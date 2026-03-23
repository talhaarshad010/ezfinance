import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo, Button } from '../../../components';
import { colors } from '../../../theme/colors';
import { promptBiometric, getBiometricName, isBiometricAvailable } from '../../../services/biometricService';
import { useToast } from '../../../context/ToastContext';
import { signOut } from '../../../services/authService';

interface BiometricLockScreenProps {
  onAuthenticated: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onAuthenticated }) => {
  const [biometryType, setBiometryType] = useState<string | undefined>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const { biometryType } = await isBiometricAvailable();
    setBiometryType(biometryType);
    handleBiometricAuth();
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    const success = await promptBiometric('Unlock your account');
    setIsAuthenticating(false);

    if (success) {
      onAuthenticated();
    } else {
      showToast('Authentication failed or cancelled.', 'error');
    }
  };

  const handleUsePassword = async () => {
    try {
      await signOut();
    } catch (error) {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  const biometricName = getBiometricName(biometryType);
  const iconName = biometryType === 'FaceID' ? 'smile' : 'shield';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size={120} />
        </View>

        <View style={styles.lockContainer}>
          <TouchableOpacity 
            style={styles.iconCircle}
            onPress={handleBiometricAuth}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Feather name={iconName} size={48} color="#000" />
            )}
          </TouchableOpacity>
          <Typography variant="h2" weight="700" style={styles.title}>
            {biometricName} Locked
          </Typography>
          <Typography variant="body" color="#666" style={styles.subtitle}>
            Tap the icon above to unlock with {biometricName}
          </Typography>
        </View>

        <View style={styles.footer}>
          <Button
            title={`Unlock with ${biometricName}`}
            onPress={handleBiometricAuth}
            isLoading={isAuthenticating}
            style={styles.unlockBtn}
          />
          <TouchableOpacity style={styles.passwordBtn} onPress={handleUsePassword}>
            <Typography variant="body" weight="700" color="#666">
              Use Password Instead
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  lockContainer: {
    alignItems: 'center',
    marginTop: -40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  footer: {
    width: '100%',
  },
  unlockBtn: {
    marginBottom: 16,
  },
  passwordBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

export default BiometricLockScreen;
