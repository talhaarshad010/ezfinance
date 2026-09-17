import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  track: string;
  animate?: boolean;
}

/** Circular progress ring used by the savings goal cards and goal detail hero. */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  pct,
  size = 56,
  strokeWidth = 4,
  color,
  track,
  animate = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(pct, 100));
  const offset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    const target = circumference - (clamped / 100) * circumference;
    if (!animate) {
      offset.setValue(target);
      return;
    }
    Animated.timing(offset, {
      toValue: target,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, circumference, animate, offset]);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={track}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset as unknown as number}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export default ProgressRing;
