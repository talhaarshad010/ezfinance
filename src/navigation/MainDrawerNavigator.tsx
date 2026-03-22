import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { TouchableOpacity, View, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo } from '../components';
import NotificationsScreen from '../features/main/screens/NotificationsScreen';
import StockMarketScreen from '../features/main/screens/StockMarketScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import AnalyticsScreen from '../features/main/screens/AnalyticsScreen';
import PortfolioScreen from '../features/main/screens/PortfolioScreen';
import CryptoMarketScreen from '../features/main/screens/CryptoMarketScreen';
import SettingsScreen from '../features/main/screens/SettingsScreen';
import BudgetPlannerScreen from '../features/main/screens/BudgetPlannerScreen';

const Drawer = createDrawerNavigator();

export const MainDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 20 }}
            onPress={() => (navigation as any).openDrawer()}
          >
            <Feather name="menu" size={24} color="#000" />
          </TouchableOpacity>
        ),
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
          fontSize: 18,
          color: '#000',
        },
        headerTitleAlign: 'center',
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
            <TouchableOpacity style={{ marginRight: 16 }} onPress={() => Alert.alert('Search', 'Market search coming soon.')}>
              <Feather name="search" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
               <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  <Typography variant="caption" weight="700" style={{ fontSize: 10 }}>AS</Typography>
               </View>
            </TouchableOpacity>
          </View>
        ),
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          backgroundColor: '#F8F9FB',
        },
        drawerType: 'slide',
        drawerStyle: {
          width: '75%',
        },
      })}
    >
      <Drawer.Screen name="MainTabs" component={MainNavigator} options={{ headerShown: false }} />
      <Drawer.Screen name="StockMarket" component={StockMarketScreen} />
      <Drawer.Screen name="CryptoMarket" component={CryptoMarketScreen} />
      <Drawer.Screen name="AddExpense" component={AddExpenseScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Analytics" component={AnalyticsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="BudgetPlanner" component={BudgetPlannerScreen} options={{ title: 'Budget Planner' }} />
      <Drawer.Screen name="Portfolio" component={PortfolioScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};
