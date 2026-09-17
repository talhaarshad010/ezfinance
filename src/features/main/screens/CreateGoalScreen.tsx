import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { CalendarPicker } from '../../../components';
import { GOAL_ICONS } from '../../../constants/savingsGoals';

type CreateStep = 1 | 2 | 3;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatTargetDate = (d: Date) =>
  `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;

export const CreateGoalScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [step, setStep] = useState<CreateStep>(1);
  const [iconIdx, setIconIdx] = useState(0);
  const [name, setName] = useState('');
  const [targetAmt, setTargetAmt] = useState('');
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [vehicle, setVehicle] = useState<'cash' | 'fund'>('cash');
  const [strategy, setStrategy] = useState<'manual' | 'surplus'>('manual');

  const stepTitle =
    step === 1
      ? 'Identity & Icon'
      : step === 2
      ? 'Target & Deadline'
      : 'Funding Vehicle';

  function tapKey(k: string) {
    if (k === '⌫') {
      setTargetAmt(v => v.slice(0, -1));
      return;
    }
    if (k === '000' && !targetAmt) return;
    setTargetAmt(v => (v + k).slice(0, 12));
  }

  const handleCreate = () => {
    if (!name.trim()) {
      showToast('Give your goal a name first.', 'error', 'Name Required');
      setStep(1);
      return;
    }
    const amount = parseInt(targetAmt || '0', 10);
    if (!amount) {
      showToast('Enter a target amount.', 'error', 'Target Required');
      setStep(2);
      return;
    }
    showToast(
      `${name.trim()} created — PKR ${amount.toLocaleString()} by ${formatTargetDate(
        targetDate,
      )}.`,
      'success',
      'Goal Created',
    );
    navigation.goBack();
  };

  const vehicleOptions = [
    {
      id: 'cash' as const,
      label: 'Cash Reserve',
      sub: 'Unallocated checking balance · No yield',
      icon: 'dollar-sign',
    },
    {
      id: 'fund' as const,
      label: 'SECP Mutual Fund',
      sub: 'e.g., Meezan Rozana Amdani · Earn 12.8% p.a.',
      icon: 'trending-up',
    },
  ];

  const strategyOptions = [
    {
      id: 'manual' as const,
      label: 'Manual Contribution Logs',
      sub: 'I will add funds manually',
    },
    {
      id: 'surplus' as const,
      label: 'Earmark from Monthly Surplus',
      sub: 'Auto-allocate from checking net position',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => (step === 1 ? navigation.goBack() : setStep((step - 1) as CreateStep))}
            style={[styles.backButton, { backgroundColor: theme.CARD }]}
          >
            <Feather name="chevron-left" size={16} color={theme.TEXT} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
              NEW GOAL · STEP {step} OF 3
            </Text>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              {stepTitle}
            </Text>
          </View>
        </View>

        {/* Step progress */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map(s => (
            <View
              key={s}
              style={[
                styles.stepBar,
                { backgroundColor: s <= step ? theme.TEXT : theme.CARD },
              ]}
            />
          ))}
        </View>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <View style={styles.body}>
            <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
              GOAL ICON
            </Text>
            <View style={styles.iconRow}>
              {GOAL_ICONS.map((g, i) => (
                <TouchableOpacity
                  key={g.label}
                  activeOpacity={0.85}
                  onPress={() => setIconIdx(i)}
                  style={[
                    styles.iconTile,
                    { backgroundColor: i === iconIdx ? theme.TEXT : theme.CARD },
                  ]}
                >
                  <Feather
                    name={g.icon}
                    size={18}
                    color={i === iconIdx ? theme.BG : theme.MUTED}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
              GOAL NAME
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.CARD }]}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., House Down Payment…"
                placeholderTextColor={theme.MUTED}
                style={[styles.input, { color: theme.TEXT }]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setStep(2)}
              style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
                Continue →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <View style={styles.body}>
            <View style={[styles.amountCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabelTight, { color: theme.MUTED }]}>
                TARGET AMOUNT (PKR)
              </Text>
              <Text style={[styles.amountValue, { color: theme.GREEN }]}>
                {targetAmt ? parseInt(targetAmt, 10).toLocaleString() : '0'}
              </Text>
            </View>

            <View style={styles.keypad}>
              {KEYS.map(k => (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.8}
                  onPress={() => tapKey(k)}
                  style={[styles.key, { backgroundColor: theme.CARD }]}
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

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCalendar(true)}
              style={[styles.rowCard, { backgroundColor: theme.CARD }]}
            >
              <Text style={[styles.rowCardLabel, { color: theme.TEXT }]}>
                Target Date
              </Text>
              <View style={styles.rowCardRight}>
                <Text style={[styles.rowCardValue, { color: theme.ACTIVE }]}>
                  {formatTargetDate(targetDate)}
                </Text>
                <Feather name="calendar" size={14} color={theme.ACTIVE} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setStep(3)}
              style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
                Continue →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <View style={styles.body}>
            <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
              FUNDING VEHICLE
            </Text>
            {vehicleOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.9}
                onPress={() => setVehicle(opt.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: theme.CARD,
                    borderColor: vehicle === opt.id ? theme.TEXT : 'transparent',
                  },
                ]}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: theme.MODAL }]}
                >
                  <Feather
                    name={opt.icon}
                    size={16}
                    color={vehicle === opt.id ? theme.ACTIVE : theme.MUTED}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.optionLabel, { color: theme.TEXT }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.MUTED }]}>
                    {opt.sub}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text
              style={[styles.fieldLabel, { color: theme.MUTED, marginTop: 20 }]}
            >
              FUNDING STRATEGY
            </Text>
            <View style={[styles.strategyCard, { backgroundColor: theme.CARD }]}>
              {strategyOptions.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.9}
                  onPress={() => setStrategy(s.id)}
                  style={[
                    styles.strategyRow,
                    {
                      backgroundColor:
                        strategy === s.id ? `${theme.ACTIVE}12` : theme.MODAL,
                      borderColor:
                        strategy === s.id ? theme.ACTIVE : 'transparent',
                      marginBottom: i === 0 ? 8 : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: strategy === s.id ? theme.ACTIVE : theme.MUTED,
                      },
                    ]}
                  >
                    {strategy === s.id && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.ACTIVE },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.strategyLabel, { color: theme.TEXT }]}>
                      {s.label}
                    </Text>
                    <Text style={[styles.optionSub, { color: theme.MUTED }]}>
                      {s.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCreate}
              style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CalendarPicker
        visible={showCalendar}
        initialDate={targetDate}
        onClose={() => setShowCalendar(false)}
        onSelectDate={d => setTargetDate(d)}
      />
    </View>
  );
};

export default CreateGoalScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
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

  stepRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  stepBar: { flex: 1, height: 2, borderRadius: 1 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  fieldLabelTight: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },

  iconRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  iconTile: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputWrap: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 32,
  },
  input: { fontSize: 15, padding: 0 },

  amountCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  amountValue: { fontSize: 40, fontWeight: '800', letterSpacing: -2 },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    width: '31.5%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  keyText: { fontWeight: '600' },

  rowCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rowCardLabel: { fontSize: 13 },
  rowCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowCardValue: { fontSize: 13, fontWeight: '700' },

  optionCard: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  optionSub: { fontSize: 11 },

  strategyCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 24,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  strategyLabel: { fontSize: 12, fontWeight: '600' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  primaryBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
});
