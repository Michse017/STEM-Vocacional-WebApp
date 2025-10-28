import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function Segmented({ options, value, onChange }) {
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [rect, setRect] = useState({ left: 0, width: 0, height: 0 });

  const index = Math.max(0, options.findIndex(o => o.value === value));

  const recalc = () => {
    const el = btnRefs.current[index];
    const root = containerRef.current;
    if (!el || !root) return;
    const b = el.getBoundingClientRect();
    const r = root.getBoundingClientRect();
    setRect({ left: b.left - r.left, width: b.width, height: b.height });
  };

  useLayoutEffect(() => { recalc(); }, [index, options.length]);
  useEffect(() => {
    const on = () => recalc();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  return (
    <div ref={containerRef} className="segmented">
      <div className="seg-indicator" style={{ transform: `translateX(${rect.left}px)`, width: rect.width, height: rect.height }} />
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={el => (btnRefs.current[i] = el)}
          className={'seg-btn' + (opt.value === value ? ' active' : '')}
          onClick={() => onChange?.(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
