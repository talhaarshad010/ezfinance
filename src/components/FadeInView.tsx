import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

type Direction = 'up' | 'forward' | 'back' | 'none';

interface FadeInViewProps {
  /** `up` rises in; `forward` enters from the right; `back` enters from the left. */
  from?: Direction;
  distance?: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Fades + slides its children in on mount. Give it a changing `key`
 * (e.g. the active tab or view) to replay the transition on every switch.
 */
export function FadeInView({
  from = 'up',
  distance = 14,
  duration = 300,
  delay = 0,
  style,
  children,
}: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [progress, duration, delay]);

  const offset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [from === 'back' ? -distance : distance, 0],
  });

  const transform =
    from === 'up'
      ? [{ translateY: offset }]
      : from === 'forward' || from === 'back'
      ? [{ translateX: offset }]
      : [];

  return (
    <Animated.View style={[style, { opacity: progress, transform }]}>
      {children}
    </Animated.View>
  );
}

export default FadeInView;
