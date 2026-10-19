import React from 'react';
import { AuthStack } from './AuthStack';
export type { AuthStackParamList } from './AuthStack';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChangePasswordScreen from '../features/main/screens/ChangePasswordScreen';
import StockDetailScreen from '../features/main/screens/StockDetailScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import ExpenseDetailScreen from '../features/main/screens/ExpenseDetailScreen';

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
import GoalDetailScreen from '../features/main/screens/GoalDetailScreen';
import CreateGoalScreen from '../features/main/screens/CreateGoalScreen';
import LogContributionScreen from '../features/main/screens/LogContributionScreen';
import PauseGoalScreen from '../features/main/screens/PauseGoalScreen';
import AgeOfMoneyScreen from '../features/main/screens/AgeOfMoneyScreen';
import MoveMoneyScreen from '../features/main/screens/MoveMoneyScreen';
import ImportStatementScreen from '../features/main/screens/ImportStatementScreen';
import {
  View,
  StatusBar,
  DeviceEventEmitter,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearProfile, setProfile } from '../store/slices/userSlice';
import { FEATURES } from '../constants/features';
import { isSignedIn, markTourCompleted, refreshProfile, restoreSession } from '../services/authService';
import { resetSettings } from '../store/slices/settingsSlice';
import { useTheme } from '../context/ThemeContext';
import { useUserMode, useUserUi } from '../context/UserModeContext';
import { useNetwork } from '../context/NetworkContext';
import { OfflineBanner } from '../components/Feedback';
import { FirstActionSheetHost, TransactionSheetHost } from '../features/main/newUser/sheets';

// Native stack: the slide in/out runs on the platform's own animation (not the JS thread), so a
// screen starts moving the moment it's tapped, and swipe-back feels like any other iOS app.
const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const profile = useAppSelector(state => state.user.profile);
  const isAuthenticated = !!profile;
  const { beginNewUser, beginReturningUser } = useUserMode();
  const { tourOpen } = useUserUi();
  const net = useNetwork();

  const [restoring, setRestoring] = React.useState(true);
  const [pendingOTP, setPendingOTP] = React.useState(false);
  const [otpUserData, setOtpUserData] = React.useState<{
    uid: string;
    email: string;
  } | null>(null);

  // Reopen the app signed in when a session was saved on this device.
  React.useEffect(() => {
    let active = true;
    (async () => {
      const saved = await restoreSession();
      if (!active) return;
      if (saved) {
        // Real accounts never see sample data; the tour shows until it's been completed once.
        beginNewUser({ tour: !saved.tourCompleted });
        dispatch(setProfile(saved));
      }
      setRestoring(false);
      if (saved) {
        // Pick up changes made on the server. A dead session signs out via the api layer.
        refreshProfile()
          .then(latest => {
            if (active && isSignedIn()) dispatch(setProfile(latest));
          })
          .catch(() => {});
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a signed-in account finishes or skips the tour, remember it on the server so it shows
  // only on the first visit (on any device). Explore (guest) has no account to remember it on.
  const wasTourOpen = React.useRef(false);
  React.useEffect(() => {
    if (wasTourOpen.current && !tourOpen && profile && !profile.tourCompleted && isSignedIn()) {
      markTourCompleted()
        .then(latest => {
          if (isSignedIn()) dispatch(setProfile(latest));
        })
        .catch(() => {}); // offline: the tour shows again next time, which is harmless
    }
    wasTourOpen.current = tourOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOpen]);

  React.useEffect(() => {
    const logoutListener = DeviceEventEmitter.addListener('LOGOUT', () => {
      dispatch(clearProfile());
      dispatch(resetSettings());
      // A logged-out device never keeps the previous account's new-user data.
      beginReturningUser();
      setPendingOTP(false);
      setOtpUserData(null);
    });
    return () => logoutListener.remove();
  }, [dispatch, beginReturningUser]);

  const handleOTPVerified = () => {
    setPendingOTP(false);
    setOtpUserData(null);
  };

  const handleOTPCancel = () => {
    setPendingOTP(false);
    setOtpUserData(null);
    dispatch(clearProfile());
  };

  if (restoring) {
    return <View style={{ flex: 1, backgroundColor: theme.BG }} />;
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
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.BG },
              animation: 'slide_from_right',
              gestureEnabled: true,
              // Screens covered by another one stop redrawing until they're shown again.
              freezeOnBlur: true,
            }}
          >
            <Stack.Screen name="Drawer" component={MainDrawerNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
            {FEATURES.stockMarket && (
              <Stack.Screen name="StockDetail" component={StockDetailScreen} options={{ headerShown: false }} />
            )}
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ headerShown: false }} />
            
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddAccount" component={AddAccountScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddCategory" component={AddCategoryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LogContribution" component={LogContributionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PauseGoal" component={PauseGoalScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AgeOfMoney" component={AgeOfMoneyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MoveMoney" component={MoveMoneyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ImportStatement" component={ImportStatementScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
          {/* Global sheets for the new-user flow (add / edit transaction, first transaction chooser) */}
          <TransactionSheetHost />
          <FirstActionSheetHost />
          <OfflineBanner online={net.online} syncing={net.syncing} />
        </>
      ) : (
        <AuthStack />
      )}
    </>
  );
};
