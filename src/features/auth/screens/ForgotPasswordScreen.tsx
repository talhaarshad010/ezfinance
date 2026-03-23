import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Input, Button, Card, Logo } from '../../../components';
import { colors } from '../../../theme/colors';
import { forgotPassword } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleReset = async () => {
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      showToast('Password reset email sent!', 'success');
      navigation.navigate('Login');
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Logo size={32} />
          </View>

          <View style={styles.titleSection}>
            <Typography variant="h1" weight="700" style={styles.title}>
              Recover{"\n"}Password
            </Typography>
            <Typography variant="body" color="#666" style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="EMAIL ADDRESS"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                title="Send Reset Link"
                onPress={handleReset}
                style={styles.resetButton}
                isLoading={isLoading}
              />
            </View>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body" color="#666">
              Remember your password?
            </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Typography variant="body" weight="700" style={styles.loginLink}>
                Log In
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  formCard: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 32,
  },
  form: {
    width: '100%',
  },
  resetButton: {
    marginTop: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loginLink: {
    marginLeft: 8,
    color: '#000',
  },
});

export default ForgotPasswordScreen;
