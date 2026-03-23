import React from 'react';
import { createDrawerNavigator, useDrawerProgress } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Logo } from '../components';
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

const Drawer = createDrawerNavigator();

const SceneWrapper = ({ children }: { children: React.ReactNode }) => {
  const progress = useDrawerProgress();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [1, 0.8],
      Extrapolation.CLAMP
    );

    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [0, 26],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      borderRadius,
    };
  });

  return (
    <Animated.View style={[styles.stack, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export const MainDrawerNavigator = () => {
  const { showToast } = useToast();
  
  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
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
              <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Search')}>
                <Feather name="search" size={20} color="#000" />
              </TouchableOpacity>
              <HeaderProfile />
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
            width: '70%',
            backgroundColor: 'transparent',
          },
          overlayColor: 'transparent',
          sceneContainerStyle: {
            backgroundColor: '#F2F2F7', // Light gray background behind the scaled screen
          },
        })}
      >
        <Drawer.Screen name="MainTabs" options={{ headerShown: false }}>
            {() => <SceneWrapper><MainNavigator /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="StockMarket">
            {() => <SceneWrapper><StockMarketScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="CryptoMarket">
            {() => <SceneWrapper><CryptoMarketScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="AddExpense" options={{ drawerItemStyle: { display: 'none' } }}>
            {() => <SceneWrapper><AddExpenseScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="Analytics" options={{ drawerItemStyle: { display: 'none' } }}>
            {() => <SceneWrapper><AnalyticsScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="BudgetPlanner" options={{ title: 'Budget Planner' }}>
            {() => <SceneWrapper><BudgetPlannerScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="Portfolio" options={{ drawerItemStyle: { display: 'none' } }}>
            {() => <SceneWrapper><PortfolioScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen name="Settings" options={{ drawerItemStyle: { display: 'none' } }}>
            {() => <SceneWrapper><SettingsScreen /></SceneWrapper>}
        </Drawer.Screen>
        <Drawer.Screen
          name="Notifications"
          options={{ drawerItemStyle: { display: 'none' } }}
        >
            {() => <SceneWrapper><NotificationsScreen /></SceneWrapper>}
        </Drawer.Screen>
      </Drawer.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    shadowColor: '#FFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 5,
    overflow: 'hidden',
  },
});
