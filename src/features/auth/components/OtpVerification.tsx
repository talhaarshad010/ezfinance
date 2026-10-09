import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../../api/client';
import { AuthPalette, useAuthStyles } from './authTheme';
import { PrimaryButton } from './AuthButtons';
import { FieldError, InlineLink, NoticeData } from './AuthFeedback';
import { authErrorMessage, useAuthGuard } from './AuthGuard';
import { maskEmail } from './authMessages';
import { OTP_LENGTH, OtpInput } from './OtpInput';

/** Supabase allows one email per address per minute. */
export const RESEND_SECONDS = 60;

/**
 * 6-digit code entry used by the sign-up wizard, forgot password and email verification.
 * `onVerify` throws on failure; Supabase reports a wrong and an expired code the same way
 * ("otp_expired"), so both show one message with a Resend link.
 */
export function OtpVerification({
  email,
  variant,
  onVerify,
  onResend,
  onChangeEmail,
  onNotice,
}: {
  email: string;
  /** `page`: standalone screen title. `wizard`: a sign-up step question. */
  variant: 'page' | 'wizard';
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
  onNotice: (notice: NoticeData | null) => void;
}) {
  const { styles } = useAuthStyles(createStyles);
  const insets = useSafeAreaInsets();
  const guard = useAuthGuard();
  const [code, setCode] = useState('');
  const [error, setError] = useState<{ text: string; canResend: boolean } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [sentMsg, setSentMsg] = useState('');

  const masked = maskEmail(email);
  const busy = loading || resending;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value = code) => {
    if (busy || guard.blocked) return;
    if (value.length < OTP_LENGTH) {
      setError({ text: 'Enter the 6-digit code.', canResend: false });
      return;
    }
    onNotice(null);
    setLoading(true);
    try {
      await onVerify(value);
    } catch (e) {
      if ((e as ApiError).code === 'otp_expired') {
        setError({ text: "That code isn't right or has expired.", canResend: true });
        setShakeKey(k => k + 1);
        setCode('');
      } else {
        const msg = authErrorMessage(e, guard);
        if (msg) onNotice({ tone: 'error', text: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (busy || guard.blocked) return;
    setResending(true);
    try {
      await onResend();
      setCode('');
      setError(null);
      setCooldown(RESEND_SECONDS);
      setSentMsg(`We sent a new code to ${masked}.`);
    } catch (e) {
      const msg = authErrorMessage(e, guard);
      if (msg) onNotice({ tone: 'error', text: msg });
    } finally {
      setResending(false);
    }
  };

  const canResend = cooldown <= 0;

  return (
    <View style={styles.container}>
      <View style={variant === 'wizard' ? styles.headWizard : styles.headPage}>
        <Text style={variant === 'wizard' ? styles.question : styles.title}>
          {variant === 'wizard' ? 'Verify your email' : 'Enter the code'}
        </Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to <Text style={styles.email}>{masked}</Text>
        </Text>

        <OtpInput
          value={code}
          onChange={v => {
            setCode(v);
            setError(null);
          }}
          onComplete={verify}
          error={!!error}
          shakeKey={shakeKey}
          disabled={loading}
          autoFocus
        />
        <FieldError>
          {error && (
            <>
              {error.text}
              {error.canResend && canResend && (
                <>
                  {' '}
                  <InlineLink onPress={resend} disabled={busy || guard.blocked}>Resend code</InlineLink>
                </>
              )}
            </>
          )}
        </FieldError>

        <View style={styles.links}>
          <Text style={styles.linkText} accessibilityLiveRegion="polite">
            {resending ? (
              'Sending a new code…'
            ) : canResend ? (
              <>
                Didn't get it? <InlineLink onPress={resend} disabled={busy || guard.blocked}>Resend code</InlineLink>
              </>
            ) : (
              <Text style={styles.tabular}>Resend in {cooldown}s</Text>
            )}
          </Text>
          {sentMsg && !resending ? <Text style={styles.sentMsg}>{sentMsg}</Text> : null}
          <Text style={styles.linkText}>
            Wrong email? <InlineLink onPress={onChangeEmail} disabled={loading}>Change it</InlineLink>
          </Text>
        </View>
      </View>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton
          label="Verify"
          onPress={() => verify()}
          loading={loading}
          loadingText="Verifying…"
          disabled={guard.blocked || resending}
          dim={code.length < OTP_LENGTH}
        />
      </View>
    </View>
  );
}

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: { flex: 1 },
    headPage: { paddingTop: 24 },
    headWizard: { paddingTop: 48 },
    title: { fontSize: 28, fontWeight: '700', color: A.TEXT, letterSpacing: -0.6 },
    question: { fontSize: 26, fontWeight: '700', color: A.TEXT, letterSpacing: -0.5, lineHeight: 31 },
    subtitle: { fontSize: 14, color: A.MUTED, lineHeight: 22, marginTop: 8, marginBottom: 28 },
    email: { color: A.TEXT, fontWeight: '600' },
    links: { marginTop: 22, gap: 12 },
    linkText: { fontSize: 14, color: A.MUTED, minHeight: 20 },
    tabular: { fontVariant: ['tabular-nums'] },
    sentMsg: { fontSize: 13, color: A.MUTED, marginTop: -6 },
    cta: { marginTop: 'auto', paddingTop: 16 },
  });
