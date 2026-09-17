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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { AMBER, SAVINGS_GOALS } from '../../../constants/savingsGoals';

export const PauseGoalScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const goalId = route.params?.goalId ?? SAVINGS_GOALS[0].id;
  const goal = SAVINGS_GOALS.find(g => g.id === goalId) ?? SAVINGS_GOALS[0];
  const isPaused = goal.status === 'paused';

  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    {
      id: '1mo',
      label: 'Pause for 1 Month',
      newPace: goal.pace + Math.round(goal.pace * 0.12),
    },
    {
      id: '3mo',
      label: 'Pause for 3 Months',
      newPace: goal.pace + Math.round(goal.pace * 0.4),
    },
    { id: 'indef', label: 'Indefinite Hold', newPace: null },
  ];

  const confirm = () => {
    if (!selected) return;
    const chosen = options.find(o => o.id === selected);
    showToast(
      isPaused
        ? `${goal.label} resumed. Contributions restart next cycle.`
        : `${goal.label} paused — ${chosen?.label}. Progress history kept.`,
      'success',
      isPaused ? 'Goal Resumed' : 'Goal Paused',
    );
    navigation.goBack();
  };

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
            <Feather name="chevron-left" size={16} color={theme.TEXT} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
              {isPaused ? 'RESUME GOAL' : 'PAUSE GOAL'}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              {goal.label}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View
            style={[
              styles.notice,
              { backgroundColor: `${AMBER}14`, borderColor: `${AMBER}33` },
            ]}
          >
            <Text style={[styles.noticeText, { color: AMBER }]}>
              Pausing recalculates your required monthly pace without deleting
              your progress history.
            </Text>
          </View>

          {options.map(o => (
            <TouchableOpacity
              key={o.id}
              activeOpacity={0.9}
              onPress={() => setSelected(o.id)}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.CARD,
                  borderColor: selected === o.id ? AMBER : 'transparent',
                },
              ]}
            >
              <Text style={[styles.optionLabel, { color: theme.TEXT }]}>
                {o.label}
              </Text>
              {o.newPace ? (
                <Text style={[styles.optionSub, { color: theme.MUTED }]}>
                  New pace: PKR {o.newPace.toLocaleString()}/mo after pause
                </Text>
              ) : (
                <Text style={[styles.optionSub, { color: theme.MUTED }]}>
                  Target date auto-extends · No guilt flags
                </Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!selected}
            onPress={confirm}
            style={[
              styles.confirmBtn,
              {
                backgroundColor: selected ? AMBER : theme.MUTED,
                opacity: selected ? 1 : 0.4,
              },
            ]}
          >
            <Text style={styles.confirmText}>
              {isPaused ? 'Confirm Resume' : 'Confirm Pause'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default PauseGoalScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
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

  notice: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  noticeText: { fontSize: 12, lineHeight: 18 },

  optionCard: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  optionSub: { fontSize: 11 },

  confirmBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
