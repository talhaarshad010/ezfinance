import React from 'react';
import { createDrawerNavigator, useDrawerProgress } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { View, StyleSheet } from 'react-native';
import { useNavigationState, useRoute } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import StockMarketScreen from '../features/main/screens/StockMarketScreen';
import AddExpenseScreen from '../features/main/screens/AddExpenseScreen';
import AnalyticsScreen from '../features/main/screens/AnalyticsScreen';
import PortfolioScreen from '../features/main/screens/PortfolioScreen';

import SettingsScreen from '../features/main/screens/SettingsScreen';
import BudgetPlannerScreen from '../features/main/screens/BudgetPlannerScreen';
import NotificationsScreen from '../features/main/screens/NotificationsScreen';
import BankAccountsScreen from '../features/main/screens/BankAccountsScreen';
import ProfileScreen from '../features/main/screens/ProfileScreen';
import LoansScreen from '../features/main/screens/LoansScreen';
import { useTheme } from '../context/ThemeContext';
import { useUserMode } from '../context/UserModeContext';
import { FEATURES } from '../constants/features';
import {
  NewLoans,
  NewNotifications,
} from '../features/main/newUser/NewUserDrawerScreens';

const Drawer = createDrawerNavigator();

const SceneWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  const progress = useDrawerProgress();
  const { theme } = useTheme();

  // Drawer screens swap instantly by default; fade + rise the newly active one.
  // Only the drawer's own active route is tracked, so pushing a root-stack
  // screen on top (which blurs this one) doesn't hide it mid-transition.
  const routeKey = useRoute().key;
  const isActive = useNavigationState(
    state => state.routes[state.index]?.key === routeKey,
  );
  const enter = useSharedValue(isActive ? 0 : 1);

  React.useEffect(() => {
    if (isActive) {
      enter.value = 0;
      enter.value = withTiming(1, {
        duration: 340,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    }
  }, [isActive, enter]);

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
      opacity: interpolate(enter.value, [0, 1], [0, 1]),
      transform: [
        { translateY: interpolate(enter.value, [0, 1], [18, 0]) },
        { scale },
      ],
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

// Stable component wrappers to prevent unmounting & re-creation during drawer transitions.
// Screens with sample data show a new-user version (real data or an empty state) for signed-in
// accounts; the sample-data version is only for Explore.
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



const AddExpenseWrapper = React.memo(() => (
  <SceneWrapper>
    <AddExpenseScreen />
  </SceneWrapper>
));

// Same analytics for both; a real account sees only its own spending.
const AnalyticsWrapper = React.memo(() => (
  <SceneWrapper>
    <AnalyticsScreen />
  </SceneWrapper>
));

// Same planner for both; a real account sees only its own budget and envelopes.
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

const NotificationsWrapper = React.memo(() => {
  const { isNewUser } = useUserMode();
  return <SceneWrapper>{isNewUser ? <NewNotifications /> : <NotificationsScreen />}</SceneWrapper>;
});

// Same accounts screen for both; a real account sees only the accounts it added.
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

const LoansWrapper = React.memo(() => {
  const { isNewUser } = useUserMode();
  return <SceneWrapper>{isNewUser ? <NewLoans /> : <LoansScreen />}</SceneWrapper>;
});

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
        {FEATURES.stockMarket && <Drawer.Screen name="StockMarket" component={StockMarketWrapper} />}
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
        {FEATURES.loans && (
          <Drawer.Screen
            name="Loans"
            component={LoansWrapper}
            options={{ title: 'Loans & Liabilities' }}
          />
        )}
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
