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
import VerifyEmailScreen from '../features/auth/screens/VerifyEmailScreen';
import { useAuthTheme } from '../features/auth/components/authTheme';
import { AuthGuardProvider } from '../features/auth/components/AuthGuard';
import { HAS_NATIVE_SPLASH } from '../utils/nativeSplash';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  Login: { email?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
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

// The splash + onboarding intro plays once per app launch. AuthStack mounts again
// after sign-out, and that should land on Welcome instead of replaying the intro.
let introShown = false;
const introRoute = (): keyof AuthStackParamList => (HAS_NATIVE_SPLASH ? 'Onboarding' : 'Splash');

export const AuthStack = () => {
  // Follows the app theme: light by default, dark once switched in Settings.
  const A = useAuthTheme();
  const [initialRoute] = React.useState<keyof AuthStackParamList>(() => (introShown ? 'Welcome' : introRoute()));
  React.useEffect(() => {
    introShown = true;
  }, []);
  return (
    <AuthGuardProvider>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} translucent={false} />
      <Stack.Navigator
        // First launch: Android plays the logo splash natively before JS is up, iOS uses
        // the JS Splash route. After sign-out: straight to Welcome.
        initialRouteName={initialRoute}
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
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      </Stack.Navigator>
    </AuthGuardProvider>
  );
};
