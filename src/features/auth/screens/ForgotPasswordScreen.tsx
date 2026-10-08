import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../../context/ToastContext';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, PrimaryButton, TextButton } from '../components/AuthButtons';
import { GlassInput } from '../components/GlassInput';
import { FadeUp, LogoReveal } from '../components/Entrance';
import { Glow } from '../components/Glow';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

function MailIcon({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Rect x={5} y={9} width={26} height={19} rx={4} stroke={color} strokeWidth={2} />
      <Path d="M6.5 11.5 18 20l11.5-8.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Mock reset request — swap for the real auth call (e.g. Firebase sendPasswordResetEmail). */
const requestReset = (_email: string) => new Promise<void>(resolve => setTimeout(resolve, 600));

/** Forgot password: email form → "Check your email" with a resend cooldown. */
export const ForgotPasswordScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);
  const error = touched && trimmed.length > 0 && !valid ? 'Enter a valid email address' : undefined;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setTouched(true);
    if (!valid || isLoading) return;
    setIsLoading(true);
    try {
      await requestReset(trimmed);
      setSentTo(trimmed);
      setCooldown(RESEND_SECONDS);
    } catch {
      showToast("Couldn't send the link. Check your connection and try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    if (!sentTo || cooldown > 0) return;
    try {
      await requestReset(sentTo);
      setCooldown(RESEND_SECONDS);
      showToast('Reset link sent again', 'success');
    } catch {
      showToast("Couldn't send the link. Try again.", 'error');
    }
  };

  const back = (
    <TextButton
      onPress={() => (sentTo ? setSentTo(null) : navigation.goBack())}
      style={styles.backBtn}
      label={
        <View style={styles.backRow}>
          <BackChevron />
          <Text style={styles.backText}>Back</Text>
        </View>
      }
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />

      {sentTo ? (
        // ── Sent ────────────────────────────────────────────────
        <View style={[styles.sent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
          {back}
          <View style={styles.sentBody}>
            <LogoReveal style={styles.iconWrap}>
              <Glow size={130} stops={[[0, A.SKY, 0.22], [0.72, A.SKY, 0]]} />
              <View style={styles.icon}>
                <MailIcon color={A.SKY} />
              </View>
            </LogoReveal>
            <FadeUp delay={140} style={styles.sentText}>
              <Text style={styles.sentTitle}>Check your email</Text>
              <Text style={styles.sentLine}>
                We sent a password reset link to{'\n'}
                <Text style={styles.sentEmail}>{sentTo}</Text>
              </Text>
              <Text style={styles.sentHint}>The link expires in 30 minutes. Check your spam folder if you don't see it.</Text>
            </FadeUp>
          </View>

          <FadeUp delay={260} style={styles.actions}>
            <PrimaryButton label="Back to log in" onPress={() => navigation.navigate('Login')} />
            <View style={styles.footerRow}>
              {cooldown > 0 ? (
                <Text style={styles.footerText}>
                  Resend link in 0:{String(cooldown).padStart(2, '0')}
                </Text>
              ) : (
                <>
                  <Text style={styles.footerText}>Didn't get it? </Text>
                  <TextButton label="Resend" onPress={resend} textStyle={[styles.link, styles.footerLink]} />
                </>
              )}
            </View>
          </FadeUp>
        </View>
      ) : (
        // ── Form ────────────────────────────────────────────────
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
            ]}
          >
            {back}

            <FadeUp style={styles.heading}>
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>
                Enter the email linked to your account and we'll send you a link to set a new password.
              </Text>
            </FadeUp>

            <FadeUp delay={140} style={styles.card}>
              <View style={styles.cardEdge} />
              <GlassInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched(true)}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={send}
                error={error}
              />
            </FadeUp>

            <View style={styles.flex} />

            <FadeUp delay={260} style={styles.actions}>
              <PrimaryButton
                label="Send reset link"
                onPress={send}
                disabled={trimmed.length === 0}
                loading={isLoading}
              />
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Remember it? </Text>
                <TextButton
                  label="Log in"
                  onPress={() => navigation.navigate('Login')}
                  textStyle={[styles.link, styles.footerLink]}
                />
              </View>
            </FadeUp>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default ForgotPasswordScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: A.BG },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24 },
    backBtn: { alignSelf: 'flex-start', paddingVertical: 8 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    backText: { color: A.MUTED, fontSize: 15 },
    heading: { marginTop: 24 },
    title: { fontSize: 28, fontWeight: '700', color: A.TEXT, letterSpacing: -0.6 },
    subtitle: { fontSize: 14, color: A.MUTED, marginTop: 8, lineHeight: 21, letterSpacing: -0.1 },
    card: {
      marginTop: 28,
      backgroundColor: A.CARD,
      borderWidth: 1,
      borderColor: A.CARD_BORDER,
      borderRadius: 24,
      paddingVertical: 24,
      paddingHorizontal: 20,
      boxShadow: A.CARD_SHADOW,
    },
    cardEdge: {
      position: 'absolute',
      top: 0,
      left: '10%',
      right: '10%',
      height: 1,
      experimental_backgroundImage: `linear-gradient(90deg, transparent, ${A.INK(0.12)}, transparent)`,
    },
    link: { color: A.LINK, fontSize: 13, fontWeight: '500' },
    actions: { gap: 16, marginTop: 28 },
    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 20 },
    footerText: { fontSize: 14, color: A.MUTED },
    footerLink: { fontSize: 14, fontWeight: '600' },

    sent: { flex: 1, paddingHorizontal: 24 },
    sentBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
    iconWrap: { alignItems: 'center', justifyContent: 'center' },
    icon: {
      width: 88,
      height: 88,
      borderRadius: 26,
      backgroundColor: 'rgba(14,165,233,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(14,165,233,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sentText: { alignItems: 'center' },
    sentTitle: { fontSize: 30, fontWeight: '700', color: A.TEXT, letterSpacing: -0.7 },
    sentLine: { fontSize: 16, color: A.MUTED, lineHeight: 26, marginTop: 14, textAlign: 'center' },
    sentEmail: { color: A.TEXT, fontWeight: '600' },
    sentHint: { fontSize: 13, color: A.HINT, lineHeight: 20, marginTop: 12, maxWidth: 280, textAlign: 'center' },
  });
