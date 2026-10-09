import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { UNLOCK_AT, useUserMode } from '../../../context/UserModeContext';
import { fullAmt } from '../../../utils/format';
import { BudgetSheet } from './sheets';
import { CAT_META, EmptyState, ScreenShell, TEAL } from './shared';

/**
 * New-user versions of the side-menu screens: only the user's own data (transactions and budget
 * from UserModeContext), never sample data. Features that aren't connected yet show an empty
 * state that says so.
 */

const isThisMonth = (d: Date) => {
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/** Small helper card used by these screens. */
function Card({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <View style={[st.card, { backgroundColor: theme.CARD }]}>{children}</View>;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const { theme } = useTheme();
  const track = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  return (
    <View style={[st.barTrack, { backgroundColor: track }]}>
      <View style={[st.barFill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }]} />
    </View>
  );
}

/** Spending per category, largest first. */
function useCategoryTotals(onlyThisMonth: boolean) {
  const { txs } = useUserMode();
  return useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of txs) {
      if (t.type !== 'expense' || (onlyThisMonth && !isThisMonth(t.date))) continue;
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [txs, onlyThisMonth]);
}

function CategoryBreakdown({ rows }: { rows: [string, number][] }) {
  const { theme } = useTheme();
  const total = rows.reduce((a, [, v]) => a + v, 0);
  return (
    <View style={st.rows}>
      {rows.map(([cat, amount]) => {
        const color = CAT_META[cat]?.color ?? TEAL;
        return (
          <View key={cat}>
            <View style={st.rowHead}>
              <View style={st.rowLabel}>
                <View style={[st.dot, { backgroundColor: color }]} />
                <Text style={[st.rowName, { color: theme.TEXT }]}>{cat}</Text>
              </View>
              <Text style={[st.rowValue, { color: theme.TEXT }]}>PKR {fullAmt(amount)}</Text>
            </View>
            <Bar pct={total ? (amount / total) * 100 : 0} color={color} />
          </View>
        );
      })}
    </View>
  );
}

// ── Analytics ────────────────────────────────────────────────────────────────

export function NewAnalytics() {
  const { theme } = useTheme();
  const { txs, setFirstActionOpen } = useUserMode();
  const categories = useCategoryTotals(false);
  const income = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const spent = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const unlocked = txs.length >= UNLOCK_AT;
  const left = UNLOCK_AT - txs.length;

  return (
    <ScreenShell eyebrow="Where your money goes" title="Analytics">
      {!unlocked ? (
        <EmptyState
          icon="bar-chart-2"
          title="Analytics unlock soon"
          line={`Log ${left} more transaction${left === 1 ? '' : 's'} and we'll show where your money goes, by category and over time.`}
          primary={{ label: 'Log a transaction', onPress: () => setFirstActionOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <Text style={[st.eyebrow, { color: theme.MUTED }]}>ALL TIME</Text>
            <View style={st.statRow}>
              <View style={st.stat}>
                <Text style={[st.statLabel, { color: theme.MUTED }]}>Income</Text>
                <Text style={[st.statValue, { color: theme.GREEN }]}>{fullAmt(income)}</Text>
              </View>
              <View style={st.stat}>
                <Text style={[st.statLabel, { color: theme.MUTED }]}>Spent</Text>
                <Text style={[st.statValue, { color: theme.RED }]}>{fullAmt(spent)}</Text>
              </View>
              <View style={st.stat}>
                <Text style={[st.statLabel, { color: theme.MUTED }]}>Net</Text>
                <Text style={[st.statValue, { color: theme.TEXT }]}>{fullAmt(income - spent)}</Text>
              </View>
            </View>
          </Card>
          <Card>
            <Text style={[st.eyebrow, { color: theme.MUTED }]}>SPENDING BY CATEGORY</Text>
            {categories.length ? (
              <CategoryBreakdown rows={categories} />
            ) : (
              <Text style={[st.muted, { color: theme.MUTED }]}>No spending logged yet.</Text>
            )}
          </Card>
        </>
      )}
    </ScreenShell>
  );
}

// ── Budget planner ───────────────────────────────────────────────────────────

export function NewBudgetPlanner() {
  const { theme } = useTheme();
  const { budget } = useUserMode();
  const [sheetOpen, setSheetOpen] = useState(false);
  const categories = useCategoryTotals(true);
  const spent = categories.reduce((a, [, v]) => a + v, 0);
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ScreenShell eyebrow="Plan your month" title="Budget planner">
      {budget === null ? (
        <EmptyState
          icon="pie-chart"
          title="No budget yet"
          line="Set one monthly spending limit. We'll track what you spend against it and warn you before you go over."
          primary={{ label: 'Set a monthly budget', onPress: () => setSheetOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <View style={st.rowHead}>
              <Text style={[st.eyebrow, { color: theme.MUTED }]}>{month.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setSheetOpen(true)} hitSlop={10}>
                <Text style={[st.link, { color: TEAL }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={[st.big, { color: theme.TEXT }]}>PKR {fullAmt(budget)}</Text>
            <Text style={[st.muted, { color: theme.MUTED }]}>
              {spent > budget
                ? `Over budget by PKR ${fullAmt(spent - budget)}`
                : `PKR ${fullAmt(budget - spent)} left · PKR ${fullAmt(spent)} spent`}
            </Text>
            <View style={st.gap}>
              <Bar pct={(spent / budget) * 100} color={spent > budget ? theme.RED : TEAL} />
            </View>
          </Card>
          <Card>
            <Text style={[st.eyebrow, { color: theme.MUTED }]}>SPENT THIS MONTH</Text>
            {categories.length ? (
              <CategoryBreakdown rows={categories} />
            ) : (
              <Text style={[st.muted, { color: theme.MUTED }]}>No spending logged this month.</Text>
            )}
          </Card>
        </>
      )}
      <BudgetSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </ScreenShell>
  );
}

// ── Not connected yet: plain empty states ────────────────────────────────────

export function NewBankAccounts() {
  return (
    <ScreenShell eyebrow="Your money" title="Bank accounts">
      <EmptyState
        icon="credit-card"
        title="No accounts linked"
        line="Linking bank accounts and wallets is coming soon. For now, choose an account when you log a transaction."
      />
    </ScreenShell>
  );
}

export function NewLoans() {
  return (
    <ScreenShell eyebrow="What you owe" title="Loans & liabilities">
      <EmptyState
        icon="layers"
        title="No loans or liabilities"
        line="Loans, credit cards and money you owe will show here, with what's left to pay and when it's due. Coming soon."
      />
    </ScreenShell>
  );
}

export function NewNotifications() {
  return (
    <ScreenShell eyebrow="Stay on top" title="Notifications">
      <EmptyState
        icon="bell"
        title="No notifications yet"
        line="We'll let you know here about budget limits, goal milestones and upcoming bills."
      />
    </ScreenShell>
  );
}

const st = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 24, padding: 20 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9, marginBottom: 12 },
  statRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  big: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  muted: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  link: { fontSize: 12, fontWeight: '700' },
  gap: { marginTop: 14 },
  rows: { gap: 14 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowName: { fontSize: 13, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
