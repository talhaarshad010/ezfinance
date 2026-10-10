import type { UserGoal, UserHolding, UserTx } from '../../../../context/UserModeContext';
import type { BudgetCategory } from '../../../../store/slices/budgetSlice';
import type { DebtEntry } from '../../../../constants/ledgerData';
import { monthsLeftOf } from '../goals/useSavingsGoals';

/**
 * Everything the Home dashboard shows, worked out from a signed-in user's own data. Nothing here
 * is sample data: a figure that can't be worked out yet is null and the screen says so.
 */

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Categories counted as needs in the needs / wants split; the rest are wants. */
const NEEDS = new Set(['Groceries', 'Fuel', 'Bills']);

export interface DashInsight {
  id: number;
  icon: string;
  tag: string;
  color: string;
  title: string;
  body: string;
  impact: string;
  action: string;
  /** Where "Execute" takes the user. */
  go: 'BudgetPlanner' | 'Goals' | 'Expenses' | 'AI Advisor';
}

export interface DashMonth {
  label: string;
  inflow: number;
  outflow: number;
  needsPct: number;
  wantsPct: number;
  net: number;
  dailyBurn: number;
  categories: { label: string; amount: number; pct: number }[];
}

export interface DashRatio {
  label: string;
  value: string;
  sub: string;
  status: 'good' | 'warn' | 'bad';
}

export interface UserDashboardInput {
  txs: UserTx[];
  goals: UserGoal[];
  holdings: UserHolding[];
  budget: number | null;
  envelopes: BudgetCategory[];
  /** Live balances of the user's bank accounts (empty when none added). */
  accountBalances: number[];
  /** Monthly income from the user's profile (sign-up), when they gave one. */
  profileIncome?: number | null;
  debts: DebtEntry[];
}

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function computeUserDashboard(input: UserDashboardInput) {
  const { txs, goals, holdings, budget, envelopes, accountBalances, debts, profileIncome = null } = input;
  const now = new Date();
  const thisKey = monthKey(now);

  const inMonth = (key: number) => txs.filter(t => monthKey(t.date) === key);
  const incomeOf = (list: UserTx[]) => sum(list.filter(t => t.type === 'income').map(t => t.amount));
  // Spending figures leave out transactions excluded from the budget; cash still counts them.
  const spendOf = (list: UserTx[]) =>
    sum(list.filter(t => t.type === 'expense' && !t.excludeFromBudget).map(t => t.amount));

  const thisMonth = inMonth(thisKey);
  // Income: the monthly income from the profile, or what's logged this month if that's more.
  const income = Math.max(incomeOf(thisMonth), profileIncome ?? 0);
  const spent = spendOf(thisMonth);

  // Cash: added accounts if any, otherwise everything logged in minus everything logged out.
  // Cash: the linked accounts' balances, which already include their transactions. A removed
  // account's transactions leave net worth along with it.
  const cash = sum(accountBalances);
  const invested = sum(holdings.map(h => h.amount));
  const owed = sum(debts.map(d => d.remaining));
  const netWorth = cash + invested - owed;

  // Average monthly spending over the last 3 months that have any spending.
  const recentSpend = [0, 1, 2].map(i => spendOf(inMonth(thisKey - i))).filter(v => v > 0);
  const avgMonthlySpend = recentSpend.length ? sum(recentSpend) / recentSpend.length : 0;
  const recentIncome = [0, 1, 2].map(i => incomeOf(inMonth(thisKey - i))).filter(v => v > 0);
  const loggedIncome = recentIncome.length ? sum(recentIncome) / recentIncome.length : 0;
  const avgMonthlyIncome = Math.max(loggedIncome, profileIncome ?? 0);

  const runwayMonths = avgMonthlySpend > 0 && cash > 0 ? cash / avgMonthlySpend : null;

  // This month by category, with the envelope cap of the same name when there is one.
  const byCat: Record<string, number> = {};
  for (const t of thisMonth) if (t.type === 'expense' && !t.excludeFromBudget) byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
  const capOf = (name: string) =>
    envelopes.find(e => e.name.trim().toLowerCase() === name.toLowerCase())?.limit ?? null;
  const categories = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({ label, spent: amount, limit: capOf(label) }));

  const envelopeUse = envelopes.map(e => {
    const used = byCat[Object.keys(byCat).find(k => k.toLowerCase() === e.name.trim().toLowerCase()) ?? ''] ?? 0;
    return { label: e.name, limit: e.limit, spent: used, remaining: e.limit - used, pct: e.limit ? Math.round((used / e.limit) * 100) : 0 };
  });

  // ── Monthly tab: the current month and the earlier months that have data (up to 6) ──
  const keys = Array.from(new Set(txs.map(t => monthKey(t.date))))
    .filter(k => k <= thisKey)
    .concat(thisKey);
  const monthKeys = Array.from(new Set(keys)).sort((a, b) => a - b).slice(-6);
  const months: DashMonth[] = monthKeys.map(key => {
    const list = inMonth(key);
    const inflow = incomeOf(list);
    const outflow = spendOf(list);
    const counted = list.filter(t => t.type === 'expense' && !t.excludeFromBudget);
    const needs = sum(counted.filter(t => NEEDS.has(t.category)).map(t => t.amount));
    const cats: Record<string, number> = {};
    for (const t of counted) cats[t.category] = (cats[t.category] ?? 0) + t.amount;
    const year = Math.floor(key / 12);
    const month = key % 12;
    const daysElapsed = key === thisKey ? now.getDate() : new Date(year, month + 1, 0).getDate();
    return {
      label: `${MONTH_SHORT[month]} ${year}`,
      inflow,
      outflow,
      needsPct: outflow ? Math.round((needs / outflow) * 100) : 0,
      wantsPct: outflow ? 100 - Math.round((needs / outflow) * 100) : 0,
      net: inflow - outflow,
      dailyBurn: Math.round(outflow / Math.max(1, daysElapsed)),
      categories: Object.entries(cats)
        .sort((a, b) => b[1] - a[1])
        .map(([label, amount]) => ({ label, amount, pct: outflow ? Math.round((amount / outflow) * 1000) / 10 : 0 })),
    };
  });

  // ── Health: three parts, each out of its weight, from the user's own numbers ──
  const savingsRate = avgMonthlyIncome > 0 ? (avgMonthlyIncome - avgMonthlySpend) / avgMonthlyIncome : null;
  const emi = sum(debts.map(d => d.emi));
  const dti = avgMonthlyIncome > 0 ? emi / avgMonthlyIncome : null;
  const savingsPts = savingsRate === null ? 0 : Math.round(Math.max(0, Math.min(savingsRate / 0.2, 1)) * 40);
  const runwayPts = runwayMonths === null ? 0 : Math.round(Math.min(runwayMonths / 6, 1) * 35);
  const debtPts = dti === null ? 0 : Math.round(Math.max(0, 1 - dti / 0.5) * 25);
  const hasHealthData = avgMonthlyIncome > 0 && avgMonthlySpend > 0;
  const score = savingsPts + runwayPts + debtPts;
  const scoreLabel = score >= 75 ? 'Stable Growth' : score >= 50 ? 'Getting There' : 'Needs Attention';

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const ratios: DashRatio[] = [];
  if (runwayMonths !== null) {
    ratios.push({
      label: 'How many days you could live on your current cash without a new paycheck.',
      value: `${Math.round(runwayMonths * 30)} Days`,
      sub: 'Based on your average monthly spending',
      status: runwayMonths >= 3 ? 'good' : runwayMonths >= 1 ? 'warn' : 'bad',
    });
    ratios.push({
      label: 'You could cover this many months if income stopped',
      value: `${runwayMonths.toFixed(1)} Mo`,
      sub: 'Target: 6.0 months',
      status: runwayMonths >= 6 ? 'good' : runwayMonths >= 3 ? 'warn' : 'bad',
    });
  }
  if (savingsRate !== null) {
    ratios.push({
      label: "Percent of income you're saving",
      value: pct(savingsRate),
      sub: 'of monthly inflow',
      status: savingsRate >= 0.2 ? 'good' : savingsRate >= 0 ? 'warn' : 'bad',
    });
  }
  if (dti !== null) {
    ratios.push({
      label: 'How much of your income goes to debt',
      value: pct(dti),
      sub: dti < 0.36 ? 'Healthy · below 36%' : 'High · above 36%',
      status: dti < 0.36 ? 'good' : 'bad',
    });
  }
  const breakdown = [
    {
      label: `Health Score (${score}/100)`,
      formula: 'Savings (40) + Emergency fund (35) + Debt (25)',
      result: `= ${savingsPts} + ${runwayPts} + ${debtPts} = ${score} pts`,
    },
    {
      label: 'Savings Rate',
      formula: `(Income − Spending) ÷ Income\nPKR ${Math.round(avgMonthlyIncome).toLocaleString()} − PKR ${Math.round(avgMonthlySpend).toLocaleString()}`,
      result: savingsRate === null ? 'Log income to work this out' : `= ${pct(savingsRate)}  (full points at 20%)`,
    },
    {
      label: 'Emergency Fund',
      formula: `Cash ÷ Monthly Spending\nPKR ${Math.round(cash).toLocaleString()} ÷ PKR ${Math.round(avgMonthlySpend).toLocaleString()}`,
      result: runwayMonths === null ? 'Log spending to work this out' : `= ${runwayMonths.toFixed(1)} months  (Target ≥ 6.0)`,
    },
    {
      label: 'Debt-to-Income (DTI)',
      formula: `Monthly Loan Payments ÷ Income\nPKR ${emi.toLocaleString()} ÷ PKR ${Math.round(avgMonthlyIncome).toLocaleString()}`,
      result: dti === null ? 'Log income to work this out' : `= ${pct(dti)}  (Healthy < 36%)`,
    },
  ];

  // ── Insights, most urgent first ──
  const insights: DashInsight[] = [];
  const tight = envelopeUse.filter(e => e.limit > 0 && e.pct >= 80).sort((a, b) => b.pct - a.pct)[0];
  if (tight) {
    const over = tight.spent - tight.limit;
    insights.push({
      id: 1,
      icon: 'alert-triangle',
      tag: 'OVERSPEND',
      color: '#FF9500',
      title: over > 0 ? `${tight.label} Over Budget` : `${tight.label} Nearly Used Up`,
      body:
        over > 0
          ? `${tight.label} spending is PKR ${tight.spent.toLocaleString()} this month vs a PKR ${tight.limit.toLocaleString()} cap — PKR ${over.toLocaleString()} above plan.`
          : `${tight.label} is ${tight.pct}% used with ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()} days left this month.`,
      impact: over > 0 ? `−PKR ${over.toLocaleString()}` : `${tight.pct}% used`,
      action: `Review your ${tight.label} cap in the Budget Planner.`,
      go: 'BudgetPlanner',
    });
  }
  const lastMonth = inMonth(thisKey - 1);
  const top = categories[0];
  if (top) {
    const before = sum(
      lastMonth.filter(t => t.type === 'expense' && !t.excludeFromBudget && t.category === top.label).map(t => t.amount),
    );
    if (before > 0 && top.spent > before) {
      const up = Math.round(((top.spent - before) / before) * 100);
      insights.push({
        id: 2,
        icon: 'trending-up',
        tag: 'TREND',
        color: '#FF3B30',
        title: `${top.label} Up ${up}%`,
        body: `You've spent PKR ${top.spent.toLocaleString()} on ${top.label} this month, up from PKR ${before.toLocaleString()} last month.`,
        impact: `+PKR ${(top.spent - before).toLocaleString()}`,
        action: `Look through this month's ${top.label} transactions.`,
        go: 'Expenses',
      });
    }
  }
  if (runwayMonths !== null && runwayMonths < 3) {
    insights.push({
      id: 3,
      icon: 'shield',
      tag: 'SAFETY NET',
      color: '#FF9500',
      title: 'Emergency Fund Is Thin',
      body: `Your cash covers about ${runwayMonths.toFixed(1)} months of spending. Aim for 3–6 months before taking on new commitments.`,
      impact: `${runwayMonths.toFixed(1)} mo`,
      action: 'Start an emergency fund goal and add to it each month.',
      go: 'Goals',
    });
  } else if (runwayMonths !== null && runwayMonths > 6) {
    insights.push({
      id: 4,
      icon: 'trending-up',
      tag: 'OPPORTUNITY',
      color: '#00C853',
      title: 'Cash Beyond Your Safety Net',
      body: `You hold about ${runwayMonths.toFixed(1)} months of spending in cash. What's beyond 6 months could be put to work in savings or investments.`,
      impact: `PKR ${Math.round(cash - avgMonthlySpend * 6).toLocaleString()}`,
      action: 'Ask the AI Advisor where extra cash could go.',
      go: 'AI Advisor',
    });
  }
  for (const g of goals) {
    if (g.saved >= g.target) continue;
    const months = monthsLeftOf(g.deadline);
    const pace = Math.ceil((g.target - g.saved) / months);
    insights.push({
      id: 100 + insights.length,
      icon: 'target',
      tag: 'SAVINGS',
      color: '#00A3FF',
      title: `${g.name}: PKR ${pace.toLocaleString()}/mo`,
      body: `${g.name} is ${Math.round((g.saved / g.target) * 100)}% funded. Putting aside PKR ${pace.toLocaleString()} a month reaches PKR ${g.target.toLocaleString()} in ${months} month${months === 1 ? '' : 's'}.`,
      impact: `${Math.round((g.saved / g.target) * 100)}% funded`,
      action: `Log a contribution to ${g.name}.`,
      go: 'Goals',
    });
    break;
  }
  if (budget === null) {
    insights.push({
      id: 5,
      icon: 'pie-chart',
      tag: 'TIP',
      color: '#00A3FF',
      title: 'Set a Monthly Budget',
      body: 'A monthly spending limit lets us warn you before you overspend and track every category against its cap.',
      impact: 'Plan ahead',
      action: 'Set a monthly budget in the Budget Planner.',
      go: 'BudgetPlanner',
    });
  }

  return {
    monthLabel: `${MONTH_SHORT[now.getMonth()]} ${now.getFullYear()}`,
    netWorth,
    income,
    spent,
    saved: income - spent,
    budget,
    budgetLeft: budget === null ? null : budget - spent,
    budgetPct: budget ? Math.round((spent / budget) * 100) : null,
    invested,
    holdingsCount: holdings.length,
    cash,
    runwayMonths,
    categories,
    envelopeUse,
    months,
    hasHealthData,
    score,
    scoreLabel,
    ratios,
    breakdown,
    insights,
  };
}

export type UserDashboard = ReturnType<typeof computeUserDashboard>;
