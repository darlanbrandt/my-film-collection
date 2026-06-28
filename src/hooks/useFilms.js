import { useState, useEffect } from "react";
import { supabase } from "../lib/constants.js";
import { rowToFilm, filmToRow } from "../lib/adapters.js";

// Stale-while-revalidate cache: the films list is the only thing gating the
// initial loading screen, so persisting it locally lets repeat visits paint
// instantly while we refresh from Supabase in the background.
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
    // Never cache optimistic (not-yet-confirmed) rows.
    const stable = films.filter(f => !String(f.id).startsWith("temp_"));
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
      if (supabase) {
        const { data, error } = await supabase
          .from("films").select("*").order("created_at", { ascending: false });
        if (alive && !error && data) {
          const mapped = data.map(rowToFilm);
          setFilms(mapped);
          writeCache(mapped);
        }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

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

  return { films, loading, addFilm, updateFilm, removeFilm, toggleRewatch };
}
