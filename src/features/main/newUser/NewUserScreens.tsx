import { usePlanningActions } from '../../../hooks/usePlanningActions';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { PendingBadge, useNetwork } from '../../../context/NetworkContext';
import { UNLOCK_AT, UserGoal, useUserMode, useUserUi } from '../../../context/UserModeContext';
import { ConfirmDialog } from '../../../components/Feedback';
import { abbr, fullAmt } from '../../../utils/format';
import { MSG, SAVE_ERROR, parseAmount, useFormErrors } from '../../../utils/validation';
import { TxList } from './TxList';
import { BudgetSheet, GoalSheet } from './sheets';
import {
  AmountInput,
  CAT_META,
  EmptyState,
  Field,
  LockedInsight,
  PrimaryButton,
  RoundAdd,
  Sample,
  ScreenShell,
  Sheet,
  TEAL,
  useSave,
} from './shared';

const fmt = (n: number) => n.toLocaleString('en-IN');

// ── Home ─────────────────────────────────────────────────────────────────────

export function NewDashboard() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { txs, goals, holdings, budget } = useUserMode();
  const { setFirstActionOpen } = useUserUi();
  const unlocked = txs.length >= UNLOCK_AT;
  const spent = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const income = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const saved = goals.reduce((a, g) => a + g.saved, 0);
  const invested = holdings.reduce((a, h) => a + h.amount, 0);
  const net = income - spent;
  const boxBg = theme.isDark ? theme.CARD : '#FAFAF8';
  const track = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <ScreenShell
      eyebrow="Welcome to ezFinance"
      title="Let's get started"
      right={
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Settings"
          style={[d.iconBtn, { backgroundColor: theme.CARD }]}
        >
          <Feather name="settings" size={16} color={theme.TEXT} />
        </TouchableOpacity>
      }
    >
      <GettingStartedCard />

      {/* Metric grid — locked until there's enough data, never fake zeros */}
      <View style={d.row}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Expenses')} style={[d.box, { backgroundColor: boxBg }]}>
          {unlocked ? (
            <>
              <Text style={[d.boxEyebrow, { color: theme.MUTED }]}>MONTHLY SPENDING</Text>
              <Text style={[d.big, { color: theme.TEXT }]} numberOfLines={1}>
                {abbr(spent)}
              </Text>
              <Text style={[d.small, { color: theme.MUTED }]}>{budget ? `of PKR ${abbr(budget)}` : 'No budget set'}</Text>
              {budget ? (
                <View style={[d.bar, { backgroundColor: track }]}>
                  <View
                    style={[
                      d.barFill,
                      { width: `${Math.min(100, (spent / budget) * 100)}%`, backgroundColor: spent > budget ? theme.RED : TEAL },
                    ]}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <LockedInsight label="Monthly Spending" count={txs.length} />
          )}
        </TouchableOpacity>
        <View style={[d.box, { backgroundColor: boxBg }]}>
          {unlocked ? (
            <>
              <Text style={[d.boxEyebrow, { color: theme.MUTED }]}>NET THIS MONTH</Text>
              <Text style={[d.big, { color: net >= 0 ? theme.GREEN : theme.RED }]} numberOfLines={1}>
                {net >= 0 ? '+' : '−'}
                {abbr(Math.abs(net))}
              </Text>
              <Text style={[d.small, { color: theme.MUTED }]}>Income {abbr(income)}</Text>
            </>
          ) : (
            <LockedInsight label="Cash on Hand" count={txs.length} />
          )}
        </View>
      </View>
      <View style={[d.row, d.mb18]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Goals')} style={[d.box, d.boxShort, { backgroundColor: boxBg }]}>
          <Text style={[d.boxEyebrow, { color: theme.MUTED }]}>GOALS</Text>
          {goals.length ? (
            <>
              <Text style={[d.big, { color: theme.TEXT }]}>{goals.length}</Text>
              <Text style={[d.small, { color: theme.MUTED }]}>PKR {abbr(saved)} saved</Text>
            </>
          ) : (
            <Text style={[d.boxCta, { color: theme.TEXT }]}>
              No goals yet.{'\n'}
              <Text style={{ color: TEAL }}>Create one →</Text>
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Investments')} style={[d.box, d.boxShort, { backgroundColor: boxBg }]}>
          <Text style={[d.boxEyebrow, { color: theme.MUTED }]}>INVESTMENTS</Text>
          {holdings.length ? (
            <>
              <Text style={[d.big, { color: theme.TEXT }]} numberOfLines={1}>
                {abbr(invested)}
              </Text>
              <Text style={[d.small, { color: theme.MUTED }]}>
                {holdings.length} holding{holdings.length === 1 ? '' : 's'}
              </Text>
            </>
          ) : (
            <Text style={[d.boxCta, { color: theme.TEXT }]}>
              Nothing tracked yet.{'\n'}
              <Text style={{ color: TEAL }}>Add a holding →</Text>
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recent activity */}
      <View style={d.sectionHead}>
        <Text style={[d.sectionTitle, { color: theme.TEXT }]}>Recent activity</Text>
        {txs.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={[d.seeAll, { color: TEAL }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      {txs.length ? (
        <TxList limit={4} />
      ) : (
        <View style={[d.dashed, { borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }]}>
          <Text style={[d.dashedText, { color: theme.MUTED }]}>Your transactions will show up here.</Text>
          <TouchableOpacity onPress={() => setFirstActionOpen(true)}>
            <Text style={[d.dashedCta, { color: TEAL }]}>+ Log your first one</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScreenShell>
  );
}

/** First-run checklist (log a transaction, set a goal, set a budget); hides when done or dismissed. */
export function GettingStartedCard({ style }: { style?: object }) {
  const { theme } = useTheme();
  const { txs, goals, budget } = useUserMode();
  const { setFirstActionOpen, checklistHidden, setChecklistHidden } = useUserUi();
  const [sheet, setSheet] = useState<null | 'budget' | 'goal'>(null);
  const steps = [
    { label: 'Log a transaction', done: txs.length > 0, go: () => setFirstActionOpen(true) },
    { label: 'Set a goal', done: goals.length > 0, go: () => setSheet('goal') },
    { label: 'Set a budget', done: budget !== null, go: () => setSheet('budget') },
  ];
  const doneCount = steps.filter(x => x.done).length;
  return (
    <View style={style}>
      {/* Getting started */}
      {!checklistHidden && doneCount < steps.length && (
        <View style={[d.checklist, style ? d.checklistFlush : null, { backgroundColor: theme.HERO_BG }]}>
          <View style={d.checkHead}>
            <Text style={d.checkTitle}>Getting started</Text>
            <View style={d.checkHeadRight}>
              <Text style={d.checkCount}>
                {doneCount}/{steps.length}
              </Text>
              <TouchableOpacity accessibilityLabel="Hide checklist" hitSlop={10} onPress={() => setChecklistHidden(true)}>
                <Feather name="x" size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={d.checkSub}>Three quick steps to set up your money</Text>
          <View style={d.checkTrack}>
            <View style={[d.checkFill, { width: `${(doneCount / steps.length) * 100}%` }]} />
          </View>
          {steps.map((x, i) => (
            <TouchableOpacity
              key={x.label}
              activeOpacity={x.done ? 1 : 0.7}
              onPress={() => !x.done && x.go()}
              style={[d.step, i > 0 && d.stepDivider]}
            >
              <View style={[d.stepDot, x.done ? d.stepDotDone : d.stepDotTodo]}>
                {x.done && <Feather name="check" size={12} color="#FFFFFF" />}
              </View>
              <Text style={[d.stepLabel, x.done && d.stepLabelDone]}>{x.label}</Text>
              {!x.done && <Text style={d.stepGo}>Start →</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <BudgetSheet visible={sheet === 'budget'} onClose={() => setSheet(null)} />
      <GoalSheet visible={sheet === 'goal'} onClose={() => setSheet(null)} />
    </View>
  );
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export function NewExpenses() {
  const { theme } = useTheme();
  const { txs } = useUserMode();
  const { openTxSheet, setFirstActionOpen } = useUserUi();
  const samples: Sample[] = [
    { label: 'Add Groceries', icon: CAT_META.Groceries.icon, color: CAT_META.Groceries.color, onPress: () => openTxSheet({ type: 'expense', category: 'Groceries', source: 'manual' }) },
    { label: 'Add Fuel', icon: CAT_META.Fuel.icon, color: CAT_META.Fuel.color, onPress: () => openTxSheet({ type: 'expense', category: 'Fuel', source: 'manual' }) },
    { label: 'Add Salary', icon: CAT_META.Salary.icon, color: CAT_META.Salary.color, onPress: () => openTxSheet({ type: 'income', category: 'Salary', source: 'manual' }) },
  ];
  return (
    <ScreenShell
      eyebrow="Your ledger"
      title="Expenses"
      right={txs.length > 0 ? <RoundAdd onPress={() => setFirstActionOpen(true)} /> : undefined}
    >
      {txs.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No transactions yet"
          line="Every rupee you log here builds your budget, tax picture and AI advice."
          samples={samples}
          primary={{ label: 'Log a transaction', onPress: () => setFirstActionOpen(true) }}
        />
      ) : (
        <>
          <TxList />
          {txs.length < UNLOCK_AT && (
            <View style={[d.note, { backgroundColor: theme.CARD }]}>
              <Text style={[d.noteText, { color: theme.TEXT }]}>
                Add {UNLOCK_AT - txs.length} more to unlock spending insights
              </Text>
            </View>
          )}
        </>
      )}
    </ScreenShell>
  );
}

// ── Goals ────────────────────────────────────────────────────────────────────

const monthsUntil = (date: Date) => Math.max(1, Math.ceil((date.getTime() - Date.now()) / 2.63e9));

export function NewGoals() {
  const { theme } = useTheme();
  const { goals } = useUserMode();
  const planning = usePlanningActions();
  const { showToast } = useToast();
  const [toDelete, setToDelete] = useState<UserGoal | null>(null);
  const [lastDelete, setLastDelete] = useState<UserGoal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preset, setPreset] = useState<{ name: string; target: number } | undefined>(undefined);
  const openGoal = (p?: { name: string; target: number }) => {
    setPreset(p);
    setSheetOpen(true);
  };
  const samples: Sample[] = [
    { label: 'Emergency fund', icon: 'shield', color: TEAL, onPress: () => openGoal({ name: 'Emergency fund', target: 300000 }) },
    { label: 'Umrah', icon: 'send', color: '#0055FF', onPress: () => openGoal({ name: 'Umrah', target: 450000 }) },
    { label: 'Wedding', icon: 'heart', color: '#FF2D55', onPress: () => openGoal({ name: 'Wedding', target: 1500000 }) },
  ];
  const track = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const pending = toDelete ?? lastDelete;

  return (
    <ScreenShell eyebrow="Save with purpose" title="Goals" right={goals.length > 0 ? <RoundAdd onPress={() => openGoal()} /> : undefined}>
      {goals.length === 0 ? (
        <EmptyState
          icon="target"
          title="What are you saving for?"
          line="Pick a target and we'll show how much to put aside each month."
          samples={samples}
          primary={{ label: 'Create a goal', onPress: () => openGoal() }}
        />
      ) : (
        <View style={d.goalList}>
          {goals.map(g => {
            const months = g.deadline ? monthsUntil(g.deadline) : 12;
            return (
              <View key={g.id} style={[d.goal, { backgroundColor: theme.CARD }]}>
                <View style={d.goalHead}>
                  <Text style={[d.goalName, { color: theme.TEXT }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <TouchableOpacity
                    accessibilityLabel={`Delete ${g.name}`}
                    hitSlop={8}
                    onPress={() => {
                      setToDelete(g);
                      setLastDelete(g);
                    }}
                  >
                    <Feather name="trash-2" size={14} color={theme.MUTED} />
                  </TouchableOpacity>
                </View>
                <Text style={[d.goalSub, { color: theme.MUTED }]} numberOfLines={2}>
                  Target PKR {abbr(g.target)} · PKR {abbr(Math.ceil(g.target / months))}/mo{' '}
                  {g.deadline
                    ? `until ${g.deadline.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
                    : 'over a year'}
                </Text>
                <View style={d.goalBadge}>
                  <PendingBadge entity="goal" id={g.id} />
                </View>
                <View style={[d.goalTrack, { backgroundColor: track }]} />
                <Text style={[d.goalHint, { color: theme.MUTED }]}>Not started — log your first contribution</Text>
              </View>
            );
          })}
        </View>
      )}
      <GoalSheet visible={sheetOpen} preset={preset} onClose={() => setSheetOpen(false)} />
      <ConfirmDialog
        visible={!!toDelete}
        title={`Delete "${pending?.name ?? ''}"?`}
        line="This goal and its progress will be removed. This can't be undone."
        confirmLabel="Delete goal"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          const goal = toDelete;
          setToDelete(null);
          planning
            .archiveGoal(goal.id)
            .then(() => showToast('Goal deleted', 'success'))
            .catch(() => showToast(SAVE_ERROR, 'error'));
        }}
      />
    </ScreenShell>
  );
}

// ── Investments ──────────────────────────────────────────────────────────────

export function NewInvestments() {
  const { theme } = useTheme();
  const { holdings, addHolding } = useUserMode();
  const [kind, setKind] = useState<string | null>(null);
  const [lastKind, setLastKind] = useState('Mutual fund');
  const [amount, setAmount] = useState('');
  const { save, saving } = useSave();
  const form = useFormErrors<'amount'>(() => ({ amount: parseAmount(amount) ? undefined : MSG.amount }));
  const pick = (k: string) => {
    setAmount('');
    form.reset();
    setKind(k);
    setLastKind(k);
  };
  const samples: Sample[] = [
    { label: 'Add Mutual fund', icon: 'trending-up', color: TEAL, onPress: () => pick('Mutual fund') },
    { label: 'Add Savings certificate', icon: 'award', color: '#0055FF', onPress: () => pick('Savings certificate') },
    { label: 'Add Gold', icon: 'star', color: '#FF9500', onPress: () => pick('Gold') },
  ];

  return (
    <ScreenShell eyebrow="Grow your money" title="Wealth" right={holdings.length > 0 ? <RoundAdd onPress={() => pick('Mutual fund')} /> : undefined}>
      {holdings.length === 0 ? (
        <EmptyState
          icon="trending-up"
          title="Nothing invested yet"
          line="Track funds, NSS certificates and gold together. Portfolio charts appear once you add a holding."
          samples={samples}
          primary={{ label: 'Add an investment', onPress: () => pick('Mutual fund') }}
        />
      ) : (
        <View style={[d.holdings, { backgroundColor: theme.CARD }]}>
          {holdings.map((h, i) => (
            <View key={h.id} style={[d.holding, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.BORDER }]}>
              <View style={d.holdingLeft}>
                <Text style={[d.holdingName, { color: theme.TEXT }]} numberOfLines={1}>
                  {h.kind}
                </Text>
                <PendingBadge entity="holding" id={h.id} />
              </View>
              <Text style={[d.holdingAmt, { color: theme.TEXT }]}>PKR {abbr(h.amount)}</Text>
            </View>
          ))}
          <Text style={[d.holdingNote, { color: theme.MUTED }]}>Returns appear after your first month of tracking.</Text>
        </View>
      )}
      <Sheet
        visible={!!kind}
        onClose={() => setKind(null)}
        title={`Add ${lastKind.toLowerCase()}`}
        sub="How much have you put in so far?"
      >
        <Field error={form.errors.amount} mb={20}>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save'}
          dim={!form.valid}
          disabled={saving}
          onPress={() =>
            form.submit(() =>
              save(() => {
                const h = { kind: lastKind, amount: parseAmount(amount)! };
                const id = addHolding(h);
                setKind(null);
                return { entity: 'holding', entityId: id, action: 'create', label: `${h.kind} · PKR ${fullAmt(h.amount)}`, payload: h };
              }, 'Holding added'),
            )
          }
        />
      </Sheet>
    </ScreenShell>
  );
}

// ── AI chat ──────────────────────────────────────────────────────────────────

const STARTERS: { q: string; a: string }[] = [
  {
    q: 'How much tax will I pay on my salary?',
    a: 'Tell me your monthly salary and whether you are a filer, and I will work it out using the Finance Act slabs. Once you log your salary as income, I can do this automatically.',
  },
  {
    q: 'How do I start an emergency fund?',
    a: 'A good target is 3–6 months of expenses. Log a few weeks of spending and I will calculate your exact number — or create an "Emergency fund" goal in Goals to begin now.',
  },
  {
    q: 'How is Zakat calculated?',
    a: 'Zakat is 2.5% of eligible wealth held for a lunar year above the nisab threshold. Add your cash, gold and savings and I will compute it for you.',
  },
];

export const AI_OFFLINE = 'Your assistant needs internet. You can still browse everything else.';

export function AIOfflineNote() {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="alert" style={[d.aiOffline, { backgroundColor: theme.MODAL }]}>
      <Feather name="wifi-off" size={14} color={theme.MUTED} />
      <Text style={[d.aiOfflineText, { color: theme.MUTED }]}>{AI_OFFLINE}</Text>
    </View>
  );
}

export function NewAI() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { online } = useNetwork();
  const [msgs, setMsgs] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [msgs, typing]);

  function ask(q: string) {
    if (!q.trim() || !online) return;
    setMsgs(m => [...m, { role: 'user', text: q.trim() }]);
    setInput('');
    setTyping(true);
    const a =
      STARTERS.find(x => x.q === q)?.a ??
      "Good question. I don't have any of your data yet — log a few transactions and I can give you an answer based on your real numbers.";
    replyTimer.current = setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { role: 'ai', text: a }]);
    }, 900);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[d.flex, { backgroundColor: theme.BG }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.BG} />
      <ScrollView ref={scrollRef} style={d.flex} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={d.aiHeader}>
          <Text style={[d.aiEyebrow, { color: theme.MUTED }]}>Your accountant</Text>
          <Text style={[d.aiTitle, { color: theme.TEXT }]}>AI CA</Text>
        </View>
        {msgs.length === 0 ? (
          <EmptyState
            icon="cpu"
            title="Ask me anything about money"
            line="Tax, Zakat, savings or budgeting — I answer in plain words. Answers get personal as you add data."
            samples={STARTERS.map(x => ({ label: x.q, icon: 'zap', color: theme.ACTIVE, onPress: () => ask(x.q), disabled: !online }))}
            primary={online ? { label: 'Ask a question', onPress: () => inputRef.current?.focus() } : undefined}
          />
        ) : (
          <View style={d.msgs}>
            {msgs.map((m, i) => (
              <View
                key={i}
                style={[
                  d.msg,
                  m.role === 'user'
                    ? { alignSelf: 'flex-end', backgroundColor: theme.TEXT }
                    : { alignSelf: 'flex-start', backgroundColor: theme.CARD },
                ]}
              >
                <Text style={[d.msgText, { color: m.role === 'user' ? theme.BG : theme.TEXT }]}>{m.text}</Text>
              </View>
            ))}
            {typing && (
              <View style={[d.msg, { alignSelf: 'flex-start', backgroundColor: theme.CARD }]}>
                <Text style={[d.msgText, { color: theme.MUTED }]}>Thinking…</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      {!online && <AIOfflineNote />}
      <View style={[d.composer, { paddingBottom: insets.bottom + 92, opacity: online ? 1 : 0.45 }]}>
        <TextInput
          ref={inputRef}
          editable={online}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => ask(input)}
          returnKeyType="send"
          placeholder="Ask your CA…"
          placeholderTextColor={theme.MUTED}
          style={[d.composerInput, { backgroundColor: theme.CARD, color: theme.TEXT }]}
        />
        <TouchableOpacity
          onPress={() => ask(input)}
          disabled={!online}
          accessibilityLabel="Send"
          style={[d.send, { backgroundColor: input.trim() ? theme.ACTIVE : theme.MODAL }]}
        >
          <Feather name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const d = StyleSheet.create({
  flex: { flex: 1 },
  iconBtn: { width: 42, height: 42, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  checklist: { marginHorizontal: 16, marginBottom: 12, borderRadius: 24, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 10 },
  // Inside a screen that already pads its content.
  checklistFlush: { marginHorizontal: 0 },
  checkHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  checkHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  checkCount: { fontSize: 12, fontWeight: '700', color: TEAL },
  checkSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 12 },
  checkTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  checkFill: { height: '100%', backgroundColor: TEAL, borderRadius: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stepDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.12)' },
  stepDot: { width: 22, height: 22, borderRadius: 100, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: TEAL, borderColor: TEAL },
  stepDotTodo: { borderColor: 'rgba(255,255,255,0.3)' },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  stepLabelDone: { color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  stepGo: { fontSize: 11, fontWeight: '700', color: TEAL },
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  mb18: { marginBottom: 18 },
  box: { flex: 1, borderRadius: 24, padding: 15, minHeight: 158 },
  boxShort: { minHeight: 130 },
  boxEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9, marginBottom: 10 },
  big: { fontSize: 29, fontWeight: '800', letterSpacing: -1.5, marginBottom: 4 },
  small: { fontSize: 10 },
  boxCta: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  bar: { marginTop: 'auto', height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%' },
  sectionHead: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  seeAll: { fontSize: 12, fontWeight: '600' },
  dashed: { marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center' },
  dashedText: { fontSize: 12, marginBottom: 12 },
  dashedCta: { fontSize: 13, fontWeight: '700' },
  note: { marginTop: 12, marginHorizontal: 16, borderRadius: 20, padding: 16 },
  noteText: { fontSize: 12, fontWeight: '600' },
  goalList: { gap: 10, paddingHorizontal: 16 },
  goal: { borderRadius: 24, padding: 18 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  goalName: { flex: 1, fontSize: 15, fontWeight: '700' },
  goalSub: { fontSize: 12, marginBottom: 12 },
  goalBadge: { marginBottom: 10 },
  goalTrack: { height: 6, borderRadius: 3 },
  goalHint: { fontSize: 11, marginTop: 8 },
  holdings: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' },
  holding: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18, gap: 12 },
  holdingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  holdingName: { flexShrink: 1, fontSize: 13, fontWeight: '600' },
  holdingAmt: { fontSize: 13, fontWeight: '700' },
  holdingNote: { fontSize: 11, paddingHorizontal: 18, paddingBottom: 16 },
  aiHeader: { paddingHorizontal: 20, paddingBottom: 18 },
  aiEyebrow: { fontSize: 11, marginBottom: 2 },
  aiTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  msgs: { paddingHorizontal: 16, gap: 10 },
  msg: { maxWidth: '82%', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 20 },
  msgText: { fontSize: 13, lineHeight: 19 },
  aiOffline: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
  aiOfflineText: { flex: 1, fontSize: 12, lineHeight: 17 },
  composer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  composerInput: { flex: 1, height: 46, borderRadius: 100, paddingHorizontal: 18, fontSize: 13 },
  send: { width: 46, height: 46, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
});
