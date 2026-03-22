import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Input, Button, Card, Logo } from '../../../components';
import { colors } from '../../../theme/colors';

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Placeholder login logic - just trigger onLogin to enter the app
    onLogin();
  };

  return (
    <SafeAreaView style={styles.container}>
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
              />
            </View>
          </Card>

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
});

export default LoginScreen;
