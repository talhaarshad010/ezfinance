import React from 'react';
import { createDrawerNavigator, useDrawerProgress } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import StockMarketScreen from '../features/main/screens/StockMarketScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import AnalyticsScreen from '../features/main/screens/AnalyticsScreen';
import PortfolioScreen from '../features/main/screens/PortfolioScreen';
import CryptoMarketScreen from '../features/main/screens/CryptoMarketScreen';
import SettingsScreen from '../features/main/screens/SettingsScreen';
import BudgetPlannerScreen from '../features/main/screens/BudgetPlannerScreen';
import { useToast } from '../context/ToastContext';
import { HeaderProfile } from '../components/HeaderProfile';
import NotificationsScreen from '../features/main/screens/NotificationsScreen';
import BankAccountsScreen from '../features/main/screens/BankAccountsScreen';
import { useTheme } from '../context/ThemeContext';

import ProfileScreen from '../features/main/screens/ProfileScreen';

const Drawer = createDrawerNavigator();

const SceneWrapper = ({ children }: { children: React.ReactNode }) => {
  const progress = useDrawerProgress();
  const { theme } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [1, 0.82],
      Extrapolation.CLAMP,
    );

    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [0, 26],
      Extrapolation.CLAMP,
    );

    const borderWidth = interpolate(
      progress.value,
      [0, 1],
      [0, theme.isDark ? 1.5 : 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
      borderRadius,
      borderWidth,
    };
  });

  return (
    <Animated.View
      style={[
        styles.stack,
        animatedStyle,
        {
          backgroundColor: theme.BG,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.16)'
            : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const MainDrawerNavigator = () => {
  const { showToast } = useToast();
  const { theme } = useTheme();

  const drawerBg = theme.isDark ? '#0A0A0D' : '#F8F9FA';
  const sceneBg = theme.isDark ? '#040405' : '#E9EBEF';

  return (
    <View style={{ flex: 1, backgroundColor: sceneBg }}>
      <Drawer.Navigator
        drawerContent={props => <DrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 20 }}
              onPress={() => (navigation as any).openDrawer()}
            >
              <Feather name="menu" size={24} color={theme.TEXT} />
            </TouchableOpacity>
          ),
          headerTitleStyle: {
            fontFamily: 'Inter-Bold',
            fontSize: 18,
            color: theme.TEXT,
          },
          headerTitleAlign: 'center',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
              <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Search')}>
                <Feather name="search" size={20} color={theme.TEXT} />
              </TouchableOpacity>
              <HeaderProfile />
            </View>
          ),
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            backgroundColor: theme.BG,
          },
          drawerType: 'slide',
          drawerStyle: {
            width: '75%',
            backgroundColor: drawerBg,
          },
          overlayColor: 'transparent',
          sceneContainerStyle: {
            backgroundColor: sceneBg,
          },
        })}
      >
        <Drawer.Screen name="MainTabs" options={{ headerShown: false }}>
          {() => <SceneWrapper><MainNavigator /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="StockMarket" options={{ headerShown: false }}>
          {() => <SceneWrapper><StockMarketScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="CryptoMarket" options={{ headerShown: false }}>
          {() => <SceneWrapper><CryptoMarketScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="AddExpense" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}>
          {() => <SceneWrapper><AddExpenseScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="Analytics" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}>
          {() => <SceneWrapper><AnalyticsScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="BudgetPlanner" options={{ headerShown: false, title: 'Budget Planner' }}>
          {() => <SceneWrapper><BudgetPlannerScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="Portfolio" options={{ drawerItemStyle: { display: 'none' } }}>
          {() => <SceneWrapper><PortfolioScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="Settings" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}>
          {() => <SceneWrapper><SettingsScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen
          name="Notifications"
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
        >
          {() => <SceneWrapper><NotificationsScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen
          name="BankAccounts"
          options={{ headerShown: false, title: 'Bank Accounts', drawerItemStyle: { display: 'none' } }}
        >
          {() => <SceneWrapper><BankAccountsScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen
          name="Profile"
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
        >
          {() => <SceneWrapper><ProfileScreen /></SceneWrapper>}
        </Drawer.Screen>
      </Drawer.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: -8,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
});
