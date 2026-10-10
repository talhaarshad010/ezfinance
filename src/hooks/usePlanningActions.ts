import { budgetApi, goalsApi } from '../api/planningApi';
import { UserGoal, useUserMode } from '../context/UserModeContext';
import { toApiDate, toEnvelope, toUserGoal } from '../services/transactionMapping';
import type { BudgetCategory } from '../store/slices/budgetSlice';
import { uuidv4 } from '../utils/uuid';

export type GoalInput = Omit<UserGoal, 'id' | 'saved'>;

const goalFields = (g: GoalInput) => ({
  name: g.name.trim(),
  target: Math.round(g.target * 100) / 100,
  deadline: g.deadline ? toApiDate(g.deadline) : null,
  icon: g.icon ?? null,
  paused: !!g.paused,
});

const envelopeFields = (c: BudgetCategory) => ({
  name: c.name.trim(),
  icon: c.icon,
  color: c.color,
  monthlyLimit: Math.round(c.limit * 100) / 100,
  isMain: !!c.isMain,
});

/**
 * Changes to a signed-in user's savings goals, monthly budget and envelopes, saved on the server
 * (these need a connection). Edits show at once and are undone if the server turns them down or
 * can't be reached; the error is thrown for the caller to show.
 */
export function usePlanningActions() {
  const userMode = useUserMode();

  async function attempt(apply: () => void, rollback: () => void, call: () => Promise<unknown>) {
    apply();
    try {
      await call();
    } catch (error) {
      rollback();
      throw error;
    }
  }

  return {
    // ── Goals ──
    async createGoal(input: GoalInput): Promise<string> {
      const id = uuidv4();
      const created = await goalsApi.create(id, goalFields(input));
      userMode.addGoal(toUserGoal(created));
      return id;
    },
    async updateGoal(id: string, patch: Partial<GoalInput>) {
      const before = userMode.goals.find(g => g.id === id);
      if (!before) return;
      const next = { ...before, ...patch };
      await attempt(
        () => userMode.updateGoal(id, patch),
        () => userMode.updateGoal(id, before),
        () => goalsApi.update(id, goalFields(next)),
      );
    },
    /** Archives a goal (its contributions stay on record). */
    async archiveGoal(id: string) {
      const index = userMode.goals.findIndex(g => g.id === id);
      const removed = userMode.goals[index];
      if (!removed) return;
      await attempt(
        () => userMode.deleteGoal(id),
        () => userMode.restoreGoal(removed, index),
        () => goalsApi.remove(id),
      );
    },
    /** Puts money towards a goal (negative takes some out); the server keeps the running total. */
    async contribute(id: string, amount: number, date = new Date()) {
      const updated = await goalsApi.contribute(id, uuidv4(), Math.round(amount * 100) / 100, toApiDate(date));
      userMode.updateGoal(id, { saved: Number(updated.saved) });
    },

    // ── Budget ──
    async setMonthlyBudget(limit: number) {
      const before = userMode.budget;
      await attempt(
        () => userMode.setBudget(limit),
        () => userMode.setBudget(before),
        () => budgetApi.setLimit(Math.round(limit * 100) / 100),
      );
    },
    async addEnvelope(c: BudgetCategory) {
      const id = uuidv4();
      const created = await budgetApi.createEnvelope(id, envelopeFields(c));
      userMode.setEnvelopes(p => [...p.filter(e => e.id !== id), toEnvelope(created)]);
    },
    async updateEnvelope(c: BudgetCategory) {
      const before = userMode.envelopes.find(e => e.id === c.id);
      if (!before) return;
      await attempt(
        () => userMode.setEnvelopes(p => p.map(e => (e.id === c.id ? c : e))),
        () => userMode.setEnvelopes(p => p.map(e => (e.id === c.id ? before : e))),
        () => budgetApi.updateEnvelope(c.id, envelopeFields(c)),
      );
    },
    async removeEnvelope(id: string) {
      const index = userMode.envelopes.findIndex(e => e.id === id);
      const removed = userMode.envelopes[index];
      if (!removed) return;
      await attempt(
        () => userMode.setEnvelopes(p => p.filter(e => e.id !== id)),
        () => userMode.setEnvelopes(p => [...p.slice(0, index), removed, ...p.slice(index)]),
        () => budgetApi.removeEnvelope(id),
      );
    },
  };
}
