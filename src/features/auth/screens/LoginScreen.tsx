import React, { useState } from 'react';
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
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile } from '../../../store/slices/userSlice';
import { useUserMode } from '../../../context/UserModeContext';
import { ApiError, resendVerificationCode, signIn } from '../../../services/authService';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, PrimaryButton, TextButton } from '../components/AuthButtons';
import { GlassInput } from '../components/GlassInput';
import { FadeUp } from '../components/Entrance';
import { AuthBanners, NoticeData } from '../components/AuthFeedback';
import { authErrorMessage, useAuthGuard } from '../components/AuthGuard';
import { MSG, validateEmail } from '../components/authMessages';

export const LoginScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const { beginReturningUser } = useUserMode();

  const guard = useAuthGuard();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  // Same message whether or not the account exists, so it can't be used to probe for accounts.
  const [badCredentials, setBadCredentials] = useState(false);
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filled = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (isLoading || guard.blocked) return;
    // The button stays tappable while the form is incomplete, so explain what's missing.
    const next = {
      email: validateEmail(email) ?? undefined,
      password: password ? undefined : 'Enter your password.',
    };
    setErrors(next);
    if (next.email || next.password) return;

    setNotice(null);
    setBadCredentials(false);
    setIsLoading(true);
    try {
      const profile = await signIn(email, password);
      guard.resetFailures();
      beginReturningUser();
      dispatch(setProfile(profile));
      showToast('Welcome back! Vault unlocked.', 'success');
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'email_not_confirmed') {
        // Signed up but never entered the code: send a fresh one and finish verification.
        try {
          await resendVerificationCode(email);
        } catch {
          // Rate limited or offline; the previous code may still be valid.
        }
        navigation.navigate('VerifyEmail', { email: email.trim() });
      } else if (err.code === 'invalid_credentials') {
        setBadCredentials(true);
        guard.registerFailure(); // 5 wrong attempts lock the form for 5 minutes
      } else {
        const msg = authErrorMessage(err, guard);
        if (msg) setNotice({ tone: 'error', text: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />
      <View style={{ paddingTop: insets.top }}>
        <AuthBanners notice={notice} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: 8, paddingBottom: insets.bottom + 24 },
          ]}
        >
          {/* Back */}
          <TextButton
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            label={
              <View style={styles.backRow}>
                <BackChevron />
                <Text style={styles.backText}>Back</Text>
              </View>
            }
          />

          {/* Heading */}
          <FadeUp style={styles.heading}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your ezFinance account</Text>
          </FadeUp>

          {/* Glass form card */}
          <FadeUp delay={140} style={styles.card}>
            <View style={styles.cardEdge} />
            <GlassInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setErrors(er => ({ ...er, email: undefined }));
                setBadCredentials(false);
              }}
              error={errors.email}
              editable={!isLoading}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
            />
            <GlassInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setErrors(er => ({ ...er, password: undefined }));
                setBadCredentials(false);
              }}
              error={errors.password ?? (badCredentials ? MSG.loginFail : undefined)}
              editable={!isLoading}
              password
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              suffix={
                <View style={styles.forgotRow}>
                  <TextButton
                    label="Forgot password?"
                    onPress={() => navigation.navigate('ForgotPassword')}
                    textStyle={styles.link}
                  />
                </View>
              }
            />
            {badCredentials && (
              <Text style={styles.hint}>
                Signed up with Google? Go back and choose Continue with Google. Or tap Forgot password
                to set a password for this email.
              </Text>
            )}
          </FadeUp>

          <View style={styles.flex} />

          {/* Actions */}
          <FadeUp delay={260} style={styles.actions}>
            <PrimaryButton
              label="Log in"
              onPress={handleLogin}
              loading={isLoading}
              loadingText="Signing in…"
              disabled={guard.blocked}
              dim={!filled}
            />
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TextButton
                label="Create one"
                onPress={() => navigation.navigate('Register')}
                textStyle={[styles.link, styles.footerLink]}
              />
            </View>
          </FadeUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: A.BG,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backText: {
    color: A.MUTED,
    fontSize: 15,
  },
  heading: { marginTop: 24 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: A.TEXT,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: A.MUTED,
    marginTop: 8,
    letterSpacing: -0.1,
  },
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
    experimental_backgroundImage:
      `linear-gradient(90deg, transparent, ${A.INK(0.12)}, transparent)`,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: A.MUTED,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  link: {
    color: A.LINK,
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    gap: 16,
    marginTop: 28,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: A.MUTED,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
