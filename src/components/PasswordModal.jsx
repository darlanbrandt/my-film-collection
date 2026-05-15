import React, { useState } from "react";
import { APP_PASSWORD } from "../lib/constants.js";

export function PasswordModal({ onSuccess, onClose }) {
  const [value, setValue] = useState('');
  const [err,   setErr]   = useState('');

  const submit = () => {
    if (value === APP_PASSWORD) { onSuccess(); onClose(); }
    else { setErr("Wrong password. Try again."); setValue(''); }
  };

  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="af-hd">
          <h3>Unlock collection</h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>
        <div className="af-step">This action is restricted to the collection owner.</div>
        <div className="af-field">
          <label>Password</label>
          <input type="password" value={value} autoFocus
            onChange={e => { setValue(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter password…"/>
        </div>
        {err && <div className="af-error">{err}</div>}
        <div className="af-footer">
          <button className="cm-btn" onClick={onClose}>Cancel</button>
          <button className="cm-btn primary" style={{ flex: 2 }} onClick={submit}>Unlock</button>
        </div>
      </div>
    </div>
  );
}
