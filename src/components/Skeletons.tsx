import React, { ReactNode, useEffect } from 'react';
import {
  AccessibilityInfo,
  Animated,
  DimensionValue,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// One shared pulse (opacity 1 ↔ 0.5, 1.2s) on the native driver; static when Reduce Motion is on.
const pulse = new Animated.Value(1);
let pulseStarted = false;
function usePulse() {
  useEffect(() => {
    if (pulseStarted) return;
    pulseStarted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (reduce) return;
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.5, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    });
  }, []);
}

/** Single shape — stands in for a text line, number, icon circle or progress bar. */
export function Sk({
  w = '100%',
  h = 12,
  r = 6,
  tone,
  style,
}: {
  w?: DimensionValue;
  h?: number;
  r?: number;
  tone?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  usePulse();
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: r, backgroundColor: tone ?? theme.MODAL, opacity: pulse }, style]}
    />
  );
}

function Busy({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityLabel="Loading" accessibilityState={{ busy: true }} style={style}>
      {children}
    </View>
  );
}

function Card({
  children,
  r = 20,
  pad = 16,
  style,
}: {
  children: ReactNode;
  r?: number;
  pad?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return <View style={[{ backgroundColor: theme.CARD, borderRadius: r, padding: pad }, style]}>{children}</View>;
}

const Row = ({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

function Lines({ a = '60%', b = '38%' }: { a?: DimensionValue; b?: DimensionValue }) {
  return (
    <View style={sk.lines}>
      <Sk w={a} h={12} />
      <Sk w={b} h={9} />
    </View>
  );
}

/** Stand-alone screen: background + safe-area header (eyebrow + title + round button). */
function Screen({ children, title = 28, right = true }: { children: ReactNode; title?: number; right?: boolean }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Busy style={[sk.screen, { backgroundColor: theme.BG, paddingTop: insets.top + 12 }]}>
      <View style={sk.header}>
        <View style={sk.headerText}>
          <Sk w={150} h={10} />
          <Sk w={130} h={title} r={8} />
        </View>
        {right && <Sk w={38} h={38} r={100} />}
      </View>
      {children}
    </Busy>
  );
}

// ── Home sub-tabs ────────────────────────────────────────────────────────────

/** `checklist`: a signed-in user who still sees the Getting started card. */
export function DashLiveSkeleton({ checklist }: { checklist?: boolean }) {
  const { theme } = useTheme();
  const metric = (
    <View style={[sk.metric, { backgroundColor: theme.isDark ? theme.CARD : '#FAFAF8' }]}>
      <Sk w="62%" h={9} style={sk.mb10} />
      <Sk w="70%" h={29} r={8} style={sk.mb6} />
      <Sk w="50%" h={10} />
      <Sk w="100%" h={5} r={3} style={sk.pushDown} />
    </View>
  );
  return (
    <Busy style={sk.stack12}>
      {checklist && (
        <View style={[sk.checklist, { backgroundColor: theme.HERO_BG }]}>
          <Sk w={130} h={16} tone="#2A2A2E" style={sk.mb8} />
          <Sk w={190} h={11} tone="#2A2A2E" style={sk.mb12} />
          <Sk h={4} r={2} tone="#2A2A2E" style={sk.mb8} />
          {[0, 1, 2].map(i => (
            <Row key={i} style={sk.pad10}>
              <Sk w={22} h={22} r={100} tone="#2A2A2E" />
              <Sk w="50%" h={13} tone="#2A2A2E" />
            </Row>
          ))}
        </View>
      )}
      <Card pad={14}>
        <Row>
          <Sk w={18} h={18} r={100} />
          <Lines a="70%" b="48%" />
        </Row>
      </Card>
      <View style={[sk.hero, { backgroundColor: theme.HERO_BG }]}>
        <Sk w={150} h={10} tone="#2A2A2E" style={sk.mb12} />
        <Sk w={210} h={56} r={10} tone="#2A2A2E" />
        <Sk w={32} h={11} tone="#2A2A2E" style={sk.mt8} />
        <Row gap={32} style={sk.pushDown}>
          {[0, 1, 2].map(i => (
            <View key={i} style={sk.col6}>
              <Sk w="60%" h={9} tone="#2A2A2E" />
              <Sk w="85%" h={16} tone="#2A2A2E" />
            </View>
          ))}
        </Row>
      </View>
      <Row gap={10}>
        {metric}
        {metric}
      </Row>
      <Row gap={10}>
        {metric}
        {metric}
      </Row>
      <Card r={24} pad={18}>
        <Row style={sk.spaceBetween}>
          <Sk w={110} h={13} />
          <Sk w={60} h={11} />
        </Row>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={sk.catRow}>
            <Row style={sk.spaceBetweenMb8}>
              <Sk w="34%" h={12} />
              <Sk w="26%" h={12} />
            </Row>
            <Sk h={4} r={2} />
          </View>
        ))}
      </Card>
    </Busy>
  );
}

export function DashMonthlySkeleton() {
  return (
    <Busy style={sk.stack12}>
      <Sk h={44} r={100} />
      <Card r={24} pad={20}>
        <Sk w={100} h={10} style={sk.mb16} />
        <Row gap={36} style={sk.mb16}>
          {[0, 1].map(i => (
            <View key={i} style={sk.col6}>
              <Sk w="60%" h={10} />
              <Sk w="85%" h={28} r={8} />
              <Sk w={30} h={10} />
            </View>
          ))}
        </Row>
        <Sk h={8} r={4} />
      </Card>
      <Row gap={10}>
        {[0, 1].map(i => (
          <Card key={i} style={sk.flex1}>
            <Sk w="60%" h={10} style={sk.mb8} />
            <Sk w="70%" h={26} r={8} />
          </Card>
        ))}
      </Row>
      <Card r={24} pad={18}>
        {[0, 1, 2, 3].map(i => (
          <Row key={i} style={sk.pad10}>
            <Sk w={32} h={32} r={100} />
            <Lines />
          </Row>
        ))}
      </Card>
    </Busy>
  );
}

export function DashHealthSkeleton() {
  return (
    <Busy style={sk.stack12}>
      <Card r={24} pad={24} style={sk.centerCol}>
        <Sk w={128} h={128} r={100} />
        <Sk w={200} h={11} />
        <Sk w={160} h={11} />
      </Card>
      {[0, 1, 2, 3].map(i => (
        <Card key={i}>
          <Row gap={14}>
            <Lines a="70%" b="45%" />
            <Sk w={48} h={18} />
          </Row>
        </Card>
      ))}
      <Sk h={50} r={100} />
    </Busy>
  );
}

export function DashInsightsSkeleton() {
  return (
    <Busy style={sk.stack10}>
      <Sk w={140} h={10} style={sk.mb4} />
      {[0, 1, 2, 3].map(i => (
        <Card key={i}>
          <Row style={sk.alignStart}>
            <Sk w={36} h={36} r={11} />
            <View style={sk.col6}>
              <Sk w="75%" h={13} />
              <Sk w="95%" h={10} />
              <Sk w="60%" h={10} />
            </View>
          </Row>
        </Card>
      ))}
    </Busy>
  );
}

/** Smart Insight card while it loads (section-level skeleton). */
export function InsightCardSkeleton() {
  return (
    <Card pad={14}>
      <Row gap={10} style={sk.alignStart}>
        <Sk w={7} h={7} r={4} style={sk.mt5} />
        <View style={sk.col6}>
          <Sk w="90%" h={12} />
          <Sk w="60%" h={12} />
        </View>
      </Row>
    </Card>
  );
}

// ── Expenses tabs ────────────────────────────────────────────────────────────

function TxRows({ n }: { n: number }) {
  const { theme } = useTheme();
  return (
    <View style={[sk.txCard, { backgroundColor: theme.CARD }]}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={[sk.txRow, i < n - 1 && { borderBottomWidth: 2, borderBottomColor: theme.BG }]}>
          <Row>
            <Sk w={40} h={40} r={14} />
            <Lines a="58%" b="40%" />
            <Sk w={56} h={14} />
          </Row>
        </View>
      ))}
    </View>
  );
}

export function ExpTransactionsSkeleton() {
  return (
    <Busy style={sk.stack12}>
      <Row gap={10}>
        {[0, 1].map(i => (
          <Card key={i} r={18} pad={14} style={sk.flex1}>
            <View style={sk.col6}>
              <Sk w="55%" h={9} />
              <Sk w="70%" h={17} />
            </View>
          </Card>
        ))}
      </Row>
      <Card r={16} pad={12}>
        <Row gap={10}>
          <Sk w={14} h={14} r={100} />
          <Sk w="50%" h={14} />
        </Row>
      </Card>
      {[3, 4].map((n, g) => (
        <View key={g}>
          <Sk w={120} h={10} style={sk.mb8} />
          <TxRows n={n} />
        </View>
      ))}
    </Busy>
  );
}

export function ExpRecurringSkeleton() {
  return (
    <Busy style={sk.stack12}>
      <Row gap={8}>
        <Sk h={38} r={100} style={sk.flex1} />
        <Sk h={38} r={100} style={sk.flex1} />
      </Row>
      <Card pad={18}>
        <View style={sk.col7}>
          <Sk w={130} h={10} />
          <Sk w={150} h={28} r={8} />
          <Sk w={160} h={10} />
        </View>
      </Card>
      <TxRows n={5} />
    </Busy>
  );
}

export function ExpLoansSkeleton() {
  return (
    <Busy style={sk.stack12}>
      <Card pad={16}>
        <Row style={sk.spaceBetween}>
          <Sk w={140} h={12} />
          <Sk w={100} h={20} />
        </Row>
      </Card>
      {[0, 1].map(i => (
        <Card key={i} r={24} pad={18}>
          <Row style={sk.mb12}>
            <Sk w={40} h={40} r={14} />
            <Lines a="60%" b="40%" />
            <Sk w={48} h={20} />
          </Row>
          <Row gap={8} style={sk.mb12}>
            {[0, 1, 2].map(j => (
              <Sk key={j} h={44} r={14} style={sk.flex1} />
            ))}
          </Row>
          <Sk h={3} r={2} />
        </Card>
      ))}
    </Busy>
  );
}

// ── Stand-alone screens ──────────────────────────────────────────────────────

export function GoalsSkeleton() {
  return (
    <Screen>
      <View style={sk.screenBody}>
        <Card r={24} pad={18}>
          <Row style={sk.spaceBetween}>
            <View style={sk.col7}>
              <Sk w={100} h={9} />
              <Sk w={160} h={24} r={8} />
            </View>
            <Sk w={110} h={28} r={100} />
          </Row>
        </Card>
        {[0, 1, 2].map(i => (
          <Card key={i} r={24} pad={18}>
            <Row style={sk.mb12}>
              <Sk w={42} h={42} r={14} />
              <Lines a="55%" b="35%" />
              <Sk w={44} h={22} r={100} />
            </Row>
            <Row style={sk.spaceBetweenMb8}>
              <Sk w="40%" h={18} />
              <Sk w="22%" h={11} />
            </Row>
            <Sk h={6} r={3} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function InvestmentsSkeleton() {
  return (
    <Screen title={24}>
      <View style={sk.screenBody}>
        <Card r={28} pad={22}>
          <Sk w={120} h={10} style={sk.mb10} />
          <Sk w={200} h={40} r={10} style={sk.mb12} />
          <Sk h={90} r={12} />
        </Card>
        {[0, 1, 2].map(i => (
          <Card key={i} pad={16}>
            <Row>
              <Sk w={40} h={40} r={100} />
              <Lines a="62%" b="40%" />
              <Sk w={64} h={14} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function AISkeleton() {
  const { theme } = useTheme();
  return (
    <Screen title={24}>
      <View style={sk.screenBody}>
        <View style={[sk.bubble, { backgroundColor: theme.CARD }]}>
          <Sk w="95%" h={11} />
          <Sk w="88%" h={11} />
          <Sk w="60%" h={11} />
        </View>
        <Sk w="62%" h={44} r={20} style={sk.alignEnd} />
        <View style={[sk.bubble, { backgroundColor: theme.CARD }]}>
          {(['90%', '75%', '82%', '50%'] as DimensionValue[]).map((w, i) => (
            <Sk key={i} w={w} h={11} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

/** Dark summary card shared by the side-menu screens (amount + three stats). */
function HeroCard() {
  const { theme } = useTheme();
  return (
    <View style={[sk.heroShort, { backgroundColor: theme.HERO_BG }]}>
      <Sk w={170} h={10} tone="#2A2A2E" style={sk.mb12} />
      <Sk w={190} h={44} r={10} tone="#2A2A2E" />
      <Sk w={32} h={11} tone="#2A2A2E" style={sk.mt8} />
      <Row gap={32} style={sk.pushDown}>
        {[0, 1, 2].map(i => (
          <View key={i} style={sk.col6}>
            <Sk w="60%" h={9} tone="#2A2A2E" />
            <Sk w="85%" h={15} tone="#2A2A2E" />
          </View>
        ))}
      </Row>
    </View>
  );
}

const SectionLabel = () => (
  <Row style={sk.sectionLabel}>
    <Sk w={140} h={10} />
    <Sk w={70} h={10} />
  </Row>
);

export function AnalyticsSkeleton() {
  return (
    <Screen right={false}>
      <View style={sk.screenBody}>
        <Row gap={8}>
          {[64, 76, 62, 66].map((w, i) => (
            <Sk key={i} w={w} h={32} r={100} />
          ))}
        </Row>
        <HeroCard />
        <Card r={24} pad={18}>
          <Row style={sk.spaceBetween}>
            <Sk w={120} h={14} />
            <Sk w={80} h={10} />
          </Row>
          <Sk h={110} r={12} style={sk.mb10} />
          <Row style={sk.spaceBetweenFlat}>
            {[0, 1, 2, 3].map(i => (
              <Sk key={i} w={40} h={9} />
            ))}
          </Row>
        </Card>
        <Card r={24} pad={18}>
          <Row style={sk.spaceBetween}>
            <Sk w={150} h={14} />
            <Sk w={70} h={10} />
          </Row>
          {[0, 1, 2].map(i => (
            <Row key={i} style={sk.mb16}>
              <Sk w={34} h={34} r={10} />
              <View style={sk.col6}>
                <Row style={sk.spaceBetweenFlat}>
                  <Sk w="40%" h={12} />
                  <Sk w="30%" h={12} />
                </Row>
                <Sk h={5} r={3} />
              </View>
            </Row>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

export function BudgetPlannerSkeleton() {
  return (
    <Screen>
      <View style={sk.screenBody}>
        <HeroCard />
        <SectionLabel />
        {[0, 1, 2].map(i => (
          <Card key={i} r={22} pad={18}>
            <Row style={sk.mb12}>
              <Sk w={38} h={38} r={12} />
              <Lines a="45%" b="30%" />
            </Row>
            <Sk w="50%" h={16} style={sk.mb10} />
            <Sk h={6} r={3} style={sk.mb10} />
            <Row style={sk.spaceBetweenFlat}>
              <Sk w="28%" h={10} />
              <Sk w="24%" h={10} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function BankAccountsSkeleton() {
  return (
    <Screen>
      <View style={sk.screenBody}>
        <HeroCard />
        <SectionLabel />
        {[0, 1].map(i => (
          <Card key={i} r={22} pad={18}>
            <Row style={sk.mb12}>
              <Sk w={40} h={40} r={12} />
              <Lines a="45%" b="60%" />
            </Row>
            <Sk w="55%" h={20} style={sk.mb12} />
            <Row gap={8}>
              <Sk w={130} h={32} r={100} />
              <Sk w={100} h={32} r={100} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

/** New-user screens: header + empty-state card shape (icon, title, line, 3 samples, button). */
export function NewUserSkeleton({ dashboard }: { dashboard?: boolean }) {
  const { theme } = useTheme();
  return (
    <Screen title={24} right={!!dashboard}>
      <View style={sk.screenBody}>
        {dashboard ? (
          <>
            <Card r={24} pad={18}>
              <Sk w={130} h={16} style={sk.mb8} />
              <Sk w={190} h={11} style={sk.mb12} />
              <Sk h={4} r={2} style={sk.mb12} />
              {[0, 1, 2].map(i => (
                <Row key={i} style={sk.pad10}>
                  <Sk w={22} h={22} r={100} />
                  <Sk w="50%" h={13} />
                </Row>
              ))}
            </Card>
            {[0, 1].map(r => (
              <Row key={r} gap={10}>
                {[0, 1].map(i => (
                  <View
                    key={i}
                    style={[sk.metric, { minHeight: r ? 130 : 158, backgroundColor: theme.isDark ? theme.CARD : '#FAFAF8' }]}
                  >
                    <Sk w="60%" h={9} style={sk.mb10} />
                    <Sk w={30} h={30} r={10} style={sk.mb10} />
                    <Sk w="85%" h={12} />
                  </View>
                ))}
              </Row>
            ))}
          </>
        ) : (
          <Card r={24} pad={22}>
            <Sk w={52} h={52} r={18} style={sk.mb16} />
            <Sk w="60%" h={18} style={sk.mb8} />
            <Sk w="90%" h={12} style={sk.mb6} />
            <Sk w="70%" h={12} style={sk.mb16} />
            {[0, 1, 2].map(i => (
              <Row key={i} style={sk.pad10}>
                <Sk w={32} h={32} r={100} />
                <Sk w="50%" h={13} />
              </Row>
            ))}
            <Sk h={50} r={100} style={sk.mt10} />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const sk = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: { gap: 6 },
  screenBody: { paddingHorizontal: 16, gap: 12 },
  lines: { flex: 1, gap: 6 },
  stack12: { gap: 12 },
  stack10: { gap: 10 },
  metric: { flex: 1, borderRadius: 24, padding: 15, minHeight: 158 },
  hero: { borderRadius: 28, padding: 24, height: 226 },
  heroShort: { borderRadius: 28, padding: 24, height: 214 },
  checklist: { borderRadius: 24, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 8 },
  sectionLabel: { justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 },
  spaceBetweenFlat: { justifyContent: 'space-between' },
  col6: { flex: 1, gap: 6 },
  col7: { gap: 7 },
  flex1: { flex: 1 },
  pushDown: { marginTop: 'auto' },
  spaceBetween: { justifyContent: 'space-between', marginBottom: 16 },
  spaceBetweenMb8: { justifyContent: 'space-between', marginBottom: 8 },
  catRow: { marginBottom: 14 },
  centerCol: { alignItems: 'center', gap: 12 },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignSelf: 'flex-end' },
  pad10: { paddingVertical: 10 },
  txCard: { borderRadius: 20, overflow: 'hidden' },
  txRow: { paddingVertical: 14, paddingHorizontal: 18 },
  bubble: { alignSelf: 'flex-start', width: '82%', borderRadius: 20, padding: 15, gap: 7 },
  mb4: { marginBottom: 4 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mt5: { marginTop: 5 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
});
