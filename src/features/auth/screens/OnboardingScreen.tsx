import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPalette, useAuthStyles, useAuthTheme } from '../components/authTheme';
import { PrimaryButton, TextButton } from '../components/AuthButtons';
import { SlideIn } from '../components/Entrance';
import {
  GlowCard,
  GlowTone,
  InvestIllustration,
  SavingsIllustration,
  TaxIllustration,
  TrackIllustration,
} from '../components/OnboardingIllustrations';

const SLIDES: { title: string; body: string; Illustration: React.FC; glow: GlowTone }[] = [
  {
    title: 'Track every rupee',
    body: 'See exactly where your money goes. Automatic categorisation for spending, income, and transfers.',
    Illustration: TrackIllustration,
    glow: 'emerald',
  },
  {
    title: 'Understand your taxes in plain language',
    body: 'Know your filer status, estimate taxes, and stay compliant. Province by province guidance included.',
    Illustration: TaxIllustration,
    glow: 'teal',
  },
  {
    title: 'Save toward what matters',
    body: 'Set savings goals and track your progress. Realistic targets built around your actual income.',
    Illustration: SavingsIllustration,
    glow: 'emerald',
  },
  {
    title: 'Grow your money, the halal way',
    body: 'Explore mutual funds, stocks, and government bonds. Plain language explanations for every option.',
    Illustration: InvestIllustration,
    glow: 'teal',
  },
];

const SWIPE_THRESHOLD = 40;

/** Pagination pill: stretches from 7px to 22px and glows sky-blue when active. */
function PageDot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const A = useAuthTheme();
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: active ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.34, 1.26, 0.64, 1),
      useNativeDriver: false,
    }).start();
  }, [active, v]);
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View
        style={[
          dotStyles.dot,
          {
            width: v.interpolate({ inputRange: [0, 1], outputRange: [7, 22] }),
            backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: [A.INK(0.2), A.SKY] }),
            boxShadow: active ? '0 0 10px rgba(14,165,233,0.6)' : undefined,
          },
        ]}
      />
    </Pressable>
  );
}

/** Four illustrated "Get started" slides (swipe, Skip, dots, Continue / Get started). */
export const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { A, styles } = useAuthStyles(createStyles);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);
  const touchX = useRef(0);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const goTo = (next: number, direction: 'right' | 'left') => {
    setDir(direction);
    setAnimKey(k => k + 1);
    setIndex(next);
  };
  const finish = () => navigation.replace('Welcome');
  const next = () => (isLast ? finish() : goTo(index + 1, 'right'));
  const prev = () => index > 0 && goTo(index - 1, 'left');

  return (
    <View
      style={styles.container}
      onTouchStart={e => {
        touchX.current = e.nativeEvent.pageX;
      }}
      onTouchEnd={e => {
        const dx = e.nativeEvent.pageX - touchX.current;
        if (dx < -SWIPE_THRESHOLD) next();
        else if (dx > SWIPE_THRESHOLD) prev();
      }}
    >
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />

      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TextButton label="Skip" onPress={finish} textStyle={styles.skip} />
      </View>

      <SlideIn key={`ill-${animKey}`} from={dir} style={styles.illustrationWrap}>
        <GlowCard tone={slide.glow}>
          <slide.Illustration />
        </GlowCard>
      </SlideIn>

      <View style={styles.flex} />

      <SlideIn key={`txt-${animKey}`} from={dir} style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <PageDot key={i} active={i === index} onPress={() => goTo(i, i > index ? 'right' : 'left')} />
          ))}
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <PrimaryButton label={isLast ? 'Get started' : 'Continue'} onPress={next} />
      </SlideIn>
    </View>
  );
};

export default OnboardingScreen;

const dotStyles = StyleSheet.create({
  dot: { height: 7, borderRadius: 100 },
});

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: A.BG,
    },
    flex: { flex: 1 },
    topBar: {
      height: 40,
      boxSizing: 'content-box',
      paddingHorizontal: 24,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    skip: {
      fontSize: 15,
      color: A.MUTED,
      fontWeight: '500',
      paddingVertical: 6,
    },
    illustrationWrap: {
      paddingTop: 16,
      paddingHorizontal: 24,
    },
    footer: {
      paddingHorizontal: 24,
    },
    dots: {
      flexDirection: 'row',
      gap: 7,
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: A.TEXT,
      marginBottom: 10,
      lineHeight: 31,
      letterSpacing: -0.5,
    },
    body: {
      fontSize: 15,
      color: A.MUTED,
      marginBottom: 28,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
  });
