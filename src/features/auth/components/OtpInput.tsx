import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthPalette, useAuthStyles } from './authTheme';

export const OTP_LENGTH = 6;

/**
 * Six digit boxes backed by one hidden TextInput, so typing, deleting, pasting and the
 * iOS/Android "from Messages/Mail" code suggestion all work like a normal field.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  error,
  shakeKey = 0,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  /** Change this number to play the "wrong code" shake. */
  shakeKey?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const { A, styles } = useAuthStyles(createStyles);
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shakeKey) return;
    shake.setValue(0);
    Animated.sequence(
      [-8, 8, -6, 6, -3, 0].map(toValue => Animated.timing(shake, { toValue, duration: 55, useNativeDriver: true })),
    ).start();
  }, [shakeKey, shake]);

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    onChange(digits);
    if (digits.length === OTP_LENGTH) {
      onComplete?.(digits);
    }
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="Verification code" disabled={disabled}>
      <Animated.View style={[styles.row, { transform: [{ translateX: shake }] }, disabled && styles.disabled]}>
        {Array.from({ length: OTP_LENGTH }, (_, i) => {
          const active = focused && (i === value.length || (i === OTP_LENGTH - 1 && value.length === OTP_LENGTH));
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  borderColor: error ? A.RED : active ? A.FOCUS_BORDER : A.GLASS_BORDER,
                  backgroundColor: active ? A.FOCUS_BG : A.GLASS,
                  boxShadow: active && !error ? A.FOCUS_GLOW : A.REST_SHADOW,
                },
              ]}
            >
              <Text style={styles.digit}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    box: {
      flex: 1,
      maxWidth: 52,
      aspectRatio: 0.85,
      borderWidth: 1,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.6 },
    digit: {
      fontSize: 24,
      fontWeight: '700',
      color: A.TEXT,
    },
    // Kept on screen (not display:none) so it can hold focus and receive autofill.
    hiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
  });
