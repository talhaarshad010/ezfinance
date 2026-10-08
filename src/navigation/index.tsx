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
import GoalDetailScreen from '../features/main/screens/GoalDetailScreen';
import CreateGoalScreen from '../features/main/screens/CreateGoalScreen';
import LogContributionScreen from '../features/main/screens/LogContributionScreen';
import PauseGoalScreen from '../features/main/screens/PauseGoalScreen';
import AgeOfMoneyScreen from '../features/main/screens/AgeOfMoneyScreen';
import MoveMoneyScreen from '../features/main/screens/MoveMoneyScreen';
import {
  TouchableOpacity,
  View,
  StatusBar,
  DeviceEventEmitter,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo } from '../components';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearProfile } from '../store/slices/userSlice';
import { HeaderProfile } from '../components/HeaderProfile';
import { resetSettings } from '../store/slices/settingsSlice';
import { useTheme } from '../context/ThemeContext';
import { useUserMode } from '../context/UserModeContext';
import { useNetwork } from '../context/NetworkContext';
import { OfflineBanner } from '../components/Feedback';
import { FirstActionSheetHost, TransactionSheetHost } from '../features/main/newUser/sheets';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const profile = useAppSelector(state => state.user.profile);
  const isAuthenticated = !!profile;
  const { beginReturningUser } = useUserMode();
  const net = useNetwork();

  const [pendingOTP, setPendingOTP] = React.useState(false);
  const [otpUserData, setOtpUserData] = React.useState<{
    uid: string;
    email: string;
  } | null>(null);

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
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LogContribution" component={LogContributionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PauseGoal" component={PauseGoalScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AgeOfMoney" component={AgeOfMoneyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MoveMoney" component={MoveMoneyScreen} options={{ headerShown: false }} />
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
