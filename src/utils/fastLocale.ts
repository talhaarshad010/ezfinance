/**
 * Fast number and date formatting.
 *
 * On Android, `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` go through the
 * platform's ICU over JNI and can cost about a millisecond per call. The app formats every amount
 * and date that way (hundreds of calls when a screen opens), which froze screens like Expenses for
 * seconds. This replaces exactly the formats the app uses with plain JavaScript that gives the
 * same text; anything else still goes to the original implementation.
 *
 * Imported once, first thing in index.js.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WESTERN = new Set([undefined, 'en', 'en-US', 'en-PK', 'en-GB']);
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

function group(intDigits: string, indian: boolean): string {
  if (intDigits.length <= 3) return intDigits;
  if (!indian) return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const last3 = intDigits.slice(-3);
  const rest = intDigits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** Adds one to a string of digits ("0999" → "1000"). */
function incrementDigits(digits: string): string {
  const out = digits.split('');
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] !== '9') {
      out[i] = String(Number(out[i]) + 1);
      return out.join('');
    }
    out[i] = '0';
  }
  return `1${out.join('')}`;
}

/**
 * `n` grouped with commas (Western 1,234,567 or Indian 12,34,567), like Intl's en-* number format.
 * Rounds the number's shortest decimal form half away from zero, as ICU does (1.005 → 1.01).
 * Returns null for numbers JavaScript writes in exponent form (left to the system).
 */
export function formatNumber(n: number, indian = false, minFrac = 0, maxFrac = 3): string | null {
  if (!Number.isFinite(n)) return Number.isNaN(n) ? 'NaN' : n > 0 ? '∞' : '-∞';
  // Intl keeps the sign of -0 and of small negatives that round to 0 ("-0").
  const negative = n < 0 || Object.is(n, -0);
  const plain = String(Math.abs(n));
  if (plain.includes('e')) return null;
  let [int, frac = ''] = plain.split('.');
  if (frac.length > maxFrac) {
    const roundUp = frac.charCodeAt(maxFrac) >= 53; // '5'
    let kept = int + frac.slice(0, maxFrac);
    if (roundUp) kept = incrementDigits(kept);
    int = kept.slice(0, kept.length - maxFrac) || '0';
    frac = maxFrac ? kept.slice(kept.length - maxFrac) : '';
  }
  frac = frac.replace(/0+$/, '');
  while (frac.length < minFrac) frac += '0';
  const text = group(int, indian) + (frac ? `.${frac}` : '');
  return negative ? `-${text}` : text;
}

type NumOpts = { minimumFractionDigits?: number; maximumFractionDigits?: number };
const NUM_KEYS = new Set(['minimumFractionDigits', 'maximumFractionDigits']);

function fastNumber(n: number, locale: unknown, opts: unknown): string | null {
  if (locale !== undefined && typeof locale !== 'string') return null;
  const indian = locale === 'en-IN';
  if (!indian && !WESTERN.has(locale as string | undefined)) return null;
  const o = (opts ?? {}) as NumOpts;
  if (opts !== undefined && (typeof opts !== 'object' || Object.keys(o).some(k => !NUM_KEYS.has(k)))) return null;
  const min = o.minimumFractionDigits ?? 0;
  const max = o.maximumFractionDigits ?? Math.max(min, 3);
  if (min < 0 || max < min || max > 20) return null;
  return formatNumber(n, indian, min, max);
}

type DateOpts = {
  day?: 'numeric' | '2-digit';
  month?: 'short' | 'long';
  year?: 'numeric';
  hour?: '2-digit';
  minute?: '2-digit';
};
const DATE_KEYS = new Set(['day', 'month', 'year', 'hour', 'minute']);

function fastDate(d: Date, locale: unknown, opts: unknown): string | null {
  if (typeof locale !== 'string' || !opts || typeof opts !== 'object') return null;
  const us = locale === 'en-US';
  if (!us && locale !== 'en-GB' && locale !== 'en-PK') return null;
  const o = opts as DateOpts;
  const keys = Object.keys(o).filter(k => (o as Record<string, unknown>)[k] !== undefined);
  if (keys.some(k => !DATE_KEYS.has(k))) return null;
  if (Number.isNaN(d.getTime())) return 'Invalid Date';

  // Time of day: "02:05 PM" (only the en-US form; en-PK's differs by platform, so it falls back).
  if (o.hour || o.minute) {
    if (!us || o.hour !== '2-digit' || o.minute !== '2-digit' || o.day || o.month || o.year) return null;
    const h = d.getHours();
    return `${pad2(h % 12 === 0 ? 12 : h % 12)}:${pad2(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
  }
  if (!o.month || (o.day && o.day !== 'numeric' && o.day !== '2-digit') || (o.year && o.year !== 'numeric')) return null;
  const month = o.month === 'long' ? MONTHS_LONG[d.getMonth()] : o.month === 'short' ? MONTHS_SHORT[d.getMonth()] : null;
  if (!month) return null;
  const day = o.day === '2-digit' ? pad2(d.getDate()) : o.day ? String(d.getDate()) : '';
  const year = o.year ? String(d.getFullYear()) : '';
  if (us) {
    // "Oct 5, 2026" · "Oct 5" · "Oct 2026" · "October 2026" · "Oct"
    if (day) return year ? `${month} ${day}, ${year}` : `${month} ${day}`;
    return year ? `${month} ${year}` : month;
  }
  // en-GB / en-PK: "5 Oct 2026" · "05 Oct" · "Oct 2026" · "5 October 2026"
  return [day, month, year].filter(Boolean).join(' ');
}

let installed = false;

export function installFastLocale() {
  if (installed) return;
  installed = true;

  const numToLocale = Number.prototype.toLocaleString;
  // eslint-disable-next-line no-extend-native
  Number.prototype.toLocaleString = function (this: number, locale?: unknown, opts?: unknown) {
    const fast = fastNumber(Number(this), locale, opts);
    return fast ?? numToLocale.call(this, locale as string, opts as Intl.NumberFormatOptions);
  } as typeof numToLocale;

  const dateToLocale = Date.prototype.toLocaleString;
  const dateToLocaleDate = Date.prototype.toLocaleDateString;
  const dateToLocaleTime = Date.prototype.toLocaleTimeString;
  // eslint-disable-next-line no-extend-native
  Date.prototype.toLocaleString = function (this: Date, locale?: unknown, opts?: unknown) {
    return fastDate(this, locale, opts) ?? dateToLocale.call(this, locale as string, opts as Intl.DateTimeFormatOptions);
  } as typeof dateToLocale;
  // eslint-disable-next-line no-extend-native
  Date.prototype.toLocaleDateString = function (this: Date, locale?: unknown, opts?: unknown) {
    const o = opts as DateOpts | undefined;
    const fast = o && !o.hour && !o.minute ? fastDate(this, locale, opts) : null;
    return fast ?? dateToLocaleDate.call(this, locale as string, opts as Intl.DateTimeFormatOptions);
  } as typeof dateToLocaleDate;
  // eslint-disable-next-line no-extend-native
  Date.prototype.toLocaleTimeString = function (this: Date, locale?: unknown, opts?: unknown) {
    const o = opts as DateOpts | undefined;
    const fast = o && o.hour && o.minute && !o.day && !o.month && !o.year ? fastDate(this, locale, opts) : null;
    return fast ?? dateToLocaleTime.call(this, locale as string, opts as Intl.DateTimeFormatOptions);
  } as typeof dateToLocaleTime;
}

export const __test = { fastNumber, fastDate };
