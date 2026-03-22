import React from 'react';
import { AuthStack } from './AuthStack';
export type { AuthStackParamList } from './AuthStack';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import { createStackNavigator } from '@react-navigation/stack';
import ChangePasswordScreen from '../features/main/screens/ChangePasswordScreen';
import StockDetailScreen from '../features/main/screens/StockDetailScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import ExpenseDetailScreen from '../features/main/screens/ExpenseDetailScreen';
import BuyCryptoScreen from '../features/main/screens/BuyCryptoScreen';
import EditProfileScreen from '../features/main/screens/EditProfileScreen';
import SecurityScreen from '../features/main/screens/SecurityScreen';
import AssetDetailScreen from '../features/main/screens/AssetDetailScreen';
import {
  TouchableOpacity,
  View,
  StatusBar,
  DeviceEventEmitter,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo } from '../components';
import { onAuthStateChanged, signOut } from '../services/authService';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [initializing, setInitializing] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const logoutListener = DeviceEventEmitter.addListener('LOGOUT', () => {
      signOut();
    });
    return () => logoutListener.remove();
  }, []);

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F9FB',
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#F8F9FB"
            translucent={false}
          />
          <Stack.Navigator
            screenOptions={({ navigation }) => ({
              headerStyle: {
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
                backgroundColor: '#F8F9FB',
              },
              headerLeft: () => (
                <TouchableOpacity
                  style={{ marginLeft: 20 }}
                  onPress={() => navigation.goBack()}
                >
                  <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
              ),
              headerTitleStyle: {
                fontFamily: 'Inter-Bold',
                fontSize: 18,
              },
              headerTitleAlign: 'center',
              headerRight: () => (
                <TouchableOpacity
                  style={{ marginRight: 20 }}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#E0E0E0',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name="user" size={18} color="#666" />
                  </View>
                </TouchableOpacity>
              ),
            })}
          >
            <Stack.Screen
              name="Drawer"
              component={MainDrawerNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen
              name="StockDetail"
              component={StockDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen
              name="ExpenseDetail"
              component={ExpenseDetailScreen}
              options={{ title: 'Transaction' }}
            />
            <Stack.Screen
              name="BuyCrypto"
              component={BuyCryptoScreen}
              options={{ title: '' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="Security"
              component={SecurityScreen}
              options={{ title: 'Security' }}
            />
            <Stack.Screen
              name="AssetDetail"
              component={AssetDetailScreen}
              options={{ title: '' }}
            />
          </Stack.Navigator>
        </>
      ) : (
        <AuthStack onLogin={() => setIsAuthenticated(true)} />
      )}
    </>
  );
};
