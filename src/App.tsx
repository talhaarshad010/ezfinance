import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigator} from './navigation';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import { Provider } from 'react-redux';
import { store } from './store';
import { FirebaseSyncProvider } from './components/FirebaseSyncProvider';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <FirebaseSyncProvider>
        <ToastProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
          <Toast />
        </ToastProvider>
      </FirebaseSyncProvider>
    </Provider>
  );
}

export default App;
