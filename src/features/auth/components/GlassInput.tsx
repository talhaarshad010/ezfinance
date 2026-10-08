import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAuthTheme } from './authTheme';

function EyeIcon({ open, size, color }: { open: boolean; size: number; color: string }) {
  return open ? (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6Z" stroke={color} strokeWidth={1.5} />
      <Circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth={1.5} />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M3 3l14 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M11.4 11.4A2.5 2.5 0 0 1 7.6 8.6M5.3 5.3C3.7 6.5 2.6 8.1 2 10c1.3 3.5 4.3 6 8 6 1.5 0 2.9-.4 4.1-1.1M8.5 4.1C9 4 9.5 4 10 4c3.7 0 6.7 2.5 8 6-.5 1.3-1.2 2.5-2.2 3.4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface GlassInputProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label?: string;
  /** `md` = login card field (52px), `lg` = sign-up step field (58px). */
  size?: 'md' | 'lg';
  password?: boolean;
  /** Rendered under the field (e.g. "Forgot password?"). */
  suffix?: React.ReactNode;
  /** Inline error under the field; also turns the border red. */
  error?: string;
}

/** Frosted text field that glows sky-blue while focused. */
export function GlassInput({
  label,
  size = 'md',
  password,
  suffix,
  error,
  onFocus,
  onBlur,
  ...inputProps
}: GlassInputProps) {
  const A = useAuthTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const lg = size === 'lg';

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: A.LABEL }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            borderRadius: lg ? 16 : 14,
            borderColor: error ? A.RED : focused ? A.FOCUS_BORDER : A.GLASS_BORDER,
            backgroundColor: focused ? A.FOCUS_BG : A.GLASS,
            boxShadow: error ? A.REST_SHADOW : focused ? A.FOCUS_GLOW : A.REST_SHADOW,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={password && !revealed}
          placeholderTextColor={A.PLACEHOLDER}
          selectionColor={A.SKY}
          keyboardAppearance={A.isDark ? 'dark' : 'light'}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: A.TEXT,
              height: lg ? 58 : 52,
              fontSize: lg ? 17 : 15,
              paddingLeft: lg ? 20 : 16,
              paddingRight: password ? (lg ? 52 : 48) : lg ? 20 : 16,
            },
          ]}
        />
        {password && (
          <Pressable
            onPress={() => setRevealed(r => !r)}
            hitSlop={8}
            style={({ pressed }) => [styles.eye, { opacity: pressed ? 0.9 : 0.42 }]}
          >
            <EyeIcon open={revealed} size={lg ? 20 : 19} color={A.ICON} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={[styles.error, { color: A.RED }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {suffix}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  field: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
  },
  error: { fontSize: 12, marginTop: -1 },
  eye: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
});

export default GlassInput;
