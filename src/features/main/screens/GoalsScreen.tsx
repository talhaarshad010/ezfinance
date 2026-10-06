import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { ProgressRing, ProgressTrack } from '../../../components';
import {
  AMBER,
  SAVINGS_GOALS,
  SavingsGoal,
  goalColor,
  goalPct,
  totalEarmarked,
} from '../../../constants/savingsGoals';
import { AnimatedModal } from '../../../components/AnimatedModal';

type GoalOverlay = null | 'streak' | 'options' | 'yield' | 'activity' | 'archive';

const ACTIVITY_FEED = [
  { name: 'Shahrukh', amount: 20000, label: 'Monthly contribution', ago: '2 days ago' },
  { name: 'Fatima', amount: 10000, label: 'Monthly contribution', ago: '3 days ago' },
  { name: 'Shahrukh', amount: 20000, label: 'Monthly contribution', ago: '1 month ago' },
  { name: 'Fatima', amount: 10000, label: 'Monthly contribution', ago: '1 month ago' },
];

/* ─── Goal card ──────────────────────────────────────────────────────────── */

function GoalCard({
  goal,
  onTap,
  onOverlay,
}: {
  goal: SavingsGoal;
  onTap: () => void;
  onOverlay: (o: GoalOverlay) => void;
}) {
  const { theme } = useTheme();
  const pct = goalPct(goal);
  const color = goalColor(goal, theme.GREEN, theme.ACTIVE);
  const isPaused = goal.status === 'paused';
  const isShared = goal.status === 'shared';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onTap}
      style={[styles.goalCard, { backgroundColor: theme.CARD }]}
    >
      <View style={styles.goalTopRow}>
        <View style={[styles.goalIconTile, { backgroundColor: theme.MODAL }]}>
          <Feather
            name={goal.icon}
            size={16}
            color={isPaused ? AMBER : theme.MUTED}
          />
        </View>

        <View style={styles.goalTopMid}>
          <Text style={[styles.goalLabel, { color: theme.TEXT }]}>
            {goal.label}
          </Text>

          {isPaused && (
            <Text style={[styles.goalPausedTag, { color: AMBER }]}>
              PAUSED · Target Date Snoozed
            </Text>
          )}

          {!isPaused && goal.streak > 0 && (
            <View style={styles.goalBadgeRow}>
              <Feather name="zap" size={10} color={theme.GREEN} />
              <Text style={[styles.goalStreakText, { color: theme.GREEN }]}>
                {goal.streak}-Mo Streak
              </Text>
            </View>
          )}

          {isShared && goal.co && (
            <View style={styles.goalBadgeRow}>
              <Feather name="users" size={10} color={theme.MUTED} />
              <Text style={[styles.goalMetaText, { color: theme.MUTED }]}>
                {goal.co.join(' + ')}
              </Text>
            </View>
          )}

          {goal.fundBacked && (
            <View style={styles.goalBadgeRow}>
              <Feather name="trending-up" size={10} color={theme.ACTIVE} />
              <Text style={[styles.goalMetaText, { color: theme.ACTIVE }]}>
                {goal.fundBacked} +{goal.yieldPct}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.goalRingWrap}>
          <ProgressRing
            pct={pct}
            size={52}
            strokeWidth={4}
            color={color}
            track={theme.MODAL}
          />
          <View style={styles.goalRingCenter}>
            <Text style={[styles.goalRingPct, { color }]}>{pct}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.goalAmountsRow}>
        <Text style={[styles.goalAmountText, { color: theme.MUTED }]}>
          PKR {goal.currentLabel ?? `${(goal.current / 1000).toFixed(0)}K`}
        </Text>
        <Text style={[styles.goalAmountText, { color: theme.MUTED }]}>
          of {goal.targetLabel ?? `PKR ${(goal.target / 1000).toFixed(0)}K`}
        </Text>
      </View>

      <ProgressTrack pct={pct} color={color} />

      <View style={styles.goalBottomRow}>
        {!isPaused ? (
          <Text style={[styles.goalPaceText, { color: theme.MUTED }]}>
            PKR {goal.pace.toLocaleString()}/mo · on track
          </Text>
        ) : (
          <Text style={[styles.goalPaceText, { color: AMBER }]}>
            Contributions paused
          </Text>
        )}

        <View style={styles.goalChipRow}>
          {goal.fundBacked && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onOverlay('yield')}
              style={[styles.goalChip, { backgroundColor: theme.MODAL }]}
            >
              <Text style={[styles.goalChipText, { color: theme.ACTIVE }]}>
                Yield
              </Text>
            </TouchableOpacity>
          )}
          {isShared && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onOverlay('activity')}
              style={[styles.goalChip, { backgroundColor: theme.MODAL }]}
            >
              <Text style={[styles.goalChipText, { color: theme.MUTED }]}>
                Activity
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOverlay('options')}
            style={[styles.goalIconChip, { backgroundColor: theme.MODAL }]}
          >
            <Feather name="more-horizontal" size={13} color={theme.MUTED} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Main hub ───────────────────────────────────────────────────────────── */

export const GoalsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [overlay, setOverlay] = useState<GoalOverlay>(null);
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);

  const earmarked = totalEarmarked();

  const closeOverlay = () => setOverlay(null);

  const optionActions = [
    {
      label: activeGoal?.status === 'paused' ? 'Resume Goal' : 'Pause Goal',
      icon: activeGoal?.status === 'paused' ? 'play' : 'pause',
      color: activeGoal?.status === 'paused' ? theme.GREEN : theme.TEXT,
      onPress: () => {
        closeOverlay();
        if (activeGoal) {
          navigation.navigate('PauseGoal', { goalId: activeGoal.id });
        }
      },
    },
    {
      label: 'Extend Target by 60 Days',
      icon: 'calendar',
      color: theme.TEXT,
      onPress: () => {
        closeOverlay();
        showToast(
          `${activeGoal?.label} target extended by 60 days.`,
          'success',
          'Target Extended',
        );
      },
    },
    {
      label: 'Reduce Monthly Pace Target',
      icon: 'trending-down',
      color: theme.TEXT,
      onPress: () => {
        closeOverlay();
        showToast(
          'Monthly pace target lowered. Deadline pushed out accordingly.',
          'info',
          'Pace Reduced',
        );
      },
    },
    {
      label: 'Archive Goal',
      icon: 'archive',
      color: theme.RED,
      onPress: () => setOverlay('archive'),
    },
  ];

  const yieldProjections = activeGoal
    ? [
        {
          label: '6 Months',
          base: activeGoal.current + activeGoal.pace * 6,
          gain: Math.round((activeGoal.current + activeGoal.pace * 6) * 0.064),
        },
        {
          label: '1 Year',
          base: activeGoal.current + activeGoal.pace * 12,
          gain: Math.round((activeGoal.current + activeGoal.pace * 12) * 0.128),
        },
        {
          label: '2 Years',
          base: activeGoal.current + activeGoal.pace * 24,
          gain: Math.round((activeGoal.current + activeGoal.pace * 24) * 0.256),
        },
      ]
    : [];

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
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.openDrawer()}
              style={[styles.iconButton, { backgroundColor: theme.CARD }]}
            >
              <Feather name="menu" size={20} color={theme.TEXT} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
                SAVINGS GOALS & MILESTONES
              </Text>
              <Text style={[styles.screenTitle, { color: theme.TEXT }]}>
                Goals Hub
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CreateGoal')}
            style={[styles.addButton, { backgroundColor: theme.TEXT }]}
          >
            <Feather name="plus" size={16} color={theme.BG} />
          </TouchableOpacity>
        </View>

        {/* Portfolio banner */}
        <View style={styles.sectionPad}>
          <View style={[styles.bannerCard, { backgroundColor: theme.CARD }]}>
            <View>
              <Text style={[styles.bannerLabel, { color: theme.MUTED }]}>
                TOTAL EARMARKED
              </Text>
              <Text style={[styles.bannerValue, { color: theme.TEXT }]}>
                PKR {earmarked.toLocaleString()}
              </Text>
            </View>
            <View
              style={[styles.ratePill, { backgroundColor: `${theme.GREEN}18` }]}
            >
              <Text style={[styles.ratePillText, { color: theme.GREEN }]}>
                Savings Rate: 20%
              </Text>
            </View>
          </View>
        </View>

        {/* Goal cards */}
        <View style={styles.sectionPad}>
          {SAVINGS_GOALS.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onTap={() =>
                navigation.navigate('GoalDetail', { goalId: goal.id })
              }
              onOverlay={o => {
                setActiveGoal(goal);
                setOverlay(o);
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Options action sheet ── */}
      <AnimatedModal
        visible={overlay === 'options'}
        transparent
        animationType="slide"
        onRequestClose={closeOverlay}
      >
        <Pressable style={styles.backdrop} onPress={closeOverlay} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
              {activeGoal?.label} · Options
            </Text>
            <TouchableOpacity
              onPress={closeOverlay}
              style={[styles.closeButton, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {optionActions.map((a, i) => (
            <TouchableOpacity
              key={a.label}
              activeOpacity={0.8}
              onPress={a.onPress}
              style={[
                styles.actionRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: theme.BORDER },
              ]}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: theme.MODAL }]}
              >
                <Feather name={a.icon} size={15} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: a.color }]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AnimatedModal>

      {/* ── Yield projection sheet ── */}
      <AnimatedModal
        visible={overlay === 'yield'}
        transparent
        animationType="slide"
        onRequestClose={closeOverlay}
      >
        <Pressable style={styles.backdrop} onPress={closeOverlay} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                Yield Projection
              </Text>
              <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
                {activeGoal?.fundBacked} · {activeGoal?.yieldPct}% p.a.
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeOverlay}
              style={[styles.closeButton, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {yieldProjections.map(p => (
            <View
              key={p.label}
              style={[styles.yieldRow, { backgroundColor: theme.MODAL }]}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.yieldLabel, { color: theme.TEXT }]}>
                  {p.label}
                </Text>
                <Text style={[styles.yieldGain, { color: theme.ACTIVE }]}>
                  +PKR {p.gain.toLocaleString()}
                </Text>
              </View>
              <Text style={[styles.yieldBase, { color: theme.MUTED }]}>
                Base: PKR {p.base.toLocaleString()} · Yield earned while saving
              </Text>
            </View>
          ))}
        </View>
      </AnimatedModal>

      {/* ── Contribution activity sheet ── */}
      <AnimatedModal
        visible={overlay === 'activity'}
        transparent
        animationType="slide"
        onRequestClose={closeOverlay}
      >
        <Pressable style={styles.backdrop} onPress={closeOverlay} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                Contribution Activity
              </Text>
              <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
                {activeGoal?.label} · All contributors
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeOverlay}
              style={[styles.closeButton, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {ACTIVITY_FEED.map((f, i) => (
            <View
              key={`${f.name}-${i}`}
              style={[
                styles.feedRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: theme.BORDER },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.avatarText, { color: theme.TEXT }]}>
                  {f.name[0]}
                </Text>
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.feedName, { color: theme.TEXT }]}>
                  {f.name}
                </Text>
                <Text style={[styles.feedMeta, { color: theme.MUTED }]}>
                  {f.label} · {f.ago}
                </Text>
              </View>
              <Text style={[styles.feedAmount, { color: theme.GREEN }]}>
                +{f.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </AnimatedModal>

      {/* ── Archive confirmation ── */}
      <AnimatedModal
        visible={overlay === 'archive'}
        transparent
        animationType="fade"
        onRequestClose={closeOverlay}
      >
        <Pressable style={styles.backdrop} onPress={closeOverlay} />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={[styles.dialog, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.dialogTitle, { color: theme.TEXT }]}>
              Archive this goal?
            </Text>
            <Text style={[styles.dialogBody, { color: theme.MUTED }]}>
              Unallocated funds (PKR{' '}
              {(activeGoal?.current ?? 0).toLocaleString()}) will be returned to
              your general Net Worth pool.
            </Text>
            <View style={styles.dialogButtonRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={closeOverlay}
                style={[styles.dialogBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.dialogBtnText, { color: theme.MUTED }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  closeOverlay();
                  showToast(
                    `${activeGoal?.label} archived. Funds returned to Net Worth.`,
                    'success',
                    'Goal Archived',
                  );
                }}
                style={[styles.dialogBtn, { backgroundColor: theme.RED }]}
              >
                <Text style={[styles.dialogBtnText, { color: '#FFFFFF' }]}>
                  Archive
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AnimatedModal>
    </View>
  );
};

export default GoalsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionPad: { paddingHorizontal: 16, marginBottom: 12 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  bannerValue: { fontSize: 24, fontWeight: '800', letterSpacing: -1.2 },
  ratePill: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  ratePillText: { fontSize: 11, fontWeight: '700' },

  goalCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
  },
  goalTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  goalIconTile: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalTopMid: { flex: 1, minWidth: 0 },
  goalLabel: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  goalPausedTag: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  goalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  goalStreakText: { fontSize: 10, fontWeight: '700' },
  goalMetaText: { fontSize: 10 },
  goalRingWrap: { width: 52, height: 52, marginLeft: 8 },
  goalRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRingPct: { fontSize: 11, fontWeight: '800', letterSpacing: -0.5 },
  goalAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalAmountText: { fontSize: 12 },
  goalBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  goalPaceText: { fontSize: 11, flex: 1 },
  goalChipRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalChip: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalChipText: { fontSize: 10, fontWeight: '600' },
  goalIconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700' },
  sheetSub: { fontSize: 11, marginTop: 2 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '600' },

  yieldRow: { borderRadius: 18, padding: 16, marginBottom: 10 },
  yieldLabel: { fontSize: 12, fontWeight: '700' },
  yieldGain: { fontSize: 12, fontWeight: '700' },
  yieldBase: { fontSize: 11, marginTop: 4 },

  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700' },
  feedName: { fontSize: 13, fontWeight: '600' },
  feedMeta: { fontSize: 11 },
  feedAmount: { fontSize: 13, fontWeight: '700' },

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
  dialog: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  dialogTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  dialogBody: { fontSize: 12, lineHeight: 18, marginBottom: 20 },
  dialogButtonRow: { flexDirection: 'row', gap: 10 },
  dialogBtn: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: { fontSize: 14, fontWeight: '700' },
});
