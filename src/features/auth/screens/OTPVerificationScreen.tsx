import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Button, Logo } from '../../../components';
import { colors } from '../../../theme/colors';
import { useToast } from '../../../context/ToastContext';
import { verifyOTP, generateOTP } from '../../../services/authService';
import Feather from 'react-native-vector-icons/Feather';

interface OTPVerificationScreenProps {
  uid: string;
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  uid,
  email,
  onVerified,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const digits = text.replace(/[^0-9]/g, '').split('').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      showToast('Please enter the complete 6-digit code.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(uid, code);
      showToast('Verification successful!', 'success');
      onVerified();
    } catch (error: any) {
      showToast(error.message || 'Invalid OTP code.', 'error');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const newOtp = await generateOTP(uid);
      // DEV SIMULATION: Show OTP in toast (replace with email sending in production)
      showToast(`Your OTP code is: ${newOtp}`, 'info', 'Verification Code', 15000);
      setResendTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      showToast('Failed to resend code.', 'error');
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="shield" size={40} color="#000" />
            </View>
          </View>

          <Typography variant="h1" weight="700" style={styles.title}>
            Two-Factor{'\n'}Verification
          </Typography>
          <Typography variant="body" color="#666" style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            <Typography variant="body" weight="700" color="#000">
              {maskedEmail}
            </Typography>
          </Typography>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : {},
                ]}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Resend Button */}
          <TouchableOpacity
            style={[styles.resendBtn, resendTimer > 0 && styles.resendBtnDisabled]}
            onPress={handleResend}
            disabled={resendTimer > 0}
          >
            <Feather name="refresh-cw" size={16} color={resendTimer > 0 ? '#999' : '#000'} />
            <Typography
              variant="body"
              weight="700"
              color={resendTimer > 0 ? '#999' : '#000'}
              style={{ marginLeft: 8 }}
            >
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
            </Typography>
          </TouchableOpacity>

          {/* Verify Button */}
          <Button
            title="Verify"
            onPress={handleVerify}
            isLoading={isLoading}
            style={styles.verifyBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    marginTop: -40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    textAlign: 'center',
    lineHeight: 42,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    gap: 10,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#000',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignSelf: 'center',
  },
  resendBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtn: {
    marginTop: 20,
  },
});

export default OTPVerificationScreen;
