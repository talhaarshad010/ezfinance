import React from 'react';
import { Easing } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';

import DashboardScreen from '../features/main/screens/DashboardScreen';
import ExpensesScreen from '../features/main/screens/ExpensesScreen';
import InvestmentsScreen from '../features/main/screens/InvestmentsScreen';
import AIAdvisorScreen from '../features/main/screens/AIAdvisorScreen';
import GoalsScreen from '../features/main/screens/GoalsScreen';
import { CustomBottomNav } from './CustomBottomNav';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

// Soft cross-fade with a slight horizontal glide toward the selected tab.
const tabTransition: BottomTabNavigationOptions = {
  transitionSpec: {
    animation: 'timing',
    config: { duration: 280, easing: Easing.bezier(0.22, 1, 0.36, 1) },
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
            outputRange: [-28, 0, 28],
          }),
        },
      ],
    },
  }),
};

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        ...tabTransition,
        sceneStyle: { backgroundColor: theme.BG },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="AI Advisor" component={AIAdvisorScreen} />
      <Tab.Screen name="Investments" component={InvestmentsScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
