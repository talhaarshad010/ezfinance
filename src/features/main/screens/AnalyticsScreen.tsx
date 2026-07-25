import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop, Polyline } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useAppSelector } from '../../../store/hooks';
import { Transaction } from '../../../store/slices/bankAccountsSlice';
import { CalendarPicker } from '../../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'weekly' | 'monthly' | 'yearly' | 'custom';

const DEMO_CATEGORIES = [
  { name: 'Groceries', spent: 15560, total: 38630, icon: 'shopping-cart', color: '#00A3FF' },
  { name: 'Food & Dining', spent: 8230, total: 38630, icon: 'coffee', color: '#FF9500' },
  { name: 'Housing', spent: 7500, total: 38630, icon: 'home', color: '#00C853' },
  { name: 'Utilities', spent: 4800, total: 38630, icon: 'zap', color: '#AF52DE' },
  { name: 'Transport', spent: 2540, total: 38630, icon: 'truck', color: '#FF3B30' },
];

const TREND_VALUES = [
  1200, 2400, 1800, 3100, 2900, 4200, 3800, 5100, 4700, 6200, 5800, 7400,
  6900, 8500, 7800, 9200,
];

function Track({ pct, color }: { pct: number; color?: string }) {
  const { theme } = useTheme();
  const fill =
    color ||
    (pct >= 85
      ? theme.RED
      : pct >= 50
      ? '#FF9500'
      : theme.GREEN);

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

function SpendingTrendChart({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const chartWidth = SCREEN_WIDTH - 72;
  const chartHeight = 120;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * chartWidth;
      const y = chartHeight - 12 - ((val - min) / range) * (chartHeight - 24);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints =
    `0,${chartHeight} ` + points + ` ${chartWidth},${chartHeight}`;

  return (
    <View style={styles.chartContainer}>
      <Svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <Defs>
          <LinearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={`M ${areaPoints} Z`} fill="url(#trendGrad)" />
        <Polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          points={points}
        />
      </Svg>
    </View>
  );
}

export const AnalyticsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const transactionRecord = useAppSelector(
    state => state.bankAccounts.transactions,
  );
  const { categories, totalMonthlyBudget } = useAppSelector(
    state => state.budget,
  );

  const transactions = Object.values(transactionRecord).flat();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter((tx: Transaction) => {
    const d = new Date(tx.date);
    return (
      tx.type === 'expense' &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  const totalSpentThisMonth = currentMonthTx.reduce(
    (acc: number, tx: Transaction) => acc + tx.amount,
    0,
  );

  const displaySpent =
    totalSpentThisMonth > 0 ? totalSpentThisMonth : 38630;

  const [activeFilter, setActiveFilter] = useState<FilterType>('monthly');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const percentChange = +12.4;

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
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerBox}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={16} color={theme.MUTED} />
            <Text style={[styles.backText, { color: theme.MUTED }]}>
              Financial Audit
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
            Analytics
          </Text>
        </View>

        {/* Timeframe Filter Switcher Pills */}
        <View style={styles.sectionMargin}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {(['weekly', 'monthly', 'yearly', 'custom'] as FilterType[]).map(
              f => {
                const isActive = activeFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (f === 'custom') {
                        setShowCalendar(true);
                      }
                      setActiveFilter(f);
                    }}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isActive
                          ? theme.TEXT
                          : theme.CARD,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isActive ? theme.BG : theme.MUTED,
                        },
                      ]}
                    >
                      {f === 'custom' && customDate
                        ? customDate.toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : f.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>
        </View>

        {/* Hero Monthly Overview Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>
                TOTAL SPENT · MAY 2026
              </Text>
              <View style={styles.badgeRow}>
                <Feather
                  name="arrow-up-right"
                  size={12}
                  color={theme.RED}
                />
                <Text style={[styles.badgeText, { color: theme.RED }]}>
                  {percentChange}% vs last mo
                </Text>
              </View>
            </View>

            <Text style={styles.heroAmountDisplay}>
              {displaySpent.toLocaleString()}
            </Text>
            <Text style={styles.heroCurrency}>PKR</Text>

            {/* Bottom 3-Column Stats Divider */}
            <View style={styles.heroStatsDividerRow}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Avg. Daily</Text>
                <Text style={[styles.heroStatValue, { color: '#FFFFFF' }]}>
                  PKR {Math.round(displaySpent / 30).toLocaleString()}
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Top Category</Text>
                <Text style={[styles.heroStatValue, { color: theme.ACTIVE }]}>
                  Groceries
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Active Days</Text>
                <Text style={[styles.heroStatValue, { color: theme.GREEN }]}>
                  24 days
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spending Trend Interactive Chart Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                Spending Trend
              </Text>
              <Text style={[styles.subText, { color: theme.MUTED }]}>
                {activeFilter.toUpperCase()} CURVE
              </Text>
            </View>

            <SpendingTrendChart data={TREND_VALUES} color={theme.ACTIVE} />

            <View style={styles.trendLabelsRow}>
              <Text style={[styles.trendLabel, { color: theme.MUTED }]}>
                May 1
              </Text>
              <Text style={[styles.trendLabel, { color: theme.MUTED }]}>
                May 10
              </Text>
              <Text style={[styles.trendLabel, { color: theme.MUTED }]}>
                May 20
              </Text>
              <Text style={[styles.trendLabel, { color: theme.MUTED }]}>
                Today
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown Progress Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                Category Breakdown
              </Text>
              <Text style={[styles.subText, { color: theme.MUTED }]}>
                5 Categories
              </Text>
            </View>

            <View style={styles.catList}>
              {DEMO_CATEGORIES.map((cat, i) => {
                const pct = Math.round((cat.spent / cat.total) * 100);
                return (
                  <View
                    key={cat.name}
                    style={[
                      styles.catItemRow,
                      {
                        borderBottomWidth:
                          i < DEMO_CATEGORIES.length - 1 ? 1 : 0,
                        borderBottomColor: theme.BORDER,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catIconSquare,
                        { backgroundColor: theme.MODAL },
                      ]}
                    >
                      <Feather
                        name={cat.icon}
                        size={15}
                        color={cat.color}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.catHeaderRow}>
                        <Text style={[styles.catName, { color: theme.TEXT }]}>
                          {cat.name}
                        </Text>
                        <Text style={[styles.catAmount, { color: theme.TEXT }]}>
                          PKR {cat.spent.toLocaleString()}{' '}
                          <Text style={[styles.catPct, { color: theme.MUTED }]}>
                            ({pct}%)
                          </Text>
                        </Text>
                      </View>
                      <Track pct={pct} color={cat.color} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Budget Utilization Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                Budget Utilization
              </Text>
              <Text style={[styles.pctText, { color: theme.GREEN }]}>
                26% Used
              </Text>
            </View>

            <Text style={[styles.bigNum, { color: theme.TEXT }]}>
              38,630
            </Text>
            <Text style={[styles.subText, { color: theme.MUTED }]}>
              of PKR 1,50,000 monthly budget
            </Text>

            <Track pct={26} color={theme.GREEN} />

            <Text style={[styles.remText, { color: theme.MUTED }]}>
              PKR 1,11,370 remaining for May 2026
            </Text>
          </View>
        </View>

        {/* AI CA Spending Insight Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            showToast(
              'Audit recommendations dispatched to AI CA.',
              'info',
              'Analytics Insight',
            )
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
                ANALYTICS INSIGHT:{' '}
              </Text>
              Your grocery spend increased by 18% compared to last month.
              Consider auditing supermarket receipts to claim Section 62 tax
              offsets.
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Picker Modal for Custom Date Range */}
      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        initialDate={customDate || new Date()}
        onSelectDate={(d: Date) => {
          setCustomDate(d);
          setActiveFilter('custom');
          setShowCalendar(false);
        }}
      />
    </View>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  sectionMargin: {
    marginBottom: 12,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterPill: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 100,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(213,0,0,0.15)',
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heroAmountDisplay: {
    fontSize: 50,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -3,
    lineHeight: 52,
  },
  heroCurrency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  heroStatsDividerRow: {
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
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.07)',
    marginLeft: 14,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.32)',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  subText: {
    fontSize: 11,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  trendLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  trendLabel: {
    fontSize: 10,
  },
  catList: {
    gap: 4,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  catIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  catPct: {
    fontSize: 11,
    fontWeight: '400',
  },
  trackBackground: {
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.18)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 6,
  },
  trackFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bigNum: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -2,
    marginBottom: 2,
  },
  remText: {
    fontSize: 11,
    marginTop: 8,
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
});
