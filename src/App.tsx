import React from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { AppNavigator } from './navigation';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import { Provider } from 'react-redux';
import { store } from './store';
import { FirebaseSyncProvider } from './components/FirebaseSyncProvider';
import { ThemeProvider, useTheme } from './context/ThemeContext';

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
    <NavigationContainer theme={customNavTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <FirebaseSyncProvider>
          <ToastProvider>
            <NavigationWrapper />
            <Toast />
          </ToastProvider>
        </FirebaseSyncProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
