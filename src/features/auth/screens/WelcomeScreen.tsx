import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile } from '../../../store/slices/userSlice';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { AuthLogo } from '../components/AuthLogo';
import { Glow } from '../components/Glow';
import { GlassButton, GoogleIcon, PrimaryButton, TextButton } from '../components/AuthButtons';
import { FadeUp } from '../components/Entrance';

/** Auth choice: create account, log in, continue with Google, or explore as a guest. */
export const WelcomeScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  // Same demo sign-in the Login/Register screens use.
  const handleGoogleSignIn = () => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      dispatch(
        setProfile({
          uid: 'usr_demo_01',
          name: 'Muhammad Talha Arshad',
          email: 'talhaarshad010@gmail.com',
          photoURL: null,
          phone: '+92 300 1234567',
        }),
      );
      setBusy(false);
      showToast('Signed in with Google!', 'success');
    }, 400);
  };

  const handleExplore = () => {
    dispatch(
      setProfile({
        uid: 'guest',
        name: 'Guest',
        email: '',
        photoURL: null,
        phone: null,
      }),
    );
    showToast('Exploring as a guest. Create an account anytime.', 'info');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />

      <View style={styles.hero}>
        <Glow
          size={280}
          stops={[
            [0, '#00E68A', 0.1],
            [0.5, '#0EA5E9', 0.05],
            [0.7, '#0EA5E9', 0],
          ]}
        />
        <FadeUp>
          <AuthLogo size={80} />
        </FadeUp>
        <FadeUp delay={140} style={styles.heroText}>
          <Text style={styles.title}>Welcome to ezFinance</Text>
          <Text style={styles.subtitle}>Choose how you'd like to continue</Text>
        </FadeUp>
      </View>

      <FadeUp delay={260} style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton
          label="Create new account"
          onPress={() => navigation.navigate('Register')}
          style={{ boxShadow: A.isDark ? '0 4px 24px rgba(255,255,255,0.15)' : A.PRIMARY_SHADOW }}
        />
        <GlassButton onPress={() => navigation.navigate('Login')}>Log in</GlassButton>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <GlassButton onPress={handleGoogleSignIn}>
          <GoogleIcon />
          <Text style={styles.googleText}>Continue with Google</Text>
        </GlassButton>

        <TextButton
          label="Explore without logging in →"
          onPress={handleExplore}
          style={styles.exploreBtn}
          textStyle={styles.exploreText}
        />
      </FadeUp>
    </View>
  );
};

export default WelcomeScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: A.BG,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  heroText: { alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: A.TEXT,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    color: A.MUTED,
    marginTop: 8,
    letterSpacing: -0.1,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 10,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: A.DIVIDER,
  },
  orText: { fontSize: 13, color: A.MUTED },
  googleText: { color: A.TEXT, fontSize: 16, fontWeight: '600' },
  exploreBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreText: {
    color: A.MUTED,
    fontSize: 14,
    fontWeight: '500',
  },
});
