import React, { useState, useEffect } from "react";

export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    window.cinemaToast = (msg, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setItems(prev => [...prev, { id, msg, icon: opts.icon }]);
      setTimeout(() => setItems(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t)), 2600);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 2900);
    };
    return () => { delete window.cinemaToast; };
  }, []);

  return (
    <div className="cine-toast-host">
      {items.map(t => (
        <div key={t.id} className={`cine-toast ${t.leaving ? 'leaving' : ''}`}>
          <span className="toast-dot"/>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
