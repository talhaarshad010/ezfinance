import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import { DebtEntry } from '../../../../constants/ledgerData';
import { AnimatedModal } from '../../../../components/AnimatedModal';

interface AddDebtSheetProps {
  visible: boolean;
  existing?: DebtEntry | null;
  onSave: (d: DebtEntry) => void;
  onClose: () => void;
}

export function AddDebtSheet({
  visible,
  existing,
  onSave,
  onClose,
}: AddDebtSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(existing?.name ?? '');
  const [lender, setLender] = useState(existing?.lender ?? '');
  const [total, setTotal] = useState(existing ? String(existing.totalAmount) : '');
  const [remaining, setRemaining] = useState(existing ? String(existing.remaining) : '');
  const [rate, setRate] = useState(existing ? String(existing.interestRate) : '');
  const [emi, setEmi] = useState(existing ? String(existing.emi) : '');
  const [dueDay, setDueDay] = useState(existing ? String(existing.dueDayOfMonth) : '');
  const [remindBefore, setRemindBefore] = useState(existing?.remindDaysBefore ?? 3);
  const [remindOnDue, setRemindOnDue] = useState(existing?.remindOnDue ?? true);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setLender(existing.lender);
      setTotal(String(existing.totalAmount));
      setRemaining(String(existing.remaining));
      setRate(String(existing.interestRate));
      setEmi(String(existing.emi));
      setDueDay(String(existing.dueDayOfMonth));
      setRemindBefore(existing.remindDaysBefore);
      setRemindOnDue(existing.remindOnDue);
    } else {
      setName('');
      setLender('');
      setTotal('');
      setRemaining('');
      setRate('');
      setEmi('');
      setDueDay('');
      setRemindBefore(3);
      setRemindOnDue(true);
    }
  }, [existing, visible]);

  const isValid =
    name.trim().length > 0 &&
    parseFloat(remaining) > 0 &&
    parseFloat(emi) > 0 &&
    parseInt(dueDay, 10) >= 1 &&
    parseInt(dueDay, 10) <= 31;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      id: existing?.id ?? Date.now(),
      name: name.trim(),
      lender: lender.trim() || 'Bank',
      totalAmount: parseFloat(total) || parseFloat(remaining),
      remaining: parseFloat(remaining),
      interestRate: parseFloat(rate) || 0,
      emi: parseFloat(emi),
      dueDayOfMonth: parseInt(dueDay, 10),
      remindDaysBefore: remindBefore,
      remindOnDue,
    });
    onClose();
  };

  const REMIND_OPTIONS = [1, 3, 5, 7];

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              maxHeight: '90%',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              {existing ? 'Edit Debt' : 'Track a Debt'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {/* Loan Details Section */}
            <Text style={[styles.sectionLabel, { color: theme.MUTED }]}>
              LOAN DETAILS
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                Loan / Debt Name
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Auto Loan, Credit Card"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                Lender / Bank Name
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={lender}
                  onChangeText={setLender}
                  placeholder="e.g. Meezan Bank, Alfalah"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                Total Loan Amount
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={total}
                  onChangeText={setTotal}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
                <Text style={[styles.suffix, { color: theme.MUTED }]}>PKR</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                Remaining Balance
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={remaining}
                  onChangeText={setRemaining}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
                <Text style={[styles.suffix, { color: theme.MUTED }]}>PKR</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                Interest Rate
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={rate}
                  onChangeText={setRate}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
                <Text style={[styles.suffix, { color: theme.MUTED }]}>% / year</Text>
              </View>
            </View>

            {/* Repayment Section */}
            <Text style={[styles.sectionLabel, { color: theme.MUTED, marginTop: 12 }]}>
              REPAYMENT
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                Monthly EMI
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={emi}
                  onChangeText={setEmi}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
                <Text style={[styles.suffix, { color: theme.MUTED }]}>PKR</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldTitle, { color: theme.MUTED }]}>
                EMI Due Day
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={dueDay}
                  onChangeText={setDueDay}
                  placeholder="1–31"
                  keyboardType="numeric"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.input, { color: theme.TEXT }]}
                />
                <Text style={[styles.suffix, { color: theme.MUTED }]}>of month</Text>
              </View>
            </View>

            {/* Reminders Section */}
            <Text style={[styles.sectionLabel, { color: theme.MUTED, marginTop: 12 }]}>
              EMI REMINDERS
            </Text>

            <View style={[styles.reminderCard, { backgroundColor: theme.MODAL }]}>
              <Text style={[styles.reminderTitle, { color: theme.TEXT }]}>
                Remind me before due date
              </Text>
              <Text style={[styles.reminderSub, { color: theme.MUTED }]}>
                A heads-up so you can arrange payment.
              </Text>
              <View style={styles.daysRow}>
                {REMIND_OPTIONS.map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setRemindBefore(d)}
                    style={[
                      styles.dayBtn,
                      {
                        backgroundColor: remindBefore === d ? theme.TEXT : theme.CARD,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        { color: remindBefore === d ? theme.BG : theme.MUTED },
                      ]}
                    >
                      {d}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.switchRow, { backgroundColor: theme.MODAL }]}>
              <View>
                <Text style={[styles.reminderTitle, { color: theme.TEXT }]}>
                  Remind me on due date
                </Text>
                <Text style={[styles.reminderSub, { color: theme.MUTED }]}>
                  Day-of reminder when EMI is due.
                </Text>
              </View>
              <Switch
                value={remindOnDue}
                onValueChange={setRemindOnDue}
                trackColor={{ false: theme.MUTED + '44', true: theme.GREEN }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={isValid ? 0.88 : 1}
            disabled={!isValid}
            onPress={handleSave}
            style={[
              styles.ctaBtn,
              {
                backgroundColor: isValid ? theme.TEXT : theme.MUTED + '50',
                marginTop: 14,
              },
            ]}
          >
            <Text
              style={[
                styles.ctaBtnText,
                { color: isValid ? theme.BG : theme.CARD },
              ]}
            >
              {existing ? 'Save Changes' : 'Add to Debts'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Debt Reminder Info Sheet ──────────────────────────────────────────────────
export function DebtReminderSheet({
  visible,
  debt,
  onClose,
}: {
  visible: boolean;
  debt: DebtEntry | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  if (!debt) return null;

  const currentMonth = 'Sep 2026';
  const dueDate = `${debt.dueDayOfMonth} ${currentMonth.split(' ')[0]}`;
  const earlyDay = Math.max(1, debt.dueDayOfMonth - debt.remindDaysBefore);
  const earlyDate = `${earlyDay} ${currentMonth.split(' ')[0]}`;

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                {debt.name}
              </Text>
              <Text style={[styles.reminderSub, { color: theme.MUTED }]}>
                EMI Reminders · {debt.lender}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <View style={[styles.remindersCard, { backgroundColor: theme.MODAL }]}>
            <Text style={[styles.sectionLabel, { color: theme.MUTED, marginBottom: 12 }]}>
              UPCOMING REMINDERS
            </Text>

            <View style={styles.remRow}>
              <View style={[styles.remDot, { backgroundColor: theme.ACTIVE }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.remTitle, { color: theme.TEXT }]}>
                  Early reminder
                </Text>
                <Text style={[styles.remSub, { color: theme.MUTED }]}>
                  {debt.remindDaysBefore} days before due date
                </Text>
              </View>
              <Text style={[styles.remDate, { color: theme.ACTIVE }]}>
                {earlyDate}
              </Text>
            </View>

            <View style={[styles.remRow, { marginTop: 14 }]}>
              <View
                style={[
                  styles.remDot,
                  { backgroundColor: debt.remindOnDue ? theme.GREEN : theme.MUTED },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.remTitle, { color: theme.TEXT }]}>
                  Due-date reminder
                </Text>
                <Text style={[styles.remSub, { color: theme.MUTED }]}>
                  On the day EMI is due
                </Text>
              </View>
              <Text
                style={[
                  styles.remDate,
                  { color: debt.remindOnDue ? theme.GREEN : theme.MUTED },
                ]}
              >
                {debt.remindOnDue ? dueDate : 'Off'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.noticeBox,
              {
                backgroundColor: theme.ACTIVE + '15',
                borderColor: theme.ACTIVE + '35',
              },
            ]}
          >
            <Text style={[styles.noticeText, { color: theme.TEXT }]}>
              <Text style={{ fontWeight: '700', color: theme.ACTIVE }}>Note: </Text>
              These reminders track your EMI schedule only — ezFinance does not debit your bank. Pay your EMI through your bank, 1Link, or mobile app directly.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  suffix: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  reminderCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  reminderSub: {
    fontSize: 11,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  dayBtn: {
    flex: 1,
    height: 34,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  remindersCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  remRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  remDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  remTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  remSub: {
    fontSize: 11,
  },
  remDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  noticeBox: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
