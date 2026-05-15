import React, { useState } from "react";
import { getDetails } from "../lib/tmdb.js";
import { PosterImg } from "./FilmPoster.jsx";

export function SuggestionsSheet({ basedOn, picks: initialPicks, existingFilms, onClose, onAdd, showToast }) {
  const isMobile = window.innerWidth <= 720;
  const maxPicks = isMobile ? 6 : 5;

  const [picks, setPicks] = useState(() => {
    const isDup = (title, year) => existingFilms.some(f =>
      f.title.trim().toLowerCase() === title.trim().toLowerCase() && String(f.year) === String(year)
    );
    return initialPicks.slice(0, maxPicks).filter(p => !isDup(p.title, p.year));
  });
  const [loadingId, setLoadingId] = useState(null);
  const [addToWl,   setAddToWl]   = useState(false);

  const handlePick = async (pick) => {
    if (loadingId) return;
    setLoadingId(pick.tmdbId);
    try {
      const details = await getDetails({ tmdb_id: pick.tmdbId, poster_path: null, overview: '' }, null);
      const dup = existingFilms.find(f =>
        (details.imdbId && f.imdbId && details.imdbId === f.imdbId) ||
        (f.title.trim().toLowerCase() === details.title.trim().toLowerCase() && f.year === details.year)
      );
      if (!dup) {
        await onAdd({ ...details, awards: Number(details.awards) || 0, rewatched: false, list: addToWl ? 'watchlist' : 'watched' });
        showToast(`"${details.title}" added to ${addToWl ? 'watchlist' : 'collection'}`);
      }
      setPicks(prev => prev.filter(p => p.tmdbId !== pick.tmdbId));
    } catch {}
    setLoadingId(null);
  };

  if (!picks.length) return (
    <div className="sg" onClick={onClose}>
      <div className="sg-sheet" onClick={e => e.stopPropagation()} style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>All done!</div>
        <p style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Your collection is growing.</p>
        <button className="cm-btn primary" style={{ marginTop: 20 }} onClick={onClose}>Done</button>
      </div>
    </div>
  );

  return (
    <div className="sg" onClick={onClose}>
      <div className="sg-sheet" onClick={e => e.stopPropagation()}>
        <div className="sg-hd">
          <div className="sg-grab"/>
          <div className="sg-titlerow">
            <div>
              <h3>You might also like</h3>
              <div className="sub">Based on <b>{basedOn}</b></div>
            </div>
            <div className="sg-opts">
              <label style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Geist Mono',monospace",
                fontSize:10, color:'var(--ink-dim)', letterSpacing:'0.16em', textTransform:'uppercase', cursor:'pointer' }}>
                <input type="checkbox" checked={addToWl} onChange={e => setAddToWl(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}/>
                Watchlist
              </label>
              <button className="sg-close" onClick={onClose}>×</button>
            </div>
          </div>
        </div>
        <div className="sg-body">
          <div className="sg-grid">
            {picks.map(pick => {
              const isLoading = loadingId === pick.tmdbId;
              const af = { title: pick.title, year: pick.year, director: '',
                           poster: { layout: 'minimal', colors: ['#14141a','#d4a04a','#ecead8'] },
                           poster_url: pick.poster };
              return (
                <div key={pick.tmdbId} className={`sg-card ${isLoading ? 'added' : ''}`}>
                  <div className="pst" style={{ position: 'relative' }}>
                    <PosterImg film={af}/>
                    {isLoading && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>⏳</div>
                    )}
                  </div>
                  <div className="ttl">{pick.title}</div>
                  <div className="meta">{pick.year}</div>
                  <div className="actions">
                    <button className="add-btn" disabled={!!loadingId} onClick={() => handlePick(pick)}>
                      {isLoading ? '⏳' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
