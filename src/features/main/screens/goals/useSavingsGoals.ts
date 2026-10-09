import { useMemo } from 'react';
import { UserGoal, useUserMode } from '../../../../context/UserModeContext';
import { SAVINGS_GOALS, SavingsGoal } from '../../../../constants/savingsGoals';

const MONTH_MS = 2.63e9;

/** Icon for a goal created without one, guessed from its name. */
function iconFor(name: string) {
  const n = name.toLowerCase();
  if (/emergency|safety|rainy/.test(n)) return 'shield';
  if (/wedding|marriage|shaadi/.test(n)) return 'heart';
  if (/umrah|hajj|travel|trip|holiday|vacation/.test(n)) return 'globe';
  if (/laptop|phone|computer|tech/.test(n)) return 'monitor';
  if (/car|bike|vehicle/.test(n)) return 'truck';
  if (/house|home|plot|rent/.test(n)) return 'home';
  if (/school|education|university|fee/.test(n)) return 'book-open';
  return 'target';
}

export const monthsLeftOf = (deadline?: Date) =>
  deadline ? Math.max(1, Math.ceil((deadline.getTime() - Date.now()) / MONTH_MS)) : 12;

/** A user's goal, shaped like the sample goals the Goals screens render. */
export function toSavingsGoal(g: UserGoal): SavingsGoal {
  const monthsLeft = monthsLeftOf(g.deadline);
  return {
    id: g.id,
    icon: g.icon ?? iconFor(g.name),
    label: g.name,
    target: g.target,
    current: g.saved,
    status: g.paused ? 'paused' : 'active',
    streak: 0,
    pace: Math.ceil(Math.max(0, g.target - g.saved) / monthsLeft),
    monthsLeft,
    deadline: g.deadline
      ? g.deadline.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'No date',
  };
}

/**
 * The goals the Goals screens show: the signed-in user's own goals, or the sample goals in the
 * Explore demo. `userGoalOf` gives back the user's goal behind a shown one (user mode only).
 */
export function useSavingsGoals() {
  const userMode = useUserMode();
  const isUser = userMode.isNewUser;
  const goals = useMemo(
    () => (isUser ? userMode.goals.map(toSavingsGoal) : SAVINGS_GOALS),
    [isUser, userMode.goals],
  );
  const userGoalOf = (id: number) => (isUser ? userMode.goals.find(g => g.id === id) : undefined);
  return { goals, isUser, userGoalOf, userMode };
}
