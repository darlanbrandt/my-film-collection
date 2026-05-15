import { decadeOf } from "../lib/adapters.js";

export function useStats(watchedFilms) {
  const tally  = arr => arr.reduce((m, k) => { m[k] = (m[k] || 0) + 1; return m; }, {});
  const toRows = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const byDecade = toRows(tally(
    watchedFilms.map(f => decadeOf(f.year)).filter(d => d !== "Unknown")
  )).sort((a, b) => b[0] - a[0]);

  const byGenre = toRows(tally(
    watchedFilms.flatMap(f =>
      (typeof f.genre === 'string'
        ? f.genre.split(',').map(g => g.trim())
        : f.genre || []
      ).filter(Boolean)
    )
  ));

  const byDirector = toRows(tally(watchedFilms.map(f => f.director).filter(Boolean)));
  const byCountry  = toRows(tally(watchedFilms.map(f => f.country).filter(Boolean)));

  const totalOscars  = watchedFilms.reduce((s, f) => s + (Number(f.awards) || 0), 0);
  const totalRuntime = watchedFilms.reduce((s, f) => s + (parseInt(f.runtime) || 0), 0);
  const totalHours   = Math.round(totalRuntime / 60);

  const ratedFilms = watchedFilms.filter(f => f.imdbRating);
  const avgRating  = ratedFilms.length
    ? (ratedFilms.reduce((s, f) => s + parseFloat(f.imdbRating), 0) / ratedFilms.length).toFixed(1)
    : "-";

  const bestPicCount = watchedFilms.filter(f => Number(f.awards) >= 1).length;

  return { byDecade, byGenre, byDirector, byCountry, totalOscars, totalHours, avgRating, bestPicCount };
}
