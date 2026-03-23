import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Typography, Card, Button } from '../../../components';
import { useToast } from '../../../context/ToastContext';
import { changePassword } from '../../../services/authService';
import { useNavigation } from '@react-navigation/native';

const ChangePasswordScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('New password must be different from current.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password updated successfully!', 'success');
      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Failed to update password.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again before changing password.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="h1" weight="700" style={{ fontSize: 32 }}>Change Password</Typography>
        <Typography variant="body" style={{ marginTop: 8, lineHeight: 24 }}>
          Ensure your new password meets the security requirements.
        </Typography>
      </View>

      <Card style={styles.card}>
        <Typography variant="caption" weight="700" style={styles.label}>CURRENT PASSWORD</Typography>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#AAA"
            secureTextEntry
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
        </View>

        <View style={styles.divider} />

        <Typography variant="caption" weight="700" style={styles.label}>NEW PASSWORD</Typography>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter new password"
            placeholderTextColor="#AAA"
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <Typography variant="caption" weight="700" style={styles.label}>CONFIRM NEW PASSWORD</Typography>
        <View style={[styles.inputBox, { marginBottom: 8 }]}>
          <TextInput
            placeholder="Repeat new password"
            placeholderTextColor="#AAA"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Typography variant="caption" color="#666" style={{ fontSize: 11, marginTop: 12 }}>
          • Minimum 8 characters long{'\n'}
          • At least one uppercase and one lowercase letter{'\n'}
          • At least one number and special character
        </Typography>
      </Card>

      <Button
        title="Update Password"
        onPress={handleChangePassword}
        isLoading={isLoading}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  card: {
    marginBottom: 32,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputBox: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: '#EAEBEE',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#000',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    marginBottom: 24,
    backgroundColor: '#EAEBEE',
  },
});

export default ChangePasswordScreen;
