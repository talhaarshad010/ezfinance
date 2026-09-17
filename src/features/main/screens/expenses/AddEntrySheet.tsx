import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../context/ToastContext';
import { BottomSheet, Toggle } from '../../../../components';
import {
  EXPENSE_CATEGORIES,
  LINKED_ACCOUNTS,
} from '../../../../constants/ledgerData';

type AddMode = 'out' | 'in' | 'transfer';
type CaptureStep =
  | null
  | 'category'
  | 'account'
  | 'toAccount'
  | 'receiptOptions'
  | 'scanner'
  | 'ocrResult'
  | 'ocrCorrection'
  | 'recurring';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

/* ─── Category picker ────────────────────────────────────────────────────── */

function CategoryPickerSheet({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (c: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Category">
      <View style={styles.catGrid}>
        {EXPENSE_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.label}
            activeOpacity={0.85}
            onPress={() => onSelect(cat.label)}
            style={[styles.catTile, { backgroundColor: theme.MODAL }]}
          >
            <View style={[styles.catIcon, { backgroundColor: theme.CARD }]}>
              <Feather name={cat.icon} size={20} color={theme.TEXT} />
            </View>
            <Text style={[styles.catLabel, { color: theme.MUTED }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

/* ─── Account picker ─────────────────────────────────────────────────────── */

function AccountPickerSheet({
  visible,
  title = 'Select Account',
  onSelect,
  onClose,
}: {
  visible: boolean;
  title?: string;
  onSelect: (a: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={[styles.accList, { backgroundColor: theme.MODAL }]}>
        {LINKED_ACCOUNTS.map((acc, i) => (
          <TouchableOpacity
            key={acc.name}
            activeOpacity={0.85}
            onPress={() => onSelect(acc.name)}
            style={[
              styles.accRow,
              i < LINKED_ACCOUNTS.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.BORDER,
              },
            ]}
          >
            <View style={styles.flex1}>
              <Text style={[styles.accName, { color: theme.TEXT }]}>
                {acc.name}
              </Text>
              <View
                style={[styles.accTag, { backgroundColor: `${theme.ACTIVE}22` }]}
              >
                <Text style={[styles.accTagText, { color: theme.ACTIVE }]}>
                  {acc.type}
                </Text>
              </View>
            </View>
            <Text style={[styles.accBalance, { color: theme.GREEN }]}>
              PKR {acc.balance.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

/* ─── Receipt capture options ────────────────────────────────────────────── */

function ReceiptCaptureSheet({
  visible,
  onTakePhoto,
  onClose,
}: {
  visible: boolean;
  onTakePhoto: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const options = [
    { label: 'Take Live Photo', icon: 'camera', action: onTakePhoto },
    {
      label: 'Select from Photo Library',
      icon: 'upload',
      action: () => {
        onClose();
        showToast('Opening photo library…', 'info', 'Add Receipt');
      },
    },
    {
      label: 'Import PDF Invoice',
      icon: 'file-text',
      action: () => {
        onClose();
        showToast('Choose a PDF invoice to attach.', 'info', 'Add Receipt');
      },
    },
    { label: 'Enter Manually', icon: 'edit-2', action: onClose },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Receipt">
      <View style={styles.optionStack}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.label}
            activeOpacity={0.85}
            onPress={opt.action}
            style={[styles.optionRow, { backgroundColor: theme.MODAL }]}
          >
            <View style={[styles.optionIcon, { backgroundColor: theme.CARD }]}>
              <Feather name={opt.icon} size={18} color={theme.ACTIVE} />
            </View>
            <Text style={[styles.optionLabel, { color: theme.TEXT }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

/* ─── Camera viewfinder ──────────────────────────────────────────────────── */

function CameraViewfinderSheet({
  visible,
  onCapture,
  onClose,
}: {
  visible: boolean;
  onCapture: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [flashOn, setFlashOn] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.cameraRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        <TouchableOpacity
          onPress={onClose}
          style={[styles.cameraClose, { top: insets.top + 12 }]}
        >
          <Feather name="x" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={[styles.cameraHint, { paddingTop: insets.top + 56 }]}>
          <Text style={styles.cameraHintText}>
            Align physical paper receipt within frame.{'\n'}NTN, Date, and Total
            must be legible.
          </Text>
        </View>

        <View style={styles.cameraStage}>
          <View style={styles.cameraFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        <View
          style={[styles.cameraControls, { paddingBottom: insets.bottom + 32 }]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFlashOn(v => !v)}
            style={styles.cameraSideBtn}
          >
            <Feather
              name={flashOn ? 'zap' : 'zap-off'}
              size={20}
              color={flashOn ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCapture}
            style={styles.shutterOuter}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.cameraPhotosBtn}
          >
            <Text style={styles.cameraPhotosText}>Photos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── OCR result ─────────────────────────────────────────────────────────── */

function OcrResultSheet({
  visible,
  onAccept,
  onEdit,
  onClose,
}: {
  visible: boolean;
  onAccept: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const fields = [
    { label: 'Merchant', value: 'Imtiaz Super Market – Clifton', color: theme.TEXT },
    { label: 'NTN / Tax ID', value: '1429582-7', color: theme.TEXT },
    { label: 'Date', value: '16 Aug 2026', color: theme.TEXT },
    { label: 'Total', value: 'PKR 6,450', color: theme.RED },
    { label: 'Sales Tax', value: 'PKR 840 (13% SRB Included)', color: theme.MUTED },
  ];

  const lineItems = [
    { name: 'Basmati Rice 5kg', price: '2,500' },
    { name: 'Cooking Oil 5L x2', price: '1,800' },
    { name: 'Chicken Masala x3', price: '1,310' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.fullScreen, { backgroundColor: theme.BG }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.BG}
        />

        <View style={[styles.ocrHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.flex1}>
            <Text style={[styles.ocrEyebrow, { color: theme.ACTIVE }]}>
              OCR · RECEIPT PARSED
            </Text>
            <Text style={[styles.ocrTitle, { color: theme.TEXT }]}>
              Verify Extracted Data
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.ocrCloseBtn, { backgroundColor: theme.CARD }]}
          >
            <Feather name="x" size={14} color={theme.MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ocrBody}
        >
          {/* Receipt facsimile */}
          <View style={[styles.receiptCard, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.receiptStore, { color: theme.TEXT }]}>
              IMTIAZ SUPER MARKET
            </Text>
            <Text style={[styles.receiptMeta, { color: theme.MUTED }]}>
              Clifton Branch · NTN: 1429582-7
            </Text>
            <Text style={[styles.receiptMetaLeft, { color: theme.MUTED }]}>
              16 Aug 2026 · 03:42 PM
            </Text>
            <View style={styles.receiptDivider} />
            {lineItems.map(item => (
              <View key={item.name} style={styles.receiptRow}>
                <Text style={[styles.receiptItem, { color: theme.MUTED }]}>
                  {item.name}
                </Text>
                <Text style={[styles.receiptItem, { color: theme.TEXT }]}>
                  PKR {item.price}
                </Text>
              </View>
            ))}
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptTotal, { color: theme.TEXT }]}>
                TOTAL
              </Text>
              <Text style={[styles.receiptTotal, { color: theme.RED }]}>
                PKR 6,450
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptItem, { color: theme.MUTED }]}>
                SRB Tax (13%)
              </Text>
              <Text style={[styles.receiptItem, { color: theme.MUTED }]}>
                PKR 840
              </Text>
            </View>
          </View>

          {/* Extracted fields */}
          <View style={[styles.fieldCard, { backgroundColor: theme.CARD }]}>
            {fields.map((field, i) => (
              <View
                key={field.label}
                style={[
                  styles.fieldRow,
                  i < fields.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  {field.label}
                </Text>
                <Text style={[styles.fieldValue, { color: field.color }]}>
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.ocrFooter,
            { backgroundColor: theme.BG, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onEdit}
            style={[styles.ocrBtn, { backgroundColor: theme.CARD }]}
          >
            <Text style={[styles.ocrBtnText, { color: theme.TEXT }]}>
              Edit Fields
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onAccept}
            style={[styles.ocrBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.ocrBtnText, { color: theme.BG }]}>
              Accept & Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── OCR correction ─────────────────────────────────────────────────────── */

function OcrCorrectionSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [merchant, setMerchant] = useState('Imtiaz Super Market – Clifton');
  const [amount, setAmount] = useState('6,450');
  const [date, setDate] = useState('16 Aug 2026');
  const [ntn, setNtn] = useState('1429582-7');

  const fields = [
    { label: 'MERCHANT NAME', value: merchant, setter: setMerchant },
    { label: 'TOTAL AMOUNT', value: amount, setter: setAmount },
    { label: 'DATE', value: date, setter: setDate },
    { label: 'NTN / TAX ID', value: ntn, setter: setNtn },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Fix Extracted Fields"
      subtitle="OCR CORRECTION MODE"
    >
      {fields.map(f => (
        <View key={f.label} style={styles.correctionField}>
          <Text style={[styles.correctionLabel, { color: theme.MUTED }]}>
            {f.label}
          </Text>
          <View
            style={[
              styles.correctionInputWrap,
              { backgroundColor: theme.MODAL, borderColor: 'rgba(255,160,0,0.28)' },
            ]}
          >
            <TextInput
              value={f.value}
              onChangeText={f.setter}
              style={[styles.correctionInput, { color: theme.TEXT }]}
              placeholderTextColor={theme.MUTED}
            />
          </View>
        </View>
      ))}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onClose}
        style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
      >
        <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
          Save Corrections
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

/* ─── Recurring schedule setup ───────────────────────────────────────────── */

function RecurringSetupSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [cycle, setCycle] = useState('Monthly');
  const [remindDays, setRemindDays] = useState(3);
  const [autoLog, setAutoLog] = useState(true);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Set Recurring Schedule"
    >
      <Text style={[styles.sectionLabel, { color: theme.MUTED }]}>
        BILLING CYCLE
      </Text>
      <View style={styles.cycleRow}>
        {['Monthly', 'Quarterly', 'Annual'].map(c => (
          <TouchableOpacity
            key={c}
            activeOpacity={0.85}
            onPress={() => setCycle(c)}
            style={[
              styles.cyclePill,
              { backgroundColor: cycle === c ? theme.TEXT : theme.MODAL },
            ]}
          >
            <Text
              style={[
                styles.cyclePillText,
                { color: cycle === c ? theme.BG : theme.MUTED },
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.MUTED }]}>
        NEXT RENEWAL DATE
      </Text>
      <View style={[styles.rowCard, { backgroundColor: theme.MODAL }]}>
        <Text style={[styles.rowCardValue, { color: theme.TEXT }]}>
          01 Sep 2026
        </Text>
        <Feather name="chevron-right" size={14} color={theme.MUTED} />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.MUTED }]}>
        PAYMENT REMINDER
      </Text>
      <View style={[styles.rowCard, { backgroundColor: theme.MODAL }]}>
        <Text style={[styles.rowCardLabel, { color: theme.TEXT }]}>
          Remind {remindDays} days prior
        </Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRemindDays(d => Math.max(1, d - 1))}
            style={[styles.stepBtn, { backgroundColor: theme.CARD }]}
          >
            <Feather name="minus" size={14} color={theme.TEXT} />
          </TouchableOpacity>
          <Text style={[styles.stepValue, { color: theme.TEXT }]}>
            {remindDays}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRemindDays(d => Math.min(14, d + 1))}
            style={[styles.stepBtn, { backgroundColor: theme.CARD }]}
          >
            <Feather name="plus" size={14} color={theme.TEXT} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.rowCard, { backgroundColor: theme.MODAL }]}>
        <View style={styles.flex1}>
          <Text style={[styles.rowCardLabel, { color: theme.TEXT }]}>
            Auto-Log to Ledger
          </Text>
          <Text style={[styles.rowCardSub, { color: theme.MUTED }]}>
            Auto-enter when SMS detected
          </Text>
        </View>
        <Toggle on={autoLog} onToggle={() => setAutoLog(v => !v)} />
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onClose}
        style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
      >
        <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
          Save Recurring Schedule
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

/* ─── Main add-entry sheet ───────────────────────────────────────────────── */

export function AddEntrySheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd?: (tx: any) => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AddMode>('out');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('Meezan Bank (Current)');
  const [toAccount, setToAccount] = useState('Easypaisa Mobile Account');
  const [notes, setNotes] = useState('');
  const [taxDed, setTaxDed] = useState(false);
  const [proofAttached, setProofAttached] = useState(false);
  const [recurringOn, setRecurringOn] = useState(false);
  const [step, setStep] = useState<CaptureStep>(null);

  const amtColor =
    mode === 'in' ? theme.GREEN : mode === 'out' ? theme.RED : theme.TEXT;
  const hasAmount = parseFloat(amount) > 0;

  function tapKey(k: string) {
    if (k === '⌫') {
      setAmount(v => v.slice(0, -1));
      return;
    }
    if (k === '.' && amount.includes('.')) return;
    if (amount === '' && k === '.') {
      setAmount('0.');
      return;
    }
    setAmount(v => v + k);
  }

  function reset() {
    setAmount('');
    setCategory('');
    setNotes('');
    setTaxDed(false);
    setProofAttached(false);
    setRecurringOn(false);
    setStep(null);
  }

  function submit() {
    if (!hasAmount) return;
    if (onAdd) {
      const num = parseFloat(amount);
      const sign = mode === 'in' ? 1 : -1;
      onAdd({
        id: Date.now(),
        icon:
          category === 'Groceries'
            ? 'shopping-cart'
            : category === 'Transport'
            ? 'truck'
            : category === 'Dining'
            ? 'coffee'
            : 'credit-card',
        label:
          notes.trim() || (category ? `${category} payment` : 'Transaction'),
        account: account,
        category: category || 'Misc',
        amount: sign * num,
        dateGroup: 'TODAY',
        time: 'Just now',
        type:
          mode === 'in'
            ? 'income'
            : mode === 'transfer'
            ? 'transfer'
            : 'expense',
        smsRef: `MANUAL-${Date.now()}`,
        status: 'Settled',
      });
    }
    showToast(
      mode === 'in'
        ? `Income of PKR ${amount} recorded.`
        : mode === 'transfer'
        ? `Transfer of PKR ${amount} recorded.`
        : `Expense of PKR ${amount} recorded.`,
      'success',
      'Transaction Recorded',
    );
    reset();
    onClose();
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.entrySheet, { backgroundColor: theme.CARD }]}>
          {/* Header */}
          <View style={styles.entryHeader}>
            <View style={styles.rowBetween}>
              <Text style={[styles.entryTitle, { color: theme.TEXT }]}>
                New Transaction
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.modeRow}>
              {(
                [
                  { id: 'out' as AddMode, label: 'Money Out' },
                  { id: 'in' as AddMode, label: 'Money In' },
                  { id: 'transfer' as AddMode, label: 'Transfer' },
                ]
              ).map(m => (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.85}
                  onPress={() => setMode(m.id)}
                  style={[
                    styles.modePill,
                    {
                      backgroundColor:
                        mode === m.id ? theme.TEXT : theme.MODAL,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      { color: mode === m.id ? theme.BG : theme.MUTED },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount */}
          <View
            style={[
              styles.amountBlock,
              { borderBottomColor: theme.BORDER },
            ]}
          >
            <Text style={[styles.amountLabel, { color: theme.MUTED }]}>
              AMOUNT (PKR)
            </Text>
            <Text style={[styles.amountValue, { color: amtColor }]}>
              {amount || '0'}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            <View style={styles.formBlock}>
              {mode === 'transfer' ? (
                <View style={styles.transferStack}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setStep('account')}
                    style={[styles.pickerCard, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.pickerLabel, { color: theme.MUTED }]}>
                      TRANSFER FROM
                    </Text>
                    <Text style={[styles.pickerValue, { color: theme.TEXT }]}>
                      {account}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.transferArrowWrap}>
                    <View
                      style={[
                        styles.transferArrow,
                        { backgroundColor: theme.TEXT },
                      ]}
                    >
                      <Feather
                        name="arrow-down"
                        size={14}
                        color={theme.BG}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setStep('toAccount')}
                    style={[styles.pickerCard, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.pickerLabel, { color: theme.MUTED }]}>
                      TRANSFER TO
                    </Text>
                    <Text style={[styles.pickerValue, { color: theme.TEXT }]}>
                      {toAccount}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setStep('category')}
                  style={[styles.selectRow, { backgroundColor: theme.MODAL }]}
                >
                  <View style={styles.selectRowLeft}>
                    <Feather name="tag" size={15} color={theme.MUTED} />
                    <Text
                      style={[
                        styles.selectRowText,
                        { color: category ? theme.TEXT : theme.MUTED },
                      ]}
                    >
                      {category || 'Select Category'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={theme.MUTED} />
                </TouchableOpacity>
              )}

              {mode !== 'transfer' && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setStep('account')}
                  style={[styles.selectRow, { backgroundColor: theme.MODAL }]}
                >
                  <View style={styles.selectRowLeft}>
                    <Feather name="briefcase" size={15} color={theme.MUTED} />
                    <Text style={[styles.selectRowText, { color: theme.TEXT }]}>
                      {account}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={theme.MUTED} />
                </TouchableOpacity>
              )}

              <View style={[styles.notesCard, { backgroundColor: theme.MODAL }]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add merchant or notes…"
                  placeholderTextColor={theme.MUTED}
                  style={[styles.notesInput, { color: theme.TEXT }]}
                />
              </View>

              {/* Tax already deducted */}
              {mode === 'out' && (
                <View style={[styles.taxCard, { backgroundColor: theme.MODAL }]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.rowCardLabel, { color: theme.TEXT }]}>
                      Tax Already Deducted
                    </Text>
                    <Toggle on={taxDed} onToggle={() => setTaxDed(v => !v)} />
                  </View>

                  {taxDed && (
                    <View style={styles.taxExpanded}>
                      <Text style={[styles.taxHelp, { color: theme.MUTED }]}>
                        Turn this on if some tax was already cut from this
                        payment (like on mobile top-ups, electricity bills, or
                        vehicle registration). If you're a registered taxpayer,
                        you can get this money back later.
                      </Text>
                      <Text style={[styles.taxPrompt, { color: theme.TEXT }]}>
                        Want to save proof of this for later?
                      </Text>
                      <View style={styles.proofRow}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setStep('receiptOptions')}
                          style={[
                            styles.proofBtn,
                            {
                              backgroundColor: proofAttached
                                ? `${theme.GREEN}22`
                                : theme.CARD,
                            },
                          ]}
                        >
                          <Feather
                            name={proofAttached ? 'check' : 'camera'}
                            size={12}
                            color={proofAttached ? theme.GREEN : theme.MUTED}
                          />
                          <Text
                            style={[
                              styles.proofBtnText,
                              {
                                color: proofAttached
                                  ? theme.GREEN
                                  : theme.MUTED,
                              },
                            ]}
                          >
                            {proofAttached ? 'Proof Attached' : 'Scan Bill'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            setProofAttached(true);
                            showToast(
                              'PDF proof attached to this expense.',
                              'success',
                              'Proof Saved',
                            );
                          }}
                          style={[styles.proofBtn, { backgroundColor: theme.CARD }]}
                        >
                          <Feather name="paperclip" size={12} color={theme.MUTED} />
                          <Text
                            style={[styles.proofBtnText, { color: theme.MUTED }]}
                          >
                            Upload PDF
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Recurring income */}
              {mode === 'in' && (
                <View style={[styles.rowCard, { backgroundColor: theme.MODAL }]}>
                  <Text
                    style={[
                      styles.rowCardLabel,
                      { color: theme.TEXT, flex: 1, paddingRight: 10 },
                    ]}
                  >
                    Recurring Income (e.g. Salary, Rent Yield)
                  </Text>
                  <View style={styles.recurringRight}>
                    {recurringOn && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setStep('recurring')}
                        style={[
                          styles.configureBtn,
                          { backgroundColor: `${theme.ACTIVE}22` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.configureText,
                            { color: theme.ACTIVE },
                          ]}
                        >
                          Configure
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Toggle
                      on={recurringOn}
                      onToggle={() => setRecurringOn(v => !v)}
                    />
                  </View>
                </View>
              )}
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
                  <Text style={[styles.keyText, { color: theme.TEXT }]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.submitWrap}>
              <TouchableOpacity
                activeOpacity={hasAmount ? 0.9 : 1}
                onPress={submit}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: hasAmount ? theme.TEXT : theme.MUTED,
                    opacity: hasAmount ? 1 : 0.3,
                  },
                ]}
              >
                <Text style={[styles.submitText, { color: theme.BG }]}>
                  Save Transaction — PKR {amount || '0'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Inner pickers */}
      <CategoryPickerSheet
        visible={step === 'category'}
        onSelect={c => {
          setCategory(c);
          setStep(null);
        }}
        onClose={() => setStep(null)}
      />
      <AccountPickerSheet
        visible={step === 'account'}
        onSelect={a => {
          setAccount(a);
          setStep(null);
        }}
        onClose={() => setStep(null)}
      />
      <AccountPickerSheet
        visible={step === 'toAccount'}
        title="Transfer To Account"
        onSelect={a => {
          setToAccount(a);
          setStep(null);
        }}
        onClose={() => setStep(null)}
      />
      <ReceiptCaptureSheet
        visible={step === 'receiptOptions'}
        onTakePhoto={() => setStep('scanner')}
        onClose={() => setStep(null)}
      />
      <CameraViewfinderSheet
        visible={step === 'scanner'}
        onCapture={() => setStep('ocrResult')}
        onClose={() => setStep('receiptOptions')}
      />
      <OcrResultSheet
        visible={step === 'ocrResult'}
        onAccept={() => {
          setProofAttached(true);
          setStep(null);
          showToast(
            'Receipt parsed and attached as tax proof.',
            'success',
            'OCR Complete',
          );
        }}
        onEdit={() => setStep('ocrCorrection')}
        onClose={() => setStep('scanner')}
      />
      <OcrCorrectionSheet
        visible={step === 'ocrCorrection'}
        onClose={() => setStep('ocrResult')}
      />
      <RecurringSetupSheet
        visible={step === 'recurring'}
        onClose={() => setStep(null)}
      />
    </>
  );
}

export default AddEntrySheet;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  /* Entry sheet shell */
  entrySheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '93%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  entryHeader: { paddingHorizontal: 20, paddingTop: 16 },
  entryTitle: { fontSize: 16, fontWeight: '700' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  modePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 100,
    alignItems: 'center',
  },
  modePillText: { fontSize: 12, fontWeight: '700' },

  amountBlock: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -3,
    minHeight: 58,
  },

  formBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  transferStack: { gap: 8 },
  pickerCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  pickerLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  pickerValue: { fontSize: 14, fontWeight: '600' },
  transferArrowWrap: { alignItems: 'center' },
  transferArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectRow: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  selectRowText: { fontSize: 14 },

  notesCard: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  notesInput: { fontSize: 14, paddingVertical: 10 },

  taxCard: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  taxExpanded: { marginTop: 8 },
  taxHelp: { fontSize: 11, lineHeight: 17, marginBottom: 12 },
  taxPrompt: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  proofRow: { flexDirection: 'row', gap: 8 },
  proofBtn: {
    flex: 1,
    height: 38,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  proofBtnText: { fontSize: 11, fontWeight: '600' },

  recurringRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  configureBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  configureText: { fontSize: 10, fontWeight: '700' },

  keypad: {
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '31.5%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  keyText: { fontSize: 20, fontWeight: '600' },

  submitWrap: { paddingHorizontal: 16, paddingTop: 4 },
  submitBtn: {
    height: 54,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 14, fontWeight: '700' },

  /* Category picker */
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  catTile: {
    width: '31.5%',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  /* Account picker */
  accList: { borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
  accRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  accName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  accTag: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  accTagText: { fontSize: 9, fontWeight: '700' },
  accBalance: { fontSize: 14, fontWeight: '800' },

  /* Receipt options */
  optionStack: { gap: 8, paddingBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 14, fontWeight: '600' },

  /* Camera */
  cameraRoot: { flex: 1, backgroundColor: '#000000' },
  cameraClose: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cameraHint: { paddingHorizontal: 24, paddingBottom: 16 },
  cameraHintText: {
    fontSize: 11,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  cameraStage: {
    flex: 1,
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: '84%',
    height: '84%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
  },
  corner: { position: 'absolute', width: 22, height: 22 },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  cameraSideBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  cameraPhotosBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cameraPhotosText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },

  /* OCR */
  fullScreen: { flex: 1 },
  ocrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  ocrEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ocrTitle: { fontSize: 18, fontWeight: '700' },
  ocrCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrBody: { paddingHorizontal: 16, paddingBottom: 24 },
  receiptCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  receiptStore: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  receiptMeta: { fontSize: 9, textAlign: 'center', marginBottom: 8 },
  receiptMetaLeft: { fontSize: 9, marginBottom: 8 },
  receiptDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128,128,128,0.3)',
    marginVertical: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptItem: { fontSize: 9 },
  receiptTotal: { fontSize: 10, fontWeight: '700' },
  fieldCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  fieldLabel: { fontSize: 11 },
  fieldValue: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 190,
    textAlign: 'right',
  },
  ocrFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ocrBtn: {
    flex: 1,
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrBtnText: { fontSize: 13, fontWeight: '700' },

  /* OCR correction */
  correctionField: { marginBottom: 12 },
  correctionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  correctionInputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  correctionInput: { fontSize: 14, paddingVertical: 8 },

  /* Recurring setup */
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  cycleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  cyclePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
  },
  cyclePillText: { fontSize: 12, fontWeight: '600' },
  rowCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  rowCardLabel: { fontSize: 13, fontWeight: '600' },
  rowCardSub: { fontSize: 10, marginTop: 2 },
  rowCardValue: { fontSize: 14, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
});
