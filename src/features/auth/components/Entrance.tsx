import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { EASE_OUT_BEZIER } from './authTheme';

/** `.fade-up` — fade in while rising 16px (0.45s), with optional delay. */
export function FadeUp({
  delay = 0,
  duration = 450,
  distance = 16,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.bezier(...EASE_OUT_BEZIER),
      useNativeDriver: true,
    }).start();
  }, [v, delay, duration]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** `.logo-reveal` — springy scale-up with a slight overshoot (0.8s). */
export function LogoReveal({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 800,
      easing: Easing.bezier(0.34, 1.26, 0.64, 1),
      useNativeDriver: true,
    }).start();
  }, [v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** `.slide-in-right / .slide-in-left` — 32px horizontal slide + fade (0.3s). Re-key to replay. */
export function SlideIn({
  from,
  style,
  children,
}: {
  from: 'right' | 'left';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 300,
      easing: Easing.bezier(...EASE_OUT_BEZIER),
      useNativeDriver: true,
    }).start();
  }, [v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [from === 'right' ? 32 : -32, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
