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
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, PrimaryButton, TextButton } from '../components/AuthButtons';
import { GlassInput } from '../components/GlassInput';
import { FadeUp } from '../components/Entrance';

export const LoginScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    if (!email.trim() || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      dispatch(
        setProfile({
          uid: 'usr_demo_01',
          name: 'Muhammad Talha Arshad',
          email: email.trim(),
          photoURL: null,
          phone: '+92 300 1234567',
        }),
      );
      setIsLoading(false);
      showToast('Welcome back! Vault unlocked.', 'success');
    }, 400);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />

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
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
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
              label="Email or phone number"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
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
              onChangeText={setPassword}
              password
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={canSubmit ? handleLogin : undefined}
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
          </FadeUp>

          <View style={styles.flex} />

          {/* Actions */}
          <FadeUp delay={260} style={styles.actions}>
            <PrimaryButton
              label="Log in"
              onPress={handleLogin}
              disabled={!canSubmit}
              loading={isLoading}
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
