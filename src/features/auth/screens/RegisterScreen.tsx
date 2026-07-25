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
import { signUp, signInWithGoogle } from '../../../services/authService';
import Logo from '../../../components/Logo';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      showToast('Please fill in all account fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (!agree) {
      showToast('Please agree to the Terms & Service', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(fullName.trim(), email.trim(), password);
      showToast('Account created successfully! Welcome to EZFinance.', 'success');
    } catch (error: any) {
      let errorMessage = 'An error occurred during registration.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
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
          {/* Top Navigation Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { backgroundColor: theme.CARD }]}
            >
              <Feather name="chevron-left" size={20} color={theme.TEXT} />
            </TouchableOpacity>

            <Logo size={48} />
          </View>

          {/* Hero Section */}
          <View style={styles.sectionMargin}>
            <Text style={[styles.heroTag, { color: theme.ACTIVE }]}>
              START YOUR FINANCIAL JOURNEY
            </Text>
            <Text style={[styles.heroTitle, { color: theme.TEXT }]}>
              Create Account
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.MUTED }]}>
              Join the elite circle of serious investors and take control of your wealth.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.sectionMargin}>
            <View style={[styles.formCard, { backgroundColor: theme.CARD }]}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  FULL NAME
                </Text>
                <View
                  style={[
                    styles.inputInnerRow,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Feather name="user" size={18} color={theme.MUTED} />
                  <TextInput
                    style={[styles.textInput, { color: theme.TEXT }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.MUTED}
                  />
                </View>
              </View>

              {/* Email Address */}
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

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  PASSWORD
                </Text>
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

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  CONFIRM PASSWORD
                </Text>
                <View
                  style={[
                    styles.inputInnerRow,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Feather name="check-circle" size={18} color={theme.MUTED} />
                  <TextInput
                    style={[styles.textInput, { color: theme.TEXT }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.MUTED}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Feather
                      name={showConfirm ? 'eye' : 'eye-off'}
                      size={18}
                      color={theme.MUTED}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Checkbox Terms Agreement */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAgree(!agree)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    {
                      borderColor: agree ? theme.TEXT : theme.BORDER,
                      backgroundColor: agree ? theme.TEXT : 'transparent',
                    },
                  ]}
                >
                  {agree && (
                    <Feather name="check" size={12} color={theme.BG} />
                  )}
                </View>
                <Text style={[styles.termsText, { color: theme.MUTED }]}>
                  By creating an account, I agree to the{' '}
                  <Text style={{ color: theme.TEXT, fontWeight: '700' }}>
                    Terms & Service
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={isLoading}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: agree ? theme.TEXT : theme.MODAL,
                    opacity: agree ? 1 : 0.6,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.BG} />
                ) : (
                  <Text style={[styles.submitText, { color: theme.BG }]}>
                    Create Vault Account →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Sign-In */}
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

          {/* Login Link Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.MUTED }]}>
              Already have an account?
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.loginLink, { color: theme.TEXT }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  formCard: {
    borderRadius: 28,
    padding: 24,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 14,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 12,
    flex: 1,
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});
