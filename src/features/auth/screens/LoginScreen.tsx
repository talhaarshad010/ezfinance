import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { signIn, signInWithGoogle } from '../../../services/authService';
import Logo from '../../../components/Logo';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      showToast('Welcome back! Vault unlocked.', 'success');
    } catch (error: any) {
      let errorMessage = 'An error occurred during login.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'Incorrect email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google!', 'success');
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        showToast('Google Sign-In failed.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 40,
            },
          ]}
        >
          {/* Top Brand Header */}
          <View style={styles.headerRow}>
            <Logo size={52} />
          </View>

          {/* Hero Headline Section */}
          <View style={styles.sectionMargin}>
            <Text style={[styles.heroTag, { color: theme.ACTIVE }]}>
              EXCLUSIVELY FOR INVESTORS
            </Text>
            <Text style={[styles.heroTitle, { color: theme.TEXT }]}>
              Elevated{'\n'}Wealth Authority.
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.MUTED }]}>
              Experience financial clarity through organic minimalism, PSX feeds, and AI-grade analytics.
            </Text>

            {/* Social Trust Proof */}
            <View style={styles.trustRow}>
              <View style={styles.avatarStack}>
                <View
                  style={[
                    styles.avatarDot,
                    { backgroundColor: theme.ACTIVE, borderColor: theme.BG },
                  ]}
                />
                <View
                  style={[
                    styles.avatarDot,
                    {
                      backgroundColor: theme.GREEN,
                      borderColor: theme.BG,
                      marginLeft: -10,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.avatarCountDot,
                    { backgroundColor: theme.TEXT, borderColor: theme.BG },
                  ]}
                >
                  <Text style={[styles.avatarCountText, { color: theme.BG }]}>
                    +10k
                  </Text>
                </View>
              </View>
              <Text style={[styles.trustText, { color: theme.MUTED }]}>
                Trusted by serious investors nationwide
              </Text>
            </View>
          </View>

          {/* Credentials Login Card */}
          <View style={styles.sectionMargin}>
            <View style={[styles.formCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                Sign In
              </Text>
              <Text style={[styles.cardSub, { color: theme.MUTED }]}>
                Enter your registered credentials to access your financial vault.
              </Text>

              {/* Email Address Input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  EMAIL ADDRESS
                </Text>
                <View
                  style={[
                    styles.inputInnerRow,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Feather name="mail" size={18} color={theme.MUTED} />
                  <TextInput
                    style={[styles.textInput, { color: theme.TEXT }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor={theme.MUTED}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelForgotRow}>
                  <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                    PASSWORD
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={[styles.forgotText, { color: theme.TEXT }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.inputInnerRow,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Feather name="lock" size={18} color={theme.MUTED} />
                  <TextInput
                    style={[styles.textInput, { color: theme.TEXT }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.MUTED}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={18}
                      color={theme.MUTED}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={isLoading}
                style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.BG} />
                ) : (
                  <Text style={[styles.submitText, { color: theme.BG }]}>
                    Sign In to Vault →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Sign-In Section */}
          <View style={styles.sectionMargin}>
            <View style={styles.dividerRow}>
              <View style={[styles.divLine, { backgroundColor: theme.BORDER }]} />
              <Text style={[styles.divText, { color: theme.MUTED }]}>
                OR CONTINUE WITH
              </Text>
              <View style={[styles.divLine, { backgroundColor: theme.BORDER }]} />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              style={[
                styles.googleBtn,
                { backgroundColor: theme.CARD, borderColor: theme.BORDER },
              ]}
            >
              <Image
                source={require('../../../assets/images/Logo-google-icon-PNG.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={[styles.googleBtnText, { color: theme.TEXT }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Register Account Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.MUTED }]}>
              New to EZFinance?
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.signupLink, { color: theme.TEXT }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionMargin: {
    marginBottom: 20,
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.8,
    lineHeight: 46,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  avatarCountDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginLeft: -10,
  },
  avatarCountText: {
    fontSize: 9,
    fontWeight: '800',
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 28,
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  labelForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  divLine: {
    flex: 1,
    height: 1,
  },
  divText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});
