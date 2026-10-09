import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPalette, useAuthStyles } from './authTheme';
import { PrimaryButton } from './AuthButtons';
import { FadeUp, LogoReveal } from './Entrance';
import { Glow } from './Glow';

/** Big success state with the glowing emerald check (sign-up done, password updated). */
export function SuccessState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const { A, styles } = useAuthStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.done, { paddingBottom: insets.bottom + 28 }]} accessibilityLiveRegion="polite">
      <LogoReveal style={styles.doneIconWrap}>
        <Glow size={130} stops={[[0, '#00E68A', 0.22], [0.72, '#00E68A', 0]]} />
        <View style={styles.doneIcon}>
          <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
            <Circle cx="20" cy="20" r="18" fill="rgba(0,230,138,0.2)" />
            <Circle cx="20" cy="20" r="13" fill={A.EMERALD} />
            <Path d="M13 20l5.5 5.5 9.5-10" stroke="#0D0D0E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </LogoReveal>
      <FadeUp delay={140} style={styles.doneText}>
        <Text style={styles.doneTitle}>{title}</Text>
        <Text style={styles.doneBody}>{body}</Text>
      </FadeUp>
      <FadeUp delay={260} style={styles.doneCta}>
        <PrimaryButton label={actionLabel} height={58} onPress={onAction} />
      </FadeUp>
    </View>
  );
}

/** "You are all set!" — shown once a new account is ready. */
export function SignUpDone({ onContinue }: { onContinue: () => void }) {
  return (
    <SuccessState
      title="You are all set!"
      body="Your ezFinance account is ready. Let us take control of your finances together."
      actionLabel="Go to my dashboard"
      onAction={onContinue}
    />
  );
}

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    done: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 28,
    },
    doneIconWrap: { alignItems: 'center', justifyContent: 'center' },
    doneIcon: {
      width: 88,
      height: 88,
      borderRadius: 26,
      backgroundColor: 'rgba(0,230,138,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(0,230,138,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 48px rgba(0,230,138,0.22)',
    },
    doneText: { alignItems: 'center' },
    doneTitle: {
      fontSize: 30,
      fontWeight: '700',
      color: A.TEXT,
      letterSpacing: -0.7,
      textAlign: 'center',
    },
    doneBody: {
      fontSize: 16,
      color: A.MUTED,
      lineHeight: 26,
      maxWidth: 260,
      marginTop: 14,
      textAlign: 'center',
    },
    doneCta: { width: '100%', marginTop: 8 },
  });
