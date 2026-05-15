import React, { useState, useEffect, useRef } from "react";
import { PROXY } from "../lib/constants.js";
import { adaptFilm } from "../lib/adapters.js";

export function ShareCardModal({ film, onClose }) {
  const canvasRef = useRef(null);
  const [ready,      setReady]      = useState(false);
  const [generating, setGenerating] = useState(true);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const loadImage = (src) => new Promise((res, rej) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = rej; img.src = src;
  });
  const proxyUrl = (url) => url ? `${PROXY}/image?url=${encodeURIComponent(url)}` : null;

  useEffect(() => {
    (async () => {
      await Promise.allSettled([
        document.fonts.load("700 68px 'Bricolage Grotesque'"),
        document.fonts.load("400 34px 'Geist Mono'"),
        document.fonts.load("700 44px 'Geist Mono'"),
        document.fonts.load("400 26px 'Geist Mono'"),
      ]);

      const canvas = canvasRef.current;
      const ctx    = canvas.getContext("2d");
      const W = 1080, H = 1920;
      canvas.width = W; canvas.height = H;

      const af     = adaptFilm(film);
      const [c0, c1] = af.poster.colors;
      const bg     = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, c0); bg.addColorStop(1, c1);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      if (film.poster) {
        try {
          const bgImg = await loadImage(proxyUrl(film.poster));
          if (!isIOS) {
            ctx.save(); ctx.filter = "blur(40px) brightness(0.25)";
            ctx.drawImage(bgImg, -60, -60, W + 120, H + 120); ctx.restore();
          } else {
            ctx.save(); ctx.globalAlpha = 0.15;
            ctx.drawImage(bgImg, 0, 0, W, H); ctx.restore();
          }
        } catch {}
      }

      const ov = ctx.createLinearGradient(0, 0, 0, H);
      ov.addColorStop(0, "rgba(0,0,0,0.4)"); ov.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);

      const PW = 640, PH = 960, PX = (W - 640) / 2, PY = (H - 960) / 2 - 120;
      if (film.poster) {
        try {
          const pi = await loadImage(proxyUrl(film.poster));
          const r = 24; ctx.save(); ctx.beginPath();
          ctx.moveTo(PX+r,PY); ctx.lineTo(PX+PW-r,PY); ctx.quadraticCurveTo(PX+PW,PY,PX+PW,PY+r);
          ctx.lineTo(PX+PW,PY+PH-r); ctx.quadraticCurveTo(PX+PW,PY+PH,PX+PW-r,PY+PH);
          ctx.lineTo(PX+r,PY+PH); ctx.quadraticCurveTo(PX,PY+PH,PX,PY+PH-r);
          ctx.lineTo(PX,PY+r); ctx.quadraticCurveTo(PX,PY,PX+r,PY); ctx.closePath();
          ctx.clip(); ctx.drawImage(pi, PX, PY, PW, PH); ctx.restore();
        } catch {}
      }

      const tY = PY + PH + 100; ctx.textAlign = "center";
      let titleFontSize = 80;
      ctx.font = `700 ${titleFontSize}px 'Bricolage Grotesque', sans-serif`;
      let title = film.title; const maxW = W - 100;
      while (ctx.measureText(title).width > maxW && titleFontSize > 44) {
        titleFontSize -= 4;
        ctx.font = `700 ${titleFontSize}px 'Bricolage Grotesque', sans-serif`;
      }
      while (ctx.measureText(title + "…").width > maxW && title.length > 0) title = title.slice(0, -1);
      if (title !== film.title) title += "…";
      ctx.fillStyle = "#ffffff"; ctx.fillText(title, W / 2, tY);

      const genre = typeof film.genre === 'string'
        ? film.genre.split(',')[0].trim()
        : (film.genre || [])[0];
      const meta = [film.year, genre].filter(Boolean).join(' · ');
      ctx.font = "400 34px 'Geist Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillText(meta, W / 2, tY + 86);

      let eY = 0;
      if (film.imdbRating) {
        ctx.font = "700 44px 'Geist Mono', monospace"; ctx.fillStyle = "#d4a04a";
        ctx.fillText(`★ ${film.imdbRating} / 10  IMDb`, W / 2, tY + 168); eY = 66;
      }
      if (Number(film.awards) > 0) {
        ctx.font = "400 36px 'Geist Mono', monospace"; ctx.fillStyle = "#d4a04a";
        ctx.fillText(`🏆 ${film.awards} Oscar${Number(film.awards) > 1 ? "s" : ""}`, W / 2, tY + 168 + eY);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(W / 2 - 120, H - 160); ctx.lineTo(W / 2 + 120, H - 160); ctx.stroke();
      ctx.font = "400 26px 'Geist Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText("MY FILM COLLECTION", W / 2, H - 110);

      setGenerating(false); setReady(true);
    })();
  }, []);

  const download = () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    if (isIOS) {
      const w = window.open();
      w.document.write(`<img src="${dataUrl}" style="max-width:100%"/>`);
      w.document.title = film.title;
    } else {
      const l = document.createElement("a");
      l.download = `${film.title.replace(/[^a-z0-9]/gi, "_")}_share.png`;
      l.href = dataUrl; l.click();
    }
    window.cinemaToast?.('Download started · 1080×1920');
    onClose();
  };

  return (
    <div className="sc" onClick={onClose}>
      <div className="sc-frame" onClick={e => e.stopPropagation()}>
        <div className="sc-preview-wrap">
          <div className="sc-canvas-preview">
            {generating && (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                background:'var(--surface-down)', fontFamily:"'Geist Mono',monospace", fontSize:10,
                color:'var(--ink-soft)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
                Generating…
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: ready ? 'block' : 'none' }}/>
          </div>
        </div>
        <div className="sc-info">
          <div className="l">Share card</div>
          <h3>{film.title}</h3>
          <div className="for">1080 × 1920 · Stories format</div>
          <div className="actions">
            {ready && (
              <button className="cm-btn primary" onClick={download}>
                {isIOS ? '🖼 Open image' : '⬇ Download PNG'}
              </button>
            )}
            <button className="cm-btn" onClick={onClose}>Cancel</button>
          </div>
          <div className="dim-text">Rendered locally · TMDB &amp; OMDB data</div>
        </div>
      </div>
    </div>
  );
}
