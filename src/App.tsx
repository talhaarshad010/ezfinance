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
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { hideNativeSplash } from './utils/nativeSplash';

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
    <NavigationContainer theme={customNavTheme} onReady={hideNativeSplash}>
      <AppNavigator />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <NavigationWrapper />
          <Toast />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
