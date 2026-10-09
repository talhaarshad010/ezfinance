import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile } from '../../../store/slices/userSlice';
import { useUserMode } from '../../../context/UserModeContext';
import { ApiError, signInWithGoogle } from '../../../services/authService';
import { getLastSignInMethod, SignInMethod } from '../../../api/lastSignIn';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { AuthLogo } from '../components/AuthLogo';
import { Glow } from '../components/Glow';
import { GlassButton, GoogleIcon, PrimaryButton, TextButton } from '../components/AuthButtons';
import { FadeUp } from '../components/Entrance';
import { AuthBanners, NoticeData } from '../components/AuthFeedback';
import { authErrorMessage, useAuthGuard } from '../components/AuthGuard';
import { MSG } from '../components/authMessages';

/** Auth choice: create account, log in, continue with Google, or explore as a guest. */
export const WelcomeScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { beginNewUser, beginReturningUser } = useUserMode();
  const guard = useAuthGuard();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [lastUsed, setLastUsed] = useState<SignInMethod | null>(null);

  useEffect(() => {
    getLastSignInMethod().then(setLastUsed);
  }, []);

  const lastUsedBadge = (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.badgeText}>Last used</Text>
    </View>
  );
  const { showToast } = useToast();

  const handleGoogleSignIn = async () => {
    if (busy || guard.blocked) return;
    setNotice(null);
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return; // closing the Google sheet is not an error, so nothing is shown
      // Real accounts never see sample data; the tour shows until it's been completed once.
      beginNewUser({ tour: !result.profile.tourCompleted });
      dispatch(setProfile(result.profile));
      showToast(result.isNewUser ? 'Welcome to EZFinance!' : 'Signed in with Google!', 'success');
    } catch (e) {
      const err = e as ApiError;
      const msg = err.code === 'google_failed' ? MSG.googleFail : authErrorMessage(err, guard);
      if (msg) setNotice({ tone: 'error', text: msg });
    } finally {
      setBusy(false);
    }
  };

  // Explore = a demo of the full app with sample data, so visitors see how it looks once filled in.
  // No account, so nothing is saved and there is no tour.
  const handleExplore = () => {
    beginReturningUser();
    dispatch(
      setProfile({
        uid: 'guest',
        name: 'Guest',
        email: '',
        photoURL: null,
        phone: null,
      }),
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />
      <View style={{ paddingTop: insets.top }}>
        <AuthBanners notice={notice} />
      </View>

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
          disabled={busy}
          style={{ boxShadow: A.isDark ? '0 4px 24px rgba(255,255,255,0.15)' : A.PRIMARY_SHADOW }}
        />
        <View>
          <GlassButton onPress={() => navigation.navigate('Login')} disabled={busy}>Log in</GlassButton>
          {lastUsed === 'email' && lastUsedBadge}
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <View>
          <GlassButton onPress={handleGoogleSignIn} disabled={guard.offline || busy} busy={busy}>
            {busy ? (
              <>
                <ActivityIndicator color={A.TEXT} />
                <Text style={styles.googleText}>Signing in…</Text>
              </>
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </GlassButton>
          {lastUsed === 'google' && lastUsedBadge}
        </View>

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
  // "Last used" pill sitting on the top edge of the button the user signed in with last time.
  badge: {
    position: 'absolute',
    top: -9,
    right: 18,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: A.SKY,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
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
