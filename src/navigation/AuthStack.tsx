import React from 'react';
import { StatusBar } from 'react-native';
import {
  createStackNavigator,
  CardStyleInterpolators,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';
import SplashScreen from '../features/auth/screens/SplashScreen';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';
import WelcomeScreen from '../features/auth/screens/WelcomeScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';
import { useAuthTheme } from '../features/auth/components/authTheme';
import { HAS_NATIVE_SPLASH } from '../utils/nativeSplash';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

// Splash → slides → welcome cross-fade with a slight scale (Figma `.screen-enter`).
const fadeScale: StackNavigationOptions = {
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
  transitionSpec: {
    open: { animation: 'timing', config: { duration: 320 } },
    close: { animation: 'timing', config: { duration: 260 } },
  },
};

export const AuthStack = () => {
  // Follows the app theme: light by default, dark once switched in Settings.
  const A = useAuthTheme();
  return (
    <>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} translucent={false} />
      <Stack.Navigator
        // Android plays the logo splash natively before JS is up; iOS uses the JS route.
        initialRouteName={HAS_NATIVE_SPLASH ? 'Onboarding' : 'Splash'}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: A.BG },
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={fadeScale} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={fadeScale} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={fadeScale} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </>
  );
};
