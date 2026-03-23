import { View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { Typography } from '../components';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

import DashboardScreen from '../features/main/screens/DashboardScreen';
import ExpensesScreen from '../features/main/screens/ExpensesScreen';
import InvestmentsScreen from '../features/main/screens/InvestmentsScreen';
import AIAdvisorScreen from '../features/main/screens/AIAdvisorScreen';
import ProfileScreen from '../features/main/screens/ProfileScreen';
import { useToast } from '../context/ToastContext';
import { HeaderProfile } from '../components/HeaderProfile';

export const MainNavigator = () => {
  const { showToast } = useToast();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 20,
            }}
          >
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('Search')}
            >
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'home';
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Expenses') {
            iconName = 'credit-card';
          } else if (route.name === 'Investments') {
            iconName = 'trending-up';
          } else if (route.name === 'AI Advisor') {
            iconName = 'cpu';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Investments" component={InvestmentsScreen} />
      <Tab.Screen name="AI Advisor" component={AIAdvisorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
