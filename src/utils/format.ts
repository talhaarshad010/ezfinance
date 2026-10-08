/** Full amount with PKR digit grouping (1,50,000). Use in detail views and while editing. */
export const fullAmt = (n: number) => Math.round(n).toLocaleString('en-IN');

/** Abbreviated for cards/lists: 240K, 1.2M, 3.4B. Values under 100,000 keep full grouping. */
export function abbr(n: number) {
  const a = Math.abs(n);
  const s = (v: number, u: string) => `${+v.toFixed(v < 10 ? 1 : 0)}${u}`;
  if (a >= 1e9) return s(a / 1e9, 'B');
  if (a >= 1e6) return s(a / 1e6, 'M');
  if (a >= 1e5) return s(a / 1e3, 'K');
  return fullAmt(a);
}

/** Signed amount; the minus sign is always shown so negatives never rely on colour alone. */
export const signed = (n: number, short = true) =>
  `${n < 0 ? '−' : ''}${short ? abbr(n) : fullAmt(Math.abs(n))}`;

/** "Today" or "6 Oct". */
export const dayLabel = (d: Date) =>
  d.toDateString() === new Date().toDateString()
    ? 'Today'
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
