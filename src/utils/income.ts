/**
 * Monthly income in PKR from the bracket the user picked at sign-up (shown as e.g. "> 150,000").
 * Open-ended brackets use their edge (so "> 150,000" is 1,50,000); ranges use their midpoint.
 */
const INCOME_BY_LABEL: Record<string, number> = {
  '< 25,000': 25000,
  '25,000 to 50,000': 37500,
  '50,000 to 100,000': 75000,
  '100,000 to 150,000': 125000,
  '> 150,000': 150000,
};

export const monthlyIncomeOf = (label: string | null | undefined): number | null =>
  label ? INCOME_BY_LABEL[label] ?? null : null;
