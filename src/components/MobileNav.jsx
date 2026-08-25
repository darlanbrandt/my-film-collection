import React from "react";

// Bottom navigation capsule for the mobile layout: the three tabs plus a
// trailing action — a gold add button when unlocked, or an "Unlock" tab when
// the collection is locked (adding requires unlocking anyway).
const ICON = {
  watched: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  watchlist: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4V3z"/>
    </svg>
  ),
  stats: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20h-20"/>
    </svg>
  ),
  unlock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>
    </svg>
  ),
  plus: (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
};

const TABS = [
  ["watched", "Watched"],
  ["watchlist", "Queue"],
  ["stats", "Stats"],
];

export function MobileNav({ tab, onTab, isUnlocked, onAdd, onUnlock }) {
  return (
    <nav className="mnav">
      {TABS.map(([id, label]) => (
        <button key={id} className={`mnav-tab ${tab === id ? "on" : ""}`} onClick={() => onTab(id)}>
          {ICON[id]}
          <span>{label}</span>
          {tab === id && <span className="mnav-underline"/>}
        </button>
      ))}
      {isUnlocked ? (
        <button className="mnav-fab" onClick={onAdd} aria-label="Add film">{ICON.plus}</button>
      ) : (
        <button className="mnav-tab" onClick={onUnlock}>
          {ICON.unlock}
          <span>Unlock</span>
        </button>
      )}
    </nav>
  );
}
