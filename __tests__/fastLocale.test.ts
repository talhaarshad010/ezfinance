/**
 * The fast formatters must give exactly what the system's Intl gives for every format the app
 * uses (Node's full ICU stands in for the phone's).
 */
import { __test } from '../src/utils/fastLocale';

const { fastNumber, fastDate } = __test;

const NUMBERS = [
  0, -0, 1, 7, 12, 999, 1000, 1001, 12345, 99999, 100000, 150000, 235799.5, 1234567, 12345678.9,
  -5, -1500, -235799.5, 0.5, 1.005, 2.675, 72819.5, 72819.505, 0.0001, 1e9, 987654321.123456,
];
for (let i = 0; i < 3000; i++) NUMBERS.push(Math.round((Math.random() - 0.3) * 10 ** (1 + (i % 9))) / 10 ** (i % 4));

test.each([
  [undefined, undefined],
  ['en-PK', undefined],
  ['en-IN', undefined],
  ['en-US', undefined],
  ['en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 }],
  ['en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }],
  ['en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }],
])('numbers: %s %j', (locale, opts) => {
  for (const n of NUMBERS) {
    const want = n.toLocaleString(locale ?? 'en-US', opts as Intl.NumberFormatOptions);
    expect(`${n} → ${fastNumber(n, locale, opts)}`).toBe(`${n} → ${want}`);
  }
});

test('unknown number formats are left to the system', () => {
  expect(fastNumber(5, 'ur-PK', undefined)).toBeNull();
  expect(fastNumber(5, 'en-PK', { style: 'currency', currency: 'PKR' })).toBeNull();
});

const DATE_FORMATS: [string, Intl.DateTimeFormatOptions][] = [
  ['en-GB', { day: '2-digit', month: 'short' }],
  ['en-US', { month: 'short', year: 'numeric' }],
  ['en-US', { month: 'short', day: 'numeric' }],
  ['en-US', { month: 'long', year: 'numeric' }],
  ['en-GB', { day: 'numeric', month: 'short', year: 'numeric' }],
  ['en-US', { hour: '2-digit', minute: '2-digit' }],
  ['en-US', { month: 'short' }],
  ['en-PK', { day: 'numeric', month: 'short', year: 'numeric' }],
  ['en-GB', { month: 'short', year: 'numeric' }],
  ['en-GB', { day: 'numeric', month: 'short' }],
  ['en-GB', { day: 'numeric', month: 'long', year: 'numeric' }],
];

// Newer ICU writes September as "Sept" in en-GB; Android's (and the app's labels) use "Sep".
const sep = (s: string) => s.replace(/\bSept\b/g, 'Sep').replace(/ /g, ' ');

test.each(DATE_FORMATS)('dates: %s %j', (locale, opts) => {
  for (let i = 0; i < 400; i++) {
    const d = new Date(2024, i % 12, 1 + (i % 28), (i * 7) % 24, (i * 13) % 60);
    expect(sep(fastDate(d, locale, opts) ?? 'null')).toBe(sep(d.toLocaleString(locale, opts)));
  }
});

test('unknown date formats are left to the system', () => {
  expect(fastDate(new Date(), 'en-PK', { hour: '2-digit', minute: '2-digit' })).toBeNull();
  expect(fastDate(new Date(), 'en-US', { weekday: 'long' })).toBeNull();
  expect(fastDate(new Date(), undefined, undefined)).toBeNull();
});
