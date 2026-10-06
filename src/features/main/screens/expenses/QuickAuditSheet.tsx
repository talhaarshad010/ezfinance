import React, { useState } from 'react';
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
import { LedgerTransaction } from '../../../../constants/ledgerData';
import { AnimatedModal } from '../../../../components/AnimatedModal';

interface QuickAuditSheetProps {
  visible: boolean;
  tx: LedgerTransaction | null;
  onClose: () => void;
  onEdit: (tx: LedgerTransaction) => void;
  onSplit: (tx: LedgerTransaction) => void;
  onDelete: (tx: LedgerTransaction) => void;
  onDetail: (tx: LedgerTransaction) => void;
  onChangeCategory?: (tx: LedgerTransaction) => void;
}

export default function QuickAuditSheet({
  visible,
  tx,
  onClose,
  onEdit,
  onSplit,
  onDelete,
  onDetail,
  onChangeCategory,
}: QuickAuditSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (!tx) return null;

  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const amtColor = isTransfer ? theme.MUTED : isIncome ? theme.GREEN : theme.RED;

  const quickActions = [
    { label: 'Change\nCategory', icon: 'tag', action: () => onChangeCategory ? onChangeCategory(tx) : onEdit(tx) },
    { label: 'Add\nReceipt', icon: 'camera', action: () => onEdit(tx) },
    { label: 'Split', icon: 'scissors', action: () => onSplit(tx) },
    { label: 'Exclude\nBudget', icon: 'check-square', action: onClose },
  ];

  return (
    <AnimatedModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          {/* Tx summary card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.MODAL }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                numberOfLines={1}
                style={[styles.txTitle, { color: theme.TEXT }]}
              >
                {tx.label}
              </Text>
              <Text style={[styles.txSub, { color: theme.MUTED }]}>
                {tx.category} · {tx.account}
              </Text>
            </View>
            <Text style={[styles.txAmt, { color: amtColor }]}>
              {isIncome ? '+ ' : isTransfer ? '→ ' : '− '}
              PKR {Math.abs(tx.amount).toLocaleString()}
            </Text>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionsGrid}>
            {quickActions.map(a => (
              <TouchableOpacity
                key={a.label}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  a.action();
                }}
                style={[styles.actionBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name={a.icon} size={18} color={theme.TEXT} />
                <Text style={[styles.actionLabel, { color: theme.MUTED }]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Actions Row */}
          <View style={styles.bottomRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onDetail(tx);
              }}
              style={[styles.mainBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="file-text" size={14} color={theme.ACTIVE} />
              <Text style={[styles.mainBtnText, { color: theme.TEXT }]}>
                View Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onEdit(tx);
              }}
              style={[styles.mainBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="edit-2" size={14} color={theme.ACTIVE} />
              <Text style={[styles.mainBtnText, { color: theme.TEXT }]}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onDelete(tx);
              }}
              style={[styles.deleteBtn, { backgroundColor: theme.RED + '20' }]}
            >
              <Feather name="trash-2" size={16} color={theme.RED} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Detail Sheet Modal ────────────────────────────────────────────────────────
export function TransactionDetailModal({
  visible,
  tx,
  onClose,
}: {
  visible: boolean;
  tx: LedgerTransaction | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  if (!tx) return null;

  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const amtColor = isTransfer ? theme.MUTED : isIncome ? theme.GREEN : theme.RED;

  const rows = [
    { label: 'Date & Time', value: `${tx.dateGroup} · ${tx.time}`, badge: false },
    { label: 'Status', value: tx.status, badge: true },
    { label: 'Payment Method', value: tx.account, badge: false },
    { label: 'Category', value: tx.category, badge: false },
    { label: 'SMS Reference', value: tx.smsRef || 'N/A', badge: false, mono: true },
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
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Transaction Detail
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <View style={[styles.detailHero, { borderBottomColor: theme.BORDER }]}>
            <View style={[styles.detailIconBox, { backgroundColor: theme.MODAL }]}>
              <Feather name={tx.icon || 'credit-card'} size={24} color={theme.MUTED} />
            </View>
            <Text style={[styles.detailHeroLabel, { color: theme.TEXT }]}>
              {tx.label}
            </Text>
            <Text style={[styles.detailHeroAmt, { color: amtColor }]}>
              {isIncome ? '+' : isTransfer ? '→' : '−'} PKR {Math.abs(tx.amount).toLocaleString()}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: theme.MODAL }]}>
            {rows.map((r, i) => (
              <View
                key={r.label}
                style={[
                  styles.detailRow,
                  i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.detailRowLabel, { color: theme.MUTED }]}>
                  {r.label}
                </Text>
                {r.badge ? (
                  <View style={[styles.statusBadge, { backgroundColor: theme.GREEN + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: theme.GREEN }]}>
                      {r.value}
                    </Text>
                  </View>
                ) : (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.detailRowVal,
                      { color: theme.TEXT },
                      r.mono && { fontFamily: 'monospace', fontSize: 11 },
                    ]}
                  >
                    {r.value}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Edit Transaction Modal ───────────────────────────────────────────────────
export function EditTxModal({
  visible,
  tx,
  onClose,
  onSave,
}: {
  visible: boolean;
  tx: LedgerTransaction | null;
  onClose: () => void;
  onSave: (updated: LedgerTransaction) => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState(tx?.category || 'Groceries');
  const [notes, setNotes] = useState('');
  const [taxDed, setTaxDed] = useState(false);

  React.useEffect(() => {
    if (tx) {
      setCategory(tx.category);
    }
  }, [tx]);

  if (!tx) return null;

  const cats = [
    'Groceries',
    'Transport',
    'Housing',
    'Utilities',
    'Dining',
    'Telecom',
    'Healthcare',
    'Education',
    'Investment',
    'Salary',
  ];

  const handleSave = () => {
    onSave({
      ...tx,
      category,
    });
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
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Edit Transaction
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>Category</Text>
          <View style={styles.catChipsWrap}>
            {cats.map(c => {
              const sel = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.catChip,
                    { backgroundColor: sel ? theme.TEXT : theme.MODAL },
                  ]}
                >
                  <Text style={[styles.catChipText, { color: sel ? theme.BG : theme.MUTED }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>Notes</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.MODAL }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note…"
              placeholderTextColor={theme.MUTED}
              style={[styles.textInput, { color: theme.TEXT }]}
            />
          </View>

          <View style={[styles.switchRow, { backgroundColor: theme.MODAL }]}>
            <View>
              <Text style={[styles.switchTitle, { color: theme.TEXT }]}>
                Tax Deductible
              </Text>
              <Text style={[styles.switchSub, { color: theme.MUTED }]}>
                Mark for FBR documentation
              </Text>
            </View>
            <Switch
              value={taxDed}
              onValueChange={setTaxDed}
              trackColor={{ false: theme.MUTED + '44', true: theme.GREEN }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.saveBtnText, { color: theme.BG }]}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Split Transaction Modal ──────────────────────────────────────────────────
export function SplitTxModal({
  visible,
  tx,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  tx: LedgerTransaction | null;
  onClose: () => void;
  onConfirm: (part1: number, part2: number, cat1: string, cat2: string) => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const total = Math.abs(tx?.amount || 0);

  const [split1, setSplit1] = useState(Math.floor(total * 0.6));
  const split2 = total - split1;
  const [cat1, setCat1] = useState('Groceries');
  const [cat2, setCat2] = useState('Dining');

  if (!tx) return null;

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
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Split Transaction
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <View style={[styles.origBox, { backgroundColor: theme.MODAL }]}>
            <Text numberOfLines={1} style={[styles.origLabel, { color: theme.MUTED }]}>
              Original: {tx.label}
            </Text>
            <Text style={[styles.origAmt, { color: theme.RED }]}>
              − PKR {total.toLocaleString()}
            </Text>
          </View>

          {/* Split 1 */}
          <View style={[styles.splitCard, { backgroundColor: theme.MODAL }]}>
            <View style={styles.splitHeader}>
              <Text style={[styles.splitTitle, { color: theme.TEXT }]}>Split 1</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['Groceries', 'Household'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCat1(c)}
                    style={[
                      styles.splitCatBtn,
                      { backgroundColor: cat1 === c ? theme.TEXT : theme.CARD },
                    ]}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '600', color: cat1 === c ? theme.BG : theme.MUTED }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setSplit1(Math.max(0, split1 - 500))}
                style={[styles.stepBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={{ color: theme.TEXT, fontSize: 16 }}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.splitAmtText, { color: theme.TEXT, flex: 1, textAlign: 'center' }]}>
                PKR {split1.toLocaleString()}
              </Text>
              <TouchableOpacity
                onPress={() => setSplit1(Math.min(total, split1 + 500))}
                style={[styles.stepBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={{ color: theme.TEXT, fontSize: 16 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Split 2 */}
          <View style={[styles.splitCard, { backgroundColor: theme.MODAL }]}>
            <View style={styles.splitHeader}>
              <Text style={[styles.splitTitle, { color: theme.TEXT }]}>Split 2</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['Dining', 'Personal'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCat2(c)}
                    style={[
                      styles.splitCatBtn,
                      { backgroundColor: cat2 === c ? theme.TEXT : theme.CARD },
                    ]}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '600', color: cat2 === c ? theme.BG : theme.MUTED }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={[styles.splitAmtText, { color: theme.MUTED, marginTop: 8 }]}>
              PKR {split2.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 10, color: theme.MUTED, marginTop: 2 }}>
              Remaining balance
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              onConfirm(split1, split2, cat1, cat2);
              onClose();
            }}
            style={[styles.saveBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.saveBtnText, { color: theme.BG }]}>
              Confirm Split
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
export function DeleteConfirmModal({
  visible,
  tx,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  tx: LedgerTransaction | null;
  onClose: () => void;
  onConfirm: (tx: LedgerTransaction) => void;
}) {
  const { theme } = useTheme();
  if (!tx) return null;

  return (
    <AnimatedModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.centerBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.dialogCard, { backgroundColor: theme.CARD }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.dialogHeader}>
            <View style={[styles.dialogIconBox, { backgroundColor: theme.RED + '20' }]}>
              <Feather name="trash-2" size={18} color={theme.RED} />
            </View>
            <Text style={[styles.dialogTitle, { color: theme.TEXT }]}>
              Delete Transaction?
            </Text>
          </View>

          <Text style={[styles.dialogMsg, { color: theme.MUTED }]}>
            Deleting <Text style={{ color: theme.TEXT, fontWeight: '600' }}>{tx.label} (PKR {Math.abs(tx.amount).toLocaleString()})</Text> will recalculate your monthly net worth and budget metrics.
          </Text>

          <View style={styles.dialogActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={[styles.dialogBtn, { backgroundColor: theme.MODAL }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.MUTED }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onConfirm(tx);
                onClose();
              }}
              style={[styles.dialogBtn, { backgroundColor: theme.RED }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                Delete
              </Text>
            </TouchableOpacity>
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
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  txSub: {
    fontSize: 11,
  },
  txAmt: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mainBtn: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHero: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  detailIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detailHeroLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailHeroAmt: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  detailCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowLabel: {
    fontSize: 12,
  },
  detailRowVal: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 200,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  catChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputBox: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textInput: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  switchSub: {
    fontSize: 11,
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
  origBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  origLabel: {
    fontSize: 12,
    flex: 1,
  },
  origAmt: {
    fontSize: 13,
    fontWeight: '700',
  },
  splitCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  splitCatBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitAmtText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dialogIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dialogMsg: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtn: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
