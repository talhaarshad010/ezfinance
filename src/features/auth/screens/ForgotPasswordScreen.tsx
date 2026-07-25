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
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { forgotPassword } from '../../../services/authService';
import Logo from '../../../components/Logo';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      showToast('Password reset email sent! Check your inbox.', 'success');
      navigation.navigate('Login');
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }
      showToast(errorMessage, 'error');
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
          {/* Header Row */}
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

          {/* Hero Headline */}
          <View style={styles.sectionMargin}>
            <Text style={[styles.heroTag, { color: theme.ACTIVE }]}>
              ACCOUNT RECOVERY
            </Text>
            <Text style={[styles.heroTitle, { color: theme.TEXT }]}>
              Recover{'\n'}Password
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.MUTED }]}>
              Enter your registered email address and we'll send a secure link to reset your vault password.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.sectionMargin}>
            <View style={[styles.formCard, { backgroundColor: theme.CARD }]}>
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

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleReset}
                disabled={isLoading}
                style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.BG} />
                ) : (
                  <Text style={[styles.submitText, { color: theme.BG }]}>
                    Send Reset Link →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.sectionMargin}>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: `${theme.ACTIVE}12` },
              ]}
            >
              <Feather name="shield" size={18} color={theme.ACTIVE} />
              <Text style={[styles.infoText, { color: theme.MUTED }]}>
                A password reset link will be dispatched to your email. Ensure to check both inbox & spam folders.
              </Text>
            </View>
          </View>

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.MUTED }]}>
              Remember your password?
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

export default ForgotPasswordScreen;

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
    marginBottom: 24,
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
    lineHeight: 46,
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
    marginBottom: 20,
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
  submitBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  footerText: {
    fontSize: 13,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});
