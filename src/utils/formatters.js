// src/utils/formatters.js
export const pct = (v) => `${(v * 100).toFixed(1)}%`;
export const fixed2 = (v) => Number(v).toFixed(2);
export const fixed3 = (v) => Number(v).toFixed(3);
export const dateStr = (ts) =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
