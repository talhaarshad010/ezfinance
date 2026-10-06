import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

let glowId = 0;

/**
 * Soft radial glow (CSS `radial-gradient(circle, c1 0%, c2 50%, transparent 70%)`).
 * `stops` are [offset 0..1, color, opacity].
 */
export function Glow({
  size,
  stops,
  style,
  pulse,
}: {
  size: number;
  stops: [number, string, number][];
  style?: StyleProp<ViewStyle>;
  /** Slow breathing animation (glowPulse: 3s, scale 1 → 1.06, opacity .6 → 1). */
  pulse?: boolean;
}) {
  const id = useRef(`authGlow${glowId++}`).current;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, pulse]);

  const animStyle = pulse
    ? {
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
      }
    : null;

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style, animStyle]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={id} cx="50%" cy="50%" r="50%">
              {stops.map(([offset, color, opacity], i) => (
                <Stop key={i} offset={offset} stopColor={color} stopOpacity={opacity} />
              ))}
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
        </Svg>
      </View>
    </Animated.View>
  );
}

export default Glow;
