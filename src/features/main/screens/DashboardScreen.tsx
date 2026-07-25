import React, { useEffect, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { useToast } from '../../../context/ToastContext';

const { width } = Dimensions.get('window');

const CATS = [
  { label: 'Groceries', spent: 7800, budget: 10000 },
  { label: 'Food & Dining', spent: 4230, budget: 6000 },
  { label: 'Transport', spent: 800, budget: 2000 },
  { label: 'Utilities', spent: 3500, budget: 5000 },
  { label: 'Rent', spent: 25000, budget: 25000 },
];

function Track({ pct }: { pct: number }) {
  const { theme } = useTheme();
  const fill =
    pct >= 100
      ? theme.RED
      : pct >= 85
      ? '#FF9500'
      : pct <= 40
      ? theme.GREEN
      : theme.MUTED;

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

  const profile = useAppSelector(state => state.user.profile);
  const userName = profile?.name?.split(' ')[0] || 'Shahrukh';

  const { accounts } = useAppSelector(state => state.bankAccounts);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const displayBalance =
    totalBalance > 0
      ? totalBalance.toLocaleString('en-PK')
      : '3,82,000';

  const burnPct = 53;
  const burnColor =
    burnPct > 80 ? theme.RED : burnPct > 60 ? '#FF9500' : theme.GREEN;

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

        {/* Hero Card — Always Dark / Premium Slate */}
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
      </ScrollView>
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
    marginBottom: 20,
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
});
