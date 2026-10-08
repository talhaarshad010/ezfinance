import { useState } from 'react';

/** Plain-language form messages (shown under the field with an icon, never colour alone). */
export const MSG = {
  amount: 'Enter an amount greater than 0.',
  futureDate: 'Pick today or an earlier date.',
  pastDeadline: 'Pick a date in the future.',
  category: 'Choose a category.',
  account: 'Choose an account.',
  sameAccount: 'Pick two different accounts.',
  negativeRate: "Interest rate can't be negative.",
  zeroEmi: 'Enter a monthly payment greater than 0.',
  name: 'Give it a name.',
};

export const SAVE_ERROR = "Couldn't save. Check your connection and try again.";

/** Parses a typed amount. Returns null when empty, letters, negative, or not > 0. */
export function parseAmount(v: string | number | undefined | null): number | null {
  if (v === undefined || v === null) return null;
  const str = String(v).replace(/,/g, '').trim();
  if (!/^\d+(\.\d+)?$/.test(str)) return null;
  const n = Number(str);
  return n > 0 ? n : null;
}

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
export const isFuture = (d: Date | null | undefined) => !!d && d.getTime() > Date.now();

/**
 * Tiny form-error helper: errors appear on submit, then track live values so a
 * fix clears its message immediately. `rules` returns a message per field.
 */
export function useFormErrors<K extends string>(rules: () => Partial<Record<K, string | undefined>>) {
  const [submitted, setSubmitted] = useState(false);
  const current = rules();
  const errors = submitted
    ? (Object.fromEntries(Object.entries(current).filter(([, v]) => v)) as Partial<Record<K, string>>)
    : ({} as Partial<Record<K, string>>);
  const valid = Object.values(current).every(v => !v);

  function submit(onValid: () => void) {
    setSubmitted(true);
    if (valid) onValid();
  }
  function reset() {
    setSubmitted(false);
  }
  return { errors, valid, submit, reset };
}

/** Simulated network save (mock phase). Swap for the real API call later. */
export function simulateSave() {
  return new Promise<void>(resolve => setTimeout(resolve, 450));
}
