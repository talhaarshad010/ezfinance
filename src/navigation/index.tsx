import React from 'react';
import { AuthStack } from './AuthStack';
export type { AuthStackParamList } from './AuthStack';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import { createStackNavigator } from '@react-navigation/stack';
import ChangePasswordScreen from '../features/main/screens/ChangePasswordScreen';
import StockDetailScreen from '../features/main/screens/StockDetailScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import ExpenseDetailScreen from '../features/main/screens/ExpenseDetailScreen';
import BuyCryptoScreen from '../features/main/screens/BuyCryptoScreen';
import EditProfileScreen from '../features/main/screens/EditProfileScreen';
import SecurityScreen from '../features/main/screens/SecurityScreen';
import AssetDetailScreen from '../features/main/screens/AssetDetailScreen';
import SearchScreen from '../features/main/screens/SearchScreen';
import OTPVerificationScreen from '../features/auth/screens/OTPVerificationScreen';
import {
  TouchableOpacity,
  View,
  StatusBar,
  DeviceEventEmitter,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo } from '../components';
import BiometricLockScreen from '../features/auth/screens/BiometricLockScreen';
import {
  onAuthStateChanged,
  signOut,
  isTwoFactorEnabled,
  generateOTP,
  getUserProfile,
  recordDeviceVerification,
  checkDeviceVerification,
  removeDeviceVerification,
} from '../services/authService';
import { isBiometricEnabled } from '../services/biometricService';
import {
  registerSession,
  listenForSessionTermination,
} from '../services/sessionService';
import { useToast } from '../context/ToastContext';
import auth from '@react-native-firebase/auth';
import DeviceInfo from 'react-native-device-info';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setProfile, clearProfile } from '../store/slices/userSlice';
import { HeaderProfile } from '../components/HeaderProfile';
import {
  setTwoFactor,
  setBiometrics,
  resetSettings,
} from '../store/slices/settingsSlice';


const Stack = createStackNavigator();

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.user.profile);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const [initializing, setInitializing] = React.useState(true);
  const [pendingOTP, setPendingOTP] = React.useState(false);
  const [pendingBiometric, setPendingBiometric] = React.useState(false);
  const [otpUserData, setOtpUserData] = React.useState<{
    uid: string;
    email: string;
  } | null>(null);
  const wasAuthenticated = React.useRef(false);
  const currentSessionId = React.useRef<string | null>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    let unsubscribeTermination: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(async user => {
      if (user) {
        // Handle Session Registration
        if (!currentSessionId.current) {
          try {
            const sid = await DeviceInfo.getUniqueId();
            currentSessionId.current = sid;
            await registerSession();

            // Listen for remote logout
            unsubscribeTermination = listenForSessionTermination(
              user.uid,
              sid,
              () => {
                showToast(
                  'Your session has been terminated from another device.',
                  'info',
                  'Logout',
                );
                signOut();
              },
            );
          } catch (e) {
            console.error('Session management error:', e);
          }
        }

        // Only trigger 2FA on fresh login, not on app restart
        const isFreshLogin = !wasAuthenticated.current;
        wasAuthenticated.current = true;

        // Fetch and Sync Profile & Settings to Redux
        const syncUserData = async () => {
          try {
            const [twoFA, bioEnabled, profile] = await Promise.all([
              isTwoFactorEnabled(user.uid),
              isBiometricEnabled(user.uid),
              getUserProfile(user.uid),
            ]);

            dispatch(setTwoFactor(twoFA));
            dispatch(setBiometrics(bioEnabled));
            dispatch(
              setProfile({
                uid: user.uid,
                name: profile?.name || user.displayName || 'User',
                email: user.email || '',
                photoURL: profile?.photoURL || user.photoURL || null,
                phone: profile?.phone || null,
              }),
            );

            return { twoFA, bioEnabled };
          } catch (e) {
            console.error('Data sync error:', e);
            return { twoFA: false, bioEnabled: false };
          }
        };

        if (isFreshLogin) {
          const { twoFA } = await syncUserData();
          if (twoFA) {
            const sid = await DeviceInfo.getUniqueId();
            const isVerified = await checkDeviceVerification(user.uid, sid);

            if (!isVerified) {
              setOtpUserData({ uid: user.uid, email: user.email || '' });
              setPendingOTP(true);
              setIsAuthenticated(true);

              // Generate OTP (DEV SIMULATION: show in toast)
              const otp = await generateOTP(user.uid);
              setTimeout(() => {
                showToast(
                  `Your OTP code is: ${otp}`,
                  'info',
                  'Verification Code',
                  15000,
                );
              }, 500);
            } else {
              setPendingOTP(false);
              setOtpUserData(null);
              setIsAuthenticated(true);
            }
          } else {
            setPendingOTP(false);
            setOtpUserData(null);
            setIsAuthenticated(true);
          }
        } else {
          // App restart
          const { bioEnabled } = await syncUserData();
          if (bioEnabled) {
            setPendingBiometric(true);
          }
          setIsAuthenticated(true);
        }
      } else {
        wasAuthenticated.current = false;
        setIsAuthenticated(false);
        setPendingOTP(false);
        setPendingBiometric(false);
        setOtpUserData(null);
        dispatch(clearProfile());
        dispatch(resetSettings());
      }

      if (initializing) {
        setInitializing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTermination) unsubscribeTermination();
    };
  }, []);

  React.useEffect(() => {
    const logoutListener = DeviceEventEmitter.addListener('LOGOUT', async () => {
      await signOut();
    });
    return () => logoutListener.remove();
  }, []);

  const handleOTPVerified = async () => {
    if (otpUserData) {
      const sid = await DeviceInfo.getUniqueId();
      await recordDeviceVerification(otpUserData.uid, sid);
    }
    setPendingOTP(false);
    setOtpUserData(null);
  };

  const handleOTPCancel = () => {
    setPendingOTP(false);
    setOtpUserData(null);
    signOut();
  };

  const handleBiometricAuthenticated = () => {
    setPendingBiometric(false);
  };

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F9FB',
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Show Biometric Lock Screen if enabled on app restart
  if (isAuthenticated && pendingBiometric) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8F9FB"
          translucent={false}
        />
        <BiometricLockScreen onAuthenticated={handleBiometricAuthenticated} />
      </>
    );
  }

  // Show OTP screen if 2FA is pending
  if (isAuthenticated && pendingOTP && otpUserData) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8F9FB"
          translucent={false}
        />
        <OTPVerificationScreen
          uid={otpUserData.uid}
          email={otpUserData.email}
          onVerified={handleOTPVerified}
          onCancel={handleOTPCancel}
        />
      </>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#F8F9FB"
            translucent={false}
          />
          <Stack.Navigator
            screenOptions={({ navigation }) => ({
              headerStyle: {
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
                backgroundColor: '#F8F9FB',
              },
              headerLeft: () => (
                <TouchableOpacity
                  style={{ marginLeft: 20 }}
                  onPress={() => navigation.goBack()}
                >
                  <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
              ),
              headerTitleStyle: {
                fontFamily: 'Inter-Bold',
                fontSize: 18,
              },
              headerTitleAlign: 'center',
              headerRight: () => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 20,
                  }}
                >
                  <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => navigation.navigate('Search')}
                  >
                    <Feather name="search" size={22} color="#000" />
                  </TouchableOpacity>
                  <HeaderProfile />
                </View>
              ),
            })}

          >
            <Stack.Screen
              name="Drawer"
              component={MainDrawerNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen
              name="StockDetail"
              component={StockDetailScreen}
              options={{ title: 'Stock Detail' }}
            />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen
              name="ExpenseDetail"
              component={ExpenseDetailScreen}
              options={{ title: 'Transaction' }}
            />
            <Stack.Screen
              name="BuyCrypto"
              component={BuyCryptoScreen}
              options={{ title: '' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="Security"
              component={SecurityScreen}
              options={{ title: 'Security' }}
            />

            <Stack.Screen
              name="AssetDetail"
              component={AssetDetailScreen}
              options={{ title: '' }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </>
      ) : (
        <AuthStack onLogin={() => setIsAuthenticated(true)} />
      )}
    </>
  );
};
