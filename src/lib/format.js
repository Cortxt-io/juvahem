// Render a factor's REAL value (e.g. 31.8 % tax, 5 396 tkr) with its unit, in
// Swedish formatting (space thousands, comma decimals). The product's positioning is
// "show the number, not just the match" — this is where the raw value becomes legible.
// `unit` strings come from the dimension metadata in score.js.

const sv = (n, max = 0) =>
  new Intl.NumberFormat('sv-SE', { maximumFractionDigits: max, minimumFractionDigits: 0 }).format(n);

/** Format a raw dimension value for display. Returns '–' for null/NaN. */
export function formatRaw(value, unit) {
  if (value == null || Number.isNaN(value)) return '–';
  switch (unit) {
    case 'pct':
      return `${sv(value, 1)} %`;
    case 'pct_signed':
      return `${value > 0 ? '+' : ''}${sv(value, 1)} %`;
    case 'tkr':
      return `${sv(value)} tkr`;
    case 'orekwh':
      return `${sv(value)} öre/kWh`;
    case 'per100k':
      return `${sv(value)}/100k`;
    case 'stops':
      return `${sv(value)} hållpl.`;
    case 'sales':
      return `${sv(value)} köp/år`;
    case 'min':
      return `${sv(value)} min`;
    case 'index':
      return sv(value, 1); // composite job-fit index — no natural unit
    default:
      return sv(value, 1);
  }
}

/** Short human label for a unit/factor — used as a column header or KPI caption. */
export const UNIT_LABEL = {
  pct: '%',
  pct_signed: '%',
  tkr: 'tkr',
  orekwh: 'öre/kWh',
  per100k: '/100k',
  stops: 'hållpl.',
  sales: 'köp/år',
  min: 'min',
  index: 'index'
};
