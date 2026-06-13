// src/design/tokens.js
export const colors = {
  bg:      '#0c0e14',
  surface: '#141720',
  surface2:'#1a1d24',
  border:  '#1e2630',
  border2: '#2a2d35',
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#9ca3af',
  accent:  '#6c7ee1',
  accent2: '#818cf8',
  pass:    '#4ade80',
  fail:    '#f87171',
  cyan:    '#22d3ee',
  amber:   '#fbbf24',
  gold:    '#fbbf24',
};

export const plotlyLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: "'DM Sans', sans-serif", color: colors.text, size: 11 },
  margin: { l: 130, r: 40, t: 10, b: 30 },
  xaxis: {
    gridcolor: 'rgba(30,38,48,0.6)',
    zerolinecolor: colors.border2,
    zerolinewidth: 1,
    tickfont: { size: 10, color: colors.muted2 },
  },
  yaxis: {
    gridcolor: 'transparent',
    tickfont: { size: 11, color: colors.text },
  },
};
