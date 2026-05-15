import { useState, useEffect } from "react";
import { supabase } from "../lib/constants.js";
import { rowToFilm, filmToRow } from "../lib/adapters.js";

export function useFilms() {
  const [films,   setFilms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from("films").select("*").order("created_at", { ascending: false });
        if (!error && data) setFilms(data.map(rowToFilm));
      }
      setLoading(false);
    })();
  }, []);

  const addFilm = async (film) => {
    const tempId     = `temp_${Date.now()}`;
    const optimistic = { ...film, id: tempId, awards: Number(film.awards) || 0, created_at: new Date().toISOString() };
    setFilms(prev => [optimistic, ...prev]);
    if (supabase) {
      const { data, error } = await supabase.from("films").insert(filmToRow(film)).select().single();
      if (!error && data) setFilms(prev => prev.map(f => f.id === tempId ? rowToFilm(data) : f));
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
    setFilms(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilm = async (id) => {
    if (supabase) await supabase.from("films").delete().eq("id", id);
    setFilms(prev => prev.filter(f => f.id !== id));
  };

  const toggleRewatch = async (id) => {
    const film = films.find(f => f.id === id);
    if (!film) return;
    await updateFilm(id, { rewatched: !film.rewatched });
  };

  return { films, loading, addFilm, updateFilm, removeFilm, toggleRewatch };
}
