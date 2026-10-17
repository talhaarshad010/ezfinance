import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Polyline, Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { useToast } from '../../../context/ToastContext';
import { ProgressRing, FadeInView } from '../../../components';
import { useLoadState } from '../../../context/LoadingContext';
import { useNetwork } from '../../../context/NetworkContext';
import { ErrorState } from '../../../components/Feedback';
import {
  DashHealthSkeleton,
  DashInsightsSkeleton,
  DashLiveSkeleton,
  DashMonthlySkeleton,
  InsightCardSkeleton,
} from '../../../components/Skeletons';
import { abbr } from '../../../utils/format';
import {
  SAVINGS_GOALS,
  goalColor,
  goalPct,
} from '../../../constants/savingsGoals';
import {
  ENVELOPE_CATS,
  EnvelopeCategory,
  MONTHLY_INCOME_POOL,
  UNASSIGNED_CASH,
} from '../../../constants/envelopes';
import { AnimatedModal } from '../../../components/AnimatedModal';
import { useUserMode } from '../../../context/UserModeContext';
import { GettingStartedCard } from '../newUser/NewUserScreens';
import { useSavingsGoals } from './goals/useSavingsGoals';
import { useBankAccounts } from './bankAccounts/useBankAccounts';
import { computeUserDashboard, DashInsight } from './dashboard/userDashboard';
import { monthlyIncomeOf } from '../../../utils/income';
import { usePlanningActions } from '../../../hooks/usePlanningActions';
import { ApiError } from '../../../api/client';
import { SAVE_ERROR } from '../../../utils/validation';
import { CAT_META } from '../newUser/shared';

type DashTab = 'live' | 'monthly' | 'health' | 'insights';
const DASH_TAB_ORDER: DashTab[] = ['live', 'monthly', 'health', 'insights'];

type DashOverlay =
  | null
  | 'envelopeBudget'
  | 'goalMilestone'
  | 'quickDeposit'
  | 'rebalanceSheet'
  | 'overBudgetAlert'
  | 'unassignedWarning'
  | 'categoryDetail';

const TABS: { key: DashTab; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'health', label: 'Health' },
  { key: 'insights', label: 'Insights' },
];

const CATS = [
  { label: 'Groceries', spent: 7800, budget: 10000 },
  { label: 'Food & Dining', spent: 4230, budget: 6000 },
  { label: 'Transport', spent: 800, budget: 2000 },
  { label: 'Utilities', spent: 3500, budget: 5000 },
  { label: 'Rent', spent: 25000, budget: 25000 },
];

const CAT_TRANSACTIONS: Record<string, { date: string; desc: string; amount: number }[]> = {
  'Groceries': [
    { date: 'May 18', desc: 'Carrefour Tariq Road', amount: 3200 },
    { date: 'May 12', desc: 'Imtiaz Super Market', amount: 2800 },
    { date: 'May 6', desc: 'Naheed Supermarket', amount: 1800 },
  ],
  'Food & Dining': [
    { date: 'May 20', desc: 'Optp DHA', amount: 1450 },
    { date: 'May 15', desc: 'Hardees Clifton', amount: 980 },
    { date: 'May 10', desc: 'BBQ Tonight', amount: 1800 },
  ],
  'Transport': [
    { date: 'May 19', desc: 'Careem ride', amount: 320 },
    { date: 'May 14', desc: 'Petrol — PSO', amount: 480 },
  ],
  'Utilities': [
    { date: 'May 8', desc: 'K-Electric bill', amount: 2800 },
    { date: 'May 5', desc: 'SSGC gas bill', amount: 700 },
  ],
  'Rent': [
    { date: 'May 1', desc: 'Monthly rent — DHA Phase 5', amount: 25000 },
  ],
  'Housing & Rent': [
    { date: 'May 1', desc: 'Monthly rent — DHA Phase 5', amount: 25000 },
  ],
  'Groceries & Essentials': [
    { date: 'May 18', desc: 'Carrefour Tariq Road', amount: 9200 },
    { date: 'May 10', desc: 'Imtiaz Super Market', amount: 7400 },
    { date: 'May 5', desc: 'Al-Fatah Clifton', amount: 5400 },
  ],
  'Utilities (K-Electric)': [
    { date: 'May 8', desc: 'K-Electric bill', amount: 8500 },
    { date: 'May 5', desc: 'SSGC gas bill', amount: 3500 },
  ],
  'Commute & Fuel': [
    { date: 'May 19', desc: 'Petrol — PSO', amount: 4500 },
    { date: 'May 12', desc: 'Careem rides x4', amount: 2100 },
    { date: 'May 6', desc: 'Parking + toll', amount: 1400 },
  ],
  'Discretionary / Dining': [
    { date: 'May 20', desc: 'Dinner — Kolachi', amount: 4800 },
    { date: 'May 15', desc: 'Cinema DHA', amount: 3200 },
    { date: 'May 10', desc: 'Coffee — Gloria', amount: 5000 },
  ],
};

const INSIGHTS_DATA = [
  {
    id: 2,
    icon: 'trending-up',
    tag: 'OPPORTUNITY',
    color: '#00C853',
    title: 'Idle Capital Opportunity',
    body: 'PKR 30,000 sitting in HBL Checking earning 0% p.a. Meezan Daily Amdani Account offers ~11.5% p.a. (SECP-regulated, halal).',
    impact: '+PKR 3,450/yr',
    action: 'Transfer PKR 30,000 to Meezan Daily Amdani for ~11.5% annual yield.',
  },
  {
    id: 4,
    icon: 'alert-triangle',
    tag: 'OVERSPEND',
    color: '#FF9500',
    title: 'Groceries Over Budget',
    body: 'Grocery spending hit PKR 7,800 this month vs a PKR 6,500 target — PKR 1,300 above plan. Week 3 Carrefour run drove the spike.',
    impact: '−PKR 1,300',
    action: 'Set a per-trip cap of PKR 2,000 and review grocery frequency next week.',
  },
  {
    id: 5,
    icon: 'trending-up',
    tag: 'SAVINGS',
    color: '#00A3FF',
    title: 'Wedding Fund On Track',
    body: 'Wedding Fund is 62% funded with 14 months to go. Maintaining PKR 12,000/mo contributions will reach your PKR 5,00,000 target by Dec 2027.',
    impact: 'On track',
    action: 'Keep current contribution pace — no action needed this month.',
  },
  {
    id: 3,
    icon: 'clock',
    tag: 'TAX · 45 DAYS',
    color: '#C8FF00',
    title: 'FBR Section 62 Deadline',
    body: 'Investing PKR 1,70,000 more in SECP-approved mutual funds before June 30 unlocks a PKR 40,000 tax credit under ITO Section 62.',
    impact: '+PKR 40,000',
    action: 'Invest PKR 1,70,000 in approved SECP mutual funds before June 30 deadline.',
  },
];

const RATIOS = [
  {
    label: 'How many days you could live on your current cash without a new paycheck.',
    value: '48 Days',
    sub: 'Age of money',
    status: 'good',
  },
  {
    label: 'You could cover this many months if income stopped',
    value: '3.2 Mo',
    sub: 'Target: 6.0 months',
    status: 'warn',
  },
  {
    label: "Percent of income you're saving",
    value: '20.0%',
    sub: 'of monthly inflow',
    status: 'good',
  },
  {
    label: 'FBR Filer Savings',
    value: 'PKR 18,400',
    sub: 'Active filer status benefit',
    status: 'good',
  },
  {
    label: 'How much of your income goes to debt',
    value: '23.3%',
    sub: 'Healthy · below 36%',
    status: 'good',
  },
  {
    label: 'Tax proof saved — you could get back',
    value: 'PKR 14,200',
    sub: '6 payments verified this year',
    status: 'good',
  },
];

const SPEND_CATS = [
  { label: 'Housing & Rent', amount: 25000, pct: 31.2, flag: false },
  { label: 'Groceries & Essentials', amount: 22000, pct: 27.5, flag: true },
  { label: 'Utilities (K-Electric)', amount: 12000, pct: 15.0, flag: false },
  { label: 'Commute & Fuel', amount: 8000, pct: 10.0, flag: false },
  { label: 'Discretionary / Dining', amount: 13000, pct: 16.3, flag: false },
];

const BUDGETS = [
  { label: 'Groceries', remaining: 3000, limit: 25000, pct: 88 },
  { label: 'Utilities', remaining: 3000, limit: 15000, pct: 80 },
  { label: 'Fuel', remaining: 2000, limit: 10000, pct: 80 },
];

type InsightItem = typeof INSIGHTS_DATA[0] & { go?: DashInsight['go'] };

function Track({ pct, color }: { pct: number; color?: string }) {
  const { theme } = useTheme();
  const fill =
    color ??
    (pct >= 100
      ? theme.RED
      : pct >= 85
      ? '#FF9500'
      : pct <= 40
      ? theme.GREEN
      : theme.MUTED);

  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(pct, 100),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct, animWidth]);

  const interpolatedWidth = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.trackBackground}>
      <Animated.View
        style={[
          styles.trackFill,
          {
            backgroundColor: fill,
            width: interpolatedWidth,
          },
        ]}
      />
    </View>
  );
}

function CategoryDetailSheet({
  visible,
  categoryName,
  budget,
  onClose,
  onSaveLimit,
  transactions,
}: {
  visible: boolean;
  categoryName: string;
  budget: number;
  onClose: () => void;
  onSaveLimit?: (newLimit: number) => void;
  /** A user's own transactions in this category; the sample's are used otherwise. */
  transactions?: { date: string; desc: string; amount: number }[];
}) {
  const { theme } = useTheme();
  const [limit, setLimit] = useState(budget);

  useEffect(() => {
    setLimit(budget);
  }, [budget]);

  const txns = transactions ?? CAT_TRANSACTIONS[categoryName] ?? [];
  const spent = txns.reduce((s, t) => s + t.amount, 0);
  const pct = Math.min(Math.round((spent / (limit || 1)) * 100), 100);
  const barColor = pct >= 100 ? theme.RED : pct > 75 ? '#FF9500' : theme.GREEN;

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdropTap} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: theme.CARD, maxHeight: '82%' }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                CATEGORY
              </Text>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>{categoryName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}>
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Spend summary */}
            <View style={[styles.catDetailSummaryCard, { backgroundColor: theme.MODAL }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: barColor, letterSpacing: -1 }}>
                  {spent.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, color: theme.MUTED }}>
                  / PKR {limit.toLocaleString()} limit
                </Text>
              </View>
              <View style={{ height: 4, backgroundColor: 'rgba(128,128,128,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: barColor, borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 10, color: theme.MUTED }}>{pct}% of monthly limit used</Text>
            </View>

            {/* Spending limit editor */}
            <View style={[styles.catDetailLimitEditor, { backgroundColor: theme.MODAL }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
                EDIT SPENDING LIMIT
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setLimit(l => Math.max(1000, l - 1000))}
                  style={[styles.limitStepBtn, { backgroundColor: theme.CARD }]}
                >
                  <Text style={{ fontSize: 20, fontWeight: '700', color: theme.TEXT, lineHeight: 22 }}>−</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: theme.TEXT, letterSpacing: -0.8 }}>
                    PKR {limit.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setLimit(l => l + 1000)}
                  style={[styles.limitStepBtn, { backgroundColor: theme.CARD }]}
                >
                  <Text style={{ fontSize: 20, fontWeight: '700', color: theme.TEXT, lineHeight: 22 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transactions list */}
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>
              THIS MONTH
            </Text>
            <View style={{ gap: 8 }}>
              {txns.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.MUTED, textAlign: 'center', paddingVertical: 16 }}>
                  No transactions yet this month.
                </Text>
              ) : (
                txns.map((t, idx) => (
                  <View
                    key={idx}
                    style={[styles.catDetailTxRow, { backgroundColor: theme.MODAL }]}
                  >
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.TEXT, marginBottom: 2 }}>{t.desc}</Text>
                      <Text style={{ fontSize: 10, color: theme.MUTED }}>{t.date}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.RED }}>
                      −{t.amount.toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Save Limit CTA */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (onSaveLimit) onSaveLimit(limit);
                onClose();
              }}
              style={[styles.saveLimitBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.saveLimitBtnText, { color: theme.BG }]}>Save Limit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </AnimatedModal>
  );
}

const TEAL = '#00BFA5';
const RUNWAY_MONTHS = 3.2;
const RUNWAY_MAX_MONTHS = 6;
const RUNWAY_SEGMENTS = 6;
const runwayFilledSegs = Math.round(
  (RUNWAY_MONTHS / RUNWAY_MAX_MONTHS) * RUNWAY_SEGMENTS,
);

// Faint teal dot texture behind the light-mode metric tiles
function DotGrid({ id }: { id: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id={id} width={5} height={5} patternUnits="userSpaceOnUse">
          <Circle cx={2.5} cy={2.5} r={1} fill={TEAL} fillOpacity={0.055} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [subTab, setSubTab] = useState<DashTab>('live');
  const dashLoad = useLoadState('dashboard');
  const dashReady = dashLoad.status === 'ready';
  const insightLoad = useLoadState('dashboard-insight');
  const { online } = useNetwork();
  // Slide sub-tab content in from the side of the tab being moved toward
  const prevSubTab = useRef(subTab);
  const subTabDir =
    DASH_TAB_ORDER.indexOf(subTab) >= DASH_TAB_ORDER.indexOf(prevSubTab.current)
      ? 'forward'
      : 'back';
  useEffect(() => {
    prevSubTab.current = subTab;
  }, [subTab]);
  const [overlay, setOverlay] = useState<DashOverlay>(null);
  const [envelopes, setEnvelopes] = useState<EnvelopeCategory[]>(ENVELOPE_CATS);
  const [quickDepositGoalId, setQuickDepositGoalId] = useState(
    SAVINGS_GOALS[0].id,
  );
  const [quickDepositIdx, setQuickDepositIdx] = useState(0);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [metricBreakModalVisible, setMetricBreakModalVisible] = useState(false);
  const [actionInsight, setActionInsight] = useState<InsightItem | null>(null);
  // Keep the last insight around so the dialog can animate out with its content
  const lastActionInsight = useRef<InsightItem | null>(null);
  if (actionInsight) lastActionInsight.current = actionInsight;
  const shownInsight = actionInsight ?? lastActionInsight.current;

  const profile = useAppSelector(state => state.user.profile);
  const userName = profile?.name?.split(' ')[0] || 'Talha';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // A signed-in user's Home is worked out from their own data; Explore shows the sample.
  const userMode = useUserMode();
  const isUser = userMode.isNewUser;
  const planning = usePlanningActions();
  const userGoals = useSavingsGoals().goals;
  const userBank = useBankAccounts();
  const u = computeUserDashboard({
    txs: userMode.txs,
    goals: userMode.goals,
    holdings: userMode.holdings,
    budget: userMode.budget,
    envelopes: userMode.envelopes,
    accountBalances: isUser ? userBank.accounts.map(a => a.balance) : [],
    profileIncome: monthlyIncomeOf(profile?.monthlyIncome),
    debts: userMode.debts,
  });
  const fmt = (n: number) => Math.round(n).toLocaleString('en-PK');
  const signed = (n: number) => (n === 0 ? '0' : `${n < 0 ? '−' : '+'}${fmt(Math.abs(n))}`);
  const goalList = isUser ? userGoals : SAVINGS_GOALS;
  const insightList: InsightItem[] = isUser ? u.insights : INSIGHTS_DATA;
  const goTo = (target: DashInsight['go']) =>
    target === 'BudgetPlanner'
      ? navigation.navigate('BudgetPlanner')
      : navigation.navigate('Drawer', { screen: 'MainTabs', params: { screen: target } });
  const runwaySegs = isUser
    ? Math.round((Math.min(u.runwayMonths ?? 0, RUNWAY_MAX_MONTHS) / RUNWAY_MAX_MONTHS) * RUNWAY_SEGMENTS)
    : runwayFilledSegs;
  const spendPct = isUser ? Math.min(u.budgetPct ?? 0, 100) : 53;

  const { accounts } = useAppSelector(state => state.bankAccounts);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Privacy toggle for the Net Worth card amounts
  const [amountsHidden, setAmountsHidden] = useState(false);
  const mask = (value: string) => (amountsHidden ? '••••••' : value);

  const displayBalance =
    totalBalance > 0
      ? totalBalance.toLocaleString('en-PK')
      : '3,82,000';

  const now = new Date();
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const planMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const planMonthName = MONTH_NAMES[now.getMonth()];

  // Planning sheet: Explore plans the sample PKR 150,000; a signed-in user plans their own monthly
  // budget and envelopes (copied into the sheet when it opens, saved on Confirm).
  const [editingPool, setEditingPool] = useState(false);
  const [poolDraft, setPoolDraft] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const draftPool = parseInt(poolDraft.replace(/,/g, ''), 10);
  const planPool = !isUser
    ? MONTHLY_INCOME_POOL
    : editingPool
    ? isNaN(draftPool) ? 0 : draftPool
    : userMode.budget ?? 0;

  const allocated = envelopes.reduce((sum, e) => sum + e.amount, 0);
  const unallocated = planPool - allocated;
  const overAllocated = unallocated < 0;

  const adjustEnvelope = (idx: number, delta: number) =>
    setEnvelopes(list =>
      list.map((e, i) =>
        i === idx && !e.locked
          ? { ...e, amount: Math.max(0, e.amount + delta) }
          : e,
      ),
    );

  // Inline envelope amount editing (single row or "Edit all")
  const [editingEnvIdx, setEditingEnvIdx] = useState<number | null>(null);
  const [editEnvVal, setEditEnvVal] = useState('');
  const [editAllEnvelopes, setEditAllEnvelopes] = useState(false);
  const [editEnvVals, setEditEnvVals] = useState<string[]>([]);

  const parseAmount = (v: string) => parseInt(v.replace(/,/g, ''), 10);

  const startEnvelopeEdit = (idx: number) => {
    setEditingEnvIdx(idx);
    setEditEnvVal(String(envelopes[idx].amount));
  };
  const commitEnvelopeEdit = () => {
    if (editingEnvIdx === null) return;
    const parsed = parseAmount(editEnvVal);
    if (!isNaN(parsed) && parsed >= 0) {
      setEnvelopes(list =>
        list.map((e, i) => (i === editingEnvIdx ? { ...e, amount: parsed } : e)),
      );
    }
    setEditingEnvIdx(null);
  };
  const startEditAllEnvelopes = () => {
    setEditingEnvIdx(null);
    setEditAllEnvelopes(true);
    setEditEnvVals(envelopes.map(e => String(e.amount)));
  };
  const commitAllEnvelopes = () => {
    setEnvelopes(list =>
      list.map((e, i) => {
        if (e.locked) return e;
        const parsed = parseAmount(editEnvVals[i] ?? '');
        return !isNaN(parsed) && parsed >= 0 ? { ...e, amount: parsed } : e;
      }),
    );
    setEditAllEnvelopes(false);
  };

  const openPlanning = () => {
    setEditingEnvIdx(null);
    setEditAllEnvelopes(false);
    if (isUser) {
      setEnvelopes(userMode.envelopes.map(e => ({ id: e.id, label: e.name, amount: e.limit, locked: false })));
      setPoolDraft(userMode.budget === null ? '' : String(userMode.budget));
      setEditingPool(userMode.budget === null);
    }
    setOverlay('envelopeBudget');
  };

  /** Saves a signed-in user's plan. The server keeps envelopes inside the budget at every step, so:
   *  raise the budget first, shrink envelopes before growing others, lower the budget last. */
  const savePlan = async () => {
    if (editingPool && (isNaN(draftPool) || draftPool <= 0)) {
      showToast('Enter your monthly budget first.', 'error');
      return;
    }
    if (overAllocated) {
      showToast(`Lower your limits by PKR ${fmt(-unallocated)} to fit your budget.`, 'error');
      return;
    }
    const before = new Map(userMode.envelopes.map(e => [e.id, e]));
    const changed = envelopes.filter(r => r.id && before.has(r.id) && before.get(r.id)!.limit !== r.amount);
    const saveRow = (r: EnvelopeCategory) => planning.updateEnvelope({ ...before.get(r.id!)!, limit: r.amount });
    const oldBudget = userMode.budget;
    const budgetChanged = oldBudget !== planPool;

    setSavingPlan(true);
    try {
      if (budgetChanged && (oldBudget === null || planPool > oldBudget)) await planning.setMonthlyBudget(planPool);
      for (const r of changed.filter(c => c.amount < before.get(c.id!)!.limit)) await saveRow(r);
      for (const r of changed.filter(c => c.amount > before.get(c.id!)!.limit)) await saveRow(r);
      if (budgetChanged && oldBudget !== null && planPool < oldBudget) await planning.setMonthlyBudget(planPool);
      setEditingPool(false);
      showToast(`${planMonthLabel} budget saved.`, 'success', 'Budget Saved');
      setOverlay(unallocated > 0 && envelopes.length > 0 ? 'unassignedWarning' : null);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const quickDepositAmounts = [5000, 10000, 25000];
  const quickDepositGoal =
    SAVINGS_GOALS.find(g => g.id === quickDepositGoalId) ?? SAVINGS_GOALS[0];

  const metricTileBg = theme.isDark ? theme.CARD : '#FAFAF8';
  const spendBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(spendBarAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [spendBarAnim]);

  const burnPct = 53;
  const burnColor =
    burnPct > 80 ? theme.RED : burnPct > 60 ? '#FF9500' : theme.GREEN;

  // State for MonthlyView
  const [sampleMIdx, setSampleMIdx] = useState(2);
  // A user's months end at the current one; `monthsBack` counts back from it, so it stays put
  // when older transactions add months to the front of the list.
  const [monthsBack, setMonthsBack] = useState(0);
  const months = isUser ? u.months.map(m => m.label) : ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
  const mIdx = isUser ? Math.max(0, months.length - 1 - monthsBack) : sampleMIdx;
  const setMIdx = (next: (i: number) => number) =>
    isUser ? setMonthsBack(months.length - 1 - next(mIdx)) : setSampleMIdx(next);
  const userMonth = u.months[mIdx] ?? u.months[u.months.length - 1];

  // State for AccountSheet
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [accountList, setAccountList] = useState([
    { id: '1', name: 'Meezan Checking', balance: 45200, tag: 'Islamic' },
    { id: '2', name: 'HBL Savings', balance: 67180, tag: 'Conventional' },
    { id: '3', name: 'Easypaisa Wallet', balance: 3500, tag: 'Digital' },
  ]);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccBalance, setEditAccBalance] = useState('');
  const [addingNewAcc, setAddingNewAcc] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBal, setNewAccBal] = useState('');

  const handleSaveAccEdit = (id: string) => {
    const num = parseInt(editAccBalance.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      setAccountList(prev => prev.map(a => a.id === id ? { ...a, balance: num } : a));
    }
    setEditingAccId(null);
  };

  const handleAddNewAcc = () => {
    if (!newAccName.trim()) return;
    const num = parseInt(newAccBal.replace(/[^0-9]/g, ''), 10) || 0;
    setAccountList(prev => [
      ...prev,
      { id: String(Date.now()), name: newAccName.trim(), balance: num, tag: 'Manual' },
    ]);
    setNewAccName('');
    setNewAccBal('');
    setAddingNewAcc(false);
  };

  const totalAccountBal = accountList.reduce((s, a) => s + a.balance, 0);

  // State for CategoryDetailSheet
  const [selectedCat, setSelectedCat] = useState<{ label: string; budget: number } | null>(null);
  const [catLimits, setCatLimits] = useState<Record<string, number>>({});
  const [categoryDetailVisible, setCategoryDetailVisible] = useState(false);

  const handleCategoryTap = (label: string, budget: number) => {
    setSelectedCat({ label, budget: catLimits[label] ?? budget });
    setCategoryDetailVisible(true);
  };
  // A user's transactions in the tapped category, this month, newest first.
  const userCatTxns = selectedCat
    ? userMode.txs
        .filter(
          t =>
            t.type === 'expense' &&
            t.category === selectedCat.label &&
            t.date.getMonth() === now.getMonth() &&
            t.date.getFullYear() === now.getFullYear(),
        )
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(t => ({
          date: t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          desc: t.note || t.category,
          amount: t.amount,
        }))
    : [];

  // State for InsightsView
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  // State for DateRangeSheet
  const [selectedPreset, setSelectedPreset] = useState('This Month');

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
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.openDrawer()}
              style={[styles.iconButton, { backgroundColor: theme.CARD }]}
            >
              <Feather name="menu" size={20} color={theme.TEXT} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.greetingText, { color: theme.MUTED }]}>
                {greeting}
              </Text>
              <Text style={[styles.userNameText, { color: theme.TEXT }]}>
                {userName}
              </Text>
            </View>
          </View>

          <View style={styles.headerIconsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notifications')}
              style={[styles.iconButton, { backgroundColor: theme.CARD }]}
            >
              <Feather name="bell" size={18} color={theme.TEXT} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Settings')}
              style={[styles.iconButton, { backgroundColor: theme.CARD }]}
            >
              <Feather name="settings" size={18} color={theme.TEXT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5-Tab Horizontal Scrollable Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRowContainer}
          style={styles.tabsScrollView}
        >
          {TABS.map(t => {
            const isSelected = subTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.8}
                onPress={() => setSubTab(t.key)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isSelected ? theme.TEXT : theme.CARD,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isSelected ? theme.BG : theme.MUTED,
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB CONTENTS */}
        <FadeInView key={subTab} from={subTabDir} distance={24}>
        {/* Loads once per visit; sub-tabs share the screen's load and never replay it. */}
        {dashLoad.status === 'error' && <ErrorState onRetry={dashLoad.retry} />}
        {dashLoad.status === 'loading' && subTab === 'live' && (
          <DashLiveSkeleton checklist={isUser && !userMode.checklistHidden} />
        )}
        {dashLoad.status === 'loading' && subTab === 'monthly' && <DashMonthlySkeleton />}
        {dashLoad.status === 'loading' && subTab === 'health' && <DashHealthSkeleton />}
        {dashLoad.status === 'loading' && subTab === 'insights' && <DashInsightsSkeleton />}

        {/* 1. LIVE VIEW */}
        {dashReady && subTab === 'live' && (
          <View>
            {isUser && <GettingStartedCard style={styles.sectionMargin} />}

            {/* Monthly Planning Ritual Banner */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openPlanning}
              style={styles.sectionMargin}
            >
              <View
                style={[
                  styles.planBanner,
                  {
                    backgroundColor: `${theme.ACTIVE}14`,
                    borderColor: `${theme.ACTIVE}28`,
                  },
                ]}
              >
                <View style={styles.planBannerLeft}>
                  <Text style={styles.planBannerBolt}>⚡</Text>
                  <View style={styles.flexShrink}>
                    <Text style={[styles.planBannerTitle, { color: theme.ACTIVE }]}>
                      {isUser && u.budget === null
                        ? `${planMonthLabel} — Plan your month`
                        : `${planMonthLabel} — Unused money left`}
                    </Text>
                    <Text style={[styles.planBannerSub, { color: theme.MUTED }]}>
                      {isUser
                        ? u.budget === null
                          ? 'Set a monthly budget and spending limits →'
                          : `PKR ${fmt(Math.max(0, u.budgetLeft ?? 0))} of your budget left →`
                        : `Set spending limits for PKR ${MONTHLY_INCOME_POOL.toLocaleString('en-PK')} →`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.planBannerPill, { backgroundColor: theme.ACTIVE }]}>
                  <Text style={styles.planBannerPillText}>Budget</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Hero Card */}
            <View style={styles.sectionMargin}>
              <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAmountsHidden(h => !h)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={amountsHidden ? 'Show amounts' : 'Hide amounts'}
                  style={styles.privacyBtn}
                >
                  <Feather
                    name={amountsHidden ? 'eye-off' : 'eye'}
                    size={16}
                    color="rgba(255,255,255,0.8)"
                  />
                </TouchableOpacity>
                <Text style={styles.heroSubhead}>Net Worth · {isUser ? u.monthLabel : 'May 2026'}</Text>
                <Text style={styles.heroAmount}>{mask(isUser ? fmt(u.netWorth) : displayBalance)}</Text>
                <Text style={styles.heroCurrency}>PKR</Text>

                <View style={styles.heroDividerRow}>
                  <View style={styles.heroStatCol}>
                    <Text style={styles.heroStatLabel}>Income</Text>
                    <Text style={[styles.heroStatValue, { color: theme.GREEN }]}>
                      {mask(isUser ? fmt(u.income) : '1,50,000')}
                    </Text>
                  </View>

                  <View style={styles.heroStatColBordered}>
                    <Text style={styles.heroStatLabel}>Spent</Text>
                    <Text style={[styles.heroStatValue, { color: theme.RED }]}>
                      {mask(isUser ? fmt(u.spent) : '80,000')}
                    </Text>
                  </View>

                  <View style={styles.heroStatColBordered}>
                    <Text style={styles.heroStatLabel}>Saved</Text>
                    <Text style={[styles.heroStatValue, { color: isUser && u.saved < 0 ? theme.RED : '#FFFFFF' }]}>
                      {mask(isUser ? (u.saved < 0 ? signed(u.saved) : fmt(u.saved)) : '30,000')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Metric grid */}
            <View style={[styles.twoColRow, styles.sectionMargin]}>
              {/* Monthly Spending */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSubTab('monthly')}
                style={[styles.metricTile, { backgroundColor: metricTileBg }]}
              >
                {!theme.isDark && <DotGrid id="dotsSpend" />}
                <Text style={[styles.metricTileLabel, { color: theme.MUTED }]}>
                  MONTHLY SPENDING
                </Text>
                <Text style={[styles.metricTileValue, { color: theme.TEXT, lineHeight: 30, marginBottom: 3 }]} numberOfLines={1}>
                  {isUser ? fmt(u.spent) : '80,000'}
                </Text>
                <Text style={[styles.metricTileSub, { color: theme.MUTED }]}>
                  {isUser ? (u.budget === null ? 'No budget set' : `of PKR ${fmt(u.budget)}`) : 'of PKR 1,50,000'}
                </Text>
                <View style={{ marginTop: 'auto' }}>
                  <View style={styles.metricTileBarHead}>
                    <Text style={{ fontSize: 9, color: theme.MUTED }}>
                      {isUser
                        ? u.budgetLeft === null
                          ? 'Set a budget'
                          : u.budgetLeft < 0
                          ? `PKR ${abbr(-u.budgetLeft)} over`
                          : `PKR ${abbr(u.budgetLeft)} left`
                        : 'PKR 70k left'}
                    </Text>
                    <Text style={[styles.metricTileAccent, { color: isUser && (u.budgetPct ?? 0) > 100 ? theme.RED : TEAL }]}>
                      {isUser ? (u.budgetPct === null ? '' : `${u.budgetPct}%`) : '53%'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricTileTrack,
                      { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' },
                    ]}
                  >
                    <Animated.View
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: isUser && (u.budgetPct ?? 0) > 100 ? theme.RED : TEAL,
                        width: spendBarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${spendPct}%`],
                        }),
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Tax Saved */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AI Advisor')}
                style={[styles.metricTile, { backgroundColor: metricTileBg }]}
              >
                {!theme.isDark && <DotGrid id="dotsTax" />}
                {(!isUser || profile?.filerStatus === 'yes') && (
                  <View style={[styles.metricTileBadge, { backgroundColor: TEAL }]}>
                    <Feather name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
                <Text style={[styles.metricTileLabel, { color: theme.MUTED, paddingRight: 36 }]}>
                  {isUser ? 'TAX STATUS' : 'TAX SAVED THIS YEAR'}
                </Text>
                <Text style={[styles.metricTileValue, { color: theme.TEXT, marginBottom: 6 }]} numberOfLines={1}>
                  {isUser
                    ? profile?.filerStatus === 'yes'
                      ? 'Filer'
                      : profile?.filerStatus === 'no'
                      ? 'Non-filer'
                      : 'Unknown'
                    : abbr(18400)}
                </Text>
                {isUser && (
                  <Text style={[styles.metricTileSub, { color: theme.MUTED }]}>
                    Ask the AI Advisor how to save tax
                  </Text>
                )}
                {!isUser && !online && (
                  <View style={styles.offlineNote}>
                    <Feather name="wifi-off" size={10} color={theme.MUTED} />
                    <Text style={[styles.offlineNoteText, { color: theme.MUTED }]} numberOfLines={1}>
                      Last known figure · live rates need internet
                    </Text>
                  </View>
                )}
                <View style={{ marginTop: 'auto' }}>
                  <Text style={[styles.metricTileAccent, { color: TEAL }]}>
                    {isUser ? 'Tax tips →' : 'FBR Filer'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.twoColRow, styles.sectionMargin]}>
              {/* Investments */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Investments')}
                style={[styles.metricTile, { backgroundColor: metricTileBg }]}
              >
                {!theme.isDark && <DotGrid id="dotsInvest" />}
                <Text style={[styles.metricTileLabel, { color: theme.MUTED }]}>
                  INVESTMENTS
                </Text>
                <Text style={[styles.metricTileValue, { color: theme.TEXT, marginBottom: 8 }]} numberOfLines={1}>
                  {isUser ? (u.holdingsCount ? abbr(u.invested) : '—') : abbr(248000)}
                </Text>
                {isUser ? (
                  <View style={{ marginTop: 'auto' }}>
                    <Text style={[styles.metricTileSub, { color: theme.MUTED, marginBottom: 6 }]}>
                      {u.holdingsCount
                        ? `${u.holdingsCount} holding${u.holdingsCount === 1 ? '' : 's'}`
                        : 'Nothing tracked yet'}
                    </Text>
                    <Text style={[styles.metricTileAccent, { color: TEAL }]}>
                      {u.holdingsCount ? 'View →' : 'Add a holding →'}
                    </Text>
                  </View>
                ) : (
                <View style={{ marginTop: 'auto' }}>
                  <Svg width="100%" height={36} viewBox="0 0 100 36" preserveAspectRatio="none" style={{ marginBottom: 6 }}>
                    <Polyline
                      points="0,32 14,28 28,30 40,22 54,18 66,20 78,11 92,7 100,4"
                      fill="none"
                      stroke={TEAL}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={[styles.metricTileAccent, { color: TEAL }]}>+14.8%</Text>
                </View>
                )}
              </TouchableOpacity>

              {/* Cash on Hand */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => (isUser ? navigation.navigate('BankAccounts') : navigation.navigate('AgeOfMoney'))}
                style={[styles.metricTile, { backgroundColor: metricTileBg }]}
              >
                {!theme.isDark && <DotGrid id="dotsCash" />}
                <Text style={[styles.metricTileLabel, { color: theme.MUTED }]}>
                  CASH ON HAND
                </Text>
                <Text style={[styles.metricTileValue, { color: theme.TEXT, lineHeight: 30, marginBottom: 4 }]}>
                  {isUser ? (u.runwayMonths === null ? '—' : `${Math.round(u.runwayMonths * 30)} Days`) : '48 Days'}
                </Text>
                <Text style={[styles.metricTileSub, { color: theme.MUTED }]}>
                  {isUser
                    ? u.runwayMonths === null
                      ? 'Log spending and add your cash to see this'
                      : `${u.runwayMonths.toFixed(1)} months without income`
                    : '3.2 months without income'}
                </Text>
                <View style={styles.runwaySegRow}>
                  {Array.from({ length: RUNWAY_SEGMENTS }).map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.runwaySeg,
                        {
                          backgroundColor:
                            idx < runwaySegs
                              ? TEAL
                              : theme.isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            </View>

            {/* Active Savings Goals — compact rings */}
            <View style={styles.sectionMargin}>
              <View style={[styles.card, { backgroundColor: theme.CARD }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTagLabel, { color: theme.MUTED }]}>
                    Active Savings Goals
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('Drawer', {
                        screen: 'MainTabs',
                        params: { screen: 'Goals' },
                      })
                    }
                  >
                    <Text style={[styles.viewAllText, { color: theme.ACTIVE }]}>
                      {isUser && goalList.length === 0 ? 'Create one →' : `View All (${goalList.length}) →`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {goalList.length === 0 && (
                  <Text style={[styles.subText, { color: theme.MUTED }]}>
                    No savings goals yet. Pick a target and we'll show how much to put aside each month.
                  </Text>
                )}
                <View style={styles.goalRingsRow}>
                  {goalList.slice(0, 3).map(goal => {
                    const pct = goalPct(goal);
                    const color = goalColor(goal, theme.GREEN, theme.ACTIVE);
                    const shortName = goal.label
                      .split(' ')
                      .slice(0, 2)
                      .join(' ');
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isUser) {
                            navigation.navigate('GoalDetail', { goalId: goal.id });
                            return;
                          }
                          setQuickDepositGoalId(goal.id);
                          setOverlay('quickDeposit');
                        }}
                        style={styles.goalRingItem}
                      >
                        <View style={styles.goalRingWrap}>
                          <ProgressRing
                            pct={pct}
                            size={58}
                            strokeWidth={3.5}
                            color={color}
                            track={theme.MODAL}
                          />
                          <View style={styles.goalRingCenter}>
                            <Text style={[styles.goalRingPct, { color }]}>
                              {pct}%
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[styles.goalRingName, { color: theme.TEXT }]}
                          numberOfLines={2}
                        >
                          {shortName}
                        </Text>
                        <Text
                          style={[styles.goalRingDate, { color: theme.MUTED }]}
                        >
                          {goal.deadline}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Smart Insight Banner — loads on its own; a failure here never takes down the screen */}
            {insightLoad.status === 'error' ? (
              <View style={styles.sectionMargin}>
                <ErrorState compact onRetry={insightLoad.retry} />
              </View>
            ) : insightLoad.status === 'loading' ? (
              <View style={styles.sectionMargin}>
                <InsightCardSkeleton />
              </View>
            ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                isUser
                  ? u.insights[0]
                    ? goTo(u.insights[0].go)
                    : userMode.setFirstActionOpen(true)
                  : showToast('Grocery audit details opened.', 'info', 'SMART INSIGHT')
              }
              style={styles.sectionMargin}
            >
              <View
                style={[
                  styles.insightBanner,
                  {
                    backgroundColor: `${theme.ACTIVE}18`,
                    borderColor: `${theme.ACTIVE}30`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.insightDot,
                    { backgroundColor: theme.ACTIVE },
                  ]}
                />
                <Text style={[styles.insightText, { color: theme.TEXT }]}>
                  <Text style={{ fontWeight: '700', color: theme.ACTIVE }}>
                    SMART INSIGHT:{' '}
                  </Text>
                  {isUser
                    ? u.insights[0]?.body ?? 'Log your spending and income and we will point out what to watch.'
                    : 'Grocery spending has expanded by Rs. 5,000 this week. Tap to audit raw receipts.'}
                </Text>
              </View>
            </TouchableOpacity>
            )}

            {/* Category Spend Card */}
            <View style={styles.sectionMargin}>
              <View style={[styles.card, { backgroundColor: theme.CARD }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                    Category Spend
                  </Text>
                  <Text style={[styles.subText, { color: theme.MUTED }]}>
                    {isUser ? u.monthLabel : 'May 2026'}
                  </Text>
                </View>

                {isUser && u.categories.length === 0 && (
                  <Text style={[styles.subText, { color: theme.MUTED }]}>
                    No spending logged this month.
                  </Text>
                )}
                {(isUser
                  ? u.categories.map(c => ({ label: c.label, spent: c.spent, budget: c.limit ?? 0 }))
                  : CATS
                ).map((cat, i, list) => {
                  // A user's category with no envelope is shown as its share of this month's spending.
                  const limit = catLimits[cat.label] ?? (cat.budget || (isUser ? u.spent : 0));
                  const pct = Math.min(Math.round((cat.spent / (limit || 1)) * 100), 100);
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      activeOpacity={0.75}
                      onPress={() => handleCategoryTap(cat.label, limit)}
                      style={[
                        styles.catRow,
                        { marginBottom: i < list.length - 1 ? 16 : 4 },
                      ]}
                    >
                      <View style={styles.catHeader}>
                        <Text style={[styles.catLabel, { color: theme.TEXT }]}>
                          {cat.label}
                        </Text>
                        <View style={styles.catAmountRow}>
                          <Text style={[styles.catSpent, { color: theme.TEXT }]}>
                            {cat.spent.toLocaleString()}
                          </Text>
                          <Text
                            style={[styles.catBudget, { color: theme.MUTED }]}
                          >
                            {isUser && !cat.budget && !catLimits[cat.label] ? ' · no cap' : `/ ${limit.toLocaleString()}`}
                          </Text>
                        </View>
                      </View>
                      <Track pct={pct} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CA Insight Card */}
            <View style={styles.sectionMargin}>
              <View
                style={[
                  styles.newCaCard,
                  { backgroundColor: theme.CARD },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      backgroundColor: `${theme.ACTIVE}1A`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="zap" size={13} color={theme.ACTIVE} />
                  </View>
                  <Text style={[styles.newCaTag, { color: theme.MUTED }]}>
                    CA INSIGHT
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <Text style={[styles.newCaHeadline, { color: theme.ACTIVE }]}>
                    1,20,000
                  </Text>
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: theme.MUTED }}>
                      PKR
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.MUTED }}>
                      a year, before tax
                    </Text>
                  </View>
                </View>
                <Text style={[styles.newCaBody, { color: theme.MUTED }]}>
                  A <Text style={{ color: theme.TEXT, fontWeight: '700' }}>PKR 1 million</Text> investment earning{' '}
                  <Text style={{ color: theme.TEXT, fontWeight: '700' }}>12% annually</Text> can generate roughly this return — before taxes and fees.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 2. MONTHLY VIEW */}
        {dashReady && subTab === 'monthly' && (
          <View style={styles.tabContentGap}>
            {/* Month Selector */}
            <View
              style={[
                styles.monthSelectorRow,
                { backgroundColor: theme.CARD },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMIdx(i => Math.max(0, i - 1))}
                style={styles.monthArrowBtn}
              >
                <Feather
                  name="chevron-left"
                  size={18}
                  color={mIdx > 0 ? theme.TEXT : theme.MUTED}
                />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: theme.TEXT }]}>
                {months[mIdx]}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMIdx(i => Math.min(months.length - 1, i + 1))}
                style={styles.monthArrowBtn}
              >
                <Feather
                  name="chevron-right"
                  size={18}
                  color={mIdx < months.length - 1 ? theme.TEXT : theme.MUTED}
                />
              </TouchableOpacity>
            </View>

            {/* Inflows vs Outflows Split Card */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardTagLabel, { color: theme.MUTED, marginBottom: 16 }]}>
                Monthly Flows
              </Text>

              <View style={styles.flowsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.flowSubLabel, { color: theme.MUTED }]}>
                    Total Inflows
                  </Text>
                  <Text style={[styles.flowBigAmount, { color: theme.GREEN }]} numberOfLines={1}>
                    {isUser ? fmt(userMonth.inflow) : '1,54,200'}
                  </Text>
                  <Text style={[styles.flowCurrencyText, { color: theme.MUTED }]}>
                    PKR
                  </Text>
                </View>
                <View style={[styles.flowDivider, { backgroundColor: theme.BORDER }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.flowSubLabel, { color: theme.MUTED }]}>
                    Total Outflows
                  </Text>
                  <Text style={[styles.flowBigAmount, { color: theme.RED }]} numberOfLines={1}>
                    {isUser ? fmt(userMonth.outflow) : '80,000'}
                  </Text>
                  <Text style={[styles.flowCurrencyText, { color: theme.MUTED }]}>
                    PKR
                  </Text>
                </View>
              </View>

              <View style={[styles.splitTrack, { backgroundColor: theme.MODAL }]}>
                <View style={{ width: `${isUser ? userMonth.wantsPct : 66}%`, height: '100%', backgroundColor: theme.GREEN }} />
                <View style={{ width: `${isUser ? userMonth.needsPct : 34}%`, height: '100%', backgroundColor: theme.RED }} />
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.GREEN }]} />
                  <Text style={[styles.legendText, { color: theme.MUTED }]}>
                    Spent on wants {isUser ? userMonth.wantsPct : 66}%
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.RED }]} />
                  <Text style={[styles.legendText, { color: theme.MUTED }]}>
                    Spent on needs {isUser ? userMonth.needsPct : 34}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Net + Daily Burn 2-Column Cards */}
            <View style={styles.twoColRow}>
              <View style={[styles.miniCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                  Remaining balance
                </Text>
                <Text style={[styles.miniCardValue, { color: isUser && userMonth.net < 0 ? theme.RED : theme.GREEN }]} numberOfLines={1}>
                  {isUser ? signed(userMonth.net) : '+74,200'}
                </Text>
                <Text style={[styles.badgeText, { color: theme.MUTED }]}>
                  PKR Retained
                </Text>
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                  Daily Burn
                </Text>
                <Text style={[styles.miniCardValue, { color: theme.TEXT }]} numberOfLines={1}>
                  {isUser ? fmt(userMonth.dailyBurn) : '2,666'}
                </Text>
                <Text style={[styles.badgeText, { color: theme.MUTED }]}>
                  PKR / Day Avg
                </Text>
              </View>
            </View>

            {/* Spending by Category Card */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardTitle, { color: theme.TEXT, marginBottom: 14 }]}>
                Spending by Category
              </Text>
              {isUser && userMonth.categories.length === 0 && (
                <Text style={[styles.subText, { color: theme.MUTED }]}>
                  No spending logged in {userMonth.label}.
                </Text>
              )}
              {(isUser
                ? userMonth.categories.map(c => ({ ...c, flag: false }))
                : SPEND_CATS
              ).map((cat, i, list) => (
                <TouchableOpacity
                  key={cat.label}
                  activeOpacity={0.75}
                  onPress={() => handleCategoryTap(cat.label, Math.round(cat.amount * 1.2))}
                  style={{ marginBottom: i < list.length - 1 ? 14 : 0 }}
                >
                  <View style={styles.catHeader}>
                    <View style={styles.catLabelGroup}>
                      <Text style={[styles.catLabel, { color: theme.TEXT }]} numberOfLines={1}>
                        {cat.label}
                      </Text>
                      {cat.flag && (
                        <View style={[styles.flagBadge, { backgroundColor: `${theme.RED}20` }]}>
                          <Text style={[styles.flagText, { color: theme.RED }]}>+15%</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.catAmountRow}>
                      <Text style={[styles.catSpent, { color: theme.TEXT }]}>
                        {cat.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.catBudget, { color: theme.MUTED }]}>
                        {cat.pct}%
                      </Text>
                    </View>
                  </View>
                  <Track pct={cat.pct} color={cat.flag ? theme.RED : undefined} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget Monitor Card */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                  Budget Monitor
                </Text>
                <Text style={[styles.subText, { color: theme.MUTED }]}>
                  Remaining Allowance
                </Text>
              </View>
              {isUser && u.envelopeUse.length === 0 && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('BudgetPlanner')}>
                  <Text style={[styles.subText, { color: theme.MUTED }]}>
                    No spending caps yet.{' '}
                    <Text style={{ color: theme.ACTIVE, fontWeight: '700' }}>Add categories in the Budget Planner →</Text>
                  </Text>
                </TouchableOpacity>
              )}
              {(isUser ? u.envelopeUse : BUDGETS).map((b, i, list) => {
                const c = b.pct >= 85 ? theme.RED : b.pct >= 70 ? '#FF9500' : theme.GREEN;
                return (
                  <TouchableOpacity
                    key={b.label}
                    activeOpacity={0.75}
                    onPress={() => handleCategoryTap(b.label, b.limit)}
                    style={{ marginBottom: i < list.length - 1 ? 14 : 0 }}
                  >
                    <View style={styles.catHeader}>
                      <Text style={[styles.catLabel, { color: theme.TEXT }]}>
                        {b.label}
                      </Text>
                      <Text style={[styles.catSpent, { color: c, fontSize: 12 }]}>
                        {b.remaining < 0
                          ? `PKR ${(-b.remaining).toLocaleString()} over`
                          : `PKR ${b.remaining.toLocaleString()} left`}
                      </Text>
                    </View>
                    <Track pct={Math.min(b.pct, 100)} color={c} />
                    <Text style={[styles.remainingText, { color: theme.MUTED, marginTop: 4 }]}>
                      of PKR {b.limit.toLocaleString()} · {b.pct}% used
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.twoColRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => (isUser ? navigation.navigate('Analytics') : setDateRangeModalVisible(true))}
                style={[styles.actionPillButton, { backgroundColor: theme.MODAL }]}
              >
                <Feather name={isUser ? 'bar-chart-2' : 'calendar'} size={14} color={theme.ACTIVE} />
                <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                  {isUser ? 'Analytics' : 'Date Range'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => (isUser ? navigation.navigate('BankAccounts') : setAccountModalVisible(true))}
                style={[styles.actionPillButton, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="briefcase" size={14} color={theme.ACTIVE} />
                <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                  Accounts
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. HEALTH VIEW */}
        {dashReady && subTab === 'health' && isUser && !u.hasHealthData && (
          <View style={styles.tabContentGap}>
            <View style={[styles.card, styles.centerCard, { backgroundColor: theme.CARD }]}>
              <View style={[styles.scoreCircle, { borderColor: theme.BORDER }]}>
                <Feather name="activity" size={28} color={theme.MUTED} />
              </View>
              <Text style={[styles.scoreStatusTitle, { color: theme.TEXT }]}>
                Not enough data yet
              </Text>
              <Text style={[styles.scoreSubText, { color: theme.MUTED }]}>
                Log your income and spending and we'll score your savings, emergency fund and debt.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => userMode.setFirstActionOpen(true)}
              style={[styles.actionPillButtonFull, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="plus" size={15} color={theme.ACTIVE} />
              <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                Log a transaction
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {dashReady && subTab === 'health' && (!isUser || u.hasHealthData) && (
          <View style={styles.tabContentGap}>
            {/* Score Badge Card */}
            <View style={[styles.card, styles.centerCard, { backgroundColor: theme.CARD }]}>
              <View
                style={[
                  styles.scoreCircle,
                  { borderColor: isUser ? (u.score >= 75 ? theme.GREEN : u.score >= 50 ? '#FF9500' : theme.RED) : theme.GREEN },
                ]}
              >
                <Text style={[styles.scoreNumber, { color: theme.TEXT }]}>{isUser ? u.score : 78}</Text>
                <Text style={[styles.scoreDenom, { color: theme.MUTED }]}>/100</Text>
              </View>
              <Text style={[styles.scoreStatusTitle, { color: isUser ? (u.score >= 75 ? theme.GREEN : u.score >= 50 ? '#FF9500' : theme.RED) : theme.GREEN }]}>
                {isUser ? u.scoreLabel : 'Stable Growth'}
              </Text>
              <Text style={[styles.scoreSubText, { color: theme.MUTED }]}>
                {isUser
                  ? 'Based on your savings rate, emergency fund and debt over the last 3 months.'
                  : 'Financial health above average for PKR 1,50,000/mo income bracket.'}
              </Text>
            </View>

            {/* Plain-language metric stack */}
            <View style={styles.metricStack}>
              {(isUser ? u.ratios : RATIOS).map(r => {
                const c =
                  r.status === 'good'
                    ? theme.GREEN
                    : r.status === 'warn'
                    ? '#FF9500'
                    : theme.TEXT;
                return (
                  <View
                    key={r.label}
                    style={[styles.metricRow, { backgroundColor: theme.CARD }]}
                  >
                    <View style={styles.metricRowLeft}>
                      <Text style={[styles.metricLabel, { color: theme.MUTED }]}>
                        {r.label}
                      </Text>
                      <Text style={[styles.metricSub, { color: theme.MUTED }]}>
                        {r.sub}
                      </Text>
                    </View>
                    <Text style={[styles.metricValue, { color: c }]}>
                      {r.value}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* How score calculated button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMetricBreakModalVisible(true)}
              style={[styles.actionPillButtonFull, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="info" size={15} color={theme.ACTIVE} />
              <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                How is this score calculated?
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. AI INSIGHTS VIEW */}
        {dashReady && subTab === 'insights' && (
          <View style={styles.tabContentGap}>
            <Text style={[styles.cardTagLabel, { color: theme.MUTED, marginBottom: 4, paddingHorizontal: 4 }]}>
              AI Financial Insights
            </Text>

            {insightList.length === 0 && (
              <View style={[styles.card, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.subText, { color: theme.MUTED }]}>
                  Nothing to flag right now. Insights appear here as you log spending, set a budget and add goals.
                </Text>
              </View>
            )}
            {insightList.map(ins => {
              const isExp = expandedInsight === ins.id;
              return (
                <View
                  key={ins.id}
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: theme.CARD,
                      borderColor: isExp ? `${ins.color}40` : 'transparent',
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      setExpandedInsight(isExp ? null : ins.id)
                    }
                    style={styles.insightCardHeader}
                  >
                    <View
                      style={[
                        styles.insightIconBox,
                        { backgroundColor: `${ins.color}18` },
                      ]}
                    >
                      <Feather
                        name={ins.icon as any}
                        size={16}
                        color={ins.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={[
                          styles.insightTagBadge,
                          { backgroundColor: `${ins.color}18` },
                        ]}
                      >
                        <Text style={[styles.insightTagText, { color: ins.color }]}>
                          {ins.tag}
                        </Text>
                      </View>
                      <Text style={[styles.insightTitleText, { color: theme.TEXT }]}>
                        {ins.title}
                      </Text>
                    </View>
                    <Text style={[styles.insightImpactText, { color: ins.color }]}>
                      {ins.impact}
                    </Text>
                  </TouchableOpacity>

                  {isExp && (
                    <View style={[styles.insightExpContent, { borderTopColor: theme.BORDER }]}>
                      <Text style={[styles.insightBodyText, { color: theme.MUTED }]}>
                        {ins.body}
                      </Text>
                      <View style={styles.twoColRow}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => (isUser && ins.go ? goTo(ins.go) : setActionInsight(ins))}
                          style={[
                            styles.insightActionBtn,
                            { backgroundColor: ins.color },
                          ]}
                        >
                          <Text
                            style={[
                              styles.insightActionBtnText,
                              {
                                color:
                                  ins.color === '#C8FF00' ? '#000000' : '#FFFFFF',
                              },
                            ]}
                          >
                            {isUser ? 'Take Me There' : 'Execute Strategy via AI'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setExpandedInsight(null)}
                          style={[
                            styles.insightDismissBtn,
                            { backgroundColor: theme.MODAL },
                          ]}
                        >
                          <Text style={[styles.insightDismissBtnText, { color: theme.MUTED }]}>
                            Dismiss Insight
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        </FadeInView>
      </ScrollView>

      {/* MODALS */}

      {/* 1. Date Range Sheet Modal */}
      <AnimatedModal
        visible={dateRangeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDateRangeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setDateRangeModalVisible(false)}
          />
          <View style={[styles.sheetContainer, { backgroundColor: theme.CARD }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="calendar" size={16} color={theme.ACTIVE} />
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  Date Range
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDateRangeModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {['This Month', 'Last 30 Days', 'Q1 FY26', 'Custom Range'].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSelectedPreset(p)}
                  style={[
                    styles.presetBadge,
                    {
                      backgroundColor: selectedPreset === p ? theme.ACTIVE : theme.MODAL,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: selectedPreset === p ? '#FFFFFF' : theme.MUTED },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.calendarBox, { backgroundColor: theme.MODAL }]}>
              <View style={styles.calendarHeader}>
                <Feather name="chevron-left" size={16} color={theme.MUTED} />
                <Text style={[styles.calendarMonthText, { color: theme.TEXT }]}>
                  May 2026
                </Text>
                <Feather name="chevron-right" size={16} color={theme.MUTED} />
              </View>
              <View style={styles.calendarGrid}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <Text key={`h-${i}`} style={[styles.calHeadDay, { color: theme.MUTED }]}>
                    {d}
                  </Text>
                ))}
                {Array.from({ length: 3 }, (_, i) => (
                  <View key={`pad-${i}`} style={styles.calDayBox} />
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.calDayBox,
                      d === 16 && { backgroundColor: theme.ACTIVE, borderRadius: 8 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        { color: d === 16 ? '#FFFFFF' : theme.TEXT },
                        d === 16 && { fontWeight: '700' },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDateRangeModalVisible(false)}
              style={[styles.applyBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.applyBtnText, { color: theme.BG }]}>
                Apply Range
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>

      {/* 2. Account Sheet Modal */}
      <AnimatedModal
        visible={accountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setAccountModalVisible(false)}
          />
          <View style={[styles.sheetContainer, { backgroundColor: theme.CARD, maxHeight: '85%' }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="briefcase" size={16} color={theme.ACTIVE} />
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  Accounts
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAccountModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Manual-entry note */}
              <View
                style={[
                  styles.manualNote,
                  {
                    backgroundColor: `${theme.ACTIVE}14`,
                    borderColor: `${theme.ACTIVE}28`,
                  },
                ]}
              >
                <Feather name="info" size={13} color={theme.ACTIVE} style={{ marginTop: 2 }} />
                <Text style={[styles.manualNoteText, { color: theme.ACTIVE }]}>
                  Update your balances manually — bank syncing isn't available yet.
                </Text>
              </View>

              {/* Account list */}
              <View style={{ gap: 10 }}>
                {accountList.map(a => (
                  <View
                    key={a.id}
                    style={[styles.accountCardRow, { backgroundColor: theme.MODAL, flexDirection: 'column', alignItems: 'stretch' }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.accountName, { color: theme.TEXT, marginBottom: 0 }]}>
                          {a.name}
                        </Text>
                        <View style={[styles.accountTag, { backgroundColor: `${theme.ACTIVE}22` }]}>
                          <Text style={[styles.accountTagText, { color: theme.ACTIVE }]}>
                            {a.tag}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setEditingAccId(a.id);
                          setEditAccBalance(String(a.balance));
                        }}
                        style={[styles.editAccBtn, { backgroundColor: `${theme.ACTIVE}18` }]}
                      >
                        <Text style={[styles.editAccBtnText, { color: theme.ACTIVE }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    {editingAccId === a.id ? (
                      <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                        <TextInput
                          value={editAccBalance}
                          onChangeText={setEditAccBalance}
                          keyboardType="numeric"
                          placeholder="Balance"
                          placeholderTextColor={theme.MUTED}
                          style={[
                            styles.editBalInput,
                            {
                              backgroundColor: theme.CARD,
                              borderColor: `${theme.ACTIVE}40`,
                              color: theme.TEXT,
                            },
                          ]}
                        />
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSaveAccEdit(a.id)}
                          style={[styles.saveBalBtn, { backgroundColor: theme.GREEN }]}
                        >
                          <Text style={[styles.saveBalBtnText, { color: '#000000' }]}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.accountBal, { color: theme.GREEN, marginTop: 6 }]}>
                        Rs. {a.balance.toLocaleString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Add new account */}
              {addingNewAcc ? (
                <View style={[styles.addAccBox, { backgroundColor: theme.MODAL }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                    NEW ACCOUNT
                  </Text>
                  <TextInput
                    value={newAccName}
                    onChangeText={setNewAccName}
                    placeholder="Account name"
                    placeholderTextColor={theme.MUTED}
                    style={[
                      styles.addAccInput,
                      {
                        backgroundColor: theme.CARD,
                        borderColor: theme.BORDER,
                        color: theme.TEXT,
                      },
                    ]}
                  />
                  <TextInput
                    value={newAccBal}
                    onChangeText={setNewAccBal}
                    keyboardType="numeric"
                    placeholder="Balance (PKR)"
                    placeholderTextColor={theme.MUTED}
                    style={[
                      styles.addAccInput,
                      {
                        backgroundColor: theme.CARD,
                        borderColor: theme.BORDER,
                        color: theme.TEXT,
                        marginBottom: 12,
                      },
                    ]}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setAddingNewAcc(false)}
                      style={[styles.modalBtnHalf, { backgroundColor: theme.MODAL }]}
                    >
                      <Text style={[styles.modalBtnText, { color: theme.MUTED }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleAddNewAcc}
                      style={[styles.modalBtnHalf, { backgroundColor: theme.TEXT }]}
                    >
                      <Text style={[styles.modalBtnText, { color: theme.BG, fontWeight: '700' }]}>Add Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAddingNewAcc(true)}
                  style={[styles.addAccDashedBtn, { borderColor: theme.BORDER }]}
                >
                  <Feather name="plus" size={14} color={theme.MUTED} />
                  <Text style={[styles.addAccDashedText, { color: theme.MUTED }]}>Add Account</Text>
                </TouchableOpacity>
              )}

              {/* Total Liquid Balance */}
              <View style={[styles.totalBalCard, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.totalBalLabel, { color: theme.MUTED }]}>
                  Total Liquid Balance
                </Text>
                <Text style={[styles.totalBalValue, { color: theme.TEXT }]}>
                  Rs. {totalAccountBal.toLocaleString()}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </AnimatedModal>

      {/* Category Detail Sheet Modal */}
      {selectedCat && (
        <CategoryDetailSheet
          visible={categoryDetailVisible}
          categoryName={selectedCat.label}
          budget={selectedCat.budget}
          transactions={isUser ? userCatTxns : undefined}
          onClose={() => {
            setCategoryDetailVisible(false);
            setSelectedCat(null);
          }}
          onSaveLimit={newLimit => {
            if (selectedCat) {
              if (isUser) {
                // A user's limit is the envelope of the same name in the Budget Planner (saved on the server).
                const name = selectedCat.label;
                const existing = userMode.envelopes.find(e => e.name.toLowerCase() === name.toLowerCase());
                const meta = CAT_META[name];
                (existing
                  ? planning.updateEnvelope({ ...existing, limit: newLimit })
                  : planning.addEnvelope({
                      id: '',
                      name,
                      icon: meta?.icon ?? 'tag',
                      color: meta?.color ?? '#0047AB',
                      limit: newLimit,
                      isMain: false,
                    })
                )
                  .then(() =>
                    showToast(`Limit for ${name} updated to PKR ${newLimit.toLocaleString()}`, 'success', 'BUDGET UPDATED'),
                  )
                  .catch(error => showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error'));
                return;
              } else {
                setCatLimits(prev => ({ ...prev, [selectedCat.label]: newLimit }));
              }
              showToast(
                `Limit for ${selectedCat.label} updated to PKR ${newLimit.toLocaleString()}`,
                'success',
                'BUDGET UPDATED',
              );
            }
          }}
        />
      )}

      {/* 3. How We Calculate Metric Breakdown Modal */}
      <AnimatedModal
        visible={metricBreakModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMetricBreakModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setMetricBreakModalVisible(false)}
          />
          <View style={[styles.sheetContainer, { backgroundColor: theme.CARD, maxHeight: '80%' }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="info" size={16} color={theme.ACTIVE} />
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  How We Calculate
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMetricBreakModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(isUser ? u.breakdown : [
                {
                  label: 'Health Score (78/100)',
                  formula:
                    'Savings Rate × 0.30 + DTI × 0.30\n+ Emergency × 0.25 + Tax × 0.15',
                  result: '= 0.60 + 0.30 + 0.20 + 0.10 = 78 pts',
                },
                {
                  label: 'Debt-to-Income (DTI)',
                  formula:
                    'Total Monthly Debt ÷ Gross Income\nPKR 35,000 ÷ PKR 1,50,000',
                  result: '= 23.3%  (Healthy < 36%)',
                },
                {
                  label: 'Emergency Fund',
                  formula:
                    'Liquid Savings ÷ Monthly Essentials\nPKR 45,000 ÷ PKR 14,000',
                  result: '= 3.2 months  (Target ≥ 6.0)',
                },
                {
                  label: 'Tax Optimization',
                  formula:
                    'Actual Sec-62 Invest ÷ Max Cap\nPKR 1,10,000 ÷ PKR 1,70,000',
                  result: '= 64.7% ≈ 65% Leveraged',
                },
              ]).map((m, i) => (
                <View
                  key={i}
                  style={[styles.formulaBox, { backgroundColor: theme.MODAL }]}
                >
                  <Text style={[styles.formulaLabel, { color: theme.ACTIVE }]}>
                    {m.label}
                  </Text>
                  <Text style={[styles.formulaText, { color: theme.MUTED }]}>
                    {m.formula}
                  </Text>
                  <Text style={[styles.formulaResult, { color: theme.GREEN }]}>
                    {m.result}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </AnimatedModal>

      {/* 4. Action Confirm Modal */}
      <AnimatedModal
        visible={actionInsight !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionInsight(null)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setActionInsight(null)}
          />
          {shownInsight && (
            <View style={[styles.centerModalCard, { backgroundColor: theme.CARD }]}>
              <View style={styles.confirmHeader}>
                <View style={[styles.confirmCheckIcon, { backgroundColor: `${theme.GREEN}22` }]}>
                  <Feather name="check-circle" size={18} color={theme.GREEN} />
                </View>
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  Execute Strategy
                </Text>
              </View>

              <Text style={[styles.confirmBody, { color: theme.MUTED }]}>
                You are about to:{' '}
                <Text style={{ color: theme.TEXT, fontWeight: '600' }}>
                  {shownInsight.action}
                </Text>
              </Text>

              <View style={[styles.confirmMetaBox, { backgroundColor: theme.MODAL }]}>
                <View style={styles.confirmMetaRow}>
                  <Text style={[styles.confirmMetaLabel, { color: theme.MUTED }]}>
                    Estimated Impact
                  </Text>
                  <Text style={[styles.confirmMetaValue, { color: theme.GREEN }]}>
                    {shownInsight.impact}
                  </Text>
                </View>
                <View style={styles.confirmMetaRow}>
                  <Text style={[styles.confirmMetaLabel, { color: theme.MUTED }]}>
                    Category
                  </Text>
                  <Text style={[styles.confirmMetaValue, { color: theme.TEXT }]}>
                    {shownInsight.tag}
                  </Text>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActionInsight(null)}
                  style={[styles.modalBtnHalf, { backgroundColor: theme.MODAL }]}
                >
                  <Text style={[styles.modalBtnText, { color: theme.MUTED }]}>
                    Dismiss
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setActionInsight(null);
                    showToast(
                      'Strategy initiated via AI Advisor.',
                      'success',
                      'EXECUTION STARTED',
                    );
                  }}
                  style={[styles.modalBtnHalf, { backgroundColor: theme.GREEN }]}
                >
                  <Text style={[styles.modalBtnText, { color: '#000000', fontWeight: '700' }]}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </AnimatedModal>

      {/* 5. Monthly Planning Ritual — Category Allocation */}
      <AnimatedModal
        visible={overlay === 'envelopeBudget'}
        transparent
        animationType="slide"
        onRequestClose={() => setOverlay(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdropTap}
          activeOpacity={1}
          onPress={() => setOverlay(null)}
        />
        <View
          style={[
            styles.tallSheet,
            { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.sheetHeaderRow}>
            <View style={styles.flexShrink}>
              <Text style={[styles.envelopeEyebrow, { color: theme.ACTIVE }]}>
                {planMonthLabel.toUpperCase()}
              </Text>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                Monthly Planning
              </Text>
            </View>
            <View style={styles.envelopeHeaderActions}>
              {envelopes.length === 0 ? null : !editAllEnvelopes ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={startEditAllEnvelopes}
                  style={[styles.editAllBtn, { borderColor: theme.BORDER, borderWidth: 1 }]}
                >
                  <Text style={[styles.editAllText, { color: theme.MUTED }]}>Edit all</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={commitAllEnvelopes}
                  style={[styles.editAllBtn, { backgroundColor: theme.ACTIVE }]}
                >
                  <Text style={[styles.editAllText, { color: '#FFFFFF', fontWeight: '700' }]}>Done</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setOverlay(null)}
                style={[styles.sheetCloseBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Income pool */}
          <View
            style={[
              styles.incomePool,
              {
                backgroundColor: overAllocated
                  ? `${theme.RED}14`
                  : `${theme.GREEN}12`,
                borderColor: overAllocated
                  ? `${theme.RED}33`
                  : `${theme.GREEN}33`,
              },
            ]}
          >
            <View>
              <Text style={[styles.poolLabel, { color: theme.MUTED }]}>
                Available to Allocate
              </Text>
              <Text
                style={[
                  styles.poolValue,
                  { color: overAllocated ? theme.RED : theme.GREEN },
                ]}
              >
                PKR {Math.abs(unallocated).toLocaleString()}{' '}
                {overAllocated ? 'OVER' : 'left'}
              </Text>
            </View>
            {isUser && editingPool ? (
              <TextInput
                value={poolDraft}
                onChangeText={setPoolDraft}
                keyboardType="number-pad"
                placeholder="Monthly budget"
                placeholderTextColor={theme.MUTED}
                autoFocus={userMode.budget === null}
                accessibilityLabel="Monthly budget"
                style={[
                  styles.envelopeAmountInput,
                  styles.poolInput,
                  { color: theme.ACTIVE, backgroundColor: `${theme.ACTIVE}10`, borderColor: `${theme.ACTIVE}50` },
                ]}
              />
            ) : isUser ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setPoolDraft(String(userMode.budget ?? ''));
                  setEditingPool(true);
                }}
                accessibilityLabel="Change monthly budget"
                style={styles.poolEditBtn}
              >
                <Text style={[styles.poolOf, { color: theme.MUTED }]}>of PKR {fmt(planPool)}</Text>
                <Feather name="edit-2" size={11} color={theme.MUTED} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.poolOf, { color: theme.MUTED }]}>
                of PKR {MONTHLY_INCOME_POOL.toLocaleString('en-PK')}
              </Text>
            )}
          </View>

          {isUser && envelopes.length === 0 && (
            <View style={styles.planEmpty}>
              <Text style={[styles.planEmptyText, { color: theme.MUTED }]}>
                No spending limits yet. Split your budget into categories like groceries, fuel and bills.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setOverlay(null);
                  navigation.navigate('BudgetPlanner');
                }}
                style={[styles.editAllBtn, { borderColor: theme.BORDER, borderWidth: 1, alignSelf: 'flex-start' }]}
              >
                <Text style={[styles.editAllText, { color: theme.TEXT }]}>Add spending categories</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.envelopeList}
          >
            {envelopes.map((env, i) => (
              <View
                key={env.label}
                style={[
                  styles.envelopeRow,
                  i < envelopes.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <View style={styles.flexShrink}>
                  <Text style={[styles.envelopeName, { color: theme.TEXT }]}>
                    {env.label}
                  </Text>
                  {env.locked && (
                    <Text style={[styles.envelopeFixed, { color: theme.MUTED }]}>
                      FIXED
                    </Text>
                  )}
                </View>
                <View style={styles.envelopeStepper}>
                  {!env.locked && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => adjustEnvelope(i, -1000)}
                      style={[styles.stepCircle, { backgroundColor: theme.MODAL }]}
                    >
                      <Feather name="minus" size={12} color={theme.TEXT} />
                    </TouchableOpacity>
                  )}
                  {!env.locked && (editAllEnvelopes || editingEnvIdx === i) ? (
                    <TextInput
                      autoFocus={editingEnvIdx === i}
                      keyboardType="number-pad"
                      value={editAllEnvelopes ? editEnvVals[i] ?? '' : editEnvVal}
                      onChangeText={t =>
                        editAllEnvelopes
                          ? setEditEnvVals(vs => vs.map((v, j) => (j === i ? t : v)))
                          : setEditEnvVal(t)
                      }
                      onBlur={editAllEnvelopes ? undefined : commitEnvelopeEdit}
                      onSubmitEditing={editAllEnvelopes ? undefined : commitEnvelopeEdit}
                      style={[
                        styles.envelopeAmountInput,
                        {
                          color: theme.ACTIVE,
                          backgroundColor: `${theme.ACTIVE}10`,
                          borderColor: `${theme.ACTIVE}50`,
                        },
                      ]}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={env.locked ? 1 : 0.7}
                      disabled={env.locked}
                      onPress={() => startEnvelopeEdit(i)}
                    >
                      <Text style={[styles.envelopeAmount, { color: theme.TEXT }]}>
                        {env.amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!env.locked && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => adjustEnvelope(i, 1000)}
                      style={[styles.stepCircle, { backgroundColor: theme.MODAL }]}
                    >
                      <Feather name="plus" size={12} color={theme.TEXT} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {overAllocated && (
            <View
              style={[styles.overAllocWarn, { backgroundColor: `${theme.RED}14` }]}
            >
              <Feather name="info" size={12} color={theme.RED} />
              <Text style={[styles.overAllocText, { color: theme.RED }]}>
                Over-allocated by PKR{' '}
                {Math.abs(unallocated).toLocaleString()}. Rebalance categories.
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={savingPlan}
            onPress={() => {
              if (isUser) {
                savePlan();
                return;
              }
              if (overAllocated) {
                setOverlay('rebalanceSheet');
                return;
              }
              if (unallocated > 0) {
                setOverlay('unassignedWarning');
                return;
              }
              setOverlay(null);
              showToast(
                `${planMonthLabel} budget locked. Every rupee has a job.`,
                'success',
                'Budget Locked',
              );
            }}
            style={[
              styles.lockBtn,
              { backgroundColor: overAllocated ? theme.RED : theme.TEXT },
            ]}
          >
            <Text
              style={[
                styles.lockBtnText,
                { color: overAllocated ? '#FFFFFF' : theme.BG },
              ]}
            >
              {savingPlan
                ? 'Saving…'
                : overAllocated
                ? 'Rebalance First'
                : `Confirm ${planMonthName} Budget`}
            </Text>
          </TouchableOpacity>
          {isUser && envelopes.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setOverlay(null);
                navigation.navigate('BudgetPlanner');
              }}
              style={styles.planManageLink}
            >
              <Text style={[styles.planManageText, { color: theme.MUTED }]}>
                Add or remove categories in Budget Planner →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </AnimatedModal>

      {/* 6. Goal Milestone Celebration */}
      <AnimatedModal
        visible={overlay === 'goalMilestone'}
        transparent
        animationType="fade"
        onRequestClose={() => setOverlay(null)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setOverlay(null)}
          />
          <View style={[styles.centerModalCard, { backgroundColor: theme.CARD }]}>
            <View
              style={[
                styles.milestoneBadge,
                {
                  backgroundColor: `${theme.GREEN}18`,
                  borderColor: theme.GREEN,
                },
              ]}
            >
              <Feather name="check" size={28} color={theme.GREEN} />
            </View>
            <Text style={[styles.milestoneTitle, { color: theme.TEXT }]}>
              Goal Reached!
            </Text>
            <Text style={[styles.confirmBody, { color: theme.MUTED }]}>
              You have completed 100% of your{' '}
              <Text style={{ color: theme.TEXT, fontWeight: '600' }}>
                {quickDepositGoal.label} (PKR{' '}
                {quickDepositGoal.target.toLocaleString()})
              </Text>
              . Deploy into Meezan Daily Amdani to earn yield?
            </Text>
            <View style={styles.twoColRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOverlay(null)}
                style={[styles.modalBtnHalf, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.MUTED }]}>
                  Later
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setOverlay(null);
                  showToast(
                    'Deploying into Meezan Daily Amdani (≈12.8% p.a.).',
                    'success',
                    'Yield Deployment',
                  );
                }}
                style={[styles.modalBtnHalf, { backgroundColor: theme.GREEN }]}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: '#000000', fontWeight: '700' },
                  ]}
                >
                  Deploy to Meezan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AnimatedModal>

      {/* 7. Goal Quick Deposit Sheet */}
      <AnimatedModal
        visible={overlay === 'quickDeposit'}
        transparent
        animationType="slide"
        onRequestClose={() => setOverlay(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdropTap}
          activeOpacity={1}
          onPress={() => setOverlay(null)}
        />
        <View
          style={[
            styles.bottomSheet,
            { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.sheetHeaderRow}>
            <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
              Quick Deposit
            </Text>
            <TouchableOpacity
              onPress={() => setOverlay(null)}
              style={[styles.sheetCloseBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sheetSectionLabel, { color: theme.MUTED }]}>
            SELECT GOAL
          </Text>
          <View style={styles.chipWrap}>
            {SAVINGS_GOALS.map(g => {
              const selected = g.id === quickDepositGoalId;
              const c = goalColor(g, theme.GREEN, theme.ACTIVE);
              return (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.85}
                  onPress={() => setQuickDepositGoalId(g.id)}
                  style={[
                    styles.goalChip,
                    { backgroundColor: selected ? c : theme.MODAL },
                  ]}
                >
                  <Text
                    style={[
                      styles.goalChipText,
                      { color: selected ? '#FFFFFF' : theme.MUTED },
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sheetSectionLabel, { color: theme.MUTED }]}>
            QUICK AMOUNT
          </Text>
          <View style={styles.quickAmountRow}>
            {quickDepositAmounts.map((a, i) => (
              <TouchableOpacity
                key={a}
                activeOpacity={0.85}
                onPress={() => setQuickDepositIdx(i)}
                style={[
                  styles.quickAmountBtn,
                  {
                    backgroundColor:
                      quickDepositIdx === i ? theme.ACTIVE : theme.MODAL,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    {
                      color: quickDepositIdx === i ? '#FFFFFF' : theme.MUTED,
                    },
                  ]}
                >
                  {(a / 1000).toFixed(0)}k
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              const amount = quickDepositAmounts[quickDepositIdx];
              const completes =
                quickDepositGoal.current + amount >= quickDepositGoal.target;
              if (completes) {
                setOverlay('goalMilestone');
                return;
              }
              setOverlay(null);
              showToast(
                `PKR ${amount.toLocaleString()} deposited to ${
                  quickDepositGoal.label
                }.`,
                'success',
                'Contribution Logged',
              );
            }}
            style={[styles.lockBtn, { backgroundColor: theme.GREEN }]}
          >
            <Text style={[styles.lockBtnText, { color: '#000000' }]}>
              Deposit PKR{' '}
              {quickDepositAmounts[quickDepositIdx].toLocaleString()} to{' '}
              {quickDepositGoal.label}
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedModal>

      {/* 8. Quick Rebalance Sheet */}
      <AnimatedModal
        visible={overlay === 'rebalanceSheet'}
        transparent
        animationType="slide"
        onRequestClose={() => setOverlay(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdropTap}
          activeOpacity={1}
          onPress={() => setOverlay(null)}
        />
        <View
          style={[
            styles.bottomSheet,
            { backgroundColor: theme.MODAL, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[styles.sheetGrabber, { backgroundColor: theme.BORDER }]} />
          <Text style={[styles.sheetSectionLabel, { color: theme.MUTED }]}>
            QUICK REBALANCE
          </Text>
          <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
            Cover Overspending
          </Text>
          <Text style={[styles.rebalanceIntro, { color: theme.MUTED }]}>
            Groceries is overspent by{' '}
            <Text style={{ color: theme.RED, fontWeight: '700' }}>
              PKR 5,000
            </Text>
            . Move funds from:
          </Text>

          {[
            {
              label: 'Cover from Discretionary Buffer',
              available: 'PKR 12,000 available',
              color: theme.GREEN,
            },
            {
              label: 'Cover from Savings Goal Slice',
              available: 'PKR 25,000 available',
              color: theme.ACTIVE,
            },
            {
              label: 'Use Unassigned Cash',
              available: `PKR ${UNASSIGNED_CASH.toLocaleString()} ready to assign`,
              color: theme.MUTED,
            },
          ].map(opt => (
            <TouchableOpacity
              key={opt.label}
              activeOpacity={0.9}
              onPress={() => {
                setOverlay(null);
                showToast(
                  `${opt.label} — PKR 5,000 moved to Groceries.`,
                  'success',
                  'Category Covered',
                );
              }}
              style={[
                styles.rebalanceOption,
                { backgroundColor: theme.CARD, borderColor: theme.BORDER },
              ]}
            >
              <View style={styles.flexShrink}>
                <Text style={[styles.rebalanceLabel, { color: theme.TEXT }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.rebalanceAvail, { color: opt.color }]}>
                  {opt.available}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setOverlay(null);
              navigation.navigate('MoveMoney');
            }}
            style={[styles.outlineBtn, { borderColor: theme.ACTIVE }]}
          >
            <Text style={[styles.outlineBtnText, { color: theme.ACTIVE }]}>
              Advanced Money Movement →
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedModal>

      {/* 9. Over-Budget Alert */}
      <AnimatedModal
        visible={overlay === 'overBudgetAlert'}
        transparent
        animationType="fade"
        onRequestClose={() => setOverlay(null)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setOverlay(null)}
          />
          <View style={[styles.centerModalCard, { backgroundColor: theme.MODAL }]}>
            <View
              style={[styles.alertBadge, { backgroundColor: `${theme.RED}20` }]}
            >
              <Feather name="alert-triangle" size={22} color={theme.RED} />
            </View>
            <Text style={[styles.alertEyebrow, { color: theme.RED }]}>
              OVER-BUDGET ALERT
            </Text>
            <Text style={[styles.alertTitle, { color: theme.TEXT }]}>
              Category Exceeded
            </Text>
            <Text style={[styles.confirmBody, { color: theme.MUTED }]}>
              <Text style={{ color: theme.RED, fontWeight: '700' }}>
                Groceries
              </Text>{' '}
              spending limit exceeded by{' '}
              <Text style={{ color: theme.RED, fontWeight: '700' }}>
                PKR 5,000
              </Text>
              . Tap to rebalance from Buffer, or carry the leftover into next
              month.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setOverlay('rebalanceSheet')}
              style={[styles.lockBtn, { backgroundColor: theme.RED }]}
            >
              <Text style={[styles.lockBtnText, { color: '#FFFFFF' }]}>
                Rebalance Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setOverlay(null);
                showToast(
                  'Groceries overspend carried into next month.',
                  'info',
                  'Rollover Applied',
                );
              }}
              style={[styles.outlineBtn, { borderColor: theme.BORDER }]}
            >
              <Text style={[styles.outlineBtnText, { color: theme.MUTED }]}>
                Carry leftover to next month
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>

      {/* 10. Unassigned Income Warning */}
      <AnimatedModal
        visible={overlay === 'unassignedWarning'}
        transparent
        animationType="fade"
        onRequestClose={() => setOverlay(null)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setOverlay(null)}
          />
          <View style={[styles.centerModalCard, { backgroundColor: theme.MODAL }]}>
            <View
              style={[styles.alertBadge, { backgroundColor: `${theme.ACTIVE}20` }]}
            >
              <Feather name="info" size={22} color={theme.ACTIVE} />
            </View>
            <Text style={[styles.alertEyebrow, { color: theme.ACTIVE }]}>
              UNASSIGNED INCOME
            </Text>
            <Text style={[styles.alertTitle, { color: theme.TEXT }]}>
              Give Every Rupee a Job
            </Text>

            <View
              style={[
                styles.unassignedBox,
                {
                  backgroundColor: `${theme.ACTIVE}14`,
                  borderColor: `${theme.ACTIVE}33`,
                },
              ]}
            >
              <Text style={[styles.unassignedValue, { color: theme.ACTIVE }]}>
                PKR {Math.max(unallocated, 0).toLocaleString()}
              </Text>
              <Text style={[styles.poolLabel, { color: theme.MUTED }]}>
                unused money left to assign
              </Text>
            </View>

            <Text style={[styles.confirmBody, { color: theme.MUTED }]}>
              In zero-based budgeting, every rupee has a job before the month
              begins. Assign remaining funds to a category or savings goal.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setOverlay('envelopeBudget')}
              style={[styles.lockBtn, { backgroundColor: theme.ACTIVE }]}
            >
              <Text style={[styles.lockBtnText, { color: '#FFFFFF' }]}>
                Assign Remaining PKR{' '}
                {Math.max(unallocated, 0).toLocaleString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setOverlay(null)}
              style={[styles.outlineBtn, { borderColor: theme.BORDER }]}
            >
              <Text style={[styles.outlineBtnText, { color: theme.MUTED }]}>
                Skip for Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ── Monthly planning ritual banner ── */
  planBanner: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  planBannerBolt: { fontSize: 15 },
  planBannerTitle: { fontSize: 11, fontWeight: '700', marginBottom: 1 },
  planBannerSub: { fontSize: 10 },
  planBannerPill: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  planBannerPillText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  flexShrink: { flex: 1, minWidth: 0 },

  /* ── Dual metric cards (burn + age of money) ── */
  duoCard: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  duoCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  duoCardValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 3,
  },
  duoCardSub: { fontSize: 10, marginBottom: 10 },
  duoCardRunway: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 10,
  },
  duoCardFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  duoCardFoot: { fontSize: 10 },
  duoCardPct: { fontSize: 11, fontWeight: '700' },
  envelopeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editAllBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAllText: { fontSize: 11, fontWeight: '600' },
  envelopeAmountInput: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 72,
    maxWidth: 86,
    textAlign: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
    marginBottom: 6,
  },
  offlineNoteText: { flexShrink: 1, fontSize: 10 },
  metricTile: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 15,
    minHeight: 158,
    overflow: 'hidden',
  },
  metricTileLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  metricTileValue: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  metricTileSub: { fontSize: 10 },
  metricTileAccent: { fontSize: 11, fontWeight: '700' },
  metricTileBarHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  metricTileTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricTileBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runwaySegRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 4,
  },
  runwaySeg: {
    flex: 1,
    height: 7,
    borderRadius: 4,
  },
  simulateBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
  simulateBtnText: { fontSize: 10, fontWeight: '600' },

  /* ── Savings goals compact card ── */
  viewAllText: { fontSize: 11, fontWeight: '600' },
  goalRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goalRingItem: { flex: 1, alignItems: 'center', gap: 8 },
  goalRingWrap: { width: 58, height: 58 },
  goalRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRingPct: { fontSize: 11, fontWeight: '800' },
  goalRingName: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  goalRingDate: { fontSize: 8, textAlign: 'center' },

  /* ── Health plain-language metric rows ── */
  metricStack: { gap: 8 },
  metricRow: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  metricRowLeft: { flex: 1 },
  metricLabel: { fontSize: 12, lineHeight: 17, marginBottom: 5 },
  metricSub: { fontSize: 10, opacity: 0.7 },
  metricValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },

  /* ── Envelope allocation sheet ── */
  tallSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    gap: 12,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  incomePool: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  poolLabel: { fontSize: 10, marginBottom: 2 },
  poolValue: { fontSize: 22, fontWeight: '800', letterSpacing: -1 },
  poolOf: { fontSize: 11 },
  poolEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  poolInput: { minWidth: 110, maxWidth: 130 },
  planEmpty: { paddingVertical: 16, gap: 12 },
  planEmptyText: { fontSize: 13, lineHeight: 19 },
  planManageLink: { alignSelf: 'center', paddingVertical: 4 },
  planManageText: { fontSize: 12, fontWeight: '600' },
  envelopeList: { flexGrow: 0, marginBottom: 8 },
  envelopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  envelopeName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  envelopeFixed: { fontSize: 9, fontWeight: '700' },
  envelopeStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  envelopeAmount: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overAllocWarn: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  overAllocText: { fontSize: 10, fontWeight: '600', flex: 1 },
  lockBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  lockBtnText: { fontSize: 14, fontWeight: '700' },

  /* ── Bottom sheets shared by the new overlays ── */
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sheetGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  goalChip: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  goalChipText: { fontSize: 11, fontWeight: '600' },
  quickAmountRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickAmountBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountText: { fontSize: 14, fontWeight: '700' },
  rebalanceIntro: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  rebalanceOption: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  rebalanceLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  rebalanceAvail: { fontSize: 11 },
  outlineBtn: {
    height: 48,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600' },

  /* ── Alert dialogs ── */
  milestoneBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  unassignedBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  unassignedValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1.5 },

  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '400',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 5 Tab horizontal scroll bar */
  tabsScrollView: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  tabsRowContainer: {
    paddingHorizontal: 16,
    gap: 6,
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 100,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },

  tabContentGap: {
    gap: 12,
  },
  sectionMargin: {
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    position: 'relative',
  },
  privacyBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroSubhead: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.36)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 54,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -3,
    lineHeight: 56,
  },
  heroCurrency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  heroDividerRow: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatColBordered: {
    flex: 1,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.07)',
    marginLeft: 16,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.32)',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
  },
  miniCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  miniCardValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  cardNoPadding: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  cardTagLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  burnPctText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bigNumberText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 44,
    marginBottom: 4,
  },
  subText: {
    fontSize: 12,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 11,
    marginTop: 8,
  },
  trackBackground: {
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.18)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 8,
  },
  trackFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  insightBanner: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  insightDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 5,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  catRow: {},
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  catLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  flagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  catLabel: {
    fontSize: 13,
  },
  catAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  catSpent: {
    fontSize: 14,
    fontWeight: '700',
  },
  catBudget: {
    fontSize: 11,
  },
  caCard: {
    borderRadius: 24,
    padding: 20,
  },
  caLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  caText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  netLabel: {
    fontSize: 13,
  },
  netValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  netValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Monthly View Styles */
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  monthArrowBtn: {
    padding: 4,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  flowsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  flowSubLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  flowBigAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
  },
  flowCurrencyText: {
    fontSize: 10,
    marginTop: 2,
  },
  flowDivider: {
    width: 1,
    marginHorizontal: 18,
  },
  splitTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
  actionPillButton: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionPillButtonFull: {
    height: 50,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Cash Flow Chart Styles */
  chartContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginBottom: 16,
    height: 120,
    paddingBottom: 20,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarsGroup: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-end',
  },
  chartBar: {
    width: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  chartWeekLabel: {
    fontSize: 10,
  },
  tableHeader: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  tableCellWeek: {
    fontSize: 12,
    fontWeight: '600',
    width: 36,
  },
  tableCellVal: {
    fontSize: 12,
  },
  tableCellValBold: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Health View Styles */
  centerCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 40,
  },
  scoreDenom: {
    fontSize: 11,
  },
  scoreStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  scoreSubText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
  },

  /* AI Insight View Styles */
  insightCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  insightCardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 5,
  },
  insightTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  insightTitleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  insightImpactText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightExpContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  insightBodyText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  insightActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightDismissBtn: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightDismissBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Modal & Sheet Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalBackdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginRight: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarBox: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calHeadDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 9,
    paddingBottom: 6,
  },
  calDayBox: {
    width: `${100 / 7}%`,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  calDayText: {
    fontSize: 11,
  },
  applyBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  /* Account Sheet Styles */
  currencyPillGroup: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 3,
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  currencyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accountCardRow: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  accountTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  accountBal: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalBalCard: {
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalBalValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  /* Formula Metric Sheet */
  formulaBox: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  formulaLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  formulaText: {
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 6,
  },
  formulaResult: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Center Confirm Modal */
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  centerModalCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  confirmCheckIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  confirmMetaBox: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 6,
  },
  confirmMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmMetaLabel: {
    fontSize: 11,
  },
  confirmMetaValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBtnHalf: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Category Detail Sheet Styles */
  catDetailSummaryCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  catDetailLimitEditor: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
  },
  limitStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDetailTxRow: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveLimitBtn: {
    width: '100%',
    marginTop: 18,
    height: 50,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLimitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* New CA Card Styles */
  newCaCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  newCaTag: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  newCaHeadline: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  newCaBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  statLargeVal: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },

  /* Account Sheet Improvements */
  manualNote: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  manualNoteText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  editAccBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editAccBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  editBalInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBalBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addAccBox: {
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  addAccInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  addAccDashedBtn: {
    width: '100%',
    marginTop: 10,
    height: 48,
    borderRadius: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addAccDashedText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
