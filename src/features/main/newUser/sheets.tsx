import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../context/ThemeContext';
import { useNetwork } from '../../../context/NetworkContext';
import { TxSheetPreset, TxType, useUserMode } from '../../../context/UserModeContext';
import { CalendarPicker } from '../../../components';
import { accountLabel, accountNameOf } from '../screens/bankAccounts/useBankAccounts';
import { navigateTo } from '../../../navigation/navigationRef';
import { fullAmt } from '../../../utils/format';
import { MSG, SAVE_ERROR, isFuture, parseAmount, startOfToday, useFormErrors } from '../../../utils/validation';
import { useToast } from '../../../context/ToastContext';
import { ApiError } from '../../../api/client';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { useLedgerActions } from '../../../hooks/useLedgerActions';
import { usePlanningActions } from '../../../hooks/usePlanningActions';
import ReceiptCameraScreen from '../screens/expenses/ReceiptCameraScreen';
import { scanReceipt } from '../../../api/receiptApi';
import {
  AmountInput,
  CAT_META,
  CATS,
  Chips,
  Field,
  PrimaryButton,
  Sheet,
  TEAL,
  TextField,
  TextLink,
} from './shared';

const daysAgo = (n: number) => {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
};
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const longDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Add / edit transaction ───────────────────────────────────────────────────

function TransactionForm({ preset }: { preset: TxSheetPreset }) {
  const { theme } = useTheme();
  const { closeTxSheet, bankAccounts } = useUserMode();
  const txActions = useTransactionActions();
  const { showToast } = useToast();
  const [type, setType] = useState<TxType>(preset.type ?? 'expense');
  const [cat, setCat] = useState(preset.category ?? '');
  const [amount, setAmount] = useState(preset.amount ? String(preset.amount) : '');
  const [note, setNote] = useState(preset.note ?? '');
  // The account is picked by its name; with a single linked account it's chosen for you.
  const [account, setAccount] = useState(
    preset.accountId
      ? accountNameOf(preset.accountId, bankAccounts)
      : bankAccounts.length === 1
      ? accountLabel(bankAccounts[0])
      : '',
  );
  const [date, setDate] = useState<Date>(preset.date ?? startOfToday());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Transfer: money moved between two of the user's linked accounts (not income or spending).
  const [isTransfer, setIsTransfer] = useState(false);
  const [toAccount, setToAccount] = useState('');
  const ledger = useLedgerActions();

  const form = useFormErrors<'amount' | 'category' | 'account' | 'toAccount' | 'date'>(() => ({
    amount: parseAmount(amount) ? undefined : MSG.amount,
    category: isTransfer || cat ? undefined : MSG.category,
    account: account ? undefined : MSG.account,
    toAccount: !isTransfer ? undefined : !toAccount ? MSG.account : toAccount === account ? MSG.sameAccount : undefined,
    date: isFuture(date) ? MSG.futureDate : undefined,
  }));

  // Only the user's linked accounts (plus a removed one an older transaction still points at).
  const accountChoices = (() => {
    const base = bankAccounts.map(accountLabel);
    return account && !base.includes(account) ? [...base, account] : base;
  })();
  const accountIdOf = (name: string): string | null => {
    const linked = bankAccounts.find(a => accountLabel(a) === name);
    return linked ? linked.id : preset.accountId ?? null;
  };

  const dateChoice = sameDay(date, daysAgo(0)) ? 'Today' : sameDay(date, daysAgo(1)) ? 'Yesterday' : longDate(date);

  async function submitTransfer() {
    const fromAccountId = accountIdOf(account);
    const toAccountId = accountIdOf(toAccount);
    if (!fromAccountId || !toAccountId) return;
    setSaving(true);
    try {
      await ledger.addTransfer({ fromAccountId, toAccountId, amount: parseAmount(amount)!, note: note.trim() || undefined, date });
      closeTxSheet();
      showToast(`Moved PKR ${fullAmt(parseAmount(amount)!)} from ${account} to ${toAccount}`, 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error');
    } finally {
      setSaving(false);
    }
  }

  function submit() {
    if (saving) return;
    form.submit(async () => {
      if (isTransfer) {
        await submitTransfer();
        return;
      }
      const accountId = accountIdOf(account);
      if (!accountId) return;
      const data = {
        type,
        category: cat,
        amount: parseAmount(amount)!,
        note: note.trim() || undefined,
        accountId,
        date,
      };
      setSaving(true);
      try {
        // The list updates at once; the sheet closes when the server has it (or it's queued offline).
        const result = preset.editId
          ? await txActions.update(preset.editId, data)
          : (await txActions.create({ ...data, source: preset.source ?? 'manual' })).result;
        closeTxSheet();
        const text = preset.editId ? 'Changes saved' : type === 'income' ? 'Income added' : 'Transaction added';
        showToast(
          result === 'queued' ? `${text}. It'll sync when you're back online.` : text,
          result === 'queued' ? 'info' : 'success',
        );
      } catch (error) {
        showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error');
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <>
      <View style={[st.segment, { backgroundColor: theme.BG }]}>
        {/* Transfers can't be made by editing a transaction. */}
        {((preset.editId ? ['expense', 'income'] : ['expense', 'income', 'transfer']) as (TxType | 'transfer')[]).map(t => {
          const on = t === 'transfer' ? isTransfer : !isTransfer && type === t;
          return (
            <TouchableOpacity
              key={t}
              activeOpacity={0.8}
              onPress={() => {
                if (t === 'transfer') {
                  setIsTransfer(true);
                  return;
                }
                setIsTransfer(false);
                setType(t);
                if (t === 'income' && !cat) setCat('Salary');
                else if (t === 'expense' && cat === 'Salary') setCat('');
              }}
              style={[st.segBtn, { backgroundColor: on ? theme.TEXT : 'transparent' }]}
            >
              <Text style={[st.segText, { color: on ? theme.BG : theme.MUTED }]}>
                {t === 'expense' ? 'Expense' : t === 'income' ? 'Income' : 'Transfer'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Field error={form.errors.amount}>
        <AmountInput value={amount} onChange={setAmount} autoFocus={!preset.amount} />
      </Field>
      {!isTransfer && (
        <Field label="Category" error={form.errors.category}>
          <Chips options={CATS} value={cat} onChange={setCat} colorOf={c => CAT_META[c]?.color} iconOf={c => CAT_META[c]?.icon} />
        </Field>
      )}
      <Field label={isTransfer ? 'From account' : 'Account'} error={form.errors.account}>
        <Chips options={accountChoices} value={account} onChange={setAccount} />
      </Field>
      {isTransfer &&
        (accountChoices.length < 2 ? (
          <Text style={[st.transferHint, { color: theme.MUTED }]}>
            Link a second bank account to move money between your accounts.
          </Text>
        ) : (
          <Field label="To account" error={form.errors.toAccount}>
            <Chips options={accountChoices.filter(a => a !== account)} value={toAccount} onChange={setToAccount} />
          </Field>
        ))}
      <Field label="Date" error={form.errors.date}>
        <Chips
          options={['Today', 'Yesterday', dateChoice === 'Today' || dateChoice === 'Yesterday' ? 'Pick a date' : dateChoice]}
          value={dateChoice}
          onChange={o => {
            if (o === 'Today') setDate(daysAgo(0));
            else if (o === 'Yesterday') setDate(daysAgo(1));
            else setCalendarOpen(true);
          }}
        />
      </Field>
      <Field label="Note (optional)" mb={20}>
        <TextField value={note} onChangeText={setNote} placeholder="e.g. Imtiaz Supermarket" maxLength={60} />
      </Field>
      <PrimaryButton
        label={saving ? 'Saving…' : preset.editId ? 'Save changes' : isTransfer ? 'Move money' : 'Save transaction'}
        dim={!form.valid}
        disabled={saving}
        onPress={submit}
      />
      <CalendarPicker
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        initialDate={date}
        maxDate={new Date()}
        onSelectDate={d => {
          setDate(d);
          setCalendarOpen(false);
        }}
      />
    </>
  );
}

/** Global add / edit transaction sheet (opened from empty states, the first-action sheet, edit). */
/** Every transaction belongs to a linked bank account, so logging one starts by linking an account. */
function LinkAccountFirst() {
  const { theme } = useTheme();
  const { closeTxSheet } = useUserMode();
  return (
    <View style={st.linkFirst}>
      <View style={[st.linkFirstIcon, { backgroundColor: `${TEAL}1c` }]}>
        <Feather name="credit-card" size={22} color={TEAL} />
      </View>
      <Text style={[st.linkFirstTitle, { color: theme.TEXT }]}>Link a bank account first</Text>
      <Text style={[st.linkFirstLine, { color: theme.MUTED }]}>
        Every transaction is saved to the account it moved through, so its balance and your net worth stay right.
      </Text>
      <View style={st.linkFirstBtn}>
        <PrimaryButton
          label="Link a bank account"
          onPress={() => {
            closeTxSheet();
            setTimeout(() => navigateTo('AddAccount'), 280);
          }}
        />
      </View>
    </View>
  );
}

export function TransactionSheetHost() {
  const { txSheet, closeTxSheet, bankAccounts } = useUserMode();
  const p = txSheet.preset ?? {};
  // Fresh form state every time the sheet opens.
  const [formKey, setFormKey] = useState(0);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (txSheet.open && !wasOpen.current) setFormKey(k => k + 1);
    wasOpen.current = txSheet.open;
  }, [txSheet.open]);

  const sub = p.editId
    ? 'Changes save on this device first'
    : p.source === 'scan'
    ? 'Read from your receipt — check and save'
    : p.source === 'scanFailed'
    ? "We couldn't read everything — fill in the rest"
    : p.source === 'import'
    ? 'Found in your bank SMS — check and save'
    : 'Logged by hand';

  return (
    <Sheet visible={txSheet.open} onClose={closeTxSheet} title={p.editId ? 'Edit transaction' : 'New transaction'} sub={sub}>
      {bankAccounts.length === 0 && !p.editId ? <LinkAccountFirst /> : <TransactionForm key={formKey} preset={p} />}
    </Sheet>
  );
}

// ── First transaction chooser ────────────────────────────────────────────────

export function FirstActionSheetHost() {
  const { theme } = useTheme();
  const { firstActionOpen, setFirstActionOpen, openTxSheet } = useUserMode();
  const { online } = useNetwork();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<'pick' | 'scanning' | 'needsNet'>('pick');
  const [netFor, setNetFor] = useState<'scan' | 'import'>('scan');
  const [captureOpen, setCaptureOpen] = useState(false);
  const close = () => {
    setCaptureOpen(false);
    setFirstActionOpen(false);
  };

  useEffect(() => {
    if (firstActionOpen) setPhase('pick');
  }, [firstActionOpen]);

  // The chooser closes first, then the transaction sheet opens (one sheet at a time).
  const handOff = (preset: TxSheetPreset) => {
    close();
    setTimeout(() => openTxSheet(preset), 280);
  };

  function startScan() {
    if (!online) {
      setNetFor('scan');
      setPhase('needsNet');
      return;
    }
    setCaptureOpen(true);
  }

  async function handleImageCaptured(imageUri: string) {
    setCaptureOpen(false);
    setPhase('scanning');
    try {
      const result = await scanReceipt(imageUri);
      if (result.total != null && result.total > 0) {
        handOff({
          source: 'scan',
          type: 'expense',
          category: result.category ?? 'Groceries',
          amount: result.total,
          note: result.merchant ?? undefined,
          date: result.date ? new Date(result.date) : new Date(),
        });
      } else {
        handOff({
          source: 'scanFailed',
          type: 'expense',
          category: result.category ?? 'Other',
          amount: undefined,
          note: result.merchant ?? undefined,
        });
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Could not read receipt. Try entering manually.', 'error', 'Scan Failed');
      setPhase('pick');
    }
  }

  function importBank() {
    if (!online) {
      setNetFor('import');
      setPhase('needsNet');
      return;
    }
    handOff({ source: 'import', type: 'expense', category: 'Fuel', amount: 5200, note: 'PSO · HBL Debit' });
  }

  if (phase === 'needsNet') {
    return (
      <Sheet
        visible={firstActionOpen}
        onClose={close}
        title={netFor === 'scan' ? 'Receipt scanning needs internet' : 'Importing needs internet'}
        sub="You can add the transaction manually instead."
      >
        <PrimaryButton label="Enter manually" onPress={() => handOff({ source: 'manual' })} />
        <TextLink label="Not now" onPress={() => setPhase('pick')} />
      </Sheet>
    );
  }

  const opts = [
    { icon: 'edit-3', label: 'Add manually', sub: 'Type in an amount and category', go: () => handOff({ source: 'manual' }), net: false },
    { icon: 'camera', label: phase === 'scanning' ? 'Reading receipt…' : 'Scan a receipt', sub: 'Snap a photo, we read the total', go: startScan, net: true },
    { icon: 'download', label: 'Import from bank', sub: 'Pull in transactions from bank statement', go: importBank, net: true },
  ];

  return (
    <>
      <Sheet
        visible={firstActionOpen}
        onClose={close}
        title="Log your first transaction"
        sub="It takes 10 seconds and unlocks your dashboard"
      >
        <View style={st.optList}>
          {opts.map(o => {
            const offlineBlocked = o.net && !online;
            return (
              <TouchableOpacity
                key={o.label}
                activeOpacity={0.8}
                onPress={o.go}
                disabled={phase === 'scanning'}
                style={[st.opt, { backgroundColor: theme.BG, opacity: offlineBlocked ? 0.5 : 1 }]}
              >
                <View style={[st.optIcon, { backgroundColor: `${TEAL}1c` }]}>
                  <Feather name={o.icon} size={18} color={TEAL} />
                </View>
                <View style={st.flex}>
                  <Text style={[st.optTitle, { color: theme.TEXT }]}>{o.label}</Text>
                  <View style={st.optSubRow}>
                    {offlineBlocked && <Feather name="wifi-off" size={11} color={theme.MUTED} />}
                    <Text style={[st.optSub, { color: theme.MUTED }]}>{offlineBlocked ? 'Needs internet' : o.sub}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextLink label="Do this later" onPress={close} />
      </Sheet>

      <ReceiptCameraScreen
        visible={captureOpen}
        onCapture={handleImageCaptured}
        onClose={() => setCaptureOpen(false)}
      />
    </>
  );
}

// ── Budget + goal ────────────────────────────────────────────────────────────

export function BudgetSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { budget } = useUserMode();
  const planning = usePlanningActions();
  const { showToast } = useToast();
  const [v, setV] = useState(budget ? String(budget) : '');
  const [saving, setSaving] = useState(false);
  const form = useFormErrors<'amount'>(() => ({ amount: parseAmount(v) ? undefined : MSG.amount }));
  return (
    <Sheet visible={visible} onClose={onClose} title="Set a monthly budget" sub="How much do you want to spend this month?">
      <Field error={form.errors.amount} mb={20}>
        <AmountInput value={v} onChange={setV} autoFocus />
      </Field>
      <PrimaryButton
        label={saving ? 'Saving…' : 'Save budget'}
        dim={!form.valid}
        disabled={saving}
        onPress={() =>
          !saving &&
          form.submit(async () => {
            setSaving(true);
            try {
              await planning.setMonthlyBudget(parseAmount(v)!);
              onClose();
              showToast('Budget saved', 'success');
            } catch (error) {
              showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error');
            } finally {
              setSaving(false);
            }
          })
        }
      />
    </Sheet>
  );
}

const inMonths = (m: number) => {
  const d = startOfToday();
  d.setMonth(d.getMonth() + m);
  return d;
};

export function GoalSheet({
  visible,
  preset,
  onClose,
}: {
  visible: boolean;
  preset?: { name: string; target: number };
  onClose: () => void;
}) {
  const [name, setName] = useState(preset?.name ?? '');
  const [target, setTarget] = useState(preset ? String(preset.target) : '');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [deadlineLabel, setDeadlineLabel] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const planning = usePlanningActions();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // A new preset (e.g. tapping "Umrah") refills the form.
  useEffect(() => {
    if (!visible) return;
    setName(preset?.name ?? '');
    setTarget(preset ? String(preset.target) : '');
    setDeadline(null);
    setDeadlineLabel('');
  }, [visible, preset]);

  const form = useFormErrors<'name' | 'target' | 'deadline'>(() => ({
    name: name.trim() ? undefined : MSG.name,
    target: parseAmount(target) ? undefined : MSG.amount,
    deadline: isFuture(deadline) ? undefined : MSG.pastDeadline,
  }));
  const choices = ['6 months', '1 year', '2 years', deadlineLabel && !['6 months', '1 year', '2 years'].includes(deadlineLabel) ? deadlineLabel : 'Pick a date'];

  return (
    <Sheet visible={visible} onClose={onClose} title="New savings goal" sub="You can change the amount any time">
      <Field label="Goal name" error={form.errors.name}>
        <TextField value={name} onChangeText={setName} placeholder="e.g. New laptop" maxLength={40} />
      </Field>
      <Field label="Target amount" error={form.errors.target}>
        <AmountInput value={target} onChange={setTarget} />
      </Field>
      <Field label="Target date" error={form.errors.deadline} mb={20}>
        <Chips
          options={choices}
          value={deadlineLabel}
          onChange={o => {
            if (o === '6 months') setDeadline(inMonths(6));
            else if (o === '1 year') setDeadline(inMonths(12));
            else if (o === '2 years') setDeadline(inMonths(24));
            else {
              setCalendarOpen(true);
              return;
            }
            setDeadlineLabel(o);
          }}
        />
      </Field>
      <PrimaryButton
        label={saving ? 'Saving…' : 'Create goal'}
        dim={!form.valid}
        disabled={saving}
        onPress={() =>
          !saving &&
          form.submit(async () => {
            setSaving(true);
            try {
              await planning.createGoal({ name: name.trim(), target: parseAmount(target)!, deadline: deadline! });
              onClose();
              showToast('Goal created', 'success');
            } catch (error) {
              showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error');
            } finally {
              setSaving(false);
            }
          })
        }
      />
      <CalendarPicker
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        initialDate={deadline ?? inMonths(12)}
        onSelectDate={d => {
          setDeadline(d);
          setDeadlineLabel(longDate(d));
          setCalendarOpen(false);
        }}
      />
    </Sheet>
  );
}

const st = StyleSheet.create({
  linkFirst: { alignItems: 'center', paddingTop: 6 },
  transferHint: { fontSize: 12, lineHeight: 17, marginBottom: 16 },
  linkFirstBtn: { alignSelf: 'stretch' },
  linkFirstIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  linkFirstTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  linkFirstLine: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 20, paddingHorizontal: 8 },
  flex: { flex: 1 },
  segment: { flexDirection: 'row', borderRadius: 100, padding: 3, gap: 3, marginBottom: 14 },
  segBtn: { flex: 1, height: 36, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 12, fontWeight: '700' },
  optList: { gap: 8, marginBottom: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18 },
  optIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 14, fontWeight: '700' },
  optSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  optSub: { fontSize: 11 },
});
