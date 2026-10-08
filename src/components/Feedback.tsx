import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { AnimatedModal } from './AnimatedModal';

export const LOAD_ERROR = "We couldn't load this. Check your connection and try again.";

/** Load error with "Try again". `compact` = a single-card row; default = a centred block. */
export function ErrorState({
  onRetry,
  compact,
  line = LOAD_ERROR,
}: {
  onRetry: () => void;
  compact?: boolean;
  line?: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        compact ? fb.errCompact : fb.errBlock,
        { backgroundColor: theme.CARD, borderRadius: compact ? 20 : 24 },
      ]}
    >
      <View
        style={[
          fb.errIcon,
          { backgroundColor: theme.MODAL, width: compact ? 34 : 48, height: compact ? 34 : 48 },
        ]}
      >
        <Feather name="cloud-off" size={compact ? 15 : 20} color={theme.MUTED} />
      </View>
      <Text
        style={[
          fb.errText,
          compact ? fb.errTextCompact : fb.errTextBlock,
          { color: theme.TEXT },
        ]}
      >
        {line}
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onRetry}
        accessibilityRole="button"
        style={[fb.retry, { backgroundColor: theme.TEXT, height: compact ? 34 : 42, paddingHorizontal: compact ? 14 : 22 }]}
      >
        <Feather name="rotate-ccw" size={12} color={theme.CARD} />
        <Text style={[fb.retryText, { color: theme.CARD }]}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Screen-level error: header area stays clear, error centred in the content area. */
export function ScreenError({ onRetry }: { onRetry: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={[fb.screenError, { backgroundColor: theme.BG }]}>
      <ErrorState onRetry={onRetry} />
    </View>
  );
}

/** Field error under an input: icon + text, so it isn't colour-only. */
export function FieldError({ msg }: { msg?: string }) {
  const { theme } = useTheme();
  if (!msg) return null;
  return (
    <View accessibilityRole="alert" style={fb.fieldError}>
      <Feather name="alert-circle" size={12} color={theme.RED} />
      <Text style={[fb.fieldErrorText, { color: theme.RED }]}>{msg}</Text>
    </View>
  );
}

/** Pill under the status bar: offline, or syncing after reconnect. Never covers content taps. */
export function OfflineBanner({ online, syncing }: { online: boolean; syncing: boolean }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const show = !online || syncing;
  const appear = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: show ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show, appear]);

  useEffect(() => {
    if (!syncing) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    );
    spin.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [syncing, spin]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        fb.banner,
        {
          top: insets.top + 4,
          backgroundColor: theme.TEXT,
          opacity: appear,
          transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        },
      ]}
    >
      {online && syncing ? (
        <>
          <Animated.View
            style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
          >
            <Feather name="refresh-cw" size={12} color={theme.BG} />
          </Animated.View>
          <Text style={[fb.bannerText, { color: theme.BG }]}>Syncing…</Text>
        </>
      ) : (
        <>
          <Feather name="wifi-off" size={12} color={theme.BG} />
          <Text style={[fb.bannerText, { color: theme.BG }]}>You're offline. Changes will sync later.</Text>
        </>
      )}
    </Animated.View>
  );
}

/** High-impact confirm: one line about what goes away, red labelled action, neutral Cancel. */
export function ConfirmDialog({
  visible,
  title,
  line,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  line: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  return (
    <AnimatedModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={fb.dialogWrap}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View accessibilityRole="alert" style={[fb.dialog, { backgroundColor: theme.CARD }]}>
          <View style={[fb.dialogIcon, { backgroundColor: `${theme.RED}18` }]}>
            <Feather name="trash-2" size={18} color={theme.RED} />
          </View>
          <Text style={[fb.dialogTitle, { color: theme.TEXT }]}>{title}</Text>
          <Text style={[fb.dialogLine, { color: theme.MUTED }]}>{line}</Text>
          <View style={fb.dialogRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              style={[fb.dialogBtn, { backgroundColor: theme.MODAL }]}
            >
              <Text style={[fb.dialogBtnText, { color: theme.TEXT }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              style={[fb.dialogBtn, { backgroundColor: theme.RED }]}
            >
              <Text style={[fb.dialogBtnText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AnimatedModal>
  );
}

const fb = StyleSheet.create({
  errBlock: {
    marginHorizontal: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  errCompact: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errIcon: { borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  errText: {},
  errTextBlock: { fontSize: 13, lineHeight: 19, maxWidth: 260, textAlign: 'center' },
  errTextCompact: { flex: 1, fontSize: 12, lineHeight: 17 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
  },
  retryText: { fontSize: 12, fontWeight: '700' },
  screenError: { flex: 1, justifyContent: 'center', paddingBottom: 110 },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginHorizontal: 2 },
  fieldErrorText: { fontSize: 11, fontWeight: '600' },
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 950,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  bannerText: { fontSize: 11, fontWeight: '600' },
  dialogWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  dialog: { width: '100%', borderRadius: 28, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 18 },
  dialogIcon: {
    width: 44,
    height: 44,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  dialogLine: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  dialogRow: { flexDirection: 'row', gap: 10 },
  dialogBtn: { flex: 1, height: 46, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  dialogBtnText: { fontSize: 13, fontWeight: '700' },
});
