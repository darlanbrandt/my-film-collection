import { PROXY, TMDB_IMG, TMDB_BACKDROP } from "./constants.js";

export async function tmdbFetch(path, params = {}) {
  const qs  = new URLSearchParams({ path, ...params }).toString();
  const res = await fetch(`${PROXY}?${qs}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}

export async function fetchTmdbId(film) {
  if (film.tmdbId) return film.tmdbId;
  try {
    const params = { query: film.title, include_adult: "false", page: "1" };
    if (film.year) params.year = String(film.year);
    const d = await tmdbFetch("/search/movie", params);
    return d.results?.[0]?.id ? String(d.results[0].id) : null;
  } catch { return null; }
}

export async function searchFilms(query, year, director, setStatus) {
  setStatus("Searching…");
  try {
    const fullQuery = [query, director].filter(Boolean).join(" ");
    const params    = { query: fullQuery, include_adult: "false", page: "1" };
    if (year) params.year = year;
    const d = await tmdbFetch("/search/movie", params);
    setStatus("");
    if (d.results?.length) return d.results.slice(0, 5).map(r => ({
      tmdb_id: r.id, title: r.title, original_title: r.original_title,
      year: r.release_date?.slice(0, 4) || "?", overview: r.overview,
      poster_path: r.poster_path || null,
    }));
    return [];
  } catch (e) { setStatus(""); throw e; }
}

export async function getDetails(candidate, directorHint) {
  const [detail, credits] = await Promise.all([
    tmdbFetch(`/movie/${candidate.tmdb_id}`),
    tmdbFetch(`/movie/${candidate.tmdb_id}/credits`),
  ]);
  const director = credits.crew?.find(p => p.job === "Director")?.name || directorHint || "";
  const actors   = credits.cast?.slice(0, 5).map(a => a.name).join(", ") || "";
  const genre    = detail.genres?.map(g => g.name).join(", ") || "";
  const country  = detail.production_countries?.[0]?.name || "";
  const poster   = detail.poster_path
    ? `${TMDB_IMG}${detail.poster_path}`
    : candidate.poster_path ? `${TMDB_IMG}${candidate.poster_path}` : "";
  const backdrop = detail.backdrop_path ? `${TMDB_BACKDROP}${detail.backdrop_path}` : "";
  const plot     = detail.overview || candidate.overview || "";
  const title    = detail.title || candidate.title;
  const year     = detail.release_date?.slice(0, 4) || candidate.year || "";
  const runtime  = detail.runtime ? `${detail.runtime} min` : "";
  let awards = 0, imdbRating = "", imdbId = "";
  try {
    const tmdbImdbId = detail.imdb_id || "";
    const q = tmdbImdbId
      ? `${PROXY}/omdb?imdbId=${tmdbImdbId}`
      : `${PROXY}/omdb?title=${encodeURIComponent(title)}&year=${year}`;
    const omdb = await (await fetch(q)).json();
    if (omdb.Awards) { const m = omdb.Awards.match(/Won (\d+) Oscar/i); if (m) awards = parseInt(m[1]); }
    if (omdb.imdbRating && omdb.imdbRating !== "N/A") imdbRating = omdb.imdbRating;
    if (omdb.imdbID) imdbId = omdb.imdbID;
  } catch {}
  return {
    title, year, genre, director: directorHint || director, country, actors,
    awards: String(awards), imdbRating, imdbId,
    tmdbId: String(detail.id || ""), poster, backdrop, plot, runtime,
  };
}
