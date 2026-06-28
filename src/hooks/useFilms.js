import { useState, useEffect } from "react";
import { supabase } from "../lib/constants.js";
import { rowToFilm, filmToRow } from "../lib/adapters.js";

// Columns needed to render the card grid, filters, search, stats and dedup —
// everything EXCEPT the heavy `plot` / `backdrop` text, which only the detail
// modal and export need. Fetching the collection without them roughly halves
// the initial payload; they're hydrated on demand (see hydrateFilm/hydrateAll).
const LIST_COLUMNS =
  "id,title,year,genre,director,country,actors,awards,imdb_rating,imdb_id,poster,runtime,rewatched,list,created_at";

// Size of the first page fetched for an instant first paint.
const FIRST_PAGE = 24;

// Stale-while-revalidate cache: the films list is the only thing gating the
// initial loading screen, so persisting it locally lets repeat visits paint
// instantly while we refresh from Supabase in the background. The heavy columns
// are stripped so the cache stays small.
const CACHE_KEY = "mfc_films_cache";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function writeCache(films) {
  try {
    const stable = films
      .filter(f => !String(f.id).startsWith("temp_"))
      .map(({ plot, backdrop, ...rest }) => rest); // keep cache light
    localStorage.setItem(CACHE_KEY, JSON.stringify(stable));
  } catch { /* quota / private mode — caching is best-effort */ }
}

export function useFilms() {
  const cached = readCache();
  const [films,   setFilms]   = useState(cached || []);
  // Only show the blocking loading screen when we have nothing to render yet.
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) { if (alive) setLoading(false); return; }

      // Cache hit — already painted from localStorage. Just revalidate the full
      // (light) collection in the background and reconcile.
      if (cached) {
        const { data, error } = await supabase
          .from("films").select(LIST_COLUMNS).order("created_at", { ascending: false });
        if (alive && !error && data) {
          const mapped = data.map(rowToFilm);
          setFilms(mapped);
          writeCache(mapped);
        }
        return;
      }

      // Cold load — phase 1: first page only, for an instant first paint.
      const first = await supabase
        .from("films").select(LIST_COLUMNS).order("created_at", { ascending: false })
        .range(0, FIRST_PAGE - 1);
      if (!alive) return;
      const firstFilms = !first.error && first.data ? first.data.map(rowToFilm) : [];
      setFilms(firstFilms);
      setLoading(false);

      // Phase 2: stream the rest of the collection in the background so search,
      // filters, stats and dedup operate over the full set.
      const rest = await supabase
        .from("films").select(LIST_COLUMNS).order("created_at", { ascending: false })
        .range(FIRST_PAGE, 100000);
      if (!alive) return;
      if (!rest.error && rest.data && rest.data.length) {
        setFilms(prev => {
          const seen   = new Set(prev.map(f => f.id));
          const merged = [...prev, ...rest.data.map(rowToFilm).filter(f => !seen.has(f.id))];
          writeCache(merged);
          return merged;
        });
      } else {
        writeCache(firstFilms);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Lazy-load the heavy columns for a single film (on modal open / navigation).
  const hydrateFilm = async (id) => {
    if (!supabase || String(id).startsWith("temp_")) return null;
    const { data, error } = await supabase
      .from("films").select("plot,backdrop").eq("id", id).single();
    if (error || !data) return null;
    setFilms(prev => prev.map(f =>
      f.id === id ? { ...f, plot: data.plot, backdrop: data.backdrop } : f));
    return data;
  };

  // Fetch the full rows (incl. heavy columns) for every film — used at export
  // time, where the complete dataset is genuinely required. Returns the merged
  // list so the caller can export the freshest data without a state round-trip.
  const hydrateAll = async () => {
    if (!supabase) return films;
    const { data, error } = await supabase
      .from("films").select("*").order("created_at", { ascending: false });
    if (error || !data) return films;
    const full = data.map(rowToFilm);
    setFilms(full);
    writeCache(full);
    return full;
  };

  const addFilm = async (film) => {
    const tempId     = `temp_${Date.now()}`;
    const optimistic = { ...film, id: tempId, awards: Number(film.awards) || 0, created_at: new Date().toISOString() };
    setFilms(prev => [optimistic, ...prev]);
    if (supabase) {
      const { data, error } = await supabase.from("films").insert(filmToRow(film)).select().single();
      if (!error && data) setFilms(prev => { const next = prev.map(f => f.id === tempId ? rowToFilm(data) : f); writeCache(next); return next; });
      else setFilms(prev => prev.filter(f => f.id !== tempId));
    }
  };

  const updateFilm = async (id, updates) => {
    const row = {};
    const map = { title:"title", year:"year", genre:"genre", director:"director", country:"country",
                  actors:"actors", poster:"poster", plot:"plot", list:"list", rewatched:"rewatched" };
    Object.entries(map).forEach(([k, v]) => { if (updates[k] !== undefined) row[v] = updates[k]; });
    if (updates.awards !== undefined) row.awards = Number(updates.awards) || 0;
    if (supabase) await supabase.from("films").update(row).eq("id", id);
    setFilms(prev => { const next = prev.map(f => f.id === id ? { ...f, ...updates } : f); writeCache(next); return next; });
  };

  const removeFilm = async (id) => {
    if (supabase) await supabase.from("films").delete().eq("id", id);
    setFilms(prev => { const next = prev.filter(f => f.id !== id); writeCache(next); return next; });
  };

  const toggleRewatch = async (id) => {
    const film = films.find(f => f.id === id);
    if (!film) return;
    await updateFilm(id, { rewatched: !film.rewatched });
  };

  return { films, loading, addFilm, updateFilm, removeFilm, toggleRewatch, hydrateFilm, hydrateAll };
}
