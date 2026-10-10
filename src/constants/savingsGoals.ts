/**
 * Savings Goals seed data.
 *
 * Single source of truth for both the compact "Active Savings Goals" card on the
 * dashboard and the full Goals hub tab, so the goal count and progress rings stay
 * consistent across the app.
 */

export type GoalStatus = 'active' | 'paused' | 'shared';

export interface SavingsGoal {
  /** Sample goals use numbers; a signed-in user's goals use their UUID. */
  id: number | string;
  /** Feather icon name */
  icon: string;
  label: string;
  target: number;
  current: number;
  status: GoalStatus;
  /** Consecutive months funded */
  streak: number;
  /** Required monthly contribution */
  pace: number;
  monthsLeft: number;
  deadline: string;
  /** Set when the goal is parked in a SECP mutual fund */
  fundBacked?: string;
  yieldPct?: number;
  /** Overrides for goals measured in months of runway rather than rupees */
  targetLabel?: string;
  currentLabel?: string;
  /** Co-contributors for shared goals */
  co?: string[];
  contribs?: { name: string; amount: number; pct: number }[];
}

export const AMBER = '#FFB300';

export const SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 1,
    icon: 'heart',
    label: 'Wedding Fund',
    target: 500000,
    current: 310000,
    status: 'active',
    streak: 5,
    pace: 11875,
    monthsLeft: 16,
    deadline: 'Dec 2027',
  },
  {
    id: 2,
    icon: 'shield',
    label: 'Emergency Runway',
    target: 480000,
    current: 360000,
    status: 'active',
    streak: 3,
    pace: 10000,
    monthsLeft: 12,
    deadline: 'Sep 2027',
    fundBacked: 'Meezan Daily Amdani',
    yieldPct: 12.8,
    targetLabel: '6.0 Months',
    currentLabel: '3.2 Months',
  },
  {
    id: 3,
    icon: 'monitor',
    label: 'Tech Upgrade',
    target: 50000,
    current: 18000,
    status: 'paused',
    streak: 0,
    pace: 3200,
    monthsLeft: 10,
    deadline: 'Jul 2027',
  },
  {
    id: 4,
    icon: 'globe',
    label: 'Family Umrah 2027',
    target: 600000,
    current: 240000,
    status: 'shared',
    streak: 2,
    pace: 15000,
    monthsLeft: 24,
    deadline: 'Mar 2027',
    co: ['Shahrukh', 'Fatima'],
    contribs: [
      { name: 'Shahrukh', amount: 180000, pct: 75 },
      { name: 'Fatima', amount: 60000, pct: 25 },
    ],
  },
];

/** Icon choices offered by the create-goal wizard. */
export const GOAL_ICONS: { label: string; icon: string }[] = [
  { label: 'Wedding', icon: 'heart' },
  { label: 'Safety', icon: 'shield' },
  { label: 'Tech', icon: 'monitor' },
  { label: 'Travel', icon: 'globe' },
  { label: 'Growth', icon: 'trending-up' },
];

export function goalPct(goal: SavingsGoal): number {
  return Math.round((goal.current / goal.target) * 100);
}

/** Paused goals read amber, fund-backed/shared goals teal, everything else green. */
export function goalColor(
  goal: SavingsGoal,
  green: string,
  active: string,
): string {
  if (goal.status === 'paused') return AMBER;
  if (goal.fundBacked || goal.status === 'shared') return active;
  return green;
}

export const totalEarmarked = (goals: SavingsGoal[] = SAVINGS_GOALS): number =>
  goals.reduce((sum, g) => sum + g.current, 0);
