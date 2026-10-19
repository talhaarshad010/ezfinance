import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useUserUi } from '../../../context/UserModeContext';
import { TEAL } from './shared';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Tab = 'Home' | 'Expenses' | 'AI Advisor' | 'Investments' | 'Goals';

const TOUR: { tab: Tab; title: string; line: string }[] = [
  { tab: 'Home', title: 'Your money at a glance', line: 'Spending, savings and cash on hand — all on one screen.' },
  { tab: 'Expenses', title: 'Log spending', line: 'Add what you spend by hand, from a receipt, or from bank SMS.' },
  { tab: 'Goals', title: 'Save for something', line: 'Set a target like Umrah or an emergency fund and watch it fill.' },
  { tab: 'Investments', title: 'Grow your money', line: 'Track mutual funds, savings certificates and gold in one place.' },
  { tab: 'AI Advisor', title: 'Ask your accountant', line: 'Ask about tax, Zakat or budgeting, in plain words.' },
];
// Same order and geometry as CustomBottomNav: 5 × (46 + 2×1 margin) buttons, 6 padding, centred.
const DOCK_ORDER: Tab[] = ['Home', 'Expenses', 'AI Advisor', 'Investments', 'Goals'];
const DOCK_W = 6 * 2 + DOCK_ORDER.length * 48;
const DOCK_H = 58;
const HOLE_R = 30;

/** First-run guided tour: spotlights each dock tab with a coach mark and switches tabs as it goes. */
export function TourOverlay() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { endTour, setFirstActionOpen } = useUserUi();
  const [step, setStep] = useState(0);
  const s = TOUR[step];
  const last = step === TOUR.length - 1;

  const dockBottom = Math.max(insets.bottom + 8, 20);
  const xOf = (tab: Tab) => W / 2 - DOCK_W / 2 + 6 + 1 + 23 + DOCK_ORDER.indexOf(tab) * 48;
  const cx = xOf(s.tab);
  const cy = H - dockBottom - DOCK_H / 2;

  const fade = useRef(new Animated.Value(0)).current;
  const holeX = useRef(new Animated.Value(cx)).current;
  const card = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    navigation.navigate('MainTabs', { screen: s.tab });
    Animated.spring(holeX, { toValue: cx, stiffness: 260, damping: 26, mass: 1, useNativeDriver: false }).start();
    card.setValue(0);
    Animated.timing(card, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    endTour();
    navigation.navigate('MainTabs', { screen: 'Home' });
    setTimeout(() => setFirstActionOpen(true), 350);
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, t.root, { opacity: fade }]}>
      {/* Dim everything except a spotlight hole over the active dock tab. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Mask id="tourHole">
            <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
            <AnimatedCircle cx={holeX} cy={cy} r={HOLE_R} fill="#000000" />
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.58)" mask="url(#tourHole)" />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          t.ring,
          {
            top: cy - HOLE_R,
            left: Animated.subtract(holeX, HOLE_R),
            borderColor: TEAL,
            boxShadow: `0 0 0 6px ${TEAL}33`,
          },
        ]}
      />

      {/* Coach mark */}
      <Animated.View
        style={[
          t.card,
          {
            bottom: dockBottom + DOCK_H + 18,
            backgroundColor: theme.CARD,
            opacity: card,
            transform: [{ translateY: card.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        <View style={[t.pointer, { left: cx - 16 - 7, backgroundColor: theme.CARD }]} />
        <View style={t.cardHead}>
          <Text style={t.stepLabel}>
            STEP {step + 1} OF {TOUR.length}
          </Text>
          <TouchableOpacity onPress={finish} hitSlop={8}>
            <Text style={[t.skip, { color: theme.MUTED }]}>Skip tour</Text>
          </TouchableOpacity>
        </View>
        <Text style={[t.title, { color: theme.TEXT }]}>{s.title}</Text>
        <Text style={[t.line, { color: theme.MUTED }]}>{s.line}</Text>
        <View style={t.footer}>
          <View style={t.dots}>
            {TOUR.map((_, i) => (
              <View
                key={i}
                style={[t.dot, { width: i === step ? 18 : 6, backgroundColor: i <= step ? TEAL : 'rgba(128,128,128,0.25)' }]}
              />
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => (last ? finish() : setStep(step + 1))}
            style={[t.next, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[t.nextText, { color: theme.BG }]}>{last ? 'Finish' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const t = StyleSheet.create({
  root: { zIndex: 900 },
  ring: { position: 'absolute', width: HOLE_R * 2, height: HOLE_R * 2, borderRadius: 100, borderWidth: 2 },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },
  pointer: { position: 'absolute', bottom: -7, width: 14, height: 14, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stepLabel: { fontSize: 10, fontWeight: '700', color: TEAL, letterSpacing: 1.4 },
  skip: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  line: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  next: { height: 42, paddingHorizontal: 22, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontSize: 13, fontWeight: '700' },
});
