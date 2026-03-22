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

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);

  const handleRegister = () => {
    // Placeholder registration logic
    navigation.navigate('Login');
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
              Create Account
            </Typography>
            <Typography variant="body" color="#666" style={styles.subtitle}>
              Join the elite circle of serious investors and take control of your wealth.
            </Typography>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="FULL NAME"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
              />
              
              <View style={{ marginTop: 16 }}>
                <Input
                  label="EMAIL ADDRESS"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <Input
                  label="PASSWORD"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <Input
                  label="CONFIRM PASSWORD"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setAgree(!agree)}
              >
                <View style={[styles.checkbox, agree && styles.checkboxActive]}>
                  {agree && <Feather name="check" size={12} color="#FFF" />}
                </View>
                <Typography variant="caption" color="#666" style={{ marginLeft: 12 }}>
                  By creating an account, I agree to the <Typography variant="caption" weight="700" color="#000">Terms & Service</Typography>
                </Typography>
              </TouchableOpacity>

              <Button
                title="Create Account"
                onPress={handleRegister}
                style={styles.registerButton}
                disabled={!agree}
              />
            </View>
          </Card>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <Typography variant="caption" weight="700" color="#AAA" style={styles.socialTitle}>
              OR CONTINUE WITH
            </Typography>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialBtn}>
                <Feather name="at-sign" size={20} color="#000" />
                <Typography variant="body" weight="700" style={{ marginLeft: 12 }}>Google</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Feather name="phone" size={20} color="#000" />
                <Typography variant="body" weight="700" style={{ marginLeft: 12 }}>Apple</Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body" color="#666">
              Already have an account?
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
    marginBottom: 32,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  registerButton: {
    marginTop: 32,
  },
  socialSection: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  socialTitle: {
    letterSpacing: 2,
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialBtn: {
    flex: 0.48,
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
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

export default RegisterScreen;
