import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';

interface Msg {
  id: number;
  role: 'user' | 'ai';
  text: string;
}

const INIT: Msg[] = [
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
    text: `Under Finance Act 2024 slab rates for salaried individuals:

Annual income: PKR 18,00,000
• First PKR 6,00,000 — exempt
• PKR 6,00,001–12,00,000 — 5% → PKR 30,000
• PKR 12,00,001–18,00,000 — 15% → PKR 90,000

Total annual WHT: PKR 1,20,000
Monthly WHT: PKR 10,000
Effective rate: 6.67%

Investing PKR 1,70,000 more in SECP-approved funds reduces this by PKR 40,000 via Section 62 credit.`,
  },
];

const QUICK = [
  'Generate full tax estimate',
  'Optimize savings rate',
  'Calculate Zakat on wealth',
  'Best AMC for Shariah compliance',
  'KSE-100 entry points',
];

const MEMORY = [
  { k: 'Salary', v: 'PKR 1,50,000 / mo · HBL' },
  { k: 'Employer', v: 'Pakistan Software Export Board' },
  { k: 'Tax Profile', v: 'Salaried · FBR Registered' },
  { k: 'Risk Score', v: 'Moderate · 5/10' },
  { k: 'City', v: 'Lahore, Punjab' },
  { k: 'Dependents', v: '2 (Spouse + 1 child)' },
  { k: 'Goals', v: 'House in 5 yr · 6-mo emergency' },
  { k: 'Sec 62 Used', v: 'PKR 30,000 this FY' },
];

function MemorySheet({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const { showToast } = useToast();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
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
                What your CA knows about you
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            {MEMORY.map(m => (
              <View
                key={m.k}
                style={[
                  styles.memoryRow,
                  { borderTopColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.memoryKey, { color: theme.MUTED }]}>
                  {m.k}
                </Text>
                <View style={styles.memoryValWrap}>
                  <Text
                    style={[styles.memoryVal, { color: theme.TEXT }]}
                    numberOfLines={2}
                  >
                    {m.v}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={13}
                    color={theme.MUTED}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              showToast(
                'Add Context dialog opened.',
                'info',
                'Memory Bank',
              )
            }
            style={[styles.addContextBtn, { borderColor: theme.BORDER }]}
          >
            <Text style={[styles.addContextText, { color: theme.MUTED }]}>
              + Add Context
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
      <View
        style={[
          styles.caAvatarBadge,
          { backgroundColor: theme.ACTIVE },
        ]}
      >
        <Feather name="cpu" size={10} color="#FFFFFF" />
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

export const AIAdvisorScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [msgs, setMsgs] = useState<Msg[]>(INIT);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showMem, setShowMem] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [msgs, typing]);

  function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;

    const userMsg: Msg = { id: Date.now(), role: 'user', text: q };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const aiReply: Msg = {
        id: Date.now() + 1,
        role: 'ai',
        text:
          'Analyzing your financial profile and the latest FBR regulations — based on your monthly income, here is the breakdown and tax optimization strategy.',
      };
      setMsgs(m => [...m, aiReply]);
    }, 1200);
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
            <View>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Personal CA
              </Text>
              <Text style={[styles.headerSub, { color: theme.MUTED }]}>
                AI Chartered Accountant · Pakistan
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowMem(true)}
              style={[styles.memoryBtn, { backgroundColor: theme.TEXT }]}
            >
              <Feather name="cpu" size={13} color={theme.BG} />
              <Text style={[styles.memoryBtnText, { color: theme.BG }]}>
                Memory
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Suggestion Pills Horizontal Row */}
        <View style={styles.quickRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickContentContainer}
          >
            {QUICK.map(q => (
              <TouchableOpacity
                key={q}
                activeOpacity={0.8}
                onPress={() => send(q)}
                style={[styles.quickPill, { backgroundColor: theme.CARD }]}
              >
                <Text style={[styles.quickPillText, { color: theme.TEXT }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Message Thread */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatScrollContent}
        >
          {msgs.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.msgWrapper,
                  { alignItems: isUser ? 'flex-end' : 'flex-start' },
                ]}
              >
                {!isUser && (
                  <View style={styles.aiBadgeHeader}>
                    <View
                      style={[
                        styles.caAvatarBadge,
                        { backgroundColor: theme.ACTIVE },
                      ]}
                    >
                      <Feather name="cpu" size={10} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.aiBadgeText, { color: theme.MUTED }]}>
                      CA · ezFinance
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.msgBubble,
                    {
                      backgroundColor: isUser ? theme.TEXT : theme.CARD,
                      borderBottomRightRadius: isUser ? 4 : 20,
                      borderBottomLeftRadius: isUser ? 20 : 4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      { color: isUser ? theme.BG : theme.TEXT },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {typing && <TypingDots />}
        </ScrollView>

        {/* Bottom Input Field */}
        <View style={[styles.inputBox, { paddingBottom: insets.bottom + 80 }]}>
          <View
            style={[
              styles.inputInnerRow,
              { borderBottomColor: theme.TEXT },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              placeholder="Ask your CA…"
              placeholderTextColor={theme.MUTED}
              style={[styles.textInput, { color: theme.TEXT }]}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => send()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: input.trim() ? theme.TEXT : theme.MODAL,
                },
              ]}
            >
              <Feather
                name="send"
                size={15}
                color={input.trim() ? theme.BG : theme.MUTED}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Memory Bank Sheet Modal */}
      {showMem && <MemorySheet onClose={() => setShowMem(false)} />}
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
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    maxWidth: 180,
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
