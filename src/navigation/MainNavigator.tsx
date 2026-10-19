import React, { useCallback, useState } from 'react';
import { Easing, View } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';

import DashboardScreen from '../features/main/screens/DashboardScreen';
import ExpensesScreen from '../features/main/screens/ExpensesScreen';
import InvestmentsScreen from '../features/main/screens/InvestmentsScreen';
import AIAdvisorScreen from '../features/main/screens/AIAdvisorScreen';
import GoalsScreen from '../features/main/screens/GoalsScreen';
import { useFocusEffect } from '@react-navigation/native';
import { CustomBottomNav } from './CustomBottomNav';
import { useTheme } from '../context/ThemeContext';
import { useUserMode, useUserUi } from '../context/UserModeContext';
import { LoadGate } from '../components/LoadGate';
import { AISkeleton, GoalsSkeleton, NewUserSkeleton } from '../components/Skeletons';
import { NewInvestments } from '../features/main/newUser/NewUserScreens';
import { TourOverlay } from '../features/main/newUser/TourOverlay';
import { InvestmentComingSoon } from '../features/main/screens/investments/InvestmentComingSoon';

const Tab = createBottomTabNavigator();

// Soft cross-fade with a slight horizontal glide toward the selected tab.
const tabTransition: BottomTabNavigationOptions = {
  transitionSpec: {
    animation: 'timing',
    config: { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  },
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, -0.5, 0, 0.5, 1],
        outputRange: [0, 0, 1, 0, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-16, 0, 16],
          }),
        },
      ],
    },
  }),
};

// Each tab: a fresh account gets the new-user screen (empty states, no sample
// data); a returning user gets the regular screen. Both load behind a skeleton.
// Home, Expenses and Investments show their skeletons inside the screen, so
// their headers and sub-tabs stay put while each section loads.

// Same dashboard for both; a real account sees only its own figures.
const HomeTab = () => <DashboardScreen />;

// Same ledger layout for both; a real account sees only its own entries.
const ExpensesTab = () => {
  const { isNewUser } = useUserMode();
  return <ExpensesScreen mode={isNewUser ? 'user' : 'sample'} />;
};

const AITab = () => {
  return (
    <LoadGate id="ai" skeleton={<AISkeleton />}>
      {/* Same Personal CA for everyone; it uses a signed-in user's own data. */}
      <AIAdvisorScreen />
    </LoadGate>
  );
};

// New users get the same "Coming soon" splash as the sample-data version; "Explore now" opens
// their (empty) investments. Leaving the tab brings the splash back.
const NewInvestmentsTab = () => {
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(useCallback(() => () => setRevealed(false), []));
  return revealed ? (
    <LoadGate id="investments" skeleton={<NewUserSkeleton />}>
      <NewInvestments />
    </LoadGate>
  ) : (
    <InvestmentComingSoon onExplore={() => setRevealed(true)} />
  );
};

const InvestmentsTab = () => {
  const { isNewUser } = useUserMode();
  return isNewUser ? <NewInvestmentsTab /> : <InvestmentsScreen />;
};

// Same Goals Hub for both; a real account sees only its own goals.
const GoalsTab = () => (
  <LoadGate id="goals" skeleton={<GoalsSkeleton />}>
    <GoalsScreen />
  </LoadGate>
);

export const MainNavigator = () => {
  const { theme } = useTheme();
  const { isNewUser } = useUserMode();
  const { tourOpen } = useUserUi();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={props => <CustomBottomNav {...props} />}
        screenOptions={{
          headerShown: false,
          ...tabTransition,
          // Tabs you're not looking at stop redrawing until you switch back to them.
          freezeOnBlur: true,
          sceneStyle: { backgroundColor: theme.BG },
        }}
      >
        <Tab.Screen name="Home" component={HomeTab} />
        <Tab.Screen name="Expenses" component={ExpensesTab} />
        <Tab.Screen name="AI Advisor" component={AITab} />
        <Tab.Screen name="Investments" component={InvestmentsTab} />
        <Tab.Screen name="Goals" component={GoalsTab} />
      </Tab.Navigator>
      {/* First-run guided tour for a fresh account */}
      {isNewUser && tourOpen && <TourOverlay />}
    </View>
  );
};

export default MainNavigator;
