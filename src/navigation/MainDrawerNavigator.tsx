import React from 'react';
import { createDrawerNavigator, useDrawerProgress } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import StockMarketScreen from '../features/main/screens/StockMarketScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import AnalyticsScreen from '../features/main/screens/AnalyticsScreen';
import PortfolioScreen from '../features/main/screens/PortfolioScreen';
import CryptoMarketScreen from '../features/main/screens/CryptoMarketScreen';
import SettingsScreen from '../features/main/screens/SettingsScreen';
import BudgetPlannerScreen from '../features/main/screens/BudgetPlannerScreen';
import NotificationsScreen from '../features/main/screens/NotificationsScreen';
import BankAccountsScreen from '../features/main/screens/BankAccountsScreen';
import ProfileScreen from '../features/main/screens/ProfileScreen';
import LoansScreen from '../features/main/screens/LoansScreen';
import { useTheme } from '../context/ThemeContext';

const Drawer = createDrawerNavigator();

const SceneWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
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
      [0, 24],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
      borderRadius,
    };
  });

  return (
    <Animated.View
      style={[
        styles.stack,
        animatedStyle,
        {
          backgroundColor: theme.BG,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

// Stable component wrappers to prevent unmounting & re-creation during drawer transitions
const MainTabsWrapper = React.memo(() => (
  <SceneWrapper>
    <MainNavigator />
  </SceneWrapper>
));

const StockMarketWrapper = React.memo(() => (
  <SceneWrapper>
    <StockMarketScreen />
  </SceneWrapper>
));

const CryptoMarketWrapper = React.memo(() => (
  <SceneWrapper>
    <CryptoMarketScreen />
  </SceneWrapper>
));

const AddExpenseWrapper = React.memo(() => (
  <SceneWrapper>
    <AddExpenseScreen />
  </SceneWrapper>
));

const AnalyticsWrapper = React.memo(() => (
  <SceneWrapper>
    <AnalyticsScreen />
  </SceneWrapper>
));

const BudgetPlannerWrapper = React.memo(() => (
  <SceneWrapper>
    <BudgetPlannerScreen />
  </SceneWrapper>
));

const PortfolioWrapper = React.memo(() => (
  <SceneWrapper>
    <PortfolioScreen />
  </SceneWrapper>
));

const SettingsWrapper = React.memo(() => (
  <SceneWrapper>
    <SettingsScreen />
  </SceneWrapper>
));

const NotificationsWrapper = React.memo(() => (
  <SceneWrapper>
    <NotificationsScreen />
  </SceneWrapper>
));

const BankAccountsWrapper = React.memo(() => (
  <SceneWrapper>
    <BankAccountsScreen />
  </SceneWrapper>
));

const ProfileWrapper = React.memo(() => (
  <SceneWrapper>
    <ProfileScreen />
  </SceneWrapper>
));

const LoansWrapper = React.memo(() => (
  <SceneWrapper>
    <LoansScreen />
  </SceneWrapper>
));

export const MainDrawerNavigator = () => {
  const { theme } = useTheme();

  const drawerBg = theme.isDark ? '#0A0A0D' : '#F8F9FA';
  const sceneBg = theme.isDark ? '#040405' : '#E9EBEF';

  return (
    <View style={{ flex: 1, backgroundColor: sceneBg }}>
      <Drawer.Navigator
        drawerContent={props => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          drawerStyle: {
            width: '76%',
            backgroundColor: drawerBg,
          },
          overlayColor: 'transparent',
          sceneStyle: {
            backgroundColor: sceneBg,
          },
        }}
      >
        <Drawer.Screen name="MainTabs" component={MainTabsWrapper} />
        <Drawer.Screen name="StockMarket" component={StockMarketWrapper} />
        <Drawer.Screen name="CryptoMarket" component={CryptoMarketWrapper} />
        <Drawer.Screen
          name="AddExpense"
          component={AddExpenseWrapper}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="Analytics"
          component={AnalyticsWrapper}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="BudgetPlanner"
          component={BudgetPlannerWrapper}
          options={{ title: 'Budget Planner' }}
        />
        <Drawer.Screen
          name="Portfolio"
          component={PortfolioWrapper}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsWrapper}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="Notifications"
          component={NotificationsWrapper}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="BankAccounts"
          component={BankAccountsWrapper}
          options={{ title: 'Bank Accounts', drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileWrapper}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen
          name="Loans"
          component={LoansWrapper}
          options={{ title: 'Loans & Liabilities' }}
        />
      </Drawer.Navigator>
    </View>
  );
};

export default MainDrawerNavigator;

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: -8,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
});
