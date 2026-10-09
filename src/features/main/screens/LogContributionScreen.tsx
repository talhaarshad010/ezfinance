import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { goalColor } from '../../../constants/savingsGoals';
import { useNetwork } from '../../../context/NetworkContext';
import { useSavingsGoals } from './goals/useSavingsGoals';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
const QUICK_AMOUNTS = [5000, 10000, 25000];

export const LogContributionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const { goals, userGoalOf, userMode } = useSavingsGoals();
  const network = useNetwork();
  const initialGoalId = route.params?.goalId ?? goals[0]?.id;
  const [goalId, setGoalId] = useState<number>(initialGoalId);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<'unallocated' | 'external'>(
    'unallocated',
  );
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once added, the shown goal already includes the contribution, so keep the one from before.
  const shownGoal = goals.find(g => g.id === goalId) ?? goals[0];
  const before = useRef(shownGoal);
  if (!done) before.current = shownGoal;
  const goal = before.current;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function tapKey(k: string) {
    if (k === '⌫') {
      setAmount(v => v.slice(0, -1));
      return;
    }
    if (k === '000' && !amount) return;
    setAmount(v => (v + k).slice(0, 12));
  }

  const numeric = parseInt(amount || '0', 10);

  const submit = () => {
    if (!numeric) {
      showToast(
        'Enter a contribution amount first.',
        'error',
        'Invalid Amount',
      );
      return;
    }
    // A user's contribution is added to their goal.
    const own = userGoalOf(goal.id);
    if (own) {
      userMode.updateGoal(own.id, { saved: own.saved + numeric });
      network.record({ entity: 'goal', entityId: own.id, action: 'update', label: `Contribution · ${own.name}` });
    }
    setDone(true);
    timer.current = setTimeout(() => navigation.goBack(), 1800);
  };

  if (!goal) return <View style={[styles.container, { backgroundColor: theme.BG }]} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      {/* Header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.MODAL }]}
        >
          <Feather name="chevron-left" size={16} color={theme.TEXT} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
            LOG CONTRIBUTION
          </Text>
          <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
            {goal.label}
          </Text>
        </View>
      </View>

      {done ? (
        <View style={styles.doneWrap}>
          <View style={[styles.doneBadge, { backgroundColor: theme.GREEN }]}>
            <Feather name="check" size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.doneTitle, { color: theme.TEXT }]}>
            Contribution Logged
          </Text>
          <View style={styles.doneStreakRow}>
            <Feather name="zap" size={13} color={theme.GREEN} />
            <Text style={[styles.doneStreakText, { color: theme.GREEN }]}>
              Streak extended!
            </Text>
          </View>
          <Text style={[styles.doneAmount, { color: theme.MUTED }]}>
            PKR {numeric.toLocaleString()} added to {goal.label}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          <View style={styles.body}>
            {/* Goal selector */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
                SELECT GOAL
              </Text>
              <View style={styles.chipWrap}>
                {goals.map(g => {
                  const selected = g.id === goalId;
                  const c = goalColor(g, theme.GREEN, theme.ACTIVE);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      activeOpacity={0.85}
                      onPress={() => setGoalId(g.id)}
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? c : theme.MODAL },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? '#FFFFFF' : theme.MUTED },
                        ]}
                      >
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Amount */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
                AMOUNT TO DEPOSIT (PKR)
              </Text>
              <Text style={[styles.amountValue, { color: theme.GREEN }]}>
                {numeric.toLocaleString()}
              </Text>
            </View>

            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map(v => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.85}
                  onPress={() => setAmount(String(v))}
                  style={[styles.quickBtn, { backgroundColor: theme.MODAL }]}
                >
                  <Text style={[styles.quickText, { color: theme.ACTIVE }]}>
                    +{(v / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
              {KEYS.map(k => (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.8}
                  onPress={() => tapKey(k)}
                  style={[styles.key, { backgroundColor: theme.MODAL }]}
                >
                  <Text
                    style={[
                      styles.keyText,
                      { color: theme.TEXT, fontSize: k === '000' ? 16 : 20 },
                    ]}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Source */}
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
                SOURCE
              </Text>
              {(
                [
                  {
                    id: 'unallocated' as const,
                    label: 'Earmark from Unallocated Cash',
                  },
                  { id: 'external' as const, label: 'External Cash Entry' },
                ]
              ).map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.9}
                  onPress={() => setSource(s.id)}
                  style={[
                    styles.sourceRow,
                    {
                      backgroundColor:
                        source === s.id ? `${theme.ACTIVE}14` : theme.MODAL,
                      marginBottom: i === 0 ? 6 : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor:
                          source === s.id ? theme.ACTIVE : theme.MUTED,
                      },
                    ]}
                  >
                    {source === s.id && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.ACTIVE },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.sourceLabel, { color: theme.TEXT }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={submit}
              style={[styles.confirmBtn, { backgroundColor: theme.GREEN }]}
            >
              <Text style={styles.confirmText}>
                Confirm Contribution · PKR {numeric.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default LogContributionScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  headerTitle: { fontSize: 15, fontWeight: '700' },

  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 11, fontWeight: '600' },

  amountValue: { fontSize: 42, fontWeight: '800', letterSpacing: -2 },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: {
    flex: 1,
    height: 40,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { fontSize: 11, fontWeight: '700' },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    width: '31.5%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  keyText: { fontWeight: '600' },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sourceLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 4.5 },

  confirmBtn: {
    height: 54,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#000000' },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  doneTitle: { fontSize: 20, fontWeight: '800' },
  doneStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  doneStreakText: { fontSize: 13, fontWeight: '600' },
  doneAmount: { fontSize: 12, marginTop: 4 },
});
