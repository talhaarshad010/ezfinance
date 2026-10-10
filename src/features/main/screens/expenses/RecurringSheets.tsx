import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import { UpcomingBill } from '../../../../constants/ledgerData';
import { AnimatedModal } from '../../../../components/AnimatedModal';

/** Next date a bill due on `dueDay` falls on (this month, or next if it has passed). */
function nextDue(dueDay: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < today) due.setMonth(due.getMonth() + 1);
  return {
    date: due.toLocaleString('en-GB', { day: '2-digit', month: 'short' }),
    dueIn: Math.round((due.getTime() - today.getTime()) / 86400000),
  };
}

// ── Add Recurring Bill Sheet ──────────────────────────────────────────────────
interface AddRecurringBillSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (bill: UpcomingBill) => void;
  /** A signed-in user's linked accounts to pay from (replaces the sample payment methods). */
  accounts?: { id: string; label: string }[];
  /** Categories to pick from (replaces the sample ones). */
  categories?: string[];
}

export function AddRecurringBillSheet({
  visible,
  onClose,
  onSave,
  accounts,
  categories,
}: AddRecurringBillSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [billerName, setBillerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const cats = categories ?? ['Utilities', 'Housing', 'Telecom', 'Transport', 'Entertainment', 'Health', 'Loan'];
  const methods = React.useMemo(
    () => (accounts ? accounts.map(a => a.label) : ['Cash', 'Meezan', 'HBL', 'Easypaisa', 'Alfalah']),
    [accounts],
  );
  const [category, setCategory] = useState(categories ? (categories.includes('Bills') ? 'Bills' : cats[0]) : 'Utilities');
  const [remindDays, setRemindDays] = useState(3);
  const [payMethod, setPayMethod] = useState(methods[0] ?? '');

  // A newly linked account shows up (and is picked) without reopening the app.
  React.useEffect(() => {
    if (visible && !methods.includes(payMethod)) setPayMethod(methods[0] ?? '');
  }, [visible, methods, payMethod]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const tapKey = (k: string) => {
    if (k === '⌫') {
      setAmount(v => v.slice(0, -1));
      return;
    }
    if (k === '.' && amount.includes('.')) return;
    if (amount.length > 8) return;
    setAmount(v => v + k);
  };

  const handleSave = () => {
    if (!billerName.trim() || !(parseFloat(amount) > 0) || !payMethod) return;
    onSave({
      id: Date.now(),
      icon: category === 'Housing' ? 'home' : category === 'Utilities' ? 'zap' : 'clock',
      label: billerName.trim(),
      amount: parseFloat(amount) || 0,
      ...nextDue(dueDay),
      tag: payMethod,
      tagColor: theme.ACTIVE,
      paid: false,
      accountId: accounts?.find(a => a.label === payMethod)?.id,
      dueDay,
      category,
      remindDaysBefore: remindDays,
    });
    setBillerName('');
    setAmount('');
    onClose();
  };

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              maxHeight: '92%',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Add Recurring Bill
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {/* Biller Name */}
            <View style={[styles.inputBox, { backgroundColor: theme.MODAL }]}>
              <TextInput
                value={billerName}
                onChangeText={setBillerName}
                placeholder="Biller Name (e.g. K-Electric)"
                placeholderTextColor={theme.MUTED}
                style={[styles.textInput, { color: theme.TEXT }]}
              />
            </View>

            {/* Amount Display */}
            <View style={[styles.amtBox, { backgroundColor: theme.MODAL }]}>
              <Text style={[styles.amtLabel, { color: theme.MUTED }]}>
                EXPECTED AMOUNT (PKR)
              </Text>
              <Text style={[styles.amtVal, { color: theme.TEXT }]}>
                {amount || '0'}
              </Text>
            </View>

            {/* Custom Keypad */}
            <View style={styles.keypadGrid}>
              {keys.map(k => (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.7}
                  onPress={() => tapKey(k)}
                  style={[styles.keyBtn, { backgroundColor: theme.MODAL }]}
                >
                  <Text style={[styles.keyBtnText, { color: theme.TEXT }]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={[styles.sectionLabel, { color: theme.MUTED, marginTop: 14 }]}>
              CATEGORY
            </Text>
            <View style={styles.chipsWrap}>
              {cats.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.chip,
                    { backgroundColor: category === c ? theme.TEXT : theme.MODAL },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: category === c ? theme.BG : theme.MUTED },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Due Day & Reminder Steppers */}
            <View style={styles.stepperRow}>
              <View style={[styles.stepperBox, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.stepperLabel, { color: theme.MUTED }]}>
                  Due Day of Month
                </Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    onPress={() => setDueDay(d => Math.max(1, d - 1))}
                    style={[styles.stepBtn, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.TEXT }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepValue, { color: theme.TEXT }]}>{dueDay}</Text>
                  <TouchableOpacity
                    onPress={() => setDueDay(d => Math.min(31, d + 1))}
                    style={[styles.stepBtn, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.TEXT }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.stepperBox, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.stepperLabel, { color: theme.MUTED }]}>
                  Remind Days Prior
                </Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    onPress={() => setRemindDays(d => Math.max(1, d - 1))}
                    style={[styles.stepBtn, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.TEXT }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepValue, { color: theme.TEXT }]}>{remindDays}d</Text>
                  <TouchableOpacity
                    onPress={() => setRemindDays(d => Math.min(14, d + 1))}
                    style={[styles.stepBtn, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.TEXT }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <Text style={[styles.sectionLabel, { color: theme.MUTED, marginTop: 14 }]}>
              {accounts ? 'PAY FROM ACCOUNT' : 'PAYMENT METHOD'}
            </Text>
            <View style={styles.chipsWrap}>
              {methods.map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPayMethod(m)}
                  style={[
                    styles.chip,
                    { backgroundColor: payMethod === m ? theme.TEXT : theme.MODAL },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: payMethod === m ? theme.BG : theme.MUTED },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: theme.TEXT, marginTop: 14 }]}
          >
            <Text style={[styles.saveBtnText, { color: theme.BG }]}>
              Save Recurring Bill
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Bill Quick Action Sheet ───────────────────────────────────────────────────
interface BillQuickActionSheetProps {
  visible: boolean;
  bill: UpcomingBill | null;
  onClose: () => void;
  onMarkPaid: (bill: UpcomingBill) => void;
  onDelete: (bill: UpcomingBill) => void;
}

export function BillQuickActionSheet({
  visible,
  bill,
  onClose,
  onMarkPaid,
  onDelete,
}: BillQuickActionSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  if (!bill) return null;

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

          <View style={styles.billHeader}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.headerTitle, { color: theme.TEXT, marginBottom: 3 }]}>
                {bill.label}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.RED }}>
                PKR {bill.amount.toLocaleString()} · Due {bill.date}
              </Text>
            </View>
            <View style={[styles.tagBadge, { backgroundColor: (bill.tagColor || theme.MUTED) + '20' }]}>
              <Text style={[styles.tagBadgeText, { color: bill.tagColor || theme.MUTED }]}>
                {bill.tag}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={[styles.billActionCard, { backgroundColor: theme.MODAL, borderColor: theme.BORDER }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.ACTIVE + '18' }]}>
              <Feather name="link" size={16} color={theme.ACTIVE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: theme.ACTIVE }]}>
                Pay Now via 1Link
              </Text>
              <Text style={[styles.actionCardSub, { color: theme.MUTED }]}>
                Direct bank transfer
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              onMarkPaid(bill);
            }}
            style={[styles.billActionCard, { backgroundColor: theme.MODAL, borderColor: theme.BORDER }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.GREEN + '18' }]}>
              <Feather name="check" size={16} color={theme.GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: theme.GREEN }]}>
                Mark as Paid (Cash / Bank)
              </Text>
              <Text style={[styles.actionCardSub, { color: theme.MUTED }]}>
                Log payment into ledger
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={[styles.billActionCard, { backgroundColor: theme.MODAL, borderColor: theme.BORDER }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.MUTED + '20' }]}>
              <Feather name="edit-2" size={16} color={theme.MUTED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: theme.TEXT }]}>
                Edit Due Date
              </Text>
              <Text style={[styles.actionCardSub, { color: theme.MUTED }]}>
                Reschedule this bill
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              onDelete(bill);
            }}
            style={[
              styles.billActionCard,
              {
                backgroundColor: theme.RED + '10',
                borderColor: theme.RED + '30',
              },
            ]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.RED + '20' }]}>
              <Feather name="trash-2" size={16} color={theme.RED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: theme.RED }]}>
                Delete Bill
              </Text>
              <Text style={[styles.actionCardSub, { color: theme.MUTED }]}>
                Remove from upcoming calendar
              </Text>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Mark As Paid Sheet ────────────────────────────────────────────────────────
export function MarkAsPaidSheet({
  visible,
  bill,
  onClose,
  onConfirmPaid,
  accountName,
}: {
  visible: boolean;
  bill: UpcomingBill | null;
  onClose: () => void;
  onConfirmPaid: (method: string) => void;
  /** A signed-in user's bill: the account it's paid from (logs the payment there). */
  accountName?: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  if (!bill) return null;

  const options = accountName
    ? [
        { label: `Paid from ${accountName}`, sub: 'Logs it as an expense in this account', icon: 'briefcase', color: theme.ACTIVE },
        { label: 'Snooze Reminder', sub: 'Postpone 3 days', icon: 'clock', color: theme.MUTED },
      ]
    : [
        { label: 'Mark Paid via Cash', sub: 'Cash Wallet', icon: 'check', color: theme.GREEN },
        { label: 'Mark Paid via Bank Account', sub: 'Meezan Bank', icon: 'briefcase', color: theme.ACTIVE },
        { label: 'Snooze Reminder', sub: 'Postpone 3 days', icon: 'clock', color: theme.MUTED },
      ];

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
                {bill.label}
              </Text>
              <Text style={{ fontSize: 11, color: theme.MUTED, marginTop: 2 }}>
                PKR {bill.amount.toLocaleString()} · Due {bill.date}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.MUTED, marginBottom: 10 }]}>
            MARK AS PAID VIA
          </Text>

          {options.map(opt => (
            <TouchableOpacity
              key={opt.label}
              activeOpacity={0.85}
              onPress={() => {
                onConfirmPaid(opt.label);
                onClose();
              }}
              style={[
                styles.billActionCard,
                { backgroundColor: theme.MODAL, borderColor: theme.BORDER },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: opt.color + '20' }]}>
                <Feather name={opt.icon} size={16} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionCardTitle, { color: theme.TEXT }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.actionCardSub, { color: theme.MUTED }]}>
                  {opt.sub}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  inputBox: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 14,
    padding: 0,
  },
  amtBox: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  amtLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  amtVal: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  keyBtn: {
    width: '31.5%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  stepperBox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  billActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionCardSub: {
    fontSize: 10,
  },
});
