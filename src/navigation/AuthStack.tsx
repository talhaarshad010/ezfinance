import React from 'react';
import { StatusBar } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  onLogin: () => void;
}

export const AuthStack = ({ onLogin }: AuthStackProps) => {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F9F9F9"
        translucent={false}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={onLogin} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </>
  );
};
