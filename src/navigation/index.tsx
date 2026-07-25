import React from 'react';
import { AuthStack } from './AuthStack';
export type { AuthStackParamList } from './AuthStack';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
} from '@react-navigation/stack';
import ChangePasswordScreen from '../features/main/screens/ChangePasswordScreen';
import StockDetailScreen from '../features/main/screens/StockDetailScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import ExpenseDetailScreen from '../features/main/screens/ExpenseDetailScreen';
import BuyCryptoScreen from '../features/main/screens/BuyCryptoScreen';
import EditProfileScreen from '../features/main/screens/EditProfileScreen';
import SecurityScreen from '../features/main/screens/SecurityScreen';
import AssetDetailScreen from '../features/main/screens/AssetDetailScreen';
import SearchScreen from '../features/main/screens/SearchScreen';
import AddAccountScreen from '../features/main/screens/AddAccountScreen';
import AccountDetailScreen from '../features/main/screens/AccountDetailScreen';
import AddTransactionScreen from '../features/main/screens/AddTransactionScreen';
import TransactionDetailScreen from '../features/main/screens/TransactionDetailScreen';
import OTPVerificationScreen from '../features/auth/screens/OTPVerificationScreen';
import AddCategoryScreen from '../features/main/screens/AddCategoryScreen';
import {
  TouchableOpacity,
  View,
  StatusBar,
  DeviceEventEmitter,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo } from '../components';
import {
  onAuthStateChanged,
  signOut,
  isTwoFactorEnabled,
  generateOTP,
  getUserProfile,
  checkDeviceVerification,
  recordDeviceVerification,
} from '../services/authService';
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
  resetSettings,
} from '../store/slices/settingsSlice';
import { fetchBudget } from '../services/budgetService';
import { setBudgetData } from '../store/slices/budgetSlice';


import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const [initializing, setInitializing] = React.useState(true);
  const [pendingOTP, setPendingOTP] = React.useState(false);
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
        // Handle Session Registration in background to avoid blocking
        const handleSession = async () => {
          if (!currentSessionId.current) {
            try {
              const sid = await DeviceInfo.getUniqueId();
              currentSessionId.current = sid;
              await registerSession();

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
        };
        handleSession();

        const isFreshLogin = !wasAuthenticated.current;
        wasAuthenticated.current = true;

        // Optimized Data Sync: Parallelize everything
        const syncUserData = async () => {
          try {
            const [twoFA, profileData] = await Promise.all([
              isTwoFactorEnabled(user.uid),
              getUserProfile(user.uid),
            ]);

            dispatch(setTwoFactor(twoFA));
            dispatch(
              setProfile({
                uid: user.uid,
                name: profileData?.name || user.displayName || 'User',
                email: user.email || '',
                photoURL: profileData?.photoURL || user.photoURL || null,
                phone: profileData?.phone || null,
              }),
            );

            // Fetch Budget Data in background (don't await)
            fetchBudget().then(data => dispatch(setBudgetData(data)));

            return { twoFA };
          } catch (e) {
            console.error('Data sync error:', e);
            return { twoFA: false };
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

              const otp = await generateOTP(user.uid);
              setTimeout(() => {
                showToast(`Your OTP code is: ${otp}`, 'info', 'Verification Code', 15000);
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
          // App restart: Direct entry (Instant)
          syncUserData(); // Run in parallel
          setIsAuthenticated(true);
        }
      } else {
        wasAuthenticated.current = false;
        setIsAuthenticated(false);
        setPendingOTP(false);
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

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Show OTP screen if 2FA is pending
  if (isAuthenticated && pendingOTP && otpUserData) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" translucent={false} />
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
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.BG}
            translucent={false}
          />
          <Stack.Navigator
            screenOptions={({ navigation }) => ({
              cardStyle: { backgroundColor: theme.BG },
              gestureEnabled: true,
              ...TransitionPresets.SlideFromRightIOS,
              headerStyle: {
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
                backgroundColor: theme.BG,
              },
              headerLeft: () => (
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()}>
                  <Feather name="arrow-left" size={24} color={theme.TEXT} />
                </TouchableOpacity>
              ),
              headerTitleStyle: {
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                color: theme.TEXT,
              },
              headerTitleAlign: 'center',
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
                  <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Search')}>
                    <Feather name="search" size={22} color={theme.TEXT} />
                  </TouchableOpacity>
                  <HeaderProfile />
                </View>
              ),
            })}
          >
            <Stack.Screen name="Drawer" component={MainDrawerNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StockDetail" component={StockDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BuyCrypto" component={BuyCryptoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddAccount" component={AddAccountScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddCategory" component={AddCategoryScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </>
      ) : (
        <AuthStack />
      )}
    </>
  );
};
