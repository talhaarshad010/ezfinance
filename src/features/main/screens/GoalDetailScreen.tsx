import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { ProgressRing, ProgressTrack } from '../../../components';
import {
  AMBER,
  SAVINGS_GOALS,
  goalColor,
  goalPct,
} from '../../../constants/savingsGoals';

export const GoalDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const goalId = route.params?.goalId ?? SAVINGS_GOALS[0].id;
  const goal =
    SAVINGS_GOALS.find(g => g.id === goalId) ?? SAVINGS_GOALS[0];

  const [streakVisible, setStreakVisible] = useState(false);

  const pct = goalPct(goal);
  const color = goalColor(goal, theme.GREEN, theme.ACTIVE);
  const isPaused = goal.status === 'paused';

  const pacing = [
    { k: 'Monthly Pace', v: `PKR ${goal.pace.toLocaleString()}` },
    { k: 'Months Left', v: `${goal.monthsLeft} mo` },
    { k: 'Deadline', v: goal.deadline },
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
        {/* Back header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.CARD }]}
          >
            <Feather name="chevron-left" size={16} color={theme.TEXT} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
              GOAL DETAIL
            </Text>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              {goal.label}
            </Text>
          </View>
        </View>

        {/* Hero ring */}
        <View style={styles.heroWrap}>
          <View style={styles.heroRing}>
            <ProgressRing
              pct={pct}
              size={180}
              strokeWidth={10}
              color={color}
              track={theme.CARD}
            />
            <View style={styles.heroRingCenter}>
              <Text style={[styles.heroPct, { color }]}>{pct}%</Text>
              <Text style={[styles.heroCaption, { color: theme.MUTED }]}>
                funded
              </Text>
            </View>
          </View>

          <View style={styles.heroPillRow}>
            {goal.streak > 0 && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setStreakVisible(true)}
                style={[styles.heroPill, { backgroundColor: `${theme.GREEN}18` }]}
              >
                <Feather name="zap" size={11} color={theme.GREEN} />
                <Text style={[styles.heroPillText, { color: theme.GREEN }]}>
                  {goal.streak}-Month Streak
                </Text>
              </TouchableOpacity>
            )}
            {isPaused && (
              <View style={[styles.heroPill, { backgroundColor: `${AMBER}18` }]}>
                <Feather name="pause" size={10} color={AMBER} />
                <Text style={[styles.heroPillText, { color: AMBER }]}>
                  Goal Paused
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pacing matrix */}
        <View style={styles.matrixRow}>
          {pacing.map(d => (
            <View
              key={d.k}
              style={[styles.matrixCard, { backgroundColor: theme.CARD }]}
            >
              <Text style={[styles.matrixLabel, { color: theme.MUTED }]}>
                {d.k.toUpperCase()}
              </Text>
              <Text style={[styles.matrixValue, { color: theme.TEXT }]}>
                {d.v}
              </Text>
            </View>
          ))}
        </View>

        {/* Current vs Target */}
        <View style={styles.duoRow}>
          <View style={[styles.duoCard, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.matrixLabel, { color: theme.MUTED }]}>
              CURRENT
            </Text>
            <Text style={[styles.duoValue, { color }]}>
              {goal.currentLabel ??
                `PKR ${(goal.current / 1000).toFixed(0)}K`}
            </Text>
          </View>
          <View style={[styles.duoCard, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.matrixLabel, { color: theme.MUTED }]}>
              TARGET
            </Text>
            <Text style={[styles.duoValue, { color: theme.TEXT }]}>
              {goal.targetLabel ?? `PKR ${(goal.target / 1000).toFixed(0)}K`}
            </Text>
          </View>
        </View>

        {/* Co-contributors */}
        {goal.contribs && (
          <View style={styles.sectionPad}>
            <View style={[styles.blockCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.blockLabel, { color: theme.MUTED }]}>
                CO-CONTRIBUTORS
              </Text>
              {goal.contribs.map(c => (
                <View key={c.name} style={styles.contribRow}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.contribName, { color: theme.TEXT }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.contribMeta, { color: theme.MUTED }]}>
                      PKR {c.amount.toLocaleString()} · {c.pct}%
                    </Text>
                  </View>
                  <View style={styles.contribTrack}>
                    <ProgressTrack pct={c.pct} color={theme.GREEN} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Fund-backed callout */}
        {goal.fundBacked && (
          <View style={styles.sectionPad}>
            <View
              style={[
                styles.fundCard,
                {
                  backgroundColor: `${theme.ACTIVE}14`,
                  borderColor: `${theme.ACTIVE}33`,
                },
              ]}
            >
              <Text style={[styles.blockLabel, { color: theme.ACTIVE }]}>
                FUND-BACKED GOAL
              </Text>
              <Text style={[styles.fundBody, { color: theme.TEXT }]}>
                Backed by {goal.fundBacked} earning +{goal.yieldPct}% p.a. —
                your goal grows even when you don't contribute.
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('LogContribution', { goalId: goal.id })
            }
            style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
              + Log Contribution
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PauseGoal', { goalId: goal.id })}
            style={[styles.secondaryBtn, { borderColor: theme.CARD }]}
          >
            <Feather
              name={isPaused ? 'play' : 'pause'}
              size={13}
              color={isPaused ? theme.GREEN : theme.MUTED}
            />
            <Text
              style={[
                styles.secondaryBtnText,
                { color: isPaused ? theme.GREEN : theme.MUTED },
              ]}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Streak celebration modal */}
      <Modal
        visible={streakVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStreakVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setStreakVisible(false)}
        />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={[styles.streakCard, { backgroundColor: theme.CARD }]}>
            <Text style={styles.streakEmoji}>⚡</Text>
            <Text style={[styles.streakTitle, { color: theme.TEXT }]}>
              {goal.streak}-Month Streak Unlocked!
            </Text>
            <Text style={[styles.streakBody, { color: theme.MUTED }]}>
              You've consistently funded your {goal.label} every month. Keep the
              momentum going.
            </Text>
            <View style={styles.streakDotsRow}>
              {Array.from({ length: goal.streak }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.streakDot, { backgroundColor: theme.GREEN }]}
                >
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              ))}
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setStreakVisible(false)}
              style={[styles.streakBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.streakBtnText, { color: theme.BG }]}>
                Keep Going →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GoalDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionPad: { paddingHorizontal: 16, marginBottom: 16 },

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

  heroWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 20 },
  heroRing: { width: 180, height: 180 },
  heroRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPct: { fontSize: 34, fontWeight: '800', letterSpacing: -2 },
  heroCaption: { fontSize: 10, marginTop: 2 },
  heroPillRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  heroPillText: { fontSize: 11, fontWeight: '700' },

  matrixRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  matrixCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  matrixLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  matrixValue: { fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },

  duoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  duoCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  duoValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.8 },

  blockCard: { borderRadius: 24, paddingHorizontal: 18, paddingVertical: 16 },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  contribRow: { marginBottom: 10 },
  contribName: { fontSize: 12, fontWeight: '600' },
  contribMeta: { fontSize: 12 },
  contribTrack: { marginTop: 4 },

  fundCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
  },
  fundBody: { fontSize: 13, lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  primaryBtn: {
    flex: 2,
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 100,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  centerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  streakCard: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  streakEmoji: { fontSize: 40, marginBottom: 16 },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  streakBody: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  streakDotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 20,
  },
  streakDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBtn: {
    width: '100%',
    height: 48,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBtnText: { fontSize: 13, fontWeight: '700' },
});
