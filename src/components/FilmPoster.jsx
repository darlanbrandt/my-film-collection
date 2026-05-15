import React from "react";

export function FilmPoster({ film }) {
  const { layout, colors } = film.poster || { layout: 'minimal', colors: ['#14141a','#d4a04a','#ecead8'] };
  const [c0, c1, c2] = colors;
  const titleClean = (film.title || '').replace(/:\s*/g, ' · ').toUpperCase();
  const titleWords = titleClean.split(' ');
  let art = null;

  if (layout === 'monolith') {
    art = (<g><rect width="200" height="300" fill={c1}/><rect x="120" y="40" width="50" height="220" fill={c0}/><text x="22" y="240" fill={c0} fontFamily="serif" fontSize="14" fontWeight="600" letterSpacing="0.04em">{titleWords[0]}</text><text x="22" y="258" fill={c0} fontFamily="serif" fontSize="14" fontWeight="600" letterSpacing="0.04em">{titleWords[1]||''}</text><text x="22" y="276" fill={c2} fontFamily="serif" fontSize="14" fontWeight="600" letterSpacing="0.04em">{titleWords.slice(2).join(' ')}</text><text x="22" y="42" fill={c0} fontSize="9" fontFamily="monospace" letterSpacing="0.2em">{film.year}</text></g>);
  } else if (layout === 'split') {
    art = (<g><rect width="200" height="300" fill={c0}/><polygon points="0,0 200,300 0,300" fill={c1}/><text x="100" y="160" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="22" fontStyle="italic" fontWeight="500">{titleWords.slice(0,Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="186" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="22" fontStyle="italic" fontWeight="500">{titleWords.slice(Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="278" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.25em">{film.year}</text></g>);
  } else if (layout === 'bands') {
    art = (<g><rect width="200" height="300" fill={c0}/><rect y="80" width="200" height="50" fill={c1}/><rect y="170" width="200" height="50" fill={c1} opacity="0.6"/><text x="100" y="56" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.3em">{(film.director||'').toUpperCase()}</text><text x="100" y="156" textAnchor="middle" fill={c0} fontFamily="serif" fontSize="20" fontWeight="700">{titleWords[0]}</text><text x="100" y="200" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="14" fontWeight="500" letterSpacing="0.1em">{titleWords.slice(1).join(' ')}</text><text x="100" y="264" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.25em">{film.year}</text></g>);
  } else if (layout === 'numeral') {
    const ys = String(film.year);
    art = (<g><rect width="200" height="300" fill={c0}/><text x="100" y="190" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="140" fontWeight="700" letterSpacing="-0.04em">{ys.slice(2)}</text><text x="100" y="38" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.3em">{ys.slice(0,2)} ·</text><text x="100" y="232" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="13" fontWeight="600" letterSpacing="0.05em">{titleWords.slice(0,2).join(' ')}</text><text x="100" y="250" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="13" fontWeight="600" letterSpacing="0.05em">{titleWords.slice(2).join(' ')}</text><text x="100" y="278" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" opacity="0.7" letterSpacing="0.2em">{(film.director||'').toUpperCase()}</text></g>);
  } else if (layout === 'frame') {
    art = (<g><rect width="200" height="300" fill={c1}/><rect x="14" y="14" width="172" height="272" fill={c0}/><rect x="14" y="14" width="172" height="272" fill="none" stroke={c2} strokeWidth="0.5"/><text x="100" y="148" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="18" fontWeight="500" fontStyle="italic">{titleWords.slice(0,Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="172" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="18" fontWeight="500" fontStyle="italic">{titleWords.slice(Math.ceil(titleWords.length/2)).join(' ')}</text><line x1="80" y1="195" x2="120" y2="195" stroke={c2} strokeWidth="0.6"/><text x="100" y="216" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" letterSpacing="0.3em">{film.year}</text></g>);
  } else if (layout === 'duo') {
    art = (<g><rect width="200" height="300" fill={c0}/><circle cx="100" cy="118" r="56" fill={c1}/><circle cx="100" cy="118" r="56" fill="none" stroke={c2} strokeWidth="0.6"/><text x="100" y="216" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="16" fontWeight="600" fontStyle="italic">{titleWords.slice(0,Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="236" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="16" fontWeight="600" fontStyle="italic">{titleWords.slice(Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="266" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" letterSpacing="0.3em">{film.year}</text></g>);
  } else {
    art = (<g><rect width="200" height="300" fill={c0}/><text x="100" y="148" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="26" fontWeight="600">{titleWords[0]}</text><text x="100" y="178" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="26" fontWeight="600">{titleWords.slice(1).join(' ')}</text><line x1="60" y1="208" x2="140" y2="208" stroke={c2} strokeWidth="0.6"/><text x="100" y="232" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.3em">{film.year}</text><text x="100" y="270" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" opacity="0.6" letterSpacing="0.2em">{(film.director||'').toUpperCase()}</text></g>);
  }

  return (
    <svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label={`${film.title} poster`}>
      {art}
    </svg>
  );
}

export function PosterImg({ film, style }) {
  if (film.poster_url) {
    return (
      <img src={film.poster_url} alt={film.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
        onError={e => { e.target.style.display = 'none'; }} />
    );
  }
  return <FilmPoster film={film} />;
}
