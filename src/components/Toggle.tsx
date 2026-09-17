import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Colour when on — defaults to the theme green. */
  activeColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { w: 44, h: 26, knob: 20 },
  md: { w: 50, h: 28, knob: 22 },
  lg: { w: 58, h: 32, knob: 24 },
};

/** iOS-style switch used by the ledger, settings and rollover controls. */
export const Toggle: React.FC<ToggleProps> = ({
  on,
  onToggle,
  disabled,
  activeColor,
  size = 'sm',
}) => {
  const { theme } = useTheme();
  const { w, h, knob } = SIZES[size];
  const pad = (h - knob) / 2;
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: on ? 1 : 0,
      useNativeDriver: false,
      friction: 9,
      tension: 70,
    }).start();
  }, [on, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [pad, w - knob - pad],
  });

  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      style={[
        styles.track,
        {
          width: w,
          height: h,
          borderRadius: h / 2,
          backgroundColor: on
            ? activeColor ?? theme.GREEN
            : `${theme.MUTED}44`,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.knob,
          {
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: { justifyContent: 'center' },
  knob: { backgroundColor: '#FFFFFF' },
});

export default Toggle;
