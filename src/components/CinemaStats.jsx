import React from "react";
import { useStats } from "../hooks/useStats.js";

export function CinemaStats({ watchedFilms }) {
  const { byDecade, byGenre, byDirector, byCountry, byActor,
          totalOscars, totalHours, avgRating, bestPicCount } = useStats(watchedFilms);

  const BarChart = ({ rows, label }) => {
    const max = Math.max(...rows.map(r => r[1]), 1);
    return (
      <div className="cs-card cs-chart" style={{ gridColumn:'span 6' }}>
        <h4>{label}</h4>
        {rows.map(([name, n]) => (
          <div key={name} className="cs-bar-row">
            <span className="name">{name}{label.includes('decade') ? 's' : ''}</span>
            <span className="bar">
              <span className="fill" style={{ width:`calc(${(n / max) * 100}% - 2px)` }}/>
            </span>
            <span className="num">{n}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, color:'var(--ink-soft)',
            letterSpacing:'0.18em', textTransform:'uppercase' }}>No data yet</div>
        )}
      </div>
    );
  };

  return (
    <div className="cs">
      <div className="cs-card" style={{ gridColumn:'span 3' }}>
        <div className="l">Hours</div>
        <div className="v">{totalHours}</div>
        <div className="vu">≈ {Math.round(totalHours / 24)} days at the cinema</div>
      </div>
      <div className="cs-card" style={{ gridColumn:'span 3' }}>
        <div className="l">Films</div>
        <div className="v">{watchedFilms.length}</div>
        <div className="vu">{byCountry.length} countries represented</div>
      </div>
      <div className="cs-card" style={{ gridColumn:'span 3' }}>
        <div className="l">Mean rating</div>
        <div className="v" style={{ color:'var(--accent)' }}>{avgRating}</div>
        <div className="vu">IMDb · curated taste</div>
      </div>
      <div className="cs-card cs-osc-card" style={{ gridColumn:'span 3' }}>
        <div className="l">Oscars won</div>
        <div className="num-big">{totalOscars}</div>
        <div className="vu">Across {bestPicCount} films</div>
      </div>

      <BarChart rows={byDecade}            label="By decade"/>
      <BarChart rows={byGenre}             label="By genre"/>
      <BarChart rows={byDirector.slice(0, 7)} label="Most-watched directors"/>
      <BarChart rows={byActor.slice(0, 7)}    label="Most-watched actors"/>

      <div className="cs-card cs-chart" style={{ gridColumn:'span 12' }}>
        <h4>By country of origin</h4>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'8px 32px' }}>
          {byCountry.map(([c, n]) => {
            const max = Math.max(...byCountry.map(r => r[1]), 1);
            return (
              <div key={c} className="cs-bar-row">
                <span className="name">{c}</span>
                <span className="bar">
                  <span className="fill" style={{ width:`calc(${(n / max) * 100}% - 2px)` }}/>
                </span>
                <span className="num">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
