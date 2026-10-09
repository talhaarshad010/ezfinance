import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../context/ThemeContext';
import { useNetwork } from '../../../context/NetworkContext';
import { TxSheetPreset, TxType, useUserMode } from '../../../context/UserModeContext';
import { CalendarPicker } from '../../../components';
import { accountLabel } from '../screens/bankAccounts/useBankAccounts';
import { fullAmt } from '../../../utils/format';
import { MSG, isFuture, parseAmount, startOfToday, useFormErrors } from '../../../utils/validation';
import {
  ACCOUNTS,
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
  useSave,
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
  const { closeTxSheet, addTx, updateTx, bankAccounts } = useUserMode();
  const [type, setType] = useState<TxType>(preset.type ?? 'expense');
  const [cat, setCat] = useState(preset.category ?? '');
  const [amount, setAmount] = useState(preset.amount ? String(preset.amount) : '');
  const [note, setNote] = useState(preset.note ?? '');
  const [account, setAccount] = useState(preset.account ?? (preset.source === 'import' ? 'HBL Debit' : ''));
  const [date, setDate] = useState<Date>(preset.date ?? startOfToday());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { save, saving } = useSave();

  const form = useFormErrors<'amount' | 'category' | 'account' | 'date'>(() => ({
    amount: parseAmount(amount) ? undefined : MSG.amount,
    category: cat ? undefined : MSG.category,
    account: account ? undefined : MSG.account,
    date: isFuture(date) ? MSG.futureDate : undefined,
  }));

  // The user's own accounts (plus Cash) once they've added any; otherwise the starter list.
  const accountChoices = (() => {
    const own = bankAccounts.map(accountLabel);
    const base = own.length ? ['Cash', ...own] : ACCOUNTS;
    return account && !base.includes(account) ? [...base, account] : base;
  })();

  const dateChoice = sameDay(date, daysAgo(0)) ? 'Today' : sameDay(date, daysAgo(1)) ? 'Yesterday' : longDate(date);

  function submit() {
    if (saving) return;
    form.submit(() =>
      save(() => {
        const data = { type, category: cat, amount: parseAmount(amount)!, note: note.trim() || undefined, account, date };
        const label = `${data.note ?? data.category} · PKR ${fullAmt(data.amount)}`;
        closeTxSheet();
        if (preset.editId) {
          updateTx(preset.editId, data);
          return { entity: 'tx', entityId: preset.editId, action: 'update', label, payload: data };
        }
        return { entity: 'tx', entityId: addTx(data), action: 'create', label, payload: data };
      }, preset.editId ? 'Changes saved' : type === 'income' ? 'Income added' : 'Transaction added'),
    );
  }

  return (
    <>
      <View style={[st.segment, { backgroundColor: theme.BG }]}>
        {(['expense', 'income'] as TxType[]).map(t => (
          <TouchableOpacity
            key={t}
            activeOpacity={0.8}
            onPress={() => {
              setType(t);
              if (t === 'income' && !cat) setCat('Salary');
              else if (t === 'expense' && cat === 'Salary') setCat('');
            }}
            style={[st.segBtn, { backgroundColor: type === t ? theme.TEXT : 'transparent' }]}
          >
            <Text style={[st.segText, { color: type === t ? theme.BG : theme.MUTED }]}>
              {t === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Field error={form.errors.amount}>
        <AmountInput value={amount} onChange={setAmount} autoFocus={!preset.amount} />
      </Field>
      <Field label="Category" error={form.errors.category}>
        <Chips options={CATS} value={cat} onChange={setCat} colorOf={c => CAT_META[c]?.color} iconOf={c => CAT_META[c]?.icon} />
      </Field>
      <Field label="Account" error={form.errors.account}>
        <Chips options={accountChoices} value={account} onChange={setAccount} />
      </Field>
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
        label={saving ? 'Saving…' : preset.editId ? 'Save changes' : 'Save transaction'}
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
export function TransactionSheetHost() {
  const { txSheet, closeTxSheet } = useUserMode();
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
      <TransactionForm key={formKey} preset={p} />
    </Sheet>
  );
}

// ── First transaction chooser ────────────────────────────────────────────────

export function FirstActionSheetHost() {
  const { theme } = useTheme();
  const { firstActionOpen, setFirstActionOpen, openTxSheet } = useUserMode();
  const { online } = useNetwork();
  const [phase, setPhase] = useState<'pick' | 'scanning' | 'needsNet'>('pick');
  const [netFor, setNetFor] = useState<'scan' | 'import'>('scan');
  const close = () => setFirstActionOpen(false);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (firstActionOpen) setPhase('pick');
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [firstActionOpen]);

  // The chooser closes first, then the transaction sheet opens (one sheet at a time).
  const handOff = (preset: TxSheetPreset) => {
    close();
    setTimeout(() => openTxSheet(preset), 280);
  };

  function scan() {
    if (!online) {
      setNetFor('scan');
      setPhase('needsNet');
      return;
    }
    setPhase('scanning');
    scanTimer.current = setTimeout(
      () => handOff({ source: 'scan', type: 'expense', category: 'Groceries', amount: 3450, note: 'Imtiaz Supermarket' }),
      900,
    );
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
    { icon: 'camera', label: phase === 'scanning' ? 'Reading receipt…' : 'Scan a receipt', sub: 'Snap a photo, we read the total', go: scan, net: true },
    { icon: 'download', label: 'Import from bank', sub: 'Pull in transactions from bank SMS', go: importBank, net: true },
  ];

  return (
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
  );
}

// ── Budget + goal ────────────────────────────────────────────────────────────

export function BudgetSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { budget, setBudget } = useUserMode();
  const [v, setV] = useState(budget ? String(budget) : '');
  const { save, saving } = useSave();
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
          form.submit(() =>
            save(() => {
              const n = parseAmount(v)!;
              setBudget(n);
              onClose();
              return { entity: 'budget', entityId: 'monthly', action: budget ? 'update' : 'create', label: `Monthly budget · PKR ${fullAmt(n)}`, payload: n };
            }, 'Budget saved'),
          )
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
  const { addGoal } = useUserMode();
  const [name, setName] = useState(preset?.name ?? '');
  const [target, setTarget] = useState(preset ? String(preset.target) : '');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [deadlineLabel, setDeadlineLabel] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { save, saving } = useSave();

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
          form.submit(() =>
            save(() => {
              const g = { name: name.trim(), target: parseAmount(target)!, deadline: deadline! };
              onClose();
              return { entity: 'goal', entityId: addGoal(g), action: 'create', label: `Goal · ${g.name}`, payload: g };
            }, 'Goal created'),
          )
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
