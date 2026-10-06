import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
  DimensionValue,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../../../../context/ThemeContext';

// Soft blurred orb — a radial gradient circle padded by `blur` so the
// falloff reads like the CSS `filter: blur()` used in the design.
function Orb({
  id,
  color,
  size,
  blur,
  opacity,
  position,
}: {
  id: string;
  color: string;
  size: number;
  blur: number;
  opacity: number;
  position: {
    top?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
    bottom?: DimensionValue;
  };
}) {
  const d = size + blur * 2;
  return (
    <View
      pointerEvents="none"
      style={[styles.orb, position, { width: size, height: size }]}
    >
      <Svg
        width={d}
        height={d}
        style={{ position: 'absolute', top: -blur, left: -blur }}
      >
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.45" stopColor={color} stopOpacity={opacity * 0.55} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function FadeUp({
  delay,
  offset,
  children,
}: {
  delay: number;
  offset: number;
  children: React.ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [offset, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function InvestmentComingSoon({ onExplore }: { onExplore: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      {/* Blurred orbs */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Orb id="orbA" color="#00C853" size={320} blur={72} opacity={0.38} position={{ top: '-8%', left: '-18%' }} />
        <Orb id="orbB" color="#00BFA5" size={280} blur={64} opacity={0.32} position={{ top: '30%', right: '-22%' }} />
        <Orb id="orbC" color="#64D2FF" size={260} blur={72} opacity={0.22} position={{ bottom: '4%', left: '10%' }} />
        <Orb id="orbD" color="#00C853" size={180} blur={56} opacity={0.18} position={{ top: '52%', left: '28%' }} />
      </View>

      <View style={styles.content}>
        <FadeUp delay={100} offset={12}>
          <Text style={styles.eyebrow}>INVESTMENTHUB</Text>
        </FadeUp>

        <FadeUp delay={180} offset={16}>
          <Text style={[styles.title, { color: theme.TEXT }]}>
            Coming{'\n'}Soon
          </Text>
        </FadeUp>

        <FadeUp delay={260} offset={10}>
          <Text style={[styles.subtitle, { color: theme.MUTED }]}>
            Mutual funds, SECP onboarding, portfolio tracking,{'\n'}and
            AI-driven allocation — arriving shortly.
          </Text>
        </FadeUp>

        <FadeUp delay={340} offset={8}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onExplore}
            style={[styles.exploreBtn, { borderColor: theme.BORDER }]}
          >
            <Text style={[styles.exploreText, { color: theme.TEXT }]}>
              Explore now →
            </Text>
          </TouchableOpacity>
        </FadeUp>
      </View>
    </View>
  );
}

export default InvestmentComingSoon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 44,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00BFA5',
    letterSpacing: 2.2,
    marginBottom: 18,
    textAlign: 'center',
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: 54,
    marginBottom: 18,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 48,
    textAlign: 'center',
  },
  exploreBtn: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 100,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
