import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { ApiError, changePassword, setPassword } from '../../../services/authService';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setProfile } from '../../../store/slices/userSlice';

export const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  // Accounts created with Google have no password yet: this screen then sets one instead.
  const settingPassword = useAppSelector(state => state.user.profile?.hasPassword === false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Requirement checks
  const isMinLength = newPassword.length >= 8;
  const hasUpperLower =
    /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberSpecial =
    /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);

  const handleChangePassword = async () => {
    if ((!settingPassword && !currentPassword) || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }

    if (!isMinLength) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (!settingPassword && currentPassword === newPassword) {
      showToast('New password must be different from current.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (settingPassword) {
        dispatch(setProfile(await setPassword(newPassword)));
        showToast('Password set. You can now also log in with your email.', 'success');
      } else {
        await changePassword(currentPassword, newPassword);
        showToast('Password updated successfully!', 'success');
      }
      navigation.goBack();
    } catch (e) {
      const err = e as ApiError;
      showToast(
        err.code === 'invalid_current_password' ? 'Your current password is incorrect.' : err.message,
        'error',
      );
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 60,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={16} color={theme.MUTED} />
            <Text style={[styles.backText, { color: theme.MUTED }]}>
              Account Security
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
            {settingPassword ? 'Set a Password' : 'Change Password'}
          </Text>
          <Text style={[styles.headerSub, { color: theme.MUTED }]}>
            {settingPassword
              ? 'You signed up with Google. Add a password to also log in with your email.'
              : 'Ensure your new password meets security requirements.'}
          </Text>
        </View>

        {/* Inputs Stack Card */}
        <View style={styles.sectionMargin}>
          <View style={styles.inputsStack}>
            {/* Current Password */}
            {!settingPassword && (
              <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  CURRENT PASSWORD
                </Text>
                <View style={styles.inputInnerRow}>
                  <Feather name="lock" size={18} color={theme.MUTED} />
                  <TextInput
                    style={[styles.textInput, { color: theme.TEXT }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrent}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.MUTED}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowCurrent(!showCurrent)}
                  >
                    <Feather
                      name={showCurrent ? 'eye' : 'eye-off'}
                      size={18}
                      color={theme.MUTED}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* New Password */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                NEW PASSWORD
              </Text>
              <View style={styles.inputInnerRow}>
                <Feather name="key" size={18} color={theme.MUTED} />
                <TextInput
                  style={[styles.textInput, { color: theme.TEXT }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.MUTED}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowNew(!showNew)}
                >
                  <Feather
                    name={showNew ? 'eye' : 'eye-off'}
                    size={18}
                    color={theme.MUTED}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                CONFIRM NEW PASSWORD
              </Text>
              <View style={styles.inputInnerRow}>
                <Feather name="check-circle" size={18} color={theme.MUTED} />
                <TextInput
                  style={[styles.textInput, { color: theme.TEXT }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.MUTED}
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
          </View>
        </View>

        {/* Security Requirements Card */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            SECURITY REQUIREMENTS
          </Text>
          <View style={[styles.rulesCard, { backgroundColor: theme.CARD }]}>
            {[
              {
                label: 'Minimum 8 characters long',
                pass: isMinLength,
              },
              {
                label: 'At least one uppercase & lowercase letter',
                pass: hasUpperLower,
              },
              {
                label: 'At least one number & special character',
                pass: hasNumberSpecial,
              },
            ].map(r => (
              <View key={r.label} style={styles.ruleRow}>
                <Feather
                  name={r.pass ? 'check-circle' : 'circle'}
                  size={14}
                  color={r.pass ? theme.GREEN : theme.MUTED}
                />
                <Text
                  style={[
                    styles.ruleText,
                    { color: r.pass ? theme.TEXT : theme.MUTED },
                  ]}
                >
                  {r.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleChangePassword}
          disabled={isLoading}
          style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.BG} />
          ) : (
            <Text style={[styles.submitText, { color: theme.BG }]}>
              {settingPassword ? 'Set Password →' : 'Update Password →'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ChangePasswordScreen;

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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionMargin: {
    marginBottom: 16,
  },
  inputsStack: {
    gap: 10,
  },
  inputCard: {
    borderRadius: 20,
    padding: 16,
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
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  rulesCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
