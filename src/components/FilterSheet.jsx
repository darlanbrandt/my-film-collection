import React from "react";

// Mobile bottom sheet holding every list control (decade, genre, sort and
// direction) that lives inline in the desktop filter bar. Filters apply live,
// so the primary button just dismisses the sheet.
const SORTS = [
  ["added", "Added"],
  ["title", "Title"],
  ["year", "Year"],
  ["rating", "Rating"],
  ["oscars", "Oscars"],
];

// Direction labels read naturally per sort key ([desc, asc]).
const DIR_LABELS = {
  added:  ["Newest", "Oldest"],
  year:   ["Newest", "Oldest"],
  title:  ["Z–A", "A–Z"],
  rating: ["Highest", "Lowest"],
  oscars: ["Most", "Fewest"],
};

export function FilterSheet({
  decades, genres, filterDecade, filterGenre, sortBy, sortDir,
  onDecade, onGenre, onSortBy, onSortDir, onReset, onClose, resultCount,
}) {
  const [descLabel, ascLabel] = DIR_LABELS[sortBy] || ["Desc", "Asc"];
  const hasFilters = filterDecade !== "all" || filterGenre !== "all";

  return (
    <div className="msheet" onClick={onClose}>
      <div className="msheet-panel" onClick={e => e.stopPropagation()}>
        <div className="msheet-grab"/>
        <div className="msheet-body">
          <div className="msheet-hd">
            <h3>Filter</h3>
            {hasFilters && <button className="msheet-reset" onClick={onReset}>Reset</button>}
          </div>

          <label className="msheet-label">Decade</label>
          <div className="msheet-select">
            <select value={filterDecade} onChange={e => onDecade(e.target.value)}>
              <option value="all">All decades</option>
              {decades.map(d => <option key={d} value={d}>{d}s</option>)}
            </select>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>

          <label className="msheet-label">Genre</label>
          <div className="msheet-select">
            <select value={filterGenre} onChange={e => onGenre(e.target.value)}>
              <option value="all">All genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>

          <label className="msheet-label">Sort by</label>
          <div className="msheet-seg">
            {SORTS.map(([id, label]) => (
              <button key={id} className={sortBy === id ? "on" : ""} onClick={() => onSortBy(id)}>{label}</button>
            ))}
          </div>

          <div className="msheet-dir">
            <button className={sortDir === "desc" ? "on" : ""} onClick={() => onSortDir("desc")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>{descLabel}
            </button>
            <button className={sortDir === "asc" ? "on" : ""} onClick={() => onSortDir("asc")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>{ascLabel}
            </button>
          </div>

          <button className="msheet-apply" onClick={onClose}>
            Show {resultCount} film{resultCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
