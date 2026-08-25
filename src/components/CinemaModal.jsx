import React, { useState, useEffect, useRef } from "react";
import { adaptFilm } from "../lib/adapters.js";
import { PosterImg } from "./FilmPoster.jsx";

// Small inline icons for the mobile detail chrome.
const I = {
  back:  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  edit:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  trash: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>,
  rewatch: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>,
};

export function CinemaModal({ film, onClose, onPrev, onNext, onFindSimilar, onShareCard,
                               onMarkRewatched, onMarkWatched, onEdit, onRemove,
                               isWatchlist, isUnlocked, isMobile }) {
  const f            = adaptFilm(film);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const touchX       = useRef(null);
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

  // ── Mobile: full-bleed, swipeable detail ──────────────────────────────────
  if (isMobile) {
    const addedDate = f.created_at
      ? new Date(f.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
      : null;
    const listLabel = isWatchlist ? 'Watchlist' : (film.rewatched ? 'Rewatched' : 'Watched');
    const heroStyle = hasBackdrop
      ? { backgroundImage: `linear-gradient(rgba(11,11,20,.34), rgba(11,11,20,.5)), url(${f.backdrop_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: `linear-gradient(150deg, ${f.poster.colors[0]} 0%, ${f.poster.colors[1]} 62%, ${f.poster.colors[2]} 100%)` };
    const heroInk = hasBackdrop ? '#ece4d2' : f.poster.colors[1];

    const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (dx > 64 && onPrev) onPrev();
      else if (dx < -64 && onNext) onNext();
      touchX.current = null;
    };

    return (
      <div className="md" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="md-hero" style={heroStyle}>
          <div className="md-heroart">
            <div className="md-htitle" style={{ color: heroInk }}>{f.title}</div>
            <div className="md-hline"/>
            <div className="md-hyear">{f.year || ''}</div>
          </div>
          <div className="md-fade"/>
          <button className="md-circ md-back" onClick={onClose} aria-label="Back">{I.back}</button>
          {isUnlocked && (
            <div className="md-topact">
              <button className="md-circ" onClick={() => { onEdit(); onClose(); }} aria-label="Edit">{I.edit}</button>
              <button className="md-circ" onClick={() => setConfirmRemove(true)} aria-label="Delete">{I.trash}</button>
            </div>
          )}
        </div>

        <div className="md-scroll">
          {(onPrev || onNext) && (
            <div className="md-dots"><span/><span className="on"/><span/><span/></div>
          )}
          <div className="md-eyebrow">{listLabel}{addedDate ? ` · Added ${addedDate}` : ''}</div>
          <h2 className="md-h2">{f.title}</h2>
          <div className="md-credits">
            {[f.director, f.year, f.runtime > 0 ? `${f.runtime} min` : ''].filter(Boolean).join(' · ')}
          </div>

          <div className="md-stats">
            {f.imdb > 0 && <div className="md-stat"><b>{f.imdb}</b><span>IMDb</span></div>}
            {f.runtime > 0 && <div className="md-stat"><b>{f.runtime}</b><span>Minutes</span></div>}
            {f.country && <div className="md-stat"><b>{f.country}</b><span>Country</span></div>}
            {f.oscars > 0 && <div className="md-stat"><b>{f.oscars}</b><span>Oscars</span></div>}
          </div>

          {f.genre.length > 0 && (
            <div className="md-chips">{f.genre.map(g => <span key={g} className="md-chip">{g}</span>)}</div>
          )}

          {f.plot && <p className="md-plot">{f.plot}</p>}

          <button className="md-similar" onClick={() => { onFindSimilar(); onClose(); }}>Find similar films →</button>
        </div>

        <div className="md-bar">
          {confirmRemove ? (
            <>
              <button className="md-edit danger" onClick={() => { onRemove(film.id); onClose(); }}>Remove film</button>
              <button className="md-sq" onClick={() => setConfirmRemove(false)} aria-label="Cancel">×</button>
            </>
          ) : isUnlocked ? (
            <>
              <button className="md-edit" onClick={() => { onEdit(); onClose(); }}>{I.edit} Edit</button>
              <button className="md-sq" onClick={isWatchlist ? onMarkWatched : onMarkRewatched}
                aria-label={isWatchlist ? 'Mark watched' : 'Mark rewatched'}>
                {isWatchlist ? I.check : I.rewatch}
              </button>
              <button className="md-sq" onClick={() => { onShareCard(); onClose(); }} aria-label="Share">{I.share}</button>
            </>
          ) : (
            <>
              <button className="md-edit" onClick={() => { onFindSimilar(); onClose(); }}>Find Similar</button>
              <button className="md-sq" onClick={() => { onShareCard(); onClose(); }} aria-label="Share">{I.share}</button>
            </>
          )}
        </div>
      </div>
    );
  }

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
