import React, { useState } from "react";
import { adaptFilm } from "../lib/adapters.js";
import { PosterImg } from "./FilmPoster.jsx";
import { Ico } from "./icons.jsx";

export function RandomPicker({ pool, onOpenFilm }) {
  const [spinning, setSpinning] = useState(false);
  const [shown,    setShown]    = useState(null);
  const [picked,   setPicked]   = useState(null);

  const spin = () => {
    if (!pool.length) return;
    setSpinning(true); setPicked(null);
    let count = 0; const max = 18;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const tick = () => {
      const t = pool[Math.floor(Math.random() * pool.length)];
      setShown(t); count++;
      if (count >= max) {
        setShown(target); setPicked(target); setSpinning(false);
        window.cinemaToast?.(`Tonight: ${target.title}`);
      } else {
        setTimeout(tick, 60 + count * 12);
      }
    };
    tick();
  };

  const film = picked || shown;
  const af   = film ? adaptFilm(film) : null;

  return (
    <div className="rp">
      <div className="rp-panel">
        <div className={`rp-reel ${spinning ? 'spinning' : ''}`}>
          {af
            ? <PosterImg film={af}/>
            : <div className="rp-reel-placeholder">{Ico.dice}<span>spin</span></div>
          }
        </div>
        <div className="rp-info">
          <div className="l">Can't decide?</div>
          <h2>{picked ? picked.title : (spinning ? '…' : 'Pick something for me')}</h2>
          {picked ? (
            <>
              <div className="verdict">
                {picked.director} · {picked.year}{af?.runtime > 0 ? ` · ${af.runtime} min` : ''}
              </div>
              <p style={{ marginTop:12 }}>{picked.plot}</p>
              <div className="actions">
                <button className="cm-btn primary" onClick={() => onOpenFilm(picked)}>Open details</button>
                <button className="cm-btn" onClick={spin}>Try another</button>
              </div>
            </>
          ) : (
            <>
              <p>The projector will pick one film at random from your watchlist of {pool.length}. Use it on indecisive nights.</p>
              <div className="actions">
                <button className="cm-btn primary" onClick={spin} disabled={spinning}>
                  {spinning ? 'Spinning…' : 'Spin'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
