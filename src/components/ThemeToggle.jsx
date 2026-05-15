import React from "react";
import { Ico } from "./icons.jsx";

export function ThemeToggle({ value, onChange }) {
  const isLight = value === 'light';
  return (
    <button
      className={`th-toggle ${isLight ? 'is-light' : ''}`}
      onClick={() => onChange(isLight ? 'dark' : 'light')}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
      <span className="th-icons">{Ico.moon}{Ico.sun}</span>
      <span className="th-thumb">{isLight ? Ico.sun : Ico.moon}</span>
    </button>
  );
}
