import { navigationRef } from './navigation/navigationRef';
import React from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { AppNavigator } from './navigation';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { hideNativeSplash } from './utils/nativeSplash';
import { UserModeProvider } from './context/UserModeContext';
import { LoadingProvider } from './context/LoadingContext';
import { NetworkProvider } from './context/NetworkContext';

function NavigationWrapper() {
  const { theme } = useTheme();

  const customNavTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.BG,
      card: theme.BG,
      border: theme.BORDER,
      text: theme.TEXT,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={customNavTheme} onReady={hideNativeSplash}>
      <AppNavigator />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            {/* New vs returning user → per-section loading → connectivity + offline sync */}
            <UserModeProvider>
              <LoadingProvider>
                <NetworkProvider>
                  <NavigationWrapper />
                  <Toast />
                </NetworkProvider>
              </LoadingProvider>
            </UserModeProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
