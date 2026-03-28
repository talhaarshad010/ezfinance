import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Input, Button, Card, Logo, LoadingOverlay } from '../../../components';
import { signIn, signInWithGoogle } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      showToast('Login successful!', 'success');
    } catch (error: any) {
      let errorMessage = 'An error occurred during login.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoRow}>
              <Logo size={32} />
              <Typography variant="h2" weight="700" style={styles.logoText}>
                EZFinance
              </Typography>
            </View>
            
            <Typography variant="h1" weight="700" style={styles.heroTitle}>
              Elevated{"\n"}Wealth{"\n"}Authority.
            </Typography>
            
            <Typography variant="body" color="#666" style={styles.heroSubtitle}>
              Experience financial clarity through organic minimalism and professional-grade analytics.
            </Typography>

            <View style={styles.trustSection}>
              <View style={styles.avatarStack}>
                <View style={[styles.avatar, { backgroundColor: '#E1F5FE' }]} />
                <View style={[styles.avatar, { backgroundColor: '#F3E5F5', marginLeft: -12 }]} />
                <View style={[styles.avatarCount, { marginLeft: -12 }]}>
                  <Typography variant="caption" weight="700" color="#FFF" style={{ fontSize: 10 }}>
                    +10k
                  </Typography>
                </View>
              </View>
              <Typography variant="caption" color="#666" style={styles.trustText}>
                Trusted by serious{"\n"}investors worldwide.
              </Typography>
            </View>
          </View>

          {/* Form Section */}
          <Card style={styles.loginCard}>
            <Typography variant="h2" weight="700" style={styles.formTitle}>
              Login
            </Typography>
            <Typography variant="body" color="#666" style={styles.formSubtitle}>
              Enter your credentials to access your vault.
            </Typography>

            <View style={styles.form}>
              <Input
                label="EMAIL ADDRESS"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.passwordHeader}>
                <Typography variant="caption" weight="700" color="#666">
                  PASSWORD
                </Typography>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Typography variant="caption" weight="700" color="#000">
                    Forgot Password?
                  </Typography>
                </TouchableOpacity>
              </View>
              <Input
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Button
                title="Login"
                onPress={handleLogin}
                style={styles.loginButton}
                isLoading={isLoading}
              />
            </View>
          </Card>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <Typography variant="caption" weight="700" color="#AAA" style={styles.socialTitle}>
              OR CONTINUE WITH
            </Typography>
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
              <Image 
                source={require('../../../assets/images/Logo-google-icon-PNG.png')} 
                style={styles.googleIcon} 
                resizeMode="contain"
              />
              <Typography variant="body" weight="700" style={{ marginLeft: 12 }}>
                Continue with Google
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body" color="#666">
              New to EZFinance?
            </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Typography variant="body" weight="700" style={styles.signupLink}>
                Create Account
              </Typography>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    marginLeft: 8,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 48,
    lineHeight: 52,
    marginBottom: 16,
    color: '#000',
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#666',
    maxWidth: '80%',
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F9F9F9',
  },
  avatarCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F9F9F9',
  },
  trustText: {
    marginLeft: 12,
    fontSize: 12,
    lineHeight: 16,
  },
  loginCard: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  formTitle: {
    fontSize: 28,
    marginBottom: 8,
  },
  formSubtitle: {
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signupLink: {
    marginLeft: 8,
    color: '#000',
  },
  socialSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  socialTitle: {
    letterSpacing: 2,
    marginBottom: 20,
  },
  googleBtn: {
    width: '100%',
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
});

export default LoginScreen;
