import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../features/main/screens/DashboardScreen';
import ExpensesScreen from '../features/main/screens/ExpensesScreen';
import InvestmentsScreen from '../features/main/screens/InvestmentsScreen';
import AIAdvisorScreen from '../features/main/screens/AIAdvisorScreen';
import GoalsScreen from '../features/main/screens/GoalsScreen';
import { CustomBottomNav } from './CustomBottomNav';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
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
