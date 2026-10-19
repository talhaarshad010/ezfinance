import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useNetwork } from '../../../context/NetworkContext';
import { AIOfflineNote } from '../newUser/NewUserScreens';
import { useToast } from '../../../context/ToastContext';
import { AnimatedModal } from '../../../components/AnimatedModal';
import { DrawerMenuButton } from '../../../components';
import { useUserMode, useUserUi } from '../../../context/UserModeContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  addTransaction as addTransactionAction,
  updateAccountBalance,
} from '../../../store/slices/bankAccountsSlice';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { usePlanningActions } from '../../../hooks/usePlanningActions';
import { uuidv4 } from '../../../utils/uuid';
import { fullAmt } from '../../../utils/format';
import {
  buildCrossAppMemory,
  inferTransactionCategory,
  NOT_ADDED,
  type CaSeg,
  type MemoryBankRow,
} from './ca/caEngine';
import {
  loadCaChat,
  loadCaIntroSeen,
  loadCustomMemory,
  markCaIntroSeen,
  saveCaChat,
  saveCustomMemory,
  type CustomMemoryMap,
} from './ca/memoryStore';
import { CaWelcome, type SetupFacts } from './ca/CaWelcome';
import { caApi } from '../../../api/caApi';
import { AIChatSkeleton } from '../../../components/Skeletons';
import { ApiError } from '../../../api/client';
import { useNavigation } from '@react-navigation/native';
import type { CaExecutableAction } from './ca/caActions';
import { ActionCard, type Proposal, type ProposalRow } from './ca/ActionCard';
import { StatementCard, rowsFor, type StatementAttachment, type StatementScope } from './ca/StatementCard';
import { importApi, type PickedStatement, type StatementPreview } from '../../../api/importApi';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';

// The design's highlight colours for tax owed / tax saved.
const RED = '#D50000';
const GREEN = '#00C853';

interface Msg {
  id: number;
  role: 'user' | 'ai';
  text: string | CaSeg[];
  /** Changes the CA proposes; saved only when the user confirms them. */
  proposal?: Proposal;
  /** Shown under the reply, e.g. when the AI couldn't be reached. */
  footnote?: string;
  /** Example questions under the welcome; tapping one asks it. */
  suggestions?: string[];
  /** A file the user attached (its name, shown on their message). */
  attachment?: string;
  /** A bank statement the CA read; its transactions are added only when confirmed. */
  statement?: StatementAttachment;
}

// Explore mode: the design's sample conversation.
const SAMPLE: Msg[] = [
  {
    id: 0,
    role: 'ai',
    text: 'Assalam-o-Alaikum, Shahrukh. I have your salary profile, FBR 2024 slab data, and expense patterns loaded. Ask me anything about taxes, investments, or budget planning.',
  },
  {
    id: 1,
    role: 'user',
    text: 'How much tax will I owe this month on my PKR 1,50,000 salary?',
  },
  {
    id: 2,
    role: 'ai',
    text: [
      {
        t: `Under Finance Act 2024 slab rates for salaried individuals:

Annual income: PKR 18,00,000
• First PKR 6,00,000 — exempt
• PKR 6,00,001–12,00,000 — 5% → PKR 30,000
• PKR 12,00,001–18,00,000 — 15% → PKR 90,000

Total annual WHT: PKR 1,20,000
Monthly WHT: `,
      },
      { t: 'PKR 10,000', tone: 'red' },
      {
        t: '\nEffective rate: 6.67%\n\nInvesting PKR 1,70,000 more in SECP-approved funds reduces this by ',
      },
      { t: 'PKR 40,000', tone: 'green' },
      { t: ' via Section 62 credit.' },
    ],
  },
];

const QUICK = [
  'Generate full tax estimate',
  'Optimize savings rate',
  'Add PKR 2,500 Groceries expense',
  'Calculate Zakat on wealth',
  'Best AMC for Shariah compliance',
  'KSE-100 entry points',
];

const SAMPLE_MEMORY: MemoryBankRow[] = [
  { k: 'Salary', v: 'PKR 1,50,000 / mo · HBL', editable: true },
  { k: 'Employer', v: 'Pakistan Software Export Board', editable: true },
  { k: 'Tax Profile', v: 'Salaried · FBR Registered', editable: true },
  { k: 'Risk Score', v: 'Moderate · 5/10', editable: true },
  { k: 'City', v: 'Lahore, Punjab', editable: true },
  { k: 'Dependents', v: '2 (Spouse + 1 child)', editable: true },
  { k: 'Goals', v: 'House in 5 yr · 6-mo emergency', editable: true },
  { k: 'Sec 62 Used', v: 'PKR 30,000 this FY', editable: true },
];

const PLACEHOLDERS: Record<string, string> = {
  Salary: 'e.g. PKR 1,50,000 / mo',
  Employer: 'e.g. Systems Limited',
  'Tax Profile': 'e.g. Salaried · FBR Filer',
  'Risk Score': 'e.g. Moderate · 6/10',
  City: 'e.g. Karachi, Sindh',
  Dependents: 'e.g. 2 (Spouse + 1 child)',
  Goals: 'e.g. New Laptop · Emergency Fund',
  'Sec 62 Used': 'e.g. PKR 50,000 this FY',
};

function MemorySheet({
  onClose,
  memory,
  onSaveFact,
  onDeleteCustomFact,
}: {
  onClose: () => void;
  memory: MemoryBankRow[];
  onSaveFact: (key: string, value: string, isNewCustom?: boolean) => void;
  onDeleteCustomFact: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);
  const { theme } = useTheme();
  const { showToast } = useToast();

  // Editing an existing row or adding new custom context
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [customValInput, setCustomValInput] = useState('');

  const handleRowPress = (row: MemoryBankRow) => {
    if (row.editable === false) {
      showToast(
        `${row.k} is synced automatically from your live ledger.`,
        'info',
        'Live Synced',
      );
      return;
    }
    setAddingCustom(false);
    setEditingKey(row.k);
    setEditVal(row.v === NOT_ADDED ? '' : row.v);
  };

  const handleConfirmEdit = () => {
    if (!editingKey) return;
    const trimmed = editVal.trim();
    onSaveFact(editingKey, trimmed || NOT_ADDED, false);
    showToast(
      `Updated ${editingKey} in your CA Memory Bank.`,
      'success',
      'Memory Saved',
    );
    setEditingKey(null);
    setEditVal('');
  };

  const handleConfirmAddCustom = () => {
    const k = customKeyInput.trim();
    const v = customValInput.trim();
    if (!k || !v) {
      showToast(
        'Enter both a label and value for your context.',
        'error',
        'Missing Fields',
      );
      return;
    }
    onSaveFact(k, v, true);
    showToast(
      `Added "${k}" to your CA Memory Bank.`,
      'success',
      'Context Added',
    );
    setAddingCustom(false);
    setCustomKeyInput('');
    setCustomValInput('');
  };

  return (
    <AnimatedModal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={close}
      onDismissed={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Pressable
            style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  Memory Bank
                </Text>
                <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
                  What your CA knows about you · Tap any row to edit
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={close}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            {/* Inline Editor for Selected Memory Row */}
            {editingKey && (
              <View
                style={[
                  styles.editorCard,
                  { backgroundColor: theme.MODAL, borderColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.editorLabel, { color: theme.MUTED }]}>
                  EDIT {editingKey.toUpperCase()}
                </Text>
                <TextInput
                  value={editVal}
                  onChangeText={setEditVal}
                  placeholder={
                    PLACEHOLDERS[editingKey] || `Enter ${editingKey}...`
                  }
                  placeholderTextColor={theme.MUTED}
                  autoFocus
                  style={[
                    styles.editorInput,
                    {
                      color: theme.TEXT,
                      borderColor: theme.BORDER,
                      backgroundColor: theme.CARD,
                    },
                  ]}
                />
                <View style={styles.editorActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setEditingKey(null)}
                    style={[
                      styles.editorCancelBtn,
                      { borderColor: theme.BORDER },
                    ]}
                  >
                    <Text
                      style={[styles.editorCancelText, { color: theme.MUTED }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmEdit}
                    style={[
                      styles.editorSaveBtn,
                      { backgroundColor: theme.TEXT },
                    ]}
                  >
                    <Text style={[styles.editorSaveText, { color: theme.BG }]}>
                      Save Memory
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Inline Form for + Add Context */}
            {addingCustom && (
              <View
                style={[
                  styles.editorCard,
                  { backgroundColor: theme.MODAL, borderColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.editorLabel, { color: theme.MUTED }]}>
                  ADD NEW CONTEXT TO MEMORY BANK
                </Text>
                <TextInput
                  value={customKeyInput}
                  onChangeText={setCustomKeyInput}
                  placeholder="Label (e.g. Freelance Income, Gold, Rent)"
                  placeholderTextColor={theme.MUTED}
                  autoFocus
                  style={[
                    styles.editorInput,
                    {
                      color: theme.TEXT,
                      borderColor: theme.BORDER,
                      backgroundColor: theme.CARD,
                      marginBottom: 8,
                    },
                  ]}
                />
                <TextInput
                  value={customValInput}
                  onChangeText={setCustomValInput}
                  placeholder="Value (e.g. PKR 45,000 / mo)"
                  placeholderTextColor={theme.MUTED}
                  style={[
                    styles.editorInput,
                    {
                      color: theme.TEXT,
                      borderColor: theme.BORDER,
                      backgroundColor: theme.CARD,
                    },
                  ]}
                />
                <View style={styles.editorActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setAddingCustom(false)}
                    style={[
                      styles.editorCancelBtn,
                      { borderColor: theme.BORDER },
                    ]}
                  >
                    <Text
                      style={[styles.editorCancelText, { color: theme.MUTED }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmAddCustom}
                    style={[
                      styles.editorSaveBtn,
                      { backgroundColor: theme.TEXT },
                    ]}
                  >
                    <Text style={[styles.editorSaveText, { color: theme.BG }]}>
                      Add to Memory
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
            >
              {memory.map(m => (
                <TouchableOpacity
                  key={m.k}
                  activeOpacity={0.7}
                  onPress={() => handleRowPress(m)}
                  style={[styles.memoryRow, { borderTopColor: theme.BORDER }]}
                >
                  <Text style={[styles.memoryKey, { color: theme.MUTED }]}>
                    {m.k}
                  </Text>
                  <View style={styles.memoryValWrap}>
                    <Text
                      style={[
                        styles.memoryVal,
                        { color: m.v === NOT_ADDED ? theme.MUTED : theme.TEXT },
                      ]}
                      numberOfLines={2}
                    >
                      {m.v}
                    </Text>
                    {m.isCustom ? (
                      <TouchableOpacity
                        onPress={() => onDeleteCustomFact(m.k)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={13} color={theme.RED} />
                      </TouchableOpacity>
                    ) : (
                      <Feather
                        name={m.editable === false ? 'lock' : 'chevron-right'}
                        size={13}
                        color={theme.MUTED}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!addingCustom && !editingKey && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setEditingKey(null);
                  setAddingCustom(true);
                }}
                style={[styles.addContextBtn, { borderColor: theme.BORDER }]}
              >
                <Text style={[styles.addContextText, { color: theme.TEXT }]}>
                  + Add Context
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </AnimatedModal>
  );
}

function TypingDots() {
  const { theme } = useTheme();
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;
  const opacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnim = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);
    };

    const a1 = createAnim(opacity1, 0);
    const a2 = createAnim(opacity2, 200);
    const a3 = createAnim(opacity3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [opacity1, opacity2, opacity3]);

  return (
    <View style={styles.typingRow}>
      <View style={[styles.caAvatarBadge, { backgroundColor: theme.ACTIVE }]}>
        <MaterialCommunityIcons name="brain" size={10} color="#FFFFFF" />
      </View>
      <View style={[styles.typingBubble, { backgroundColor: theme.CARD }]}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: theme.MUTED, opacity: opacity1 },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: theme.MUTED, opacity: opacity2 },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: theme.MUTED, opacity: opacity3 },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * The message box. It keeps the typed text itself, so typing redraws only the box (not the whole
 * conversation). `onSubmit` returns whether the text was sent; if not, the text stays.
 */
const Composer = React.memo(function Composer({
  online,
  busy,
  hasFile,
  onAttach,
  onSubmit,
}: {
  online: boolean;
  busy: boolean;
  hasFile: boolean;
  onAttach: () => void;
  onSubmit: (text: string) => boolean;
}) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  // The parent's handlers change every render; the latest one is read at send time.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const submit = () => {
    if (submitRef.current(text)) setText('');
  };
  const active = !!text.trim() || hasFile;
  return (
    <View style={[styles.inputInnerRow, { borderBottomColor: theme.TEXT }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onAttach}
        disabled={!online || busy}
        accessibilityLabel="Attach a bank statement (PDF, CSV or Excel)"
        hitSlop={8}
        style={styles.attachBtn}
      >
        <Feather name="paperclip" size={18} color={theme.MUTED} />
      </TouchableOpacity>
      <TextInput
        editable={online}
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={hasFile ? 'e.g. Add all these to my expenses' : 'Ask your CA…'}
        placeholderTextColor={theme.MUTED}
        style={[styles.textInput, { color: theme.TEXT }]}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={submit}
        disabled={!online}
        accessibilityLabel="Send"
        style={[styles.sendBtn, { backgroundColor: active ? theme.TEXT : theme.MODAL }]}
      >
        <Feather name="send" size={15} color={active ? theme.BG : theme.MUTED} />
      </TouchableOpacity>
    </View>
  );
});

export const AIAdvisorScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const txActions = useTransactionActions();
  const planningActions = usePlanningActions();

  // A signed-in user's CA uses their own profile and data; Explore shows the design's sample.
  const userMode = useUserMode();
  const userUi = useUserUi();
  const isUser = userMode.isNewUser;
  const profile = useAppSelector(state => state.user.profile);
  const reduxBankAccounts = useAppSelector(
    state => state.bankAccounts.accounts,
  );

  const [customMemory, setCustomMemory] = useState<CustomMemoryMap>({
    facts: {},
    customKeys: [],
  });

  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // Load persisted custom Memory Bank entries on mount / user switch
  useEffect(() => {
    let active = true;
    setMemoryLoaded(false);
    loadCustomMemory(profile?.uid || 'guest').then(loaded => {
      if (active) {
        setCustomMemory(loaded);
        setMemoryLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [profile?.uid]);

  // Build the live Cross-App Financial & Memory Bank Snapshot
  const snapshot = useMemo(
    () =>
      buildCrossAppMemory({
        profile,
        txs: userMode.txs,
        goals: userMode.goals,
        holdings: userMode.holdings,
        budget: userMode.budget,
        envelopes: userMode.envelopes,
        bankAccounts: isUser ? userMode.bankAccounts : reduxBankAccounts,
        bills: userMode.bills,
        debts: userMode.debts,
        customMemory,
      }),
    [
      profile,
      userMode.txs,
      userMode.goals,
      userMode.holdings,
      userMode.budget,
      userMode.envelopes,
      userMode.bankAccounts,
      reduxBankAccounts,
      userMode.bills,
      userMode.debts,
      customMemory,
      isUser,
    ],
  );

  const memory: MemoryBankRow[] = isUser
    ? snapshot.memoryRows
    : SAMPLE_MEMORY.map(m => ({
        ...m,
        v: customMemory.facts[m.k] || m.v,
      })).concat(
        customMemory.customKeys
          .filter(k => customMemory.facts[k])
          .map(k => ({
            k,
            v: customMemory.facts[k],
            isCustom: true,
            editable: true,
          })),
      );

  const handleSaveFact = (
    key: string,
    value: string,
    isNewCustom?: boolean,
  ) => {
    setCustomMemory(prev => {
      const nextFacts = { ...prev.facts };
      if (value === NOT_ADDED) {
        delete nextFacts[key];
      } else {
        nextFacts[key] = value;
      }
      const nextCustomKeys =
        isNewCustom && !prev.customKeys.includes(key)
          ? [...prev.customKeys, key]
          : prev.customKeys;
      const updated: CustomMemoryMap = {
        facts: nextFacts,
        customKeys: nextCustomKeys,
      };
      saveCustomMemory(profile?.uid || 'guest', updated);
      return updated;
    });
  };

  const handleDeleteCustomFact = (key: string) => {
    setCustomMemory(prev => {
      const nextFacts = { ...prev.facts };
      delete nextFacts[key];
      const updated: CustomMemoryMap = {
        facts: nextFacts,
        customKeys: prev.customKeys.filter(k => k !== key),
      };
      saveCustomMemory(profile?.uid || 'guest', updated);
      return updated;
    });
    showToast(`Removed "${key}" from Memory Bank.`, 'info', 'Memory Updated');
  };

  // Message ids: unique and increasing, even for two messages made in the same millisecond.
  const lastMsgId = useRef(0);
  const newMsgId = () => (lastMsgId.current = Math.max(Date.now(), lastMsgId.current + 1));

  /** The welcome a signed-in user's chat starts with (once; after that their saved chat is shown). */
  const firstMessages = (note?: string): Msg[] => {
    if (!isUser) return SAMPLE;
    const name = snapshot.userName;
    const knowsSalary = snapshot.monthlyIncome > 0;
    return [
      {
        id: newMsgId(),
        role: 'ai',
        text:
          `Assalam-o-Alaikum, ${name}! Welcome to your Personal CA.\n\n` +
          (note ? `${note}\n\n` : '') +
          `I can work out your tax, plan your savings from your real spending, calculate Zakat, and add expenses when you tell me about them (you confirm before anything is saved).\n\n` +
          (knowsSalary
            ? 'Pick a question below to start, or ask me anything.'
            : 'Tell me your monthly salary (e.g. "My salary is 1,50,000") so I can work out your tax, or pick a question below.'),
        suggestions: [
          knowsSalary ? 'How much tax will I owe this month?' : 'My salary is 1,50,000',
          'How can I save PKR 50,000 in 6 months?',
          'Calculate my Zakat',
          'Spent 500 on lunch yesterday',
        ],
      },
    ];
  };

  // Explore shows the sample chat. A signed-in user's chat is loaded from the device below.
  const [msgs, setMsgs] = useState<Msg[]>(() => (isUser ? [] : SAMPLE));
  const uid = profile?.uid || 'guest';

  // First visit of a signed-in user: the welcome and quick setup, then the starting conversation.
  // After that, the saved conversation is shown instead.
  const [intro, setIntro] = useState<'loading' | 'show' | 'hidden'>(
    isUser ? 'loading' : 'hidden',
  );
  const [chatReady, setChatReady] = useState(!isUser);
  // Set when the starting conversation should be created (once the Memory Bank has loaded).
  const [seed, setSeed] = useState<{ note?: string } | null>(null);
  useEffect(() => {
    if (!isUser) {
      setIntro('hidden');
      setMsgs(SAMPLE);
      setChatReady(true);
      return;
    }
    let active = true;
    setChatReady(false);
    Promise.all([loadCaIntroSeen(uid), loadCaChat<Msg>(uid)]).then(([seen, saved]) => {
      if (!active) return;
      // A chat that only holds the old sample tax conversation (no messages from the user) is
      // replaced by the welcome.
      const onlyOldSample =
        saved.length <= 3 &&
        saved[0]?.id === 0 &&
        typeof saved[0].text === 'string' &&
        saved[0].text.includes('FBR 2024 slab data');
      if (saved.length > 0 && !onlyOldSample) {
        lastMsgId.current = Math.max(lastMsgId.current, ...saved.map(m => m.id));
        // A save that was in progress when the app closed can be confirmed again.
        setMsgs(
          // A chat saved before ids were made unique may hold the same id twice: renumber those.
          saved.map((m, i, all) => (all.findIndex(o => o.id === m.id) === i ? m : { ...m, id: newMsgId() })).map(m => {
            let next = m.proposal?.state === 'saving' ? { ...m, proposal: { ...m.proposal, state: 'pending' as const } } : m;
            // The statement's rows aren't saved with the chat: an unfinished one has to be attached again.
            if (next.statement && !['done', 'cancelled', 'failed'].includes(next.statement.state)) {
              next = { ...next, statement: { ...next.statement, state: 'expired' } };
            }
            return next;
          }),
        );
        setIntro('hidden');
      } else {
        setIntro(seen || onlyOldSample ? 'hidden' : 'show');
        if (seen || onlyOldSample) setSeed({});
      }
      setChatReady(true);
    });
    return () => {
      active = false;
    };
  }, [isUser, uid]);

  useEffect(() => {
    if (!seed || !memoryLoaded) return;
    setMsgs(firstMessages(seed.note));
    setSeed(null);
    // firstMessages reads the latest snapshot; it only needs to run when a seed is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, memoryLoaded]);

  // Keep the conversation on the device (per user) so it's still there next time.
  useEffect(() => {
    if (!isUser || !chatReady || intro !== 'hidden' || seed || msgs.length === 0) return;
    const timer = setTimeout(
      () =>
        saveCaChat(
          uid,
          // A statement's rows can be large; only its outcome is kept.
          msgs.map(m => (m.statement?.preview ? { ...m, statement: { ...m.statement, preview: undefined } } : m)),
        ),
      400,
    );
    return () => clearTimeout(timer);
  }, [isUser, chatReady, intro, seed, msgs, uid]);

  // The app tour passes through this tab; the welcome waits until the tour is over.
  const showIntro = intro === 'show' && !userUi.tourOpen;

  function finishIntro(facts: SetupFacts) {
    const entries = Object.entries(facts);
    for (const [key, value] of entries) handleSaveFact(key, value, false);
    markCaIntroSeen(uid);
    setIntro('hidden');
    setSeed({
      note: entries.length > 0 ? "Thanks! I've saved that to your Memory Bank (tap Memory to change it)." : undefined,
    });
  }
  const [typing, setTyping] = useState(false);
  const [showMem, setShowMem] = useState(false);
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null);
  const { online } = useNetwork();

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [msgs, typing]);

  const navigation = useNavigation<any>();
  const availableAccounts = isUser ? userMode.bankAccounts : reduxBankAccounts;
  const accountOptions = availableAccounts.map(a => ({
    id: a.id,
    label: `${a.bankAbbreviation || a.bankName}${
      a.accountNumber ? ` ··${a.accountNumber.slice(-4)}` : ''
    }`,
  }));
  const goalOptions = userMode.goals.map(g => ({ id: g.id, name: g.name }));

  /** Pre-fills the account (named one, else the first) and the goal (named one, else the only one). */
  function makeProposal(actions: CaExecutableAction[]): Proposal {
    return {
      state: 'pending',
      rows: actions.map(action => {
        const hint = action.accountHint?.toLowerCase();
        const account =
          (hint
            ? availableAccounts.find(
                a =>
                  a.bankName.toLowerCase().includes(hint) ||
                  a.bankAbbreviation.toLowerCase().includes(hint),
              )
            : undefined) ?? availableAccounts[0];
        const goalName = action.goalName?.toLowerCase();
        const goal =
          (goalName
            ? userMode.goals.find(g => g.name.toLowerCase() === goalName)
            : undefined) ??
          (userMode.goals.length === 1 ? userMode.goals[0] : undefined);
        return {
          action,
          accountId:
            action.kind === 'add_transaction' ? account?.id : undefined,
          goalId: action.kind === 'add_contribution' ? goal?.id : undefined,
          status: 'pending',
        };
      }),
    };
  }

  function patchProposal(msgId: number, fn: (p: Proposal) => Proposal) {
    setMsgs(list =>
      list.map(m =>
        m.id === msgId && m.proposal ? { ...m, proposal: fn(m.proposal) } : m,
      ),
    );
  }

  function dateOf(iso?: string) {
    if (!iso) return new Date();
    const [y, mo, d] = iso.split('-').map(Number);
    const date = new Date(y, mo - 1, d, 12);
    return date.toDateString() === new Date().toDateString()
      ? new Date()
      : date;
  }

  /** Saves one confirmed row. Throws if the server turns it down; nothing is faked on the device. */
  async function saveRow(row: ProposalRow): Promise<'saved' | 'queued'> {
    const a = row.action;
    const date = dateOf(a.date);
    if (a.kind === 'add_transaction') {
      const txType = a.txType === 'income' ? 'income' : 'expense';
      const category =
        a.category ?? inferTransactionCategory(a.note ?? '', txType);
      if (!row.accountId) throw new Error('Choose an account first.');
      if (isUser) {
        const { result } = await txActions.create({
          type: txType,
          category,
          amount: a.amount,
          note: a.note,
          accountId: row.accountId,
          date,
          source: 'manual',
        });
        return result;
      }
      // Explore: the sample accounts live on the device only.
      const account = reduxBankAccounts.find(acc => acc.id === row.accountId);
      dispatch(
        addTransactionAction({
          id: 'tx_' + uuidv4(),
          accountId: row.accountId,
          description: a.note || category,
          amount: a.amount,
          type: txType,
          category,
          date: date.toISOString(),
          createdAt: Date.now(),
        }),
      );
      if (account) {
        const balance =
          txType === 'income'
            ? account.balance + a.amount
            : account.balance - a.amount;
        dispatch(updateAccountBalance({ accountId: account.id, balance }));
      }
      return 'saved';
    }
    if (a.kind === 'add_goal') {
      const name = a.goalName || 'Savings Goal';
      const deadline = a.deadline ? dateOf(a.deadline) : undefined;
      if (isUser) await planningActions.createGoal({ name, target: a.amount, icon: 'target', deadline });
      else userMode.addGoal({ id: uuidv4(), name, target: a.amount, saved: 0, icon: 'target', deadline });
      return 'saved';
    }
    if (a.kind === 'set_budget') {
      if (isUser) await planningActions.setMonthlyBudget(a.amount);
      else userMode.setBudget(a.amount);
      return 'saved';
    }
    if (!row.goalId) throw new Error('Choose a goal first.');
    if (isUser) await planningActions.contribute(row.goalId, a.amount, date);
    else {
      const goal = userMode.goals.find(g => g.id === row.goalId);
      if (goal) userMode.updateGoal(goal.id, { saved: goal.saved + a.amount });
    }
    return 'saved';
  }

  function saveErrorText(error: unknown) {
    if (error instanceof ApiError && error.code === 'network') {
      return "Couldn't reach the server. Nothing was saved. Try again when you're online.";
    }
    return error instanceof Error && error.message
      ? `Couldn't save: ${error.message}`
      : "Couldn't save. Try again.";
  }

  async function confirmProposal(msgId: number, proposal: Proposal) {
    patchProposal(msgId, p => ({ ...p, state: 'saving' }));
    const rows = [...proposal.rows];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === 'saved' || rows[i].status === 'queued') continue;
      try {
        rows[i] = {
          ...rows[i],
          status: await saveRow(rows[i]),
          error: undefined,
        };
      } catch (error) {
        rows[i] = { ...rows[i], status: 'failed', error: saveErrorText(error) };
      }
    }
    const allDone = rows.every(
      r => r.status === 'saved' || r.status === 'queued',
    );
    patchProposal(msgId, () => ({ rows, state: allDone ? 'done' : 'pending' }));
    if (allDone) {
      const queued = rows.some(r => r.status === 'queued');
      showToast(
        queued
          ? "Saved on this device. It will sync when you're back online."
          : rows.length > 1
          ? `${rows.length} changes saved`
          : 'Saved',
        'success',
        'Personal CA',
      );
    }
  }

  // ── Bank statements attached in the chat ───────────────────────────────────
  // The picked file, per message, for opening a password-protected PDF (not saved with the chat).
  const attachedFiles = useRef<Record<number, PickedStatement>>({});

  function patchStatement(msgId: number, patch: Partial<StatementAttachment>, text?: Msg['text']) {
    setMsgs(list =>
      list.map(m =>
        m.id === msgId && m.statement
          ? { ...m, statement: { ...m.statement, ...patch }, ...(text !== undefined ? { text } : {}) }
          : m,
      ),
    );
  }

  /** "only the expenses" / "just income" narrow what's added; anything else adds all of it. */
  function scopeOf(instruction: string): StatementScope {
    const t = instruction.toLowerCase();
    // Also Roman Urdu: "sirf kharche add karo", "sirf aamdani".
    if (/\b(only|just|sirf)\b[^.]*\b(expenses?|spending|debits?|payments?|kharch\w*)\b|\b(expenses?|debits?)\s+only\b/.test(t)) return 'expenses';
    if (/\b(only|just|sirf)\b[^.]*\b(income|credits?|deposits?|aamdani|amdani)\b|\b(income|credits?)\s+only\b/.test(t)) return 'income';
    return 'all';
  }

  function statementSummary(p: StatementPreview, scope: StatementScope): CaSeg[] {
    const fmtDate = (iso: string) => {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const out = p.rows.filter(r => r.type === 'expense').reduce((t, r) => t + r.amount, 0);
    const inn = p.rows.filter(r => r.type === 'income').reduce((t, r) => t + r.amount, 0);
    const already = p.rows.filter(r => r.alreadyImported).length;
    const unticked = p.rows.filter(r => !r.preselected && !r.alreadyImported).length;
    const adding = rowsFor(p, scope).length;
    const check =
      p.balanceCheck === 'passed'
        ? 'Every running balance adds up, so the amounts are exact.'
        : p.balanceCheck === 'failed'
        ? `${unticked} row${unticked === 1 ? '' : 's'} didn't match the running balance, so I left ${unticked === 1 ? 'it' : 'them'} out. Use "Review rows" to check ${unticked === 1 ? 'it' : 'them'}.`
        : "This file has no running balance to check against, so please review the rows before adding them.";
    return [
      {
        t: `I read ${p.rows.length} transaction${p.rows.length === 1 ? '' : 's'} from your ${p.bankName ? `${p.bankName} ` : ''}statement${p.rows.length ? ` (${fmtDate(p.from)} – ${fmtDate(p.to)})` : ''}.\n\nMoney out: `,
      },
      { t: `PKR ${fullAmt(out)}`, tone: 'red' },
      { t: '  ·  Money in: ' },
      { t: `PKR ${fullAmt(inn)}`, tone: 'green' },
      {
        t:
          `\n\n${check}` +
          (already ? `\n${already} of them ${already === 1 ? 'was' : 'were'} already in the app and won't be added again.` : '') +
          (adding === 0
            ? already === p.rows.length
              ? "\n\nEverything in this statement is already in the app, so there's nothing new to add."
              : `\n\nThere's nothing new to add${scope === 'all' ? '' : ` in the ${scope === 'expenses' ? 'expenses' : 'income'}`}. Use "Review rows" to pick rows yourself.`
            : `\n\n${scope === 'all' ? '' : `As you asked, only the ${scope === 'expenses' ? 'expenses' : 'income'} are selected. `}Choose the account and tap Add to save ${adding === 1 ? 'it' : `these ${adding}`}.`),
      },
    ];
  }

  async function readStatement(msgId: number, file: PickedStatement, scope: StatementScope, password?: string) {
    patchStatement(msgId, { state: 'reading', passwordError: undefined });
    try {
      const preview = await importApi.preview(file, password);
      const bank = preview.bankName?.toLowerCase();
      const matched = bank
        ? availableAccounts.find(a => bank.includes(a.bankName.toLowerCase()) || a.bankName.toLowerCase().includes(bank))
        : undefined;
      patchStatement(
        msgId,
        {
          state: preview.rows.length > 0 ? 'ready' : 'failed',
          preview,
          accountId: matched?.id ?? (availableAccounts.length === 1 ? availableAccounts[0].id : undefined),
          error: preview.rows.length > 0 ? undefined : "I couldn't find any transactions in this file.",
        },
        preview.rows.length > 0 ? statementSummary(preview, scope) : "I couldn't find any transactions in this file. Is it a bank statement?",
      );
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'password_required' || error.code === 'wrong_password')) {
        patchStatement(
          msgId,
          { state: 'password', passwordError: error.code === 'wrong_password' ? error.message : undefined },
          'This statement is password-protected. Enter its password below and I\'ll read it.',
        );
        return;
      }
      const message =
        error instanceof ApiError && error.code === 'network'
          ? "I couldn't reach the server to read the file. Check your connection and attach it again."
          : error instanceof ApiError
          ? error.message
          : "I couldn't read this statement. Try again, or try a CSV or Excel file.";
      patchStatement(msgId, { state: 'failed', error: message }, message);
    }
  }

  const [pendingFile, setPendingFile] = useState<PickedStatement | null>(null);

  async function attachStatement() {
    if (!isUser) {
      showToast('Sign in to add transactions from a bank statement.', 'info');
      return;
    }
    if (typing) return;
    let file: PickedStatement;
    try {
      const [res] = await pick({
        type: [types.pdf, types.csv, types.xls, types.xlsx, types.plainText],
        allowMultiSelection: false,
      });
      file = { uri: res.uri, name: res.name ?? 'statement', type: res.type ?? 'application/octet-stream' };
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      showToast("Couldn't open that file. Try another one.", 'error');
      return;
    }
    // Held above the input until the user taps Send (with or without an instruction).
    setPendingFile(file);
  }

  /** Sends the attached statement with the user's instruction (which may be empty). */
  function sendStatement(file: PickedStatement, instruction: string) {
    const scope = scopeOf(instruction);
    const userId = newMsgId();
    const aiId = newMsgId();
    attachedFiles.current[aiId] = file;
    setPendingFile(null);
    setMsgs(m => [
      ...m,
      { id: userId, role: 'user', text: instruction, attachment: file.name },
      { id: aiId, role: 'ai', text: 'Reading your statement…', statement: { fileName: file.name, state: 'reading', scope } },
    ]);
    readStatement(aiId, file, scope);
  }

  async function confirmStatement(msgId: number, st: StatementAttachment) {
    const rows = rowsFor(st.preview, st.scope);
    if (!st.accountId || rows.length === 0) return;
    patchStatement(msgId, { state: 'importing', error: undefined });
    try {
      const result = await importApi.importRows(
        st.accountId,
        rows.map(r => ({ id: r.id, type: r.type, amount: r.amount, category: r.category, note: r.description, date: r.date })),
      );
      await userMode.reloadTxs().catch(() => {});
      const label = accountOptions.find(a => a.id === st.accountId)?.label ?? 'your account';
      patchStatement(msgId, { state: 'done', result: { ...result, accountLabel: label } });
      showToast(`${result.imported + result.restored} transactions added`, 'success', 'Statement Imported');
    } catch (error) {
      patchStatement(msgId, {
        state: 'ready',
        error:
          error instanceof ApiError && error.code === 'network'
            ? "Couldn't reach the server. Nothing was added — try again when you're online."
            : error instanceof ApiError
            ? error.message
            : "Couldn't add the transactions. Try again.",
      });
    }
  }

  /**
   * What the message box sends. Returns false when nothing was sent (offline, busy, empty), so the
   * box keeps the typed text.
   */
  function submitTyped(text: string): boolean {
    if (typing || !online) return false; // the assistant needs internet; typed text is kept
    if (pendingFile) {
      sendStatement(pendingFile, text.trim());
      return true;
    }
    if (!text.trim()) return false;
    send(text, false);
    return true;
  }

  /** Asks the CA. `fromChip`: a suggested question was tapped (it gets highlighted). */
  async function send(text: string, fromChip = true) {
    const q = text.trim();
    if (!q || typing || !online) return;
    if (fromChip) setSelectedQuick(text);

    const userMsg: Msg = { id: newMsgId(), role: 'user', text: q };
    setMsgs(m => [...m, userMsg]);
    setTyping(true);

    try {
      const history = msgs.slice(-6).map(m => ({
        role: m.role,
        text:
          typeof m.text === 'string' ? m.text : m.text.map(s => s.t).join(''),
      }));

      const result = await caApi.ask(q, snapshot, history, isUser);

      // Personal facts from the message go into the Memory Bank extracted from the user's message into Memory Bank
      if (result.extractedFacts.length > 0) {
        for (const fact of result.extractedFacts) {
          const isBuiltIn = [
            'Salary',
            'Employer',
            'Tax Profile',
            'Risk Score',
            'City',
            'Dependents',
            'Goals',
            'Sec 62 Used',
          ].includes(fact.key);
          handleSaveFact(fact.key, fact.value, !isBuiltIn);
        }
        const summary = result.extractedFacts
          .map(f => `${f.key}: ${f.value}`)
          .join(', ');
        showToast(
          `Memory Bank updated (${summary})`,
          'success',
          'CA Learned Context',
        );
      }

      // Commands are only proposed here: nothing changes until the user taps Confirm on the card.
      setMsgs(m => [
        ...m,
        {
          id: newMsgId(),
          role: 'ai',
          text: result.segments,
          proposal:
            result.executableActions.length > 0
              ? makeProposal(result.executableActions)
              : undefined,
          footnote:
            isUser && result.source === 'calculated'
              ? "The AI couldn't be reached, so this is the app's own calculation."
              : undefined,
        },
      ]);
    } catch {
      setMsgs(m => [
        ...m,
        {
          id: newMsgId(),
          role: 'ai',
          text: 'Something went wrong while answering. Please try again.',
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={[styles.headerBox, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTopRow}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <DrawerMenuButton />
              <View>
                <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                  Personal CA
                </Text>
                <Text style={[styles.headerSub, { color: theme.MUTED }]}>
                  AI Chartered Accountant · Pakistan
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowMem(true)}
              style={[styles.memoryBtn, { backgroundColor: theme.TEXT }]}
            >
              <MaterialCommunityIcons name="brain" size={13} color={theme.BG} />
              <Text style={[styles.memoryBtnText, { color: theme.BG }]}>
                Memory
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {intro === 'loading' || !chatReady || seed || (intro === 'show' && userUi.tourOpen) ? (
          <AIChatSkeleton />
        ) : showIntro ? (
          <CaWelcome
            name={snapshot.userName}
            knownIncome={snapshot.monthlyIncome}
            knownCity={profile?.city ?? undefined}
            knownFiler={
              profile?.filerStatus === 'yes'
                ? 'filer'
                : profile?.filerStatus === 'no'
                ? 'non_filer'
                : undefined
            }
            bottomInset={insets.bottom}
            onDone={finishIntro}
          />
        ) : (
          <>
            {/* Quick Suggestion Pills Horizontal Row */}
            <View style={styles.quickRowWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickContentContainer}
              >
                {QUICK.map(q => {
                  const active = selectedQuick === q;
                  return (
                    <TouchableOpacity
                      key={q}
                      activeOpacity={0.8}
                      onPress={() => send(q)}
                      disabled={!online}
                      style={[
                        styles.quickPill,
                        {
                          backgroundColor: active ? theme.ACTIVE : theme.CARD,
                          borderColor: active ? 'transparent' : theme.BORDER,
                          opacity: online ? 1 : 0.45,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickPillText,
                          { color: active ? '#FFFFFF' : theme.TEXT },
                        ]}
                      >
                        {q}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Chat Message Thread */}
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatScrollContent}
            >
              {msgs.map(msg => {
                const isUserMsg = msg.role === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgWrapper,
                      { alignItems: isUserMsg ? 'flex-end' : 'flex-start' },
                    ]}
                  >
                    {!isUserMsg && (
                      <View style={styles.aiBadgeHeader}>
                        <View
                          style={[
                            styles.caAvatarBadge,
                            { backgroundColor: theme.ACTIVE },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="brain"
                            size={10}
                            color="#FFFFFF"
                          />
                        </View>
                        <Text
                          style={[styles.aiBadgeText, { color: theme.MUTED }]}
                        >
                          CA · ezFinance
                        </Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.msgBubble,
                        {
                          backgroundColor: isUserMsg ? theme.TEXT : theme.CARD,
                          borderBottomRightRadius: isUserMsg ? 6 : 20,
                          borderTopLeftRadius: isUserMsg ? 20 : 6,
                        },
                      ]}
                    >
                      {msg.attachment && (
                        <View style={[styles.attachChip, { backgroundColor: 'rgba(127,127,127,0.25)' }]}>
                          <Feather name="paperclip" size={12} color={isUserMsg ? theme.BG : theme.TEXT} />
                          <Text
                            numberOfLines={1}
                            style={[styles.attachText, { color: isUserMsg ? theme.BG : theme.TEXT }]}
                          >
                            {msg.attachment}
                          </Text>
                        </View>
                      )}
                      {!(msg.attachment && msg.text === '') && (
                      <Text
                        style={[
                          styles.msgText,
                          { color: isUserMsg ? theme.BG : theme.TEXT },
                        ]}
                      >
                        {typeof msg.text === 'string'
                          ? msg.text
                          : msg.text.map((seg, i) => (
                              <Text
                                key={i}
                                style={
                                  seg.tone
                                    ? {
                                        color: seg.tone === 'red' ? RED : GREEN,
                                        fontWeight: '700',
                                      }
                                    : undefined
                                }
                              >
                                {seg.t}
                              </Text>
                            ))}
                      </Text>
                      )}
                    </View>

                    {msg.suggestions && msg === msgs[msgs.length - 1] && (
                      <View style={styles.suggestions}>
                        {msg.suggestions.map(sug => (
                          <TouchableOpacity
                            key={sug}
                            activeOpacity={0.8}
                            disabled={!online || typing}
                            onPress={() => send(sug)}
                            style={[styles.suggestion, { borderColor: theme.BORDER }]}
                          >
                            <Text style={[styles.suggestionText, { color: theme.TEXT }]}>{sug}</Text>
                            <Feather name="arrow-up-right" size={13} color={theme.MUTED} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {msg.footnote && (
                      <Text style={[styles.footnote, { color: theme.MUTED }]}>
                        {msg.footnote}
                      </Text>
                    )}

                    {msg.proposal && (
                      <ActionCard
                        proposal={msg.proposal}
                        accounts={accountOptions}
                        goals={goalOptions}
                        onChange={(index, patch) =>
                          patchProposal(msg.id, p => ({
                            ...p,
                            rows: p.rows.map((r, i) =>
                              i === index ? { ...r, ...patch } : r,
                            ),
                          }))
                        }
                        onConfirm={() => confirmProposal(msg.id, msg.proposal!)}
                        onCancel={() =>
                          patchProposal(msg.id, p => ({
                            ...p,
                            state: 'cancelled',
                          }))
                        }
                        onAddAccount={() => navigation.navigate('AddAccount')}
                      />
                    )}

                    {msg.statement && (
                      <StatementCard
                        statement={msg.statement}
                        accounts={accountOptions}
                        onChange={patch => patchStatement(msg.id, patch)}
                        onPassword={password => {
                          const file = attachedFiles.current[msg.id];
                          if (file) readStatement(msg.id, file, msg.statement!.scope, password);
                          else patchStatement(msg.id, { state: 'expired' });
                        }}
                        onConfirm={() => confirmStatement(msg.id, msg.statement!)}
                        onCancel={() => patchStatement(msg.id, { state: 'cancelled' })}
                        onReview={() => {
                          const file = attachedFiles.current[msg.id];
                          if (file && msg.statement?.preview) {
                            navigation.navigate('ImportStatement', {
                              file,
                              preview: msg.statement.preview,
                              scope: msg.statement.scope,
                              accountId: msg.statement.accountId,
                            });
                          }
                        }}
                        onAddAccount={() => navigation.navigate('AddAccount')}
                      />
                    )}
                  </View>
                );
              })}

              {typing && <TypingDots />}
            </ScrollView>

            {!online && <AIOfflineNote />}

            {/* Bottom Input Field */}
            <View
              style={[
                styles.inputBox,
                {
                  paddingBottom: insets.bottom + 80,
                  opacity: online ? 1 : 0.45,
                },
              ]}
            >
              {pendingFile && (
                <View style={[styles.pendingFile, { backgroundColor: theme.CARD, borderColor: theme.BORDER }]}>
                  <View style={[styles.pendingIcon, { backgroundColor: theme.MODAL }]}>
                    <Feather name="file-text" size={14} color={theme.TEXT} />
                  </View>
                  <View style={styles.pendingBody}>
                    <Text numberOfLines={1} style={[styles.pendingName, { color: theme.TEXT }]}>
                      {pendingFile.name}
                    </Text>
                    <Text style={[styles.pendingHint, { color: theme.MUTED }]}>
                      Add an instruction if you like, then tap Send
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPendingFile(null)}
                    hitSlop={8}
                    accessibilityLabel="Remove attachment"
                  >
                    <Feather name="x" size={16} color={theme.MUTED} />
                  </TouchableOpacity>
                </View>
              )}
              <Composer
                online={online}
                busy={typing}
                hasFile={!!pendingFile}
                onAttach={attachStatement}
                onSubmit={submitTyped}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Memory Bank Sheet Modal */}
      {showMem && (
        <MemorySheet
          memory={memory}
          onClose={() => setShowMem(false)}
          onSaveFact={handleSaveFact}
          onDeleteCustomFact={handleDeleteCustomFact}
        />
      )}
    </View>
  );
};

export default AIAdvisorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  headerBox: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  memoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  memoryBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickRowWrap: {
    paddingBottom: 12,
  },
  quickContentContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  quickPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chatScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  msgWrapper: {
    marginBottom: 18,
  },
  aiBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  caAvatarBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  msgBubble: {
    maxWidth: '86%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pendingFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  pendingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pendingBody: { flex: 1 },
  pendingName: { fontSize: 13, fontWeight: '700' },
  pendingHint: { fontSize: 11, marginTop: 1 },
  attachBtn: { paddingRight: 2, justifyContent: 'center' },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
    maxWidth: 240,
  },
  attachText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  suggestions: { marginTop: 10, gap: 8, alignSelf: 'stretch', maxWidth: '86%' },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestionText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  footnote: { fontSize: 11, marginTop: 6, marginLeft: 4, fontStyle: 'italic' },
  msgText: {
    fontSize: 14,
    lineHeight: 21,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  typingBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  inputBox: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 2,
    paddingBottom: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  editorLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  editorInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  editorCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
  },
  editorCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editorSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  editorSaveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  memoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  memoryKey: {
    fontSize: 12,
  },
  memoryValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memoryVal: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: 190,
  },
  addContextBtn: {
    width: '100%',
    marginTop: 14,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContextText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
