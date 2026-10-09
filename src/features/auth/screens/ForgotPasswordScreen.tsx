import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ApiError,
  completePasswordReset,
  requestPasswordReset,
  verifyResetCode,
} from '../../../services/authService';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, PrimaryButton, TextButton } from '../components/AuthButtons';
import { GlassInput } from '../components/GlassInput';
import { FadeUp, SlideIn } from '../components/Entrance';
import { AuthBanners, NoticeData } from '../components/AuthFeedback';
import { authErrorMessage, useAuthGuard } from '../components/AuthGuard';
import { MSG, validateEmail, validatePassword } from '../components/authMessages';
import { OtpVerification } from '../components/OtpVerification';
import { SuccessState } from '../components/SignUpDone';

type Stage = 'request' | 'code' | 'newPassword' | 'done';

/** Forgot password: email → 6-digit code → new password → done, then log in. */
export const ForgotPasswordScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const guard = useAuthGuard();

  const [stage, setStage] = useState<Stage>('request');
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeData | null>(null);
  // Bumped on Back so an in-flight request can't move the flow forward afterwards.
  const attempt = useRef(0);

  const go = (next: Stage, d: 'right' | 'left') => {
    setDir(d);
    setStage(next);
  };

  const back = () => {
    attempt.current++;
    setLoading(false);
    setNotice(null);
    if (stage === 'request') navigation.goBack();
    else if (stage === 'code') go('request', 'left');
    else go('code', 'left');
  };

  const sendCode = async () => {
    if (loading || guard.blocked) return;
    const err = validateEmail(email);
    setEmailError(err ?? undefined);
    if (err) return;
    setNotice(null);
    setLoading(true);
    const id = ++attempt.current;
    try {
      await requestPasswordReset(email);
      if (id !== attempt.current) return;
      // Same response whether or not an account exists.
      setNotice({ tone: 'info', text: MSG.maybeSent });
      go('code', 'right');
    } catch (e) {
      if (id !== attempt.current) return;
      const msg = authErrorMessage(e, guard);
      if (msg) setNotice({ tone: 'error', text: msg });
    } finally {
      if (id === attempt.current) setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    const token = await verifyResetCode(email, code);
    setResetToken(token);
    setNotice(null);
    go('newPassword', 'right');
  };

  const savePassword = async () => {
    if (loading || guard.blocked) return;
    const next = {
      password: validatePassword(password, 'Enter a new password.') ?? undefined,
      confirm: !confirm ? 'Confirm your new password.' : confirm !== password ? MSG.mismatch : undefined,
    };
    setPwErrors(next);
    if (next.password || next.confirm) return;
    setNotice(null);
    setLoading(true);
    const id = ++attempt.current;
    try {
      await completePasswordReset(resetToken, password);
      if (id !== attempt.current) return;
      go('done', 'right');
    } catch (e) {
      if (id !== attempt.current) return;
      const err = e as ApiError;
      if (err.code === 'same_password') {
        setPwErrors({ password: 'Choose a password different from your current one.' });
      } else if (err.code === 'weak_password') {
        setPwErrors({ password: err.message });
      } else if (err.code === 'reset_expired') {
        setNotice({ tone: 'error', text: 'This reset took too long. Enter your email to get a new code.' });
        go('request', 'left');
      } else {
        const msg = authErrorMessage(err, guard);
        if (msg) setNotice({ tone: 'error', text: msg });
      }
    } finally {
      if (id === attempt.current) setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />
      <View style={{ paddingTop: insets.top }}>
        <AuthBanners notice={notice} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {stage !== 'done' && (
          <TextButton
            onPress={back}
            style={styles.backBtn}
            label={
              <View style={styles.backRow}>
                <BackChevron />
                <Text style={styles.backText}>Back</Text>
              </View>
            }
          />
        )}

        <SlideIn key={stage} from={dir} style={styles.flex}>
          {stage === 'request' && (
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            >
              <FadeUp style={styles.heading}>
                <Text style={styles.title}>Reset your password</Text>
                <Text style={styles.subtitle}>Enter the email on your account and we'll send you a code.</Text>
              </FadeUp>
              <FadeUp delay={140} style={styles.card}>
                <View style={styles.cardEdge} />
                <GlassInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={v => {
                    setEmail(v);
                    setEmailError(undefined);
                  }}
                  error={emailError}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={sendCode}
                />
              </FadeUp>
              <View style={styles.flex} />
              <View style={styles.actions}>
                <PrimaryButton
                  label="Send code"
                  onPress={sendCode}
                  loading={loading}
                  loadingText="Sending code…"
                  disabled={guard.blocked}
                  dim={!email.trim()}
                />
              </View>
            </ScrollView>
          )}

          {stage === 'code' && (
            <View style={styles.codeWrap}>
              <OtpVerification
                email={email}
                variant="page"
                onVerify={verifyCode}
                onResend={() => requestPasswordReset(email)}
                onChangeEmail={back}
                onNotice={setNotice}
              />
            </View>
          )}

          {stage === 'newPassword' && (
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            >
              <View style={styles.heading}>
                <Text style={styles.title}>Create new password</Text>
                <Text style={styles.subtitle}>Use at least 8 characters with a number.</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.cardEdge} />
                <GlassInput
                  label="New password"
                  placeholder="Enter a new password"
                  value={password}
                  onChangeText={v => {
                    setPassword(v);
                    setPwErrors(er => ({ ...er, password: undefined }));
                  }}
                  error={pwErrors.password}
                  editable={!loading}
                  password
                  autoFocus
                  textContentType="newPassword"
                  returnKeyType="next"
                />
                <GlassInput
                  label="Confirm password"
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChangeText={v => {
                    setConfirm(v);
                    setPwErrors(er => ({ ...er, confirm: undefined }));
                  }}
                  error={pwErrors.confirm}
                  editable={!loading}
                  password
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={savePassword}
                />
              </View>
              <View style={styles.flex} />
              <View style={styles.actions}>
                <PrimaryButton
                  label="Reset password"
                  onPress={savePassword}
                  loading={loading}
                  loadingText="Resetting password…"
                  disabled={guard.blocked}
                  dim={!password || !confirm}
                />
              </View>
            </ScrollView>
          )}

          {stage === 'done' && (
            <SuccessState
              title="Password updated"
              body="You can now log in with your new password."
              actionLabel="Log in"
              onAction={() => navigation.navigate('Login')}
            />
          )}
        </SlideIn>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: A.BG },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24 },
    codeWrap: { flex: 1, paddingHorizontal: 24 },
    backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 24, marginTop: 8 },
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
      gap: 14,
    },
    cardEdge: {
      position: 'absolute',
      top: 0,
      left: '10%',
      right: '10%',
      height: 1,
      experimental_backgroundImage: `linear-gradient(90deg, transparent, ${A.INK(0.12)}, transparent)`,
    },
    actions: { marginTop: 28 },
  });
