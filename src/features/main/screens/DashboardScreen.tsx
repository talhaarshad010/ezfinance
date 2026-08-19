import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { useToast } from '../../../context/ToastContext';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

type DashTab = 'pulse' | 'monthly' | 'flow' | 'health' | 'insights';

const TABS: { key: DashTab; label: string }[] = [
  { key: 'pulse', label: 'Pulse' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'flow', label: 'Cash Flow' },
  { key: 'health', label: 'Health' },
  { key: 'insights', label: 'AI Insight' },
];

const CATS = [
  { label: 'Groceries', spent: 7800, budget: 10000 },
  { label: 'Food & Dining', spent: 4230, budget: 6000 },
  { label: 'Transport', spent: 800, budget: 2000 },
  { label: 'Utilities', spent: 3500, budget: 5000 },
  { label: 'Rent', spent: 25000, budget: 25000 },
];

const WEEKLY = [
  { week: 'W1', inflow: 37500, outflow: 22000 },
  { week: 'W2', inflow: 37500, outflow: 18000 },
  { week: 'W3', inflow: 37500, outflow: 20000 },
  { week: 'W4', inflow: 37500, outflow: 20000 },
];

const INSIGHTS_DATA = [
  {
    id: 1,
    icon: 'alert-triangle',
    tag: 'UTILITIES',
    color: '#FF9500',
    title: 'High Utility Spike Detected',
    body: 'K-Electric bill jumped +PKR 3,500 above April average (PKR 8,500 → PKR 12,000). Consider off-peak A/C scheduling to reduce next cycle.',
    impact: '−PKR 3,500',
    action: 'Audit K-Electric usage and get AI off-peak scheduling recommendations.',
  },
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
  { label: 'Emergency Fund', value: '3.2 Mo', sub: 'Target: 6.0 Mo', status: 'warn' },
  { label: 'Debt-to-Income', value: '23.3%', sub: 'Healthy DTI', status: 'good' },
  { label: 'Savings Rate', value: '20.0%', sub: 'of Inflow', status: 'good' },
  { label: 'Tax Leverage', value: '65%', sub: 'Sec-62 Used', status: 'neutral' },
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

type InsightItem = typeof INSIGHTS_DATA[0];

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

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [subTab, setSubTab] = useState<DashTab>('pulse');
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [metricBreakModalVisible, setMetricBreakModalVisible] = useState(false);
  const [actionInsight, setActionInsight] = useState<InsightItem | null>(null);

  const profile = useAppSelector(state => state.user.profile);
  const firebaseUser = auth().currentUser;
  const userName =
    profile?.name?.split(' ')[0] ||
    firebaseUser?.displayName?.split(' ')[0] ||
    '';

  const { accounts } = useAppSelector(state => state.bankAccounts);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const displayBalance =
    totalBalance > 0
      ? totalBalance.toLocaleString('en-PK')
      : '3,82,000';

  const burnPct = 53;
  const burnColor =
    burnPct > 80 ? theme.RED : burnPct > 60 ? '#FF9500' : theme.GREEN;

  // State for MonthlyView
  const [mIdx, setMIdx] = useState(2);
  const months = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];

  // State for AccountSheet
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');

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
                Good morning
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

        {/* 1. PULSE VIEW */}
        {subTab === 'pulse' && (
          <View>
            {/* Hero Card */}
            <View style={styles.sectionMargin}>
              <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: theme.ACTIVE },
                  ]}
                />
                <Text style={styles.heroSubhead}>Net Worth · May 2026</Text>
                <Text style={styles.heroAmount}>{displayBalance}</Text>
                <Text style={styles.heroCurrency}>PKR</Text>

                <View style={styles.heroDividerRow}>
                  <View style={styles.heroStatCol}>
                    <Text style={styles.heroStatLabel}>Income</Text>
                    <Text style={[styles.heroStatValue, { color: theme.GREEN }]}>
                      1,50,000
                    </Text>
                  </View>

                  <View style={styles.heroStatColBordered}>
                    <Text style={styles.heroStatLabel}>Spent</Text>
                    <Text style={[styles.heroStatValue, { color: theme.RED }]}>
                      80,000
                    </Text>
                  </View>

                  <View style={styles.heroStatColBordered}>
                    <Text style={styles.heroStatLabel}>Saved</Text>
                    <Text style={[styles.heroStatValue, { color: '#FFFFFF' }]}>
                      30,000
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 2-Column Mini Cards */}
            <View style={[styles.twoColRow, styles.sectionMargin]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Investments')}
                style={[styles.miniCard, { backgroundColor: theme.CARD }]}
              >
                <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                  Investments
                </Text>
                <Text style={[styles.miniCardValue, { color: theme.TEXT }]}>
                  2,48,000
                </Text>
                <View style={styles.badgeRow}>
                  <Feather
                    name="arrow-up-right"
                    size={13}
                    color={theme.GREEN}
                  />
                  <Text style={[styles.badgeText, { color: theme.GREEN }]}>
                    +14.8%
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Portfolio')}
                style={[styles.miniCard, { backgroundColor: theme.CARD }]}
              >
                <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                  Tax Saved FY26
                </Text>
                <Text style={[styles.miniCardValue, { color: theme.TEXT }]}>
                  18,400
                </Text>
                <View style={styles.badgeRow}>
                  <Feather
                    name="arrow-up-right"
                    size={13}
                    color={theme.GREEN}
                  />
                  <Text style={[styles.badgeText, { color: theme.GREEN }]}>
                    Sec 62
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Monthly Burn Card */}
            <View style={styles.sectionMargin}>
              <View style={[styles.card, { backgroundColor: theme.CARD }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTagLabel, { color: theme.MUTED }]}>
                    Monthly Burn
                  </Text>
                  <Text style={[styles.burnPctText, { color: burnColor }]}>
                    {burnPct}%
                  </Text>
                </View>

                <Text style={[styles.bigNumberText, { color: theme.TEXT }]}>
                  80,000
                </Text>
                <Text style={[styles.subText, { color: theme.MUTED }]}>
                  of PKR 1,50,000 budget
                </Text>

                <Track pct={burnPct} />

                <Text style={[styles.remainingText, { color: theme.MUTED }]}>
                  PKR 70,000 remaining this cycle
                </Text>
              </View>
            </View>

            {/* Smart Insight Banner */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                showToast('Grocery audit details opened.', 'info', 'SMART INSIGHT')
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
                  Grocery spending has expanded by Rs. 5,000 this week. Tap to
                  audit raw receipts.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Category Spend Card */}
            <View style={styles.sectionMargin}>
              <View style={[styles.card, { backgroundColor: theme.CARD }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                    Category Spend
                  </Text>
                  <Text style={[styles.subText, { color: theme.MUTED }]}>
                    May 2026
                  </Text>
                </View>

                {CATS.map((cat, i) => {
                  const pct = Math.round((cat.spent / cat.budget) * 100);
                  return (
                    <View
                      key={cat.label}
                      style={[
                        styles.catRow,
                        { marginBottom: i < CATS.length - 1 ? 16 : 4 },
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
                            / {cat.budget.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <Track pct={pct} />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* CA Insight Strip */}
            <View style={styles.sectionMargin}>
              <View
                style={[
                  styles.caCard,
                  { backgroundColor: theme.ACTIVE },
                ]}
              >
                <Text style={styles.caLabel}>CA Insight</Text>
                <Text style={styles.caText}>
                  Investing PKR 1,70,000 more in SECP-approved mutual funds before
                  June 30 unlocks a{' '}
                  <Text style={{ fontWeight: '800' }}>PKR 40,000 tax credit</Text>{' '}
                  under Section 62 ITO.
                </Text>
              </View>
            </View>

            {/* Net Position Rows */}
            <View style={styles.sectionMargin}>
              <View
                style={[
                  styles.cardNoPadding,
                  { backgroundColor: theme.CARD },
                ]}
              >
                {[
                  { label: 'Investments', value: '+2,48,000', up: true },
                  { label: 'Active Loans', value: '−35,000', up: false },
                  { label: 'Emergency Fund', value: '+45,000', up: true },
                ].map((row, i) => (
                  <View
                    key={row.label}
                    style={[
                      styles.netRow,
                      {
                        borderBottomWidth: i < 2 ? 1 : 0,
                        borderBottomColor: theme.BORDER,
                      },
                    ]}
                  >
                    <Text style={[styles.netLabel, { color: theme.TEXT }]}>
                      {row.label}
                    </Text>
                    <View style={styles.netValueRow}>
                      <Feather
                        name={row.up ? 'arrow-up-right' : 'arrow-down-right'}
                        size={14}
                        color={row.up ? theme.GREEN : theme.RED}
                      />
                      <Text
                        style={[
                          styles.netValue,
                          { color: row.up ? theme.GREEN : theme.RED },
                        ]}
                      >
                        {row.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 2. MONTHLY VIEW */}
        {subTab === 'monthly' && (
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
                  <Text style={[styles.flowBigAmount, { color: theme.GREEN }]}>
                    1,54,200
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
                  <Text style={[styles.flowBigAmount, { color: theme.RED }]}>
                    80,000
                  </Text>
                  <Text style={[styles.flowCurrencyText, { color: theme.MUTED }]}>
                    PKR
                  </Text>
                </View>
              </View>

              <View style={[styles.splitTrack, { backgroundColor: theme.MODAL }]}>
                <View style={{ width: '66%', height: '100%', backgroundColor: theme.GREEN }} />
                <View style={{ width: '34%', height: '100%', backgroundColor: theme.RED }} />
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.GREEN }]} />
                  <Text style={[styles.legendText, { color: theme.MUTED }]}>
                    Discretionary 66%
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.RED }]} />
                  <Text style={[styles.legendText, { color: theme.MUTED }]}>
                    Non-Disc. 34%
                  </Text>
                </View>
              </View>
            </View>

            {/* Net + Daily Burn 2-Column Cards */}
            <View style={styles.twoColRow}>
              <View style={[styles.miniCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                  Net Cash
                </Text>
                <Text style={[styles.miniCardValue, { color: theme.GREEN }]}>
                  +74,200
                </Text>
                <Text style={[styles.badgeText, { color: theme.MUTED }]}>
                  PKR Retained
                </Text>
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                  Daily Burn
                </Text>
                <Text style={[styles.miniCardValue, { color: theme.TEXT }]}>
                  2,666
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
              {SPEND_CATS.map((cat, i) => (
                <View
                  key={cat.label}
                  style={{ marginBottom: i < SPEND_CATS.length - 1 ? 14 : 0 }}
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
                </View>
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
              {BUDGETS.map((b, i) => {
                const c = b.pct >= 85 ? theme.RED : b.pct >= 70 ? '#FF9500' : theme.GREEN;
                return (
                  <View
                    key={b.label}
                    style={{ marginBottom: i < BUDGETS.length - 1 ? 14 : 0 }}
                  >
                    <View style={styles.catHeader}>
                      <Text style={[styles.catLabel, { color: theme.TEXT }]}>
                        {b.label}
                      </Text>
                      <Text style={[styles.catSpent, { color: c, fontSize: 12 }]}>
                        PKR {b.remaining.toLocaleString()} left
                      </Text>
                    </View>
                    <Track pct={b.pct} color={c} />
                    <Text style={[styles.remainingText, { color: theme.MUTED, marginTop: 4 }]}>
                      of PKR {b.limit.toLocaleString()} · {b.pct}% used
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.twoColRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setDateRangeModalVisible(true)}
                style={[styles.actionPillButton, { backgroundColor: theme.CARD }]}
              >
                <Feather name="calendar" size={14} color={theme.ACTIVE} />
                <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                  Date Range
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAccountModalVisible(true)}
                style={[styles.actionPillButton, { backgroundColor: theme.CARD }]}
              >
                <Feather name="briefcase" size={14} color={theme.ACTIVE} />
                <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                  Accounts
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. CASH FLOW VIEW */}
        {subTab === 'flow' && (
          <View style={styles.tabContentGap}>
            {/* Weekly Cash Flow Bar Chart Card */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardTagLabel, { color: theme.MUTED, marginBottom: 18 }]}>
                Weekly Cash Flow · May 2026
              </Text>

              <View style={styles.chartContainer}>
                {WEEKLY.map(w => {
                  const maxVal = 40000;
                  const maxH = 100;
                  const ih = Math.round((w.inflow / maxVal) * maxH);
                  const oh = Math.round((w.outflow / maxVal) * maxH);

                  return (
                    <View key={w.week} style={styles.chartCol}>
                      <View style={[styles.chartBarsGroup, { height: maxH }]}>
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: ih,
                              backgroundColor: theme.GREEN,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: oh,
                              backgroundColor: theme.RED,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartWeekLabel, { color: theme.MUTED }]}>
                        {w.week}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.GREEN }]} />
                  <Text style={[styles.legendText, { color: theme.MUTED }]}>Inflows</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.RED }]} />
                  <Text style={[styles.legendText, { color: theme.MUTED }]}>Outflows</Text>
                </View>
              </View>
            </View>

            {/* Cumulative Net Retained Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: `${theme.GREEN}0E`,
                  borderColor: `${theme.GREEN}22`,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.cardTagLabel, { color: theme.GREEN, marginBottom: 8 }]}>
                Cumulative Net Retained
              </Text>
              <Text style={[styles.bigNumberText, { color: theme.TEXT }]}>
                +70,000
              </Text>
              <Text style={[styles.subText, { color: theme.MUTED }]}>
                PKR retained across May 2026
              </Text>
            </View>

            {/* Weekly Breakdown Table Card */}
            <View style={[styles.cardNoPadding, { backgroundColor: theme.CARD }]}>
              <View style={[styles.tableHeader, { borderBottomColor: theme.BORDER }]}>
                <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                  Weekly Breakdown
                </Text>
              </View>
              {WEEKLY.map((w, i) => {
                const net = w.inflow - w.outflow;
                return (
                  <View
                    key={w.week}
                    style={[
                      styles.tableRow,
                      {
                        borderBottomWidth: i < WEEKLY.length - 1 ? 1 : 0,
                        borderBottomColor: theme.BORDER,
                      },
                    ]}
                  >
                    <Text style={[styles.tableCellWeek, { color: theme.TEXT }]}>
                      {w.week}
                    </Text>
                    <Text style={[styles.tableCellVal, { color: theme.GREEN }]}>
                      +{(w.inflow / 1000).toFixed(1)}k
                    </Text>
                    <Text style={[styles.tableCellVal, { color: theme.RED }]}>
                      −{(w.outflow / 1000).toFixed(1)}k
                    </Text>
                    <Text style={[styles.tableCellValBold, { color: theme.GREEN }]}>
                      +{(net / 1000).toFixed(1)}k
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 4. HEALTH VIEW */}
        {subTab === 'health' && (
          <View style={styles.tabContentGap}>
            {/* Score Badge Card */}
            <View style={[styles.card, styles.centerCard, { backgroundColor: theme.CARD }]}>
              <View
                style={[
                  styles.scoreCircle,
                  { borderColor: theme.GREEN },
                ]}
              >
                <Text style={[styles.scoreNumber, { color: theme.TEXT }]}>78</Text>
                <Text style={[styles.scoreDenom, { color: theme.MUTED }]}>/100</Text>
              </View>
              <Text style={[styles.scoreStatusTitle, { color: theme.GREEN }]}>
                Stable Growth
              </Text>
              <Text style={[styles.scoreSubText, { color: theme.MUTED }]}>
                Financial health above average for PKR 1,50,000/mo income bracket.
              </Text>
            </View>

            {/* 2×2 Ratio Grid Cards */}
            <View style={styles.gridContainer}>
              {RATIOS.map(r => {
                const c =
                  r.status === 'good'
                    ? theme.GREEN
                    : r.status === 'warn'
                    ? '#FF9500'
                    : theme.TEXT;
                return (
                  <View
                    key={r.label}
                    style={[styles.gridCard, { backgroundColor: theme.CARD }]}
                  >
                    <Text style={[styles.miniCardLabel, { color: theme.MUTED }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.gridValue, { color: c }]}>
                      {r.value}
                    </Text>
                    <Text style={[styles.badgeText, { color: theme.MUTED }]}>
                      {r.sub}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* How score calculated button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMetricBreakModalVisible(true)}
              style={[styles.actionPillButtonFull, { backgroundColor: theme.CARD }]}
            >
              <Feather name="info" size={15} color={theme.ACTIVE} />
              <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                How is this score calculated?
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. AI INSIGHT VIEW */}
        {subTab === 'insights' && (
          <View style={styles.tabContentGap}>
            <Text style={[styles.cardTagLabel, { color: theme.MUTED, marginBottom: 4, paddingHorizontal: 4 }]}>
              AI Financial Insights
            </Text>

            {INSIGHTS_DATA.map(ins => {
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
                          onPress={() => setActionInsight(ins)}
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
                            Execute Strategy via AI
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
      </ScrollView>

      {/* MODALS */}

      {/* 1. Date Range Sheet Modal */}
      <Modal
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
      </Modal>

      {/* 2. Account Sheet Modal */}
      <Modal
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
          <View style={[styles.sheetContainer, { backgroundColor: theme.CARD }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="briefcase" size={16} color={theme.ACTIVE} />
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  Linked Accounts
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={[styles.currencyPillGroup, { backgroundColor: theme.MODAL }]}>
                  {(['PKR', 'USD'] as const).map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCurrency(c)}
                      style={[
                        styles.currencyPill,
                        {
                          backgroundColor:
                            currency === c ? theme.ACTIVE : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyPillText,
                          { color: currency === c ? '#FFFFFF' : theme.MUTED },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => setAccountModalVisible(false)}
                  style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
                >
                  <Feather name="x" size={14} color={theme.MUTED} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { name: 'Meezan Checking', balance: 45200, tag: 'Islamic' },
                { name: 'HBL Savings', balance: 67180, tag: 'Conventional' },
                { name: 'Easypaisa Wallet', balance: 3500, tag: 'Digital' },
              ].map(a => {
                const bal =
                  currency === 'PKR' ? a.balance : Math.round(a.balance / 280);
                return (
                  <View
                    key={a.name}
                    style={[styles.accountCardRow, { backgroundColor: theme.MODAL }]}
                  >
                    <View>
                      <Text style={[styles.accountName, { color: theme.TEXT }]}>
                        {a.name}
                      </Text>
                      <View style={[styles.accountTag, { backgroundColor: `${theme.ACTIVE}22` }]}>
                        <Text style={[styles.accountTagText, { color: theme.ACTIVE }]}>
                          {a.tag}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.accountBal, { color: theme.GREEN }]}>
                      {currency === 'PKR' ? 'Rs.' : '$'} {bal.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={[styles.totalBalCard, { backgroundColor: theme.MODAL }]}>
              <Text style={[styles.totalBalLabel, { color: theme.MUTED }]}>
                Total Liquid Balance
              </Text>
              <Text style={[styles.totalBalValue, { color: theme.TEXT }]}>
                Rs. 1,15,880
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. How We Calculate Metric Breakdown Modal */}
      <Modal
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
              {[
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
              ].map((m, i) => (
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
      </Modal>

      {/* 4. Action Confirm Modal */}
      <Modal
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
          {actionInsight && (
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
                  {actionInsight.action}
                </Text>
              </Text>

              <View style={[styles.confirmMetaBox, { backgroundColor: theme.MODAL }]}>
                <View style={styles.confirmMetaRow}>
                  <Text style={[styles.confirmMetaLabel, { color: theme.MUTED }]}>
                    Estimated Impact
                  </Text>
                  <Text style={[styles.confirmMetaValue, { color: theme.GREEN }]}>
                    {actionInsight.impact}
                  </Text>
                </View>
                <View style={styles.confirmMetaRow}>
                  <Text style={[styles.confirmMetaLabel, { color: theme.MUTED }]}>
                    Category
                  </Text>
                  <Text style={[styles.confirmMetaValue, { color: theme.TEXT }]}>
                    {actionInsight.tag}
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
      </Modal>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  statusDot: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: (width - 42) / 2,
    borderRadius: 20,
    padding: 16,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
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
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
});
