import React, { useState, useEffect } from "react";
import { adaptFilm } from "../lib/adapters.js";
import { PosterImg } from "./FilmPoster.jsx";

export function CinemaModal({ film, onClose, onPrev, onNext, onFindSimilar, onShareCard,
                               onMarkRewatched, onMarkWatched, onEdit, onRemove,
                               isWatchlist, isUnlocked }) {
  const f            = adaptFilm(film);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const hasBackdrop  = !!f.backdrop_url;
  const backdropStyle = hasBackdrop
    ? { backgroundImage: `url(${f.backdrop_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${f.poster.colors[0]} 0%, ${f.poster.colors[1]} 50%, ${f.poster.colors[2]} 100%)` };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft'  && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="cm" onClick={onClose}>
      <div className="cm-sheet" onClick={e => e.stopPropagation()}>
        <div className="cm-back">
          <div className="cm-back-bg" style={backdropStyle}/>
          <div className="cm-grain"/>
          <div className="cm-eyebrow-over">
            <div className="cm-yearstamp">{f.year}</div>
            <div className="cm-genres">{f.genre.map(g => <span key={g}>{g}</span>)}</div>
          </div>
        </div>
        <div className="cm-nav">
          {onPrev && <button onClick={e => { e.stopPropagation(); onPrev(); }}>‹</button>}
          {onNext && <button onClick={e => { e.stopPropagation(); onNext(); }}>›</button>}
        </div>
        <button className="cm-close" onClick={onClose}>×</button>

        <div className="cm-body">
          <div>
            <div className="cm-poster"><PosterImg film={f}/></div>
          </div>
          <div className="cm-info">
            <h2 className="cm-title">{f.title}</h2>
            <div className="cm-dir">
              Directed by <b>{f.director}</b>
              {f.country  ? ` · ${f.country}`       : ''}
              {f.runtime > 0 ? ` · ${f.runtime} min` : ''}
            </div>
            <div className="cm-divider"/>
            <p className="cm-plot">{f.plot}</p>

            <div className="cm-stats">
              {f.imdb > 0 && (
                <div className="cm-stat">
                  <div className="l">IMDb</div>
                  <div className="v">{f.imdb}<span className="vu">/10</span></div>
                </div>
              )}
              <div className="cm-stat">
                <div className="l">Oscars</div>
                <div className={`v ${f.oscars > 0 ? 'osc' : ''}`}>{f.oscars}</div>
              </div>
              {f.runtime > 0 && (
                <div className="cm-stat">
                  <div className="l">Runtime</div>
                  <div className="v">{f.runtime}<span className="vu">min</span></div>
                </div>
              )}
              <div className="cm-stat">
                <div className="l">Era</div>
                <div className="v">{f.decade}s</div>
              </div>
            </div>

            {f.cast.length > 0 && (
              <div className="cm-cast">
                <h4>Featuring</h4>
                <div className="cm-cast-grid">
                  {f.cast.slice(0, 6).map(c => (
                    <div key={c}><b>{c}</b><span>cast</span></div>
                  ))}
                </div>
              </div>
            )}

            <div className="cm-actions">
              {isUnlocked && (
                isWatchlist
                  ? <button className="cm-btn primary" onClick={onMarkWatched}>Mark Watched</button>
                  : <button className="cm-btn primary" onClick={onMarkRewatched}>
                      {film.rewatched ? '↩ Rewatched ✓' : 'Mark Rewatched'}
                    </button>
              )}
              <button className="cm-btn" onClick={() => { onFindSimilar(); onClose(); }}>Find Similar</button>
              {isUnlocked && (
                <>
                  <button className="cm-btn" onClick={() => { onShareCard(); onClose(); }}>Share Card</button>
                  <button className="cm-btn" onClick={() => { onEdit(); onClose(); }}>Edit Entry</button>
                  {!confirmRemove
                    ? <button className="cm-btn danger" onClick={() => setConfirmRemove(true)}>Remove</button>
                    : <>
                        <button className="cm-btn danger" style={{ boxShadow: 'var(--shadow-pressed-sm)' }}
                          onClick={() => { onRemove(film.id); onClose(); }}>
                          Confirm remove
                        </button>
                        <button className="cm-btn" onClick={() => setConfirmRemove(false)}>Cancel</button>
                      </>
                  }
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
