/**
 * Monthly envelope (zero-based budget) seed data used by the planning ritual
 * modal, the rebalance sheets and the Move Money screen.
 */

export const MONTHLY_INCOME_POOL = 150000;

export interface EnvelopeCategory {
  label: string;
  amount: number;
  /** Fixed commitments cannot be re-allocated during the planning ritual. */
  locked: boolean;
}

export const ENVELOPE_CATS: EnvelopeCategory[] = [
  { label: 'Groceries & Supermarket', amount: 30000, locked: false },
  { label: 'House Rent', amount: 25000, locked: true },
  { label: 'Electricity & Gas', amount: 15000, locked: false },
  { label: 'Fuel & Ride-Hailing', amount: 10000, locked: false },
  { label: 'Savings Goal Slice', amount: 25000, locked: false },
  { label: 'Discretionary Buffer', amount: 45000, locked: false },
];

/** Live envelope positions — negative values are overdrawn envelopes. */
export const ENVELOPE_BALANCES: { label: string; available: number }[] = [
  { label: 'Discretionary Buffer', available: 12000 },
  { label: 'Groceries & Supermarket', available: -4200 },
  { label: 'Electricity & Gas', available: 8000 },
  { label: 'Fuel & Ride-Hailing', available: 3500 },
  { label: 'Savings Goal Slice', available: 25000 },
];

export const UNASSIGNED_CASH = 20000;
