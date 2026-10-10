import type { UserTx } from '../../../../context/UserModeContext';

export type FilterType = 'weekly' | 'monthly' | 'yearly' | 'custom';

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** The period a filter covers, ending today, and the same-length period just before it. */
function periodOf(filter: FilterType, customDate: Date | null) {
  const today = startOfDay(new Date());
  let start: Date;
  if (filter === 'weekly') start = new Date(today.getTime() - 6 * DAY);
  else if (filter === 'yearly') start = new Date(today.getFullYear(), 0, 1);
  else if (filter === 'custom' && customDate) start = startOfDay(customDate);
  else start = new Date(today.getFullYear(), today.getMonth(), 1);
  if (start > today) start = today;
  const end = new Date(today.getTime() + DAY); // exclusive
  const length = end.getTime() - start.getTime();
  return { start, end, prevStart: new Date(start.getTime() - length), days: Math.round(length / DAY) };
}

function periodLabel(filter: FilterType, start: Date) {
  const now = new Date();
  if (filter === 'weekly') return 'LAST 7 DAYS';
  if (filter === 'yearly') return String(now.getFullYear());
  if (filter === 'custom') return `SINCE ${shortDate(start).toUpperCase()}`;
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

/**
 * Analytics for a signed-in user's own transactions over the chosen period: total, change vs the
 * period before, daily average, top category, active days, a cumulative trend and a breakdown.
 */
export function computeUserAnalytics(txs: UserTx[], filter: FilterType, customDate: Date | null) {
  const { start, end, prevStart, days } = periodOf(filter, customDate);
  // Transactions left out of the budget are left out of spending analytics too.
  const expenses = txs.filter(t => t.type === 'expense' && !t.excludeFromBudget);
  const inPeriod = expenses.filter(t => t.date >= start && t.date < end);
  const inPrev = expenses.filter(t => t.date >= prevStart && t.date < start);

  const spent = inPeriod.reduce((a, t) => a + t.amount, 0);
  const prevSpent = inPrev.reduce((a, t) => a + t.amount, 0);
  const change = prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 1000) / 10 : null;

  const byCategory: Record<string, number> = {};
  for (const t of inPeriod) byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({ name, amount, pct: spent ? Math.round((amount / spent) * 100) : 0 }));

  const activeDays = new Set(inPeriod.map(t => startOfDay(t.date).getTime())).size;

  // Cumulative spend: per day, or per month for the year view.
  const buckets: { date: Date; total: number }[] = [];
  if (filter === 'yearly') {
    for (let m = 0; m <= new Date().getMonth(); m++) buckets.push({ date: new Date(start.getFullYear(), m, 1), total: 0 });
    for (const t of inPeriod) buckets[t.date.getMonth()].total += t.amount;
  } else {
    for (let i = 0; i < days; i++) buckets.push({ date: new Date(start.getTime() + i * DAY), total: 0 });
    for (const t of inPeriod) {
      const i = Math.floor((startOfDay(t.date).getTime() - start.getTime()) / DAY);
      if (buckets[i]) buckets[i].total += t.amount;
    }
  }
  let running = 0;
  const trend = buckets.map(b => (running += b.total));
  if (trend.length === 1) trend.unshift(0);
  const label = (b: { date: Date }) =>
    filter === 'yearly' ? b.date.toLocaleDateString('en-US', { month: 'short' }) : shortDate(b.date);
  const trendLabels =
    buckets.length >= 4
      ? [buckets[0], buckets[Math.floor(buckets.length / 3)], buckets[Math.floor((2 * buckets.length) / 3)]].map(label).concat('Today')
      : [label(buckets[0]), 'Today'];

  // Insight: how the top category moved against the period before, or its share of spending.
  let insight = 'Log a few more transactions and we will point out where your money goes.';
  const top = categories[0];
  if (top) {
    const prevTop = inPrev.filter(t => t.category === top.name).reduce((a, t) => a + t.amount, 0);
    if (prevTop > 0) {
      const pct = Math.round(((top.amount - prevTop) / prevTop) * 100);
      insight =
        pct > 0
          ? `Your ${top.name} spend is up ${pct}% on the period before. It's your biggest category, so it's the first place to look for savings.`
          : `Your ${top.name} spend is down ${Math.abs(pct)}% on the period before. Keep it up.`;
    } else {
      insight = `${top.name} is your biggest spend this period at ${top.pct}% of the total.`;
    }
  }

  return {
    label: periodLabel(filter, start),
    spent,
    change,
    avgDaily: Math.round(spent / Math.max(1, days)),
    topCategory: top?.name ?? '—',
    activeDays,
    trend,
    trendLabels,
    categories,
    insight,
  };
}
