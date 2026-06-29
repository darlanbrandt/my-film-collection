import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/constants.js";
import { rowToFilm, filmToRow } from "../lib/adapters.js";

// Columns needed to render the card grid, filters, search, stats and dedup —
// everything EXCEPT the heavy `plot` / `backdrop` text, which only the detail
// modal and export need. Fetching the collection without them roughly halves
// the payload; they're hydrated on demand (see hydrateFilm / hydrateAll).
const LIST_COLUMNS =
  "id,title,year,genre,director,country,actors,awards,imdb_rating,imdb_id,poster,runtime,rewatched,list,created_at";

const CACHE_KEY      = "mfc_films_cache";    // the loaded films (watched, + watchlist once opened)
const CACHE_WL_COUNT = "mfc_wl_count_cache"; // watchlist count, shown on the badge before the tab is opened

// A film belongs to "watched" unless its list is explicitly 'watchlist'
// (covers null / missing list values too).
const isWatchlist = (f) => f.list === "watchlist";
// Supabase filter for the same rule.
const WATCHED_OR = "list.is.null,list.neq.watchlist";

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeFilmsCache(films) {
  try {
    const stable = films
      .filter(f => !String(f.id).startsWith("temp_"))
      .map(({ plot, backdrop, ...rest }) => rest); // keep cache light
    localStorage.setItem(CACHE_KEY, JSON.stringify(stable));
  } catch { /* quota / private mode — caching is best-effort */ }
}

function writeNum(key, n) {
  try { localStorage.setItem(key, String(n)); } catch {}
}

export function useFilms() {
  const cachedFilms = readCache(CACHE_KEY);
  const cachedArr   = Array.isArray(cachedFilms) ? cachedFilms : null;
  // If the cache already holds watchlist rows, a previous session opened that
  // tab — so we can show them immediately instead of waiting for a fetch.
  const cachedHadWatchlist = !!cachedArr?.some(isWatchlist);
  const cachedWlCount = (() => {
    const n = Number(readCache(CACHE_WL_COUNT));
    return Number.isFinite(n) ? n : 0;
  })();

  const [films,   setFilms]   = useState(cachedArr || []);
  const [loading, setLoading] = useState(!cachedArr);

  // Watchlist is loaded lazily, the first time its tab is opened.
  const [watchlistLoaded,  setWatchlistLoaded]  = useState(cachedHadWatchlist);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [wlCount,          setWlCount]          = useState(
    cachedHadWatchlist ? cachedArr.filter(isWatchlist).length : cachedWlCount
  );

  // Refs so loadWatchlist has a stable identity yet sees fresh flags.
  const wlFetchedRef = useRef(false); // fetched from the server this session
  const wlBusyRef    = useRef(false);

  // ── Initial load: watched films + watchlist count ──────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) { if (alive) setLoading(false); return; }

      // Cheap count for the watchlist badge, so the header is correct before the
      // watchlist tab is ever opened.
      supabase
        .from("films").select("*", { count: "exact", head: true }).eq("list", "watchlist")
        .then(({ count }) => {
          if (!alive || typeof count !== "number") return;
          writeNum(CACHE_WL_COUNT, count);
          if (!wlFetchedRef.current) setWlCount(count);
        });

      // Watched films — the default view. Loaded fully so search, filters and
      // stats are correct; watchlist rows already in memory are preserved.
      const { data, error } = await supabase
        .from("films").select(LIST_COLUMNS).or(WATCHED_OR)
        .order("created_at", { ascending: false });
      if (alive && !error && data) {
        const watched = data.map(rowToFilm);
        setFilms(prev => {
          const wl     = prev.filter(isWatchlist);
          const merged = [...watched, ...wl];
          writeFilmsCache(merged);
          return merged;
        });
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // ── Lazy watchlist load (first time the tab is opened) ─────────────────────
  const loadWatchlist = useCallback(async () => {
    if (wlFetchedRef.current || wlBusyRef.current) return;
    if (!supabase) { wlFetchedRef.current = true; setWatchlistLoaded(true); return; }
    wlBusyRef.current = true;
    setWatchlistLoading(true);
    const { data, error } = await supabase
      .from("films").select(LIST_COLUMNS).eq("list", "watchlist")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const wl = data.map(rowToFilm);
      setFilms(prev => {
        const watched = prev.filter(f => !isWatchlist(f));
        const merged  = [...watched, ...wl];
        writeFilmsCache(merged);
        return merged;
      });
      setWlCount(wl.length);
      wlFetchedRef.current = true;
      setWatchlistLoaded(true);
    }
    wlBusyRef.current = false;
    setWatchlistLoading(false);
  }, []);

  // ── On-demand hydration of the heavy columns ───────────────────────────────
  const hydrateFilm = async (id) => {
    if (!supabase || String(id).startsWith("temp_")) return null;
    const { data, error } = await supabase
      .from("films").select("plot,backdrop").eq("id", id).single();
    if (error || !data) return null;
    setFilms(prev => prev.map(f =>
      f.id === id ? { ...f, plot: data.plot, backdrop: data.backdrop } : f));
    return data;
  };

  // Full rows (incl. heavy columns) for export. Returns the merged list so the
  // caller can export the freshest data without a state round-trip.
  const hydrateAll = async () => {
    if (!supabase) return films;
    const { data, error } = await supabase
      .from("films").select("*").order("created_at", { ascending: false });
    if (error || !data) return films;
    const full = data.map(rowToFilm);
    setFilms(full);
    writeFilmsCache(full);
    wlFetchedRef.current = true;
    setWatchlistLoaded(true);
    setWlCount(full.filter(isWatchlist).length);
    return full;
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addFilm = async (film) => {
    const tempId     = `temp_${Date.now()}`;
    const optimistic = { ...film, id: tempId, awards: Number(film.awards) || 0, created_at: new Date().toISOString() };
    setFilms(prev => [optimistic, ...prev]);
    // Keep the badge correct when adding to a watchlist that isn't loaded yet.
    if (isWatchlist(optimistic) && !wlFetchedRef.current) setWlCount(c => c + 1);
    if (supabase) {
      const { data, error } = await supabase.from("films").insert(filmToRow(film)).select().single();
      if (!error && data) setFilms(prev => { const next = prev.map(f => f.id === tempId ? rowToFilm(data) : f); writeFilmsCache(next); return next; });
      else { setFilms(prev => prev.filter(f => f.id !== tempId)); if (isWatchlist(optimistic) && !wlFetchedRef.current) setWlCount(c => Math.max(0, c - 1)); }
    }
  };

  const updateFilm = async (id, updates) => {
    const row = {};
    const map = { title:"title", year:"year", genre:"genre", director:"director", country:"country",
                  actors:"actors", poster:"poster", plot:"plot", list:"list", rewatched:"rewatched" };
    Object.entries(map).forEach(([k, v]) => { if (updates[k] !== undefined) row[v] = updates[k]; });
    if (updates.awards !== undefined) row.awards = Number(updates.awards) || 0;
    if (supabase) await supabase.from("films").update(row).eq("id", id);
    setFilms(prev => { const next = prev.map(f => f.id === id ? { ...f, ...updates } : f); writeFilmsCache(next); return next; });
  };

  const removeFilm = async (id) => {
    if (supabase) await supabase.from("films").delete().eq("id", id);
    setFilms(prev => {
      const gone = prev.find(f => f.id === id);
      if (gone && isWatchlist(gone) && !wlFetchedRef.current) setWlCount(c => Math.max(0, c - 1));
      const next = prev.filter(f => f.id !== id);
      writeFilmsCache(next);
      return next;
    });
  };

  const toggleRewatch = async (id) => {
    const film = films.find(f => f.id === id);
    if (!film) return;
    await updateFilm(id, { rewatched: !film.rewatched });
  };

  return {
    films, loading,
    watchlistLoaded, watchlistLoading, wlCount, loadWatchlist,
    addFilm, updateFilm, removeFilm, toggleRewatch,
    hydrateFilm, hydrateAll,
  };
}
