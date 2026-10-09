import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { FadeInView } from '../../../components';
import { useLoadState } from '../../../context/LoadingContext';
import { ErrorState } from '../../../components/Feedback';
import { ExpLoansSkeleton, ExpRecurringSkeleton, ExpTransactionsSkeleton } from '../../../components/Skeletons';
import {
  TRANSACTIONS as SEED_TXS,
  RECURRING,
  UPCOMING_BILLS as SEED_BILLS,
  SEED_DEBTS,
  groupByDate,
  DATE_LABELS,
  LedgerTransaction,
  UpcomingBill,
  DebtEntry,
} from '../../../constants/ledgerData';

import AddEntrySheet from './expenses/AddEntrySheet';
import AddGatewaySheet from './expenses/AddGatewaySheet';
import QuickAuditSheet, {
  TransactionDetailModal,
  EditTxModal,
  SplitTxModal,
  DeleteConfirmModal,
} from './expenses/QuickAuditSheet';
import { AddDebtSheet, DebtReminderSheet } from './expenses/DebtSheets';
import {
  AddRecurringBillSheet,
  BillQuickActionSheet,
  MarkAsPaidSheet,
} from './expenses/RecurringSheets';
import StatementImportModal from './expenses/StatementImportModal';
import { UserTx, useUserMode } from '../../../context/UserModeContext';
import { useNetwork } from '../../../context/NetworkContext';
import { CAT_META, CATS, EmptyState } from '../newUser/shared';

type LedgerTab = 'transactions' | 'recurring' | 'debts';
const LEDGER_TAB_ORDER: LedgerTab[] = ['transactions', 'recurring', 'debts'];
type TxFilter = 'all' | 'in' | 'out' | 'transfers';
type RecurringSubTab = 'history' | 'calendar';

const CAT_COLORS: Record<string, { bg: string; icon: string }> = {
  Groceries: { bg: '#FF950022', icon: '#FF9500' },
  Transport: { bg: '#00A3FF22', icon: '#00A3FF' },
  Housing: { bg: '#8B5CF622', icon: '#8B5CF6' },
  Utilities: { bg: '#10B98122', icon: '#10B981' },
  Dining: { bg: '#F9731622', icon: '#F97316' },
  Telecom: { bg: '#06B6D422', icon: '#06B6D4' },
  Health: { bg: '#EC489922', icon: '#EC4899' },
  Healthcare: { bg: '#EC489922', icon: '#EC4899' },
  Entertainment: { bg: '#7C3AED22', icon: '#7C3AED' },
  Investment: { bg: '#00C85322', icon: '#00C853' },
  Salary: { bg: '#00C85322', icon: '#00C853' },
  Transfer: { bg: '#86868B22', icon: '#86868B' },
  Loan: { bg: '#D5000022', icon: '#D50000' },
};
const DEFAULT_CAT = { bg: '#86868B22', icon: '#86868B' };

const catStyleOf = (category: string) => {
  if (CAT_COLORS[category]) return CAT_COLORS[category];
  const meta = CAT_META[category];
  return meta ? { bg: meta.color + '22', icon: meta.color } : DEFAULT_CAT;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Date group of a user's transaction: TODAY, YESTERDAY, or e.g. "07 OCT". */
function dateGroupOf(date: Date) {
  const days = Math.round((startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86400000);
  if (days === 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  const label = date.toLocaleString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  return date.getFullYear() === new Date().getFullYear() ? label : `${label} ${date.getFullYear()}`;
}

const numericDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

const isThisMonth = (d: Date) => {
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/** A user's own transaction, shaped for the ledger list. */
const toLedger = (t: UserTx): LedgerTransaction => ({
  id: t.id,
  icon: (CAT_META[t.category] ?? CAT_META.Other).icon,
  label: t.note || t.category,
  account: t.account ?? '',
  category: t.category,
  amount: t.type === 'income' ? t.amount : -t.amount,
  dateGroup: dateGroupOf(t.date),
  time: t.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  type: t.type,
  smsRef: '',
  status: 'Settled',
});

/**
 * The ledger. `mode="sample"` (Explore) shows the sample data; `mode="user"` shows a signed-in
 * user's own transactions, repeated bills and loans, with the same layout.
 */
export const ExpensesScreen = ({ mode = 'sample' }: { mode?: 'sample' | 'user' }) => {
  const isUser = mode === 'user';
  const userMode = useUserMode();
  const network = useNetwork();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  // Primary State
  const [tab, setTab] = useState<LedgerTab>('transactions');
  // Loads once per visit; the three tabs share it.
  const ledgerLoad = useLoadState('expenses');
  const ledgerReady = ledgerLoad.status === 'ready';
  // Slide tab content in from the side of the tab being moved toward
  const prevTab = useRef(tab);
  const tabDir =
    LEDGER_TAB_ORDER.indexOf(tab) >= LEDGER_TAB_ORDER.indexOf(prevTab.current)
      ? 'forward'
      : 'back';
  useEffect(() => {
    prevTab.current = tab;
  }, [tab]);
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');
  const [recurringSub, setRecurringSub] = useState<RecurringSubTab>('history');

  // Data Collections
  // Sample mode keeps its data here; user mode reads and writes the user's own (UserModeContext).
  const [sampleTxs, setTransactions] = useState<LedgerTransaction[]>(SEED_TXS);
  const [sampleBills, setSampleBills] = useState<UpcomingBill[]>(SEED_BILLS);
  const [sampleDebts, setSampleDebts] = useState<DebtEntry[]>(SEED_DEBTS);
  const userTxs = useMemo(
    () => [...userMode.txs].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [userMode.txs],
  );
  const userLedger = useMemo(() => userTxs.map(toLedger), [userTxs]);
  const transactions = isUser ? userLedger : sampleTxs;
  const upcomingBills = isUser ? userMode.bills : sampleBills;
  const setUpcomingBills = isUser ? userMode.setBills : setSampleBills;
  const debts = isUser ? userMode.debts : sampleDebts;
  const setDebts = isUser ? userMode.setDebts : setSampleDebts;
  const dateLabelOf = (group: string) => {
    if (!isUser) return DATE_LABELS[group] ?? group;
    const tx = userTxs.find(t => dateGroupOf(t.date) === group);
    return tx ? numericDate(tx.date) : group;
  };
  const userTxOf = (tx: LedgerTransaction) => userMode.txs.find(t => t.id === tx.id);
  const onAdd = () => (isUser ? userMode.setFirstActionOpen(true) : setGatewayOpen(true));

  // Modals & Sheets Visibility
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [statementImportOpen, setStatementImportOpen] = useState(false);

  // Quick Audit and Detail Overlays
  const [auditTx, setAuditTx] = useState<LedgerTransaction | null>(null);
  const [detailTx, setDetailTx] = useState<LedgerTransaction | null>(null);
  const [editTx, setEditTx] = useState<LedgerTransaction | null>(null);
  const [splitTx, setSplitTx] = useState<LedgerTransaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<LedgerTransaction | null>(null);

  // Recurring Overlays
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [activeBill, setActiveBill] = useState<UpcomingBill | null>(null);
  const [markPaidBill, setMarkPaidBill] = useState<UpcomingBill | null>(null);

  // Debts Overlays
  const [debtAddOpen, setDebtAddOpen] = useState(false);
  const [debtEditTarget, setDebtEditTarget] = useState<DebtEntry | null>(null);
  const [debtRemTarget, setDebtRemTarget] = useState<DebtEntry | null>(null);

  // Filtering
  const filteredTxs = transactions.filter(tx => {
    if (txFilter === 'in' && tx.type !== 'income') return false;
    if (txFilter === 'out' && tx.type !== 'expense') return false;
    if (txFilter === 'transfers' && tx.type !== 'transfer') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        tx.label.toLowerCase().includes(q) ||
        tx.account.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const groupedTxs = groupByDate(filteredTxs);

  // Metrics
  const todaySpent = transactions
    .filter(t => t.dateGroup === 'TODAY' && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const incomeTotal = isUser
    ? userTxs.filter(t => t.type === 'income' && isThisMonth(t.date)).reduce((s, t) => s + t.amount, 0)
    : transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const recurringRows = isUser
    ? upcomingBills.map(b => ({
        id: b.id,
        icon: b.icon,
        label: b.label,
        amount: b.amount,
        cadence: `Monthly · next ${b.date}`,
        category: b.tag,
      }))
    : RECURRING;
  const totalRecurring = recurringRows.reduce((s, r) => s + r.amount, 0);
  const totalDebt = debts.reduce((s, d) => s + d.remaining, 0);
  const totalEMI = debts.reduce((s, d) => s + d.emi, 0);
  // Sample data assumes a 150,000 salary; a user's ratio uses this month's logged income.
  const dtiIncome = isUser ? incomeTotal : 150000;
  const dtiPct = dtiIncome > 0 ? ((totalEMI / dtiIncome) * 100).toFixed(1) : null;
  const dtiHealthy = dtiPct !== null && parseFloat(dtiPct) < 36;
  const todayOfMonth = isUser ? new Date().getDate() : 8;

  // 30-day snapshot: sample figures, or the user's logged balance minus unpaid bills.
  const userBalance = userTxs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const unpaidBills = upcomingBills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0);
  const liquidity = isUser
    ? {
        month: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        cash: userBalance,
        bills: unpaidBills,
        safe: userBalance - unpaidBills,
      }
    : { month: 'Sep 2026', cash: 72000, bills: 48800, safe: 23200 };

  // Handlers
  const handleAddManualTransaction = (tx: any) => {
    const newTx: LedgerTransaction = {
      id: tx.id || Date.now(),
      icon: tx.icon || 'shopping-cart',
      label: tx.label || tx.merchant || 'Expense',
      account: tx.account || 'Checking',
      category: tx.category || 'Groceries',
      amount: tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount),
      dateGroup: 'TODAY',
      time: 'Just now',
      type: tx.type || 'expense',
      smsRef: `MAN-${Date.now()}`,
      status: 'Settled',
    };
    setTransactions(prev => [newTx, ...prev]);
    showToast('Transaction added to ledger', 'success');
  };

  const handleImportTransactions = (imported: LedgerTransaction[]) => {
    setTransactions(prev => [...imported, ...prev]);
    showToast(`${imported.length} transactions imported`, 'success');
  };

  const handleSaveDebt = (d: DebtEntry) => {
    setDebts(prev => {
      const idx = prev.findIndex(x => x.id === d.id);
      if (idx >= 0) {
        return prev.map(x => (x.id === d.id ? d : x));
      }
      return [...prev, d];
    });
    showToast('Debt saved successfully', 'success');
  };

  const handleDeleteDebt = (id: number) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    showToast('Debt removed', 'info');
  };

  const handleSaveEditedTx = (updated: LedgerTransaction) => {
    if (isUser) {
      userMode.updateTx(updated.id, { category: updated.category });
      showToast('Transaction updated', 'success');
      return;
    }
    setTransactions(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    showToast('Transaction updated', 'success');
  };

  const handleDeleteTx = (tx: LedgerTransaction) => {
    const own = isUser ? userTxOf(tx) : undefined;
    if (own) {
      const index = userMode.txs.findIndex(t => t.id === own.id);
      userMode.deleteTx(own.id);
      const opId = network.record({ entity: 'tx', entityId: own.id, action: 'delete', label: `Delete · ${own.note ?? own.category}` });
      showToast('Transaction deleted', 'info', undefined, 5000, {
        label: 'Undo',
        onPress: () => {
          userMode.restoreTx(own, index);
          if (opId) network.remove(opId);
        },
      });
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    showToast('Transaction deleted', 'info');
  };

  const handleConfirmSplit = (
    part1: number,
    part2: number,
    cat1: string,
    cat2: string,
  ) => {
    if (!splitTx) return;
    const own = isUser ? userTxOf(splitTx) : undefined;
    if (own) {
      userMode.deleteTx(own.id);
      [
        { amount: part1, category: cat1 },
        { amount: part2, category: cat2 },
      ].forEach((part, i) =>
        userMode.addTx({
          type: own.type,
          account: own.account,
          date: own.date,
          note: `${splitTx.label} (Split ${i + 1})`,
          ...part,
        }),
      );
      showToast('Transaction split in two', 'success');
      return;
    }
    const isNegative = splitTx.amount < 0;
    const tx1: LedgerTransaction = {
      ...splitTx,
      id: Date.now(),
      label: `${splitTx.label} (Split 1)`,
      category: cat1,
      amount: isNegative ? -part1 : part1,
    };
    const tx2: LedgerTransaction = {
      ...splitTx,
      id: Date.now() + 1,
      label: `${splitTx.label} (Split 2)`,
      category: cat2,
      amount: isNegative ? -part2 : part2,
    };
    setTransactions(prev => [tx1, tx2, ...prev.filter(t => t.id !== splitTx.id)]);
    showToast('Transaction split into 2 envelopes', 'success');
  };

  const handleSaveRecurringBill = (bill: UpcomingBill) => {
    setUpcomingBills(prev => [...prev, bill]);
    showToast('Recurring bill added', 'success');
  };

  const handleDeleteBill = (bill: UpcomingBill) => {
    setUpcomingBills(prev => prev.filter(b => b.id !== bill.id));
    showToast('Bill removed from schedule', 'info');
  };

  const handleConfirmPaid = (method: string) => {
    if (!markPaidBill) return;
    setUpcomingBills(prev =>
      prev.map(b => (b.id === markPaidBill.id ? { ...b, paid: true } : b)),
    );
    showToast(`Marked as paid (${method})`, 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: theme.TEXT }]}>
            Expenses
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAdd}
            style={[styles.addBtn, { backgroundColor: theme.TEXT }]}
          >
            <Feather name="plus" size={18} color={theme.BG} />
          </TouchableOpacity>
        </View>

        {/* 3 Main Tabs: Transactions, Recurring, Loans */}
        <View style={styles.tabBar}>
          {[
            { key: 'transactions' as LedgerTab, label: 'Transactions', icon: 'list' },
            { key: 'recurring' as LedgerTab, label: 'Repeated', icon: 'clock' },
            { key: 'debts' as LedgerTab, label: 'Loans', icon: 'credit-card' },
          ].map(t => {
            const isActive = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.8}
                onPress={() => setTab(t.key)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive ? theme.TEXT : 'transparent',
                  },
                ]}
              >
                <Feather
                  name={t.icon}
                  size={13}
                  color={isActive ? theme.BG : theme.MUTED}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: isActive ? theme.BG : theme.MUTED,
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FadeInView key={tab} from={tabDir} distance={24}>
        {ledgerLoad.status === 'loading' &&
          (tab === 'transactions' ? <ExpTransactionsSkeleton /> : tab === 'recurring' ? <ExpRecurringSkeleton /> : <ExpLoansSkeleton />)}
        {ledgerLoad.status === 'error' && <ErrorState onRetry={ledgerLoad.retry} />}
        {/* ── TAB 1: TRANSACTIONS ── */}
        {ledgerReady && tab === 'transactions' && isUser && userTxs.length === 0 && (
          <View style={styles.userEmpty}>
            <EmptyState
              icon="file-text"
              title="No transactions yet"
              line="Every rupee you log here builds your budget, tax picture and AI advice."
              samples={[
                { label: 'Add Groceries', icon: CAT_META.Groceries.icon, color: CAT_META.Groceries.color, onPress: () => userMode.openTxSheet({ type: 'expense', category: 'Groceries', source: 'manual' }) },
                { label: 'Add Fuel', icon: CAT_META.Fuel.icon, color: CAT_META.Fuel.color, onPress: () => userMode.openTxSheet({ type: 'expense', category: 'Fuel', source: 'manual' }) },
                { label: 'Add Salary', icon: CAT_META.Salary.icon, color: CAT_META.Salary.color, onPress: () => userMode.openTxSheet({ type: 'income', category: 'Salary', source: 'manual' }) },
              ]}
              primary={{ label: 'Log a transaction', onPress: () => userMode.setFirstActionOpen(true) }}
            />
          </View>
        )}
        {ledgerReady && tab === 'transactions' && !(isUser && userTxs.length === 0) && (
          <View>
            {/* Sub-Filter Chips */}
            <View style={styles.filterRow}>
              {[
                { key: 'all' as TxFilter, label: 'All', icon: null, color: theme.MUTED },
                { key: 'in' as TxFilter, label: 'Money In', icon: 'arrow-down-left', color: theme.GREEN },
                { key: 'out' as TxFilter, label: 'Money Out', icon: 'arrow-up-right', color: theme.RED },
                { key: 'transfers' as TxFilter, label: 'Transfers', icon: 'repeat', color: theme.ACTIVE },
              ].map(f => {
                const isSel = txFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.8}
                    onPress={() => setTxFilter(f.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSel ? theme.TEXT : 'transparent',
                        borderColor: isSel ? theme.TEXT : theme.MUTED + '44',
                      },
                    ]}
                  >
                    {f.icon && (
                      <Feather
                        name={f.icon}
                        size={11}
                        color={isSel ? theme.BG : f.color}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSel ? theme.BG : theme.MUTED },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Stat Cards: Today Spent & Month In */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.MUTED }]}>
                  TODAY SPENT
                </Text>
                <Text style={[styles.statVal, { color: theme.RED }]}>
                  − PKR {todaySpent.toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.MUTED }]}>
                  MONTH IN
                </Text>
                <Text style={[styles.statVal, { color: theme.GREEN }]}>
                  + PKR {incomeTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <Feather name="search" size={15} color={theme.MUTED} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search transactions…"
                placeholderTextColor={theme.MUTED}
                style={[styles.searchInput, { color: theme.TEXT }]}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={14} color={theme.MUTED} />
                </TouchableOpacity>
              )}
            </View>

            {/* Grouped Transactions Feed */}
            {groupedTxs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: theme.MUTED }]}>
                  No transactions found
                </Text>
              </View>
            ) : (
              groupedTxs.map(group => (
                <View key={group.date} style={styles.groupWrap}>
                  <Text style={[styles.groupDateLabel, { color: theme.MUTED }]}>
                    {group.date} // {dateLabelOf(group.date)}
                  </Text>
                  <View
                    style={[
                      styles.groupCard,
                      {
                        backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                        borderColor: theme.BORDER,
                      },
                    ]}
                  >
                    {group.items.map((tx, i) => {
                      const isTransfer = tx.type === 'transfer';
                      const amtColor = isTransfer
                        ? theme.MUTED
                        : tx.amount > 0
                        ? theme.GREEN
                        : theme.RED;
                      const catStyle = catStyleOf(tx.category);

                      return (
                        <TouchableOpacity
                          key={tx.id}
                          activeOpacity={0.7}
                          onPress={() => setAuditTx(tx)}
                          style={[
                            styles.txRow,
                            i < group.items.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: theme.BORDER,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.catIconWrap,
                              {
                                backgroundColor: catStyle.bg,
                                borderColor: catStyle.icon + '40',
                              },
                            ]}
                          >
                            <Feather
                              name={tx.icon || 'credit-card'}
                              size={15}
                              color={catStyle.icon}
                            />
                          </View>

                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text
                              numberOfLines={1}
                              style={[styles.txLabel, { color: theme.TEXT }]}
                            >
                              {tx.label}
                            </Text>
                            <View style={styles.txMetaRow}>
                              {!!tx.account && (
                                <Text style={[styles.txAccount, { color: theme.MUTED }]}>
                                  {tx.account}
                                </Text>
                              )}
                              <View
                                style={[
                                  styles.txCatBadge,
                                  { backgroundColor: theme.MODAL },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.txCatBadgeText,
                                    { color: theme.MUTED },
                                  ]}
                                >
                                  {tx.category}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <Text style={[styles.txAmount, { color: amtColor }]}>
                            {!isTransfer && (tx.amount > 0 ? '+' : '−')}
                            {isTransfer && '→ '}
                            PKR {Math.abs(tx.amount).toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB 2: RECURRING ── */}
        {ledgerReady && tab === 'recurring' && (
          <View>
            {/* Sub Tabs: History vs Upcoming Calendar */}
            <View style={styles.recurringSubTabs}>
              {(['history', 'calendar'] as RecurringSubTab[]).map(s => {
                const active = recurringSub === s;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.8}
                    onPress={() => setRecurringSub(s)}
                    style={[
                      styles.recurringSubPill,
                      {
                        backgroundColor: active ? theme.TEXT : theme.CARD,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recurringSubPillText,
                        {
                          color: active ? theme.BG : theme.MUTED,
                        },
                      ]}
                    >
                      {s === 'history' ? 'History' : 'Upcoming Calendar'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FadeInView key={recurringSub} distance={10}>
            {recurringSub === 'history' && (
              <View>
                {/* Monthly Commitments Header Card */}
                <View style={[styles.commitCard, { backgroundColor: theme.CARD }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.commitLabel, { color: theme.MUTED }]}>
                      MONTHLY COMMITMENTS
                    </Text>
                    <Text style={[styles.commitVal, { color: theme.RED }]}>
                      {totalRecurring > 0 ? '− ' : ''}PKR {totalRecurring.toLocaleString()}
                    </Text>
                    <Text style={[styles.commitSub, { color: theme.MUTED }]}>
                      per month · {recurringRows.length} subscription{recurringRows.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.commitIconBox,
                      { backgroundColor: theme.MODAL },
                    ]}
                  >
                    <Feather name="repeat" size={22} color={theme.MUTED} />
                  </View>
                </View>

                {/* Subscriptions List */}
                {recurringRows.length === 0 ? (
                  <NoItems
                    icon="repeat"
                    title="No repeated payments yet"
                    line="Add bills you pay every month, like rent or internet, and we'll remind you before they're due."
                    action="Add a repeated bill"
                    onAction={() => setAddBillOpen(true)}
                  />
                ) : (
                <View
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                      marginTop: 12,
                    },
                  ]}
                >
                  {recurringRows.map((r, i) => {
                    const catColor = catStyleOf(r.category);
                    return (
                      <View
                        key={r.id}
                        style={[
                          styles.txRow,
                          i < recurringRows.length - 1 && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.BORDER,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.catIconWrap,
                            {
                              backgroundColor: catColor.bg,
                              borderColor: catColor.icon + '40',
                            },
                          ]}
                        >
                          <Feather
                            name={r.icon || 'repeat'}
                            size={15}
                            color={catColor.icon}
                          />
                        </View>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.txLabel, { color: theme.TEXT }]}>
                            {r.label}
                          </Text>
                          <View style={styles.txMetaRow}>
                            <Feather name="repeat" size={9} color={theme.MUTED} />
                            <Text style={[styles.txAccount, { color: theme.MUTED }]}>
                              {r.cadence}
                            </Text>
                            <View
                              style={[
                                styles.txCatBadge,
                                { backgroundColor: theme.MODAL },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.txCatBadgeText,
                                  { color: theme.MUTED },
                                ]}
                              >
                                {r.category}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.txAmount, { color: theme.RED }]}>
                          − PKR {r.amount.toLocaleString()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                )}
              </View>
            )}

            {recurringSub === 'calendar' && (
              <View>
                {/* 30-Day Liquidity Snapshot */}
                <View
                  style={[
                    styles.liquidityCard,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                    },
                  ]}
                >
                  <View style={styles.liquidityTop}>
                    <Text style={[styles.statLabel, { color: theme.MUTED }]}>
                      30-DAY LIQUIDITY SNAPSHOT
                    </Text>
                    <View
                      style={[
                        styles.monthBadge,
                        { backgroundColor: theme.ACTIVE + '18' },
                      ]}
                    >
                      <Text style={[styles.monthBadgeText, { color: theme.ACTIVE }]}>
                        {liquidity.month}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.liquidityGrid}>
                    <View
                      style={[
                        styles.liquidityCol,
                        { borderRightWidth: 1, borderRightColor: theme.BORDER },
                      ]}
                    >
                      <Text style={[styles.colLabel, { color: theme.MUTED }]}>
                        Available Cash
                      </Text>
                      <Text style={[styles.colVal, { color: theme.TEXT }]}>
                        {liquidity.cash.toLocaleString()}
                      </Text>
                      <Text style={[styles.colSub, { color: theme.MUTED }]}>
                        PKR
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.liquidityCol,
                        { borderRightWidth: 1, borderRightColor: theme.BORDER },
                      ]}
                    >
                      <Text style={[styles.colLabel, { color: theme.MUTED }]}>
                        Upcoming Bills
                      </Text>
                      <Text style={[styles.colVal, { color: theme.RED }]}>
                        {liquidity.bills.toLocaleString()}
                      </Text>
                      <Text style={[styles.colSub, { color: theme.MUTED }]}>
                        PKR · 30 days
                      </Text>
                    </View>

                    <View style={styles.liquidityCol}>
                      <Text style={[styles.colLabel, { color: theme.MUTED }]}>
                        Safe to Spend
                      </Text>
                      <Text style={[styles.colVal, { color: liquidity.safe < 0 ? theme.RED : theme.GREEN }]}>
                        {liquidity.safe.toLocaleString()}
                      </Text>
                      <Text style={[styles.colSub, { color: theme.GREEN, fontWeight: '700' }]}>
                        PKR buffer
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Add Bill Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setAddBillOpen(true)}
                  style={[
                    styles.dashedBtn,
                    {
                      borderColor: theme.ACTIVE,
                      backgroundColor: theme.ACTIVE + '0C',
                    },
                  ]}
                >
                  <Feather name="plus" size={15} color={theme.ACTIVE} />
                  <Text style={[styles.dashedBtnText, { color: theme.ACTIVE }]}>
                    Add Recurring Bill Manually
                  </Text>
                </TouchableOpacity>

                {/* Upcoming Bills List */}
                {upcomingBills.length > 0 && (
                <View
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                      marginTop: 12,
                    },
                  ]}
                >
                  {upcomingBills.map((b, i) => (
                    <TouchableOpacity
                      key={b.id}
                      activeOpacity={0.7}
                      onPress={() => setActiveBill(b)}
                      style={[
                        styles.txRow,
                        i < upcomingBills.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.BORDER,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          {
                            backgroundColor: (b.tagColor || theme.ACTIVE) + '22',
                            borderColor: (b.tagColor || theme.ACTIVE) + '40',
                          },
                        ]}
                      >
                        <Feather
                          name={b.icon || 'clock'}
                          size={15}
                          color={b.tagColor || theme.ACTIVE}
                        />
                      </View>

                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.txLabel, { color: theme.TEXT }]}>
                          {b.label}
                        </Text>
                        <View style={styles.txMetaRow}>
                          <Text style={[styles.txAccount, { color: theme.MUTED }]}>
                            In {b.dueIn} days · {b.date}
                          </Text>
                          <View
                            style={[
                              styles.txCatBadge,
                              { backgroundColor: (b.tagColor || theme.MUTED) + '18' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.txCatBadgeText,
                                { color: b.tagColor || theme.MUTED },
                              ]}
                            >
                              {b.tag}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={[styles.txAmount, { color: theme.RED }]}>
                        − PKR {b.amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                )}
              </View>
            )}
            </FadeInView>
          </View>
        )}

        {/* ── TAB 3: LOANS ── */}
        {ledgerReady && tab === 'debts' && (
          <View>
            {/* DTI Banner */}
            <View
              style={[
                styles.dtiCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <Text style={[styles.dtiTitle, { color: theme.MUTED }]}>
                Debt-to-Income Ratio
              </Text>
              <View style={styles.dtiRight}>
                <Text
                  style={[
                    styles.dtiVal,
                    { color: dtiPct === null ? theme.MUTED : dtiHealthy ? theme.GREEN : theme.RED },
                  ]}
                >
                  {dtiPct === null ? '—' : `${dtiPct}%`}
                </Text>
                <View
                  style={[
                    styles.dtiBadge,
                    {
                      backgroundColor:
                        (dtiPct === null ? theme.MUTED : dtiHealthy ? theme.GREEN : theme.RED) + '18',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dtiBadgeText,
                      { color: dtiPct === null ? theme.MUTED : dtiHealthy ? theme.GREEN : theme.RED },
                    ]}
                  >
                    {dtiPct === null ? 'Log income' : dtiHealthy ? 'Healthy' : 'High'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3 Summary Cards */}
            <View style={styles.debtStatsRow}>
              {[
                { label: 'TOTAL BALANCE', value: totalDebt >= 1000 ? `PKR ${(totalDebt / 1000).toFixed(0)}K` : `PKR ${totalDebt}`, color: theme.RED },
                { label: 'MONTHLY EMI', value: `PKR ${totalEMI.toLocaleString()}`, color: theme.RED },
                { label: 'ACTIVE DEBTS', value: String(debts.length), color: theme.TEXT },
              ].map(s => (
                <View
                  key={s.label}
                  style={[
                    styles.debtStatBox,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.statLabel, { color: theme.MUTED }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.debtStatVal, { color: s.color }]}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Debts List Cards */}
            {debts.length === 0 && (
              <NoItems
                icon="credit-card"
                title="No loans tracked"
                line="Add a loan or credit line to see what's left to pay, your monthly instalments and reminders before each due date."
              />
            )}
            {debts.map(debt => {
              const pct = Math.round(
                ((debt.totalAmount - debt.remaining) / debt.totalAmount) * 100,
              );
              const daysLeft = debt.dueDayOfMonth - todayOfMonth;
              const urgentDue = daysLeft <= debt.remindDaysBefore && daysLeft >= 0;

              return (
                <View
                  key={debt.id}
                  style={[
                    styles.debtCard,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                    },
                  ]}
                >
                  {/* Top row */}
                  <View style={styles.debtCardTop}>
                    <View
                      style={[
                        styles.catIconWrap,
                        {
                          backgroundColor: '#D5000022',
                          borderColor: '#D5000040',
                        },
                      ]}
                    >
                      <Feather name="credit-card" size={16} color="#D50000" />
                    </View>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={[styles.txLabel, { color: theme.TEXT }]}>
                        {debt.name}
                      </Text>
                      <Text style={[styles.txAccount, { color: theme.MUTED }]}>
                        {debt.lender}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.debtRemainVal, { color: theme.RED }]}>
                        {(debt.remaining / 1000).toFixed(0)}K
                      </Text>
                      <Text style={[styles.debtRemainSub, { color: theme.MUTED }]}>
                        remaining
                      </Text>
                    </View>
                  </View>

                  {/* 3 Metrics Detail Grid */}
                  <View style={styles.debtGrid}>
                    {[
                      { k: 'EMI', v: `PKR ${debt.emi.toLocaleString()}` },
                      { k: 'Rate', v: `${debt.interestRate}% p.a.` },
                      { k: 'Due Day', v: `${debt.dueDayOfMonth}th` },
                    ].map(d => (
                      <View
                        key={d.k}
                        style={[styles.debtGridCell, { backgroundColor: theme.MODAL }]}
                      >
                        <Text style={[styles.gridCellKey, { color: theme.MUTED }]}>
                          {d.k}
                        </Text>
                        <Text style={[styles.gridCellVal, { color: theme.TEXT }]}>
                          {d.v}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Repaid Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={{ fontSize: 10, color: theme.MUTED }}>Repaid</Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: pct >= 50 ? theme.GREEN : theme.MUTED,
                        }}
                      >
                        {pct}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: pct >= 50 ? theme.GREEN : theme.RED,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Bottom Action Row */}
                  <View style={styles.debtCardBottom}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setDebtRemTarget(debt)}
                      style={[
                        styles.remBadgeBtn,
                        {
                          backgroundColor: urgentDue ? theme.ACTIVE + '18' : theme.MODAL,
                          borderColor: urgentDue ? theme.ACTIVE + '40' : 'transparent',
                        },
                      ]}
                    >
                      <Feather
                        name="bell"
                        size={11}
                        color={urgentDue ? theme.ACTIVE : theme.MUTED}
                      />
                      <Text
                        style={[
                          styles.remBadgeText,
                          { color: urgentDue ? theme.ACTIVE : theme.MUTED },
                        ]}
                      >
                        {urgentDue
                          ? `Due in ${daysLeft}d`
                          : `Reminder: ${debt.remindDaysBefore}d before`}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setDebtEditTarget(debt)}
                        style={[styles.circleBtn, { backgroundColor: theme.MODAL }]}
                      >
                        <Feather name="edit-2" size={13} color={theme.MUTED} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleDeleteDebt(debt.id)}
                        style={[styles.circleBtn, { backgroundColor: theme.MODAL }]}
                      >
                        <Feather name="trash-2" size={13} color={theme.MUTED} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Add Debt CTA Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDebtAddOpen(true)}
              style={[
                styles.dashedBtn,
                {
                  borderColor: theme.MUTED + '55',
                  backgroundColor: 'transparent',
                  marginTop: 4,
                },
              ]}
            >
              <Feather name="plus" size={14} color={theme.MUTED} />
              <Text style={[styles.dashedBtnText, { color: theme.MUTED }]}>
                Track a new debt
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </FadeInView>
      </ScrollView>

      {/* ── MODALS & SHEETS ── */}

      {/* Add Gateway Sheet */}
      <AddGatewaySheet
        visible={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        onManual={() => setManualEntryOpen(true)}
        onStatement={() => setStatementImportOpen(true)}
      />

      {/* Manual Entry Sheet */}
      <AddEntrySheet
        visible={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        onAdd={handleAddManualTransaction}
      />

      {/* Statement Import Flow */}
      <StatementImportModal
        visible={statementImportOpen}
        onClose={() => setStatementImportOpen(false)}
        onImport={handleImportTransactions}
      />

      {/* Quick Audit Sheet */}
      <QuickAuditSheet
        visible={auditTx !== null}
        tx={auditTx}
        onClose={() => setAuditTx(null)}
        onDetail={tx => {
          setAuditTx(null);
          setDetailTx(tx);
        }}
        onEdit={tx => {
          setAuditTx(null);
          const own = isUser ? userTxOf(tx) : undefined;
          if (!own) {
            setEditTx(tx);
            return;
          }
          // A user's transaction opens the full edit sheet (amount, note, account, date).
          setTimeout(
            () =>
              userMode.openTxSheet({
                editId: own.id,
                type: own.type,
                category: own.category,
                amount: own.amount,
                note: own.note,
                account: own.account,
                date: own.date,
              }),
            280,
          );
        }}
        onChangeCategory={tx => {
          setAuditTx(null);
          setEditTx(tx);
        }}
        onSplit={tx => {
          setAuditTx(null);
          setSplitTx(tx);
        }}
        onDelete={tx => {
          setAuditTx(null);
          setDeleteTx(tx);
        }}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={detailTx !== null}
        tx={detailTx}
        onClose={() => setDetailTx(null)}
      />

      {/* Edit Transaction Modal */}
      <EditTxModal
        visible={editTx !== null}
        tx={editTx}
        onClose={() => setEditTx(null)}
        onSave={handleSaveEditedTx}
        categories={isUser ? CATS : undefined}
      />

      {/* Split Transaction Modal */}
      <SplitTxModal
        visible={splitTx !== null}
        tx={splitTx}
        onClose={() => setSplitTx(null)}
        onConfirm={handleConfirmSplit}
      />

      {/* Delete Transaction Confirm Modal */}
      <DeleteConfirmModal
        visible={deleteTx !== null}
        tx={deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDeleteTx}
      />

      {/* Recurring Sheets */}
      <AddRecurringBillSheet
        visible={addBillOpen}
        onClose={() => setAddBillOpen(false)}
        onSave={handleSaveRecurringBill}
      />

      <BillQuickActionSheet
        visible={activeBill !== null}
        bill={activeBill}
        onClose={() => setActiveBill(null)}
        onMarkPaid={b => {
          setActiveBill(null);
          setMarkPaidBill(b);
        }}
        onDelete={handleDeleteBill}
      />

      <MarkAsPaidSheet
        visible={markPaidBill !== null}
        bill={markPaidBill}
        onClose={() => setMarkPaidBill(null)}
        onConfirmPaid={handleConfirmPaid}
      />

      {/* Debt Sheets */}
      <AddDebtSheet
        visible={debtAddOpen || debtEditTarget !== null}
        existing={debtEditTarget}
        onClose={() => {
          setDebtAddOpen(false);
          setDebtEditTarget(null);
        }}
        onSave={handleSaveDebt}
      />

      <DebtReminderSheet
        visible={debtRemTarget !== null}
        debt={debtRemTarget}
        onClose={() => setDebtRemTarget(null)}
      />
    </View>
  );
};

/** Empty card for a list the user hasn't added anything to yet. */
function NoItems({
  icon,
  title,
  line,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  line: string;
  action?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.noItems,
        { backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF', borderColor: theme.BORDER },
      ]}
    >
      <View style={[styles.noItemsIcon, { backgroundColor: theme.MODAL }]}>
        <Feather name={icon} size={18} color={theme.MUTED} />
      </View>
      <Text style={[styles.noItemsTitle, { color: theme.TEXT }]}>{title}</Text>
      <Text style={[styles.noItemsLine, { color: theme.MUTED }]}>{line}</Text>
      {action && onAction && (
        <TouchableOpacity activeOpacity={0.85} onPress={onAction} hitSlop={8}>
          <Text style={[styles.noItemsAction, { color: theme.ACTIVE }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default ExpensesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // EmptyState carries its own 16px side margin; the scroll content already has it.
  userEmpty: {
    marginHorizontal: -16,
  },
  noItems: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  noItemsIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  noItemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  noItemsLine: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  noItemsAction: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    height: 38,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterChip: {
    flex: 1,
    height: 32,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  groupWrap: {
    marginBottom: 14,
  },
  groupDateLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txAccount: {
    fontSize: 10,
  },
  txCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  txCatBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  recurringSubTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  recurringSubPill: {
    flex: 1,
    height: 38,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringSubPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  commitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
  },
  commitLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  commitVal: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
  },
  commitSub: {
    fontSize: 10,
    marginTop: 2,
  },
  commitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidityCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  liquidityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
  },
  monthBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  liquidityGrid: {
    flexDirection: 'row',
  },
  liquidityCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  colLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  colVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  colSub: {
    fontSize: 9,
    marginTop: 2,
  },
  dashedBtn: {
    height: 48,
    borderRadius: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashedBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dtiCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  dtiTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  dtiRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dtiVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dtiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  dtiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  debtStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  debtStatBox: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
  },
  debtStatVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  debtCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  debtCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  debtRemainVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  debtRemainSub: {
    fontSize: 10,
  },
  debtGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  debtGridCell: {
    flex: 1,
    borderRadius: 14,
    padding: 8,
  },
  gridCellKey: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  gridCellVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.15)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  debtCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  remBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
