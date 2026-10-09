import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../../context/ToastContext';
import { useUserMode } from '../../../context/UserModeContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile, UserProfile } from '../../../store/slices/userSlice';
import { resendVerificationCode, verifyEmail } from '../../../services/authService';
import type { AuthStackParamList } from '../../../navigation/AuthStack';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, TextButton } from '../components/AuthButtons';
import { AuthBanners, NoticeData } from '../components/AuthFeedback';
import { OtpVerification } from '../components/OtpVerification';
import { SignUpDone } from '../components/SignUpDone';

/**
 * Confirms the email of an account that was never verified (opened from Login when Supabase
 * answers "email_not_confirmed"). New sign-ups verify inside the sign-up wizard instead.
 */
export const VerifyEmailScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'VerifyEmail'>>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const { beginNewUser } = useUserMode();
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [verified, setVerified] = useState<UserProfile | null>(null);

  const enterApp = () => {
    if (!verified) return;
    beginNewUser();
    dispatch(setProfile(verified));
    showToast('Account created successfully! Welcome to EZFinance.', 'success');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />
      <View style={{ paddingTop: insets.top }}>
        <AuthBanners notice={notice} />
      </View>

      {verified ? (
        <SignUpDone onContinue={enterApp} />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <TextButton
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            label={
              <View style={styles.backRow}>
                <BackChevron />
                <Text style={styles.backText}>Back</Text>
              </View>
            }
          />
          <View style={styles.body}>
            <OtpVerification
              email={params.email}
              variant="page"
              onVerify={async code => setVerified(await verifyEmail(params.email, code))}
              onResend={() => resendVerificationCode(params.email)}
              onChangeEmail={() => navigation.goBack()}
              onNotice={setNotice}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default VerifyEmailScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: A.BG },
    flex: { flex: 1 },
    body: { flex: 1, paddingHorizontal: 24 },
    backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 24, marginTop: 8 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    backText: { color: A.MUTED, fontSize: 15 },
  });
