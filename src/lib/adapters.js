// ─── Row mappers ─────────────────────────────────────────────────────────────
export function rowToFilm(row) {
  return {
    id: row.id, title: row.title, year: row.year, genre: row.genre,
    director: row.director, country: row.country, actors: row.actors,
    awards: row.awards ?? 0, imdbRating: row.imdb_rating, imdbId: row.imdb_id,
    poster: row.poster, backdrop: row.backdrop, plot: row.plot,
    runtime: row.runtime, rewatched: row.rewatched ?? false,
    list: row.list || "watched", created_at: row.created_at,
  };
}

export function filmToRow(film) {
  return {
    title: film.title, year: film.year, genre: film.genre, director: film.director,
    country: film.country, actors: film.actors, awards: Number(film.awards) || 0,
    imdb_rating: film.imdbRating, imdb_id: film.imdbId, poster: film.poster,
    backdrop: film.backdrop, plot: film.plot, runtime: film.runtime,
    rewatched: film.rewatched ?? false, list: film.list || "watched",
  };
}

// ─── Poster SVG config ────────────────────────────────────────────────────────
export const POSTER_LAYOUTS  = ['monolith','split','bands','numeral','frame','minimal','duo'];
export const POSTER_PALETTES = [
  ['#0b0b14','#e9e3d5','#c64b29'], ['#1a0a05','#e85c2c','#f0d4a8'],
  ['#1a0610','#7b1f3a','#f4e3c6'], ['#0a0805','#c89a4a','#f3e8c8'],
  ['#1a3848','#e8c4a0','#a86848'], ['#1a0a14','#e8503a','#e8c878'],
  ['#1c0e08','#a8421f','#e8c98e'],
];

export function hashStr(s) {
  let h = 0;
  for (const c of (s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// ─── Film adapter (Supabase row → Cinéma component shape) ────────────────────
export function adaptFilm(f) {
  const genre = Array.isArray(f.genre)
    ? f.genre
    : (f.genre || '').split(',').map(g => g.trim()).filter(Boolean);
  const cast = Array.isArray(f.actors)
    ? f.actors
    : (f.actors || '').split(',').map(a => a.trim()).filter(Boolean);
  const year = parseInt(f.year) || 0;
  const h    = hashStr(f.title);
  return {
    ...f, year, genre, cast,
    imdb:        parseFloat(f.imdbRating) || 0,
    oscars:      Number(f.awards) || 0,
    decade:      Math.floor(year / 10) * 10,
    runtime:     parseInt(f.runtime) || 0,
    addedDays:   f.created_at ? Math.floor((Date.now() - new Date(f.created_at)) / 86400000) : 0,
    poster_url:  f.poster || null,
    backdrop_url: f.backdrop || null,
    poster: {
      layout: POSTER_LAYOUTS[h % POSTER_LAYOUTS.length],
      colors: POSTER_PALETTES[h % POSTER_PALETTES.length],
    },
  };
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────
export function decadeOf(year) {
  const y = parseInt(year);
  return isNaN(y) ? "Unknown" : `${Math.floor(y / 10) * 10}`;
}

export function parseRuntime(r) {
  if (!r) return 0;
  const m = String(r).match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}
