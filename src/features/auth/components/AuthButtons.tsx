import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuthTheme } from './authTheme';

// `.btn-press:active` → scale(0.965), opacity .88
const pressed = { transform: [{ scale: 0.965 }], opacity: 0.88 };

/**
 * Solid pill — the primary CTA (white on dark, ink on light).
 * `dim`: form incomplete. Looks inactive but stays tappable, so the screen can explain what's missing.
 * `disabled`: truly unavailable (offline, locked out). `loading` shows a spinner and `loadingText`.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  dim,
  loading,
  loadingText,
  height = 56,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  dim?: boolean;
  loading?: boolean;
  loadingText?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const A = useAuthTheme();
  const off = disabled || loading;
  const muted = !loading && (disabled || dim);
  const fontSize = height > 56 ? 17 : 16;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed: p }) => [
        styles.pill,
        {
          height,
          backgroundColor: muted ? A.DISABLED_BG : A.PRIMARY_BG,
          boxShadow: muted || loading ? undefined : A.PRIMARY_SHADOW,
          opacity: loading ? 0.86 : 1,
        },
        p && !off && pressed,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.glassRow}>
          <ActivityIndicator color={A.PRIMARY_TEXT} />
          {loadingText ? <Text style={[styles.primaryText, { fontSize, color: A.PRIMARY_TEXT }]}>{loadingText}</Text> : null}
        </View>
      ) : (
        <Text style={[styles.primaryText, { fontSize, color: muted ? A.DISABLED_TEXT : A.PRIMARY_TEXT }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Translucent glass pill with a hairline border — secondary actions. */
export function GlassButton({
  children,
  onPress,
  disabled,
  busy,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  /** Unavailable: faded and not tappable. */
  disabled?: boolean;
  /** Working (e.g. "Signing in…"): not tappable but not faded. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const A = useAuthTheme();
  const off = disabled || busy;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      style={({ pressed: p }) => [
        styles.pill,
        styles.glass,
        { backgroundColor: A.SECONDARY_BG, borderColor: A.SECONDARY_BORDER, opacity: disabled && !busy ? 0.4 : 1 },
        p && !off && { ...pressed, backgroundColor: A.SECONDARY_PRESSED },
        style,
      ]}
    >
      <View style={styles.glassRow}>
        {typeof children === 'string' ? (
          <Text style={[styles.glassText, { color: A.TEXT }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

/** Plain text button (Skip, Back, links). */
export function TextButton({
  label,
  onPress,
  style,
  textStyle,
  hitSlop = 8,
}: {
  label: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hitSlop?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={hitSlop} style={({ pressed: p }) => [style, p && { opacity: 0.6 }]}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

/** "‹ Back" chevron used by the auth headers. */
export function BackChevron({ color, size = 18 }: { color?: string; size?: number }) {
  const A = useAuthTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M11 4L6 9l5 5" stroke={color ?? A.MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <Path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" fill="#FBBC05" />
      <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.165 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  glass: {
    height: 56,
    borderWidth: 1,
  },
  glassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
