import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AuthPalette, useAuthStyles, useAuthTheme } from './authTheme';
import { useAuthGuard } from './AuthGuard';
import { formatTime, MSG } from './authMessages';
import { FadeUp } from './Entrance';

// Inline errors, notices and the offline / lockout banners for the auth screens.

export type NoticeTone = 'error' | 'info' | 'success';
export type NoticeData = { tone: NoticeTone; text: ReactNode };

export function ErrorIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={iconStyle}>
      <Circle cx="8" cy="8" r="6.75" stroke={color} strokeWidth={1.5} />
      <Path d="M8 4.75v3.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="8" cy="11" r="0.9" fill={color} />
    </Svg>
  );
}

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none" style={iconStyle}>
      <Circle cx="8" cy="8" r="6.75" stroke={color} strokeWidth={1.5} />
      <Path d="M8 7.25V11" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="8" cy="5" r="0.9" fill={color} />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none" style={iconStyle}>
      <Circle cx="8" cy="8" r="6.75" stroke={color} strokeWidth={1.5} />
      <Path d="M5.25 8.25l1.9 1.9 3.6-3.9" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Red message with an icon, shown under a field. */
export function FieldError({ children }: { children?: ReactNode }) {
  const { A, styles } = useAuthStyles(createStyles);
  if (!children) return null;
  return (
    <FadeUp distance={-6} duration={220} style={styles.fieldError}>
      <ErrorIcon color={A.RED} />
      <Text style={[styles.fieldErrorText, { color: A.RED }]} accessibilityLiveRegion="polite">
        {children}
      </Text>
    </FadeUp>
  );
}

/** Card-style message near the top of the screen. */
export function Notice({ tone, children }: { tone: NoticeTone; children: ReactNode }) {
  const { A, styles } = useAuthStyles(createStyles);
  const color = tone === 'error' ? A.RED : tone === 'success' ? A.EMERALD_TEXT : A.SKY;
  return (
    <FadeUp distance={-6} duration={220} style={styles.notice}>
      {tone === 'error' ? <ErrorIcon color={color} /> : tone === 'success' ? <CheckIcon color={color} /> : <InfoIcon color={color} />}
      <Text
        style={[styles.noticeText, { color: tone === 'error' ? A.RED : A.TEXT }]}
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
      >
        {children}
      </Text>
    </FadeUp>
  );
}

/** Offline bar, lockout countdown and an optional screen notice. Place right under the safe area. */
export function AuthBanners({ notice }: { notice?: NoticeData | null }) {
  const { A, styles } = useAuthStyles(createStyles);
  const { offline, lockedSeconds } = useAuthGuard();
  return (
    <View>
      {offline && (
        <FadeUp distance={-6} duration={220} style={styles.offlineBar}>
          <OfflineIcon color={A.MUTED} />
          <Text style={styles.offlineText}>{MSG.offline}</Text>
        </FadeUp>
      )}
      {(lockedSeconds > 0 || notice) && (
        <View style={styles.notices}>
          {lockedSeconds > 0 && (
            <Notice tone="error">
              {MSG.tooMany} <Text style={styles.countdown}>({formatTime(lockedSeconds)} left)</Text>
            </Notice>
          )}
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        </View>
      )}
    </View>
  );
}

function OfflineIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 2l12 12M1.5 6a10 10 0 0 1 3.2-2M14.5 6a10 10 0 0 0-6.9-2.9M4 8.6a6 6 0 0 1 2.4-1.4M12 8.6a6 6 0 0 0-1.3-.9M6.3 11.1a2.6 2.6 0 0 1 3.4 0"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Blue underlined link inside messages (e.g. "Resend code"). */
export function InlineLink({ children, onPress, disabled }: { children: ReactNode; onPress: () => void; disabled?: boolean }) {
  const A = useAuthTheme();
  return (
    <Text
      onPress={disabled ? undefined : onPress}
      style={{ color: A.LINK, fontWeight: '600', textDecorationLine: 'underline', opacity: disabled ? 0.4 : 1 }}
    >
      {children}
    </Text>
  );
}

const iconStyle = { marginTop: 1 };

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    fieldError: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
    fieldErrorText: { flex: 1, fontSize: 13, lineHeight: 19, letterSpacing: -0.1 },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      marginTop: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: A.GLASS,
      borderColor: A.GLASS_BORDER,
      boxShadow: A.REST_SHADOW,
    },
    noticeText: { flex: 1, fontSize: 13, lineHeight: 19, letterSpacing: -0.1 },
    notices: { paddingHorizontal: 24 },
    countdown: { color: A.MUTED, fontVariant: ['tabular-nums'] },
    offlineBar: {
      height: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: A.INK(0.06),
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: A.INK(0.06),
    },
    offlineText: { fontSize: 12, fontWeight: '500', color: A.MUTED },
  });
