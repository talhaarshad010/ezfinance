import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { ProgressTrack, Slider } from '../../../components';

const FALLBACK_RESERVES = 382000;
const MONTHLY_BURN = 80000;

/**
 * Liquidity analysis — "how long your money sits before you spend it".
 * Reached from the Age of Money card on the dashboard Live tab.
 */
export const AgeOfMoneyScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const accounts = useAppSelector(state => state.bankAccounts.accounts);
  const liveBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const cashReserves = liveBalance > 0 ? liveBalance : FALLBACK_RESERVES;

  const [burnMultiplier, setBurnMultiplier] = useState(100);

  const baseDays = Math.round((cashReserves / MONTHLY_BURN) * 30);
  const adjustedBurn = Math.round((MONTHLY_BURN * burnMultiplier) / 100);
  const simDays =
    adjustedBurn > 0 ? Math.round((cashReserves / adjustedBurn) * 30) : 999;
  const simMonths = (simDays / 30).toFixed(1);
  const runwayColor =
    simDays >= 90 ? theme.GREEN : simDays >= 45 ? theme.ACTIVE : theme.RED;

  const breakdown = [
    { label: 'Housing & Rent', amount: 25000, color: theme.RED },
    { label: 'Groceries', amount: 18000, color: '#FF9500' },
    { label: 'Utilities', amount: 12000, color: theme.ACTIVE },
    { label: 'Savings Slice', amount: 15000, color: theme.GREEN },
    { label: 'Discretionary', amount: 10000, color: theme.MUTED },
  ];

  const benchmarks = [
    { label: 'Current Runway', days: baseDays, color: theme.GREEN },
    { label: '3-Month Emergency Target', days: 90, color: theme.ACTIVE },
    { label: '6-Month Financial Independence', days: 180, color: theme.MUTED },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.CARD }]}
          >
            <Feather name="chevron-left" size={18} color={theme.TEXT} />
          </TouchableOpacity>
          <View style={styles.flex1}>
            <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
              LIQUIDITY ANALYSIS
            </Text>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              How long your money sits before you spend it
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Hero runway */}
          <View style={[styles.heroCard, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
              CURRENT RUNWAY WITHOUT INCOME
            </Text>
            <Text style={[styles.heroValue, { color: runwayColor }]}>
              {simDays < 999 ? simDays : '∞'}
            </Text>
            <Text style={[styles.heroSub, { color: runwayColor }]}>
              Days · {simMonths} Months
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.BORDER }]} />
            <Text style={[styles.heroMeta, { color: theme.MUTED }]}>
              Cash reserves:{' '}
              <Text style={{ color: theme.TEXT, fontWeight: '700' }}>
                PKR {cashReserves.toLocaleString()}
              </Text>
            </Text>
            <Text style={[styles.heroMeta, { color: theme.MUTED }]}>
              Monthly burn:{' '}
              <Text style={{ color: theme.TEXT, fontWeight: '700' }}>
                PKR {adjustedBurn.toLocaleString()}
              </Text>
            </Text>
          </View>

          {/* Simulator */}
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
                BURN RATE SIMULATOR
              </Text>
              <Text
                style={[
                  styles.simPct,
                  { color: burnMultiplier > 100 ? theme.RED : theme.GREEN },
                ]}
              >
                {burnMultiplier}% of current
              </Text>
            </View>

            <Slider
              value={burnMultiplier}
              min={50}
              max={200}
              step={5}
              onChange={setBurnMultiplier}
              accentColor={theme.ACTIVE}
              thumbColor={theme.isDark ? '#FFFFFF' : '#FFFFFF'}
            />

            <View style={styles.rowBetween}>
              <Text style={[styles.simEdge, { color: theme.MUTED }]}>
                50% (Frugal)
              </Text>
              <Text style={[styles.simEdge, { color: theme.MUTED }]}>
                200% (High Spend)
              </Text>
            </View>

            <View
              style={[
                styles.simCallout,
                {
                  backgroundColor: `${runwayColor}14`,
                  borderColor: `${runwayColor}33`,
                },
              ]}
            >
              <Text style={[styles.simCalloutText, { color: theme.TEXT }]}>
                At{' '}
                <Text style={{ color: runwayColor, fontWeight: '700' }}>
                  {burnMultiplier}% burn
                </Text>
                , your PKR {cashReserves.toLocaleString()} reserves sustain
                current lifestyle for{' '}
                <Text style={{ color: runwayColor, fontWeight: '700' }}>
                  {simDays < 999
                    ? `${simDays} Days (${simMonths} Months)`
                    : 'indefinitely'}
                </Text>
                .
              </Text>
            </View>
          </View>

          {/* Outflow breakdown */}
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
              MONTHLY OUTFLOW BREAKDOWN
            </Text>
            {breakdown.map(item => {
              const pct = Math.round((item.amount / MONTHLY_BURN) * 100);
              return (
                <View key={item.label} style={styles.breakRow}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.breakLabel, { color: theme.TEXT }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.breakValue, { color: item.color }]}>
                      PKR {item.amount.toLocaleString()}  {pct}%
                    </Text>
                  </View>
                  <View style={styles.breakTrack}>
                    <ProgressTrack pct={pct} color={item.color} height={3} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Benchmarks */}
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
              BENCHMARK
            </Text>
            {benchmarks.map((b, i) => (
              <View
                key={b.label}
                style={[
                  styles.benchRow,
                  i < benchmarks.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.breakLabel, { color: theme.TEXT }]}>
                  {b.label}
                </Text>
                <Text style={[styles.benchDays, { color: b.color }]}>
                  {b.days} Days
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AgeOfMoneyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  body: { paddingHorizontal: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },

  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroValue: { fontSize: 64, fontWeight: '800', letterSpacing: -4 },
  heroSub: { fontSize: 14, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  divider: { height: 1, alignSelf: 'stretch', marginBottom: 16 },
  heroMeta: { fontSize: 12, marginTop: 4 },

  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  simPct: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  simEdge: { fontSize: 9 },
  simCallout: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  simCalloutText: { fontSize: 12, lineHeight: 18 },

  breakRow: { marginBottom: 10 },
  breakLabel: { fontSize: 12 },
  breakValue: { fontSize: 11, fontWeight: '700' },
  breakTrack: { marginTop: 4 },

  benchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
  },
  benchDays: { fontSize: 13, fontWeight: '800' },
});
