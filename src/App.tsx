import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigator} from './navigation';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import { Provider } from 'react-redux';
import { store } from './store';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ToastProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast />
      </ToastProvider>
    </Provider>
  );
}

export default App;
