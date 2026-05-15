import React from "react";
import { adaptFilm } from "../lib/adapters.js";
import { PosterImg } from "./FilmPoster.jsx";
import { Ico } from "./icons.jsx";

export function FilmCard({ film, onSelect, layout = 'classic' }) {
  const f       = adaptFilm(film);
  const isOscar = f.oscars > 0;

  if (layout === 'list') {
    return (
      <div className={`cc list-row ${isOscar ? 'oscar' : ''}`} onClick={() => onSelect(film)}>
        <div className="cc-glow"/>
        <div className="cc-poster"><PosterImg film={f}/></div>
        <div className="cc-meta">
          <h3 className="cc-title">{f.title}</h3>
          <div className="cc-foot">
            <span>{f.year}{f.director ? ` · ${f.director}` : ''}</span>
            {f.imdb > 0 && <span className="cc-rating">{Ico.star} <b>{f.imdb}</b></span>}
            {isOscar && <span style={{color:'var(--oscar)',fontFamily:'Geist Mono,monospace',fontSize:9,letterSpacing:'0.14em'}}>{Ico.osc} ×{f.oscars}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cc classic ${isOscar ? 'oscar' : ''}`} onClick={() => onSelect(film)}>
      <div className="cc-glow"/>
      {isOscar && <span className="cc-osc">{Ico.osc} ×{f.oscars}</span>}
      {f.rewatched && <span className="cc-rew">↺</span>}
      <div className="cc-poster"><PosterImg film={f}/></div>
      <div className="cc-meta">
        <h3 className="cc-title">{f.title}</h3>
        <div className="cc-credit">{f.director}</div>
        <div className="cc-foot">
          <span>{f.year}{f.runtime > 0 ? ` · ${f.runtime}m` : ''}</span>
          {f.imdb > 0 && <span className="cc-rating">{Ico.star} <b>{f.imdb}</b></span>}
        </div>
      </div>
    </div>
  );
}

export function RecentlyAdded({ films, onSelect }) {
  if (!films.length) return null;
  return (
    <div className="cr">
      <div className="cr-row">
        <span className="cr-label">Recently added →</span>
        {films.map(f => {
          const af = adaptFilm(f);
          return (
            <div key={f.id} className="cr-item" onClick={() => onSelect(f)}>
              <div><PosterImg film={af}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyState({ isWatchlist, onAdd, isUnlocked }) {
  return (
    <div className="ce">
      <div className="ce-reel">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.2">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="12" cy="5"  r="1.2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="12" cy="19" r="1.2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="5"  cy="12" r="1.2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="19" cy="12" r="1.2" fill="var(--ink-soft)" stroke="none"/>
        </svg>
      </div>
      <h2>{isWatchlist ? "The queue is empty." : "The reel hasn't started."}</h2>
      <p>{isWatchlist ? "Add films you want to watch next." : "Start building your personal film archive."}</p>
      {isUnlocked && (
        <button className="cm-btn primary" style={{ marginTop: 4 }} onClick={onAdd}>
          + Add your first film
        </button>
      )}
    </div>
  );
}
