import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Image} from 'react-native';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import Feather from 'react-native-vector-icons/Feather';
import {Typography} from '../components';
import {colors} from '../theme/colors';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  hasBadge?: boolean;
}

const MenuItem = ({icon, label, onPress, active, hasBadge}: MenuItemProps) => (
  <TouchableOpacity 
    style={[styles.menuItem, active && styles.activeItem]} 
    onPress={onPress}
  >
    <View style={styles.iconContainer}>
      <Feather name={icon} size={22} color={active ? '#FFF' : '#333'} />
    </View>
    <Typography 
      variant="body" 
      weight={active ? "700" : "500"} 
      style={{flex: 1, marginLeft: 12}}
      color={active ? '#FFF' : '#333'}
    >
      {label}
    </Typography>
    {hasBadge && <View style={styles.badge} />}
  </TouchableOpacity>
);

const SectionHeader = ({title}: {title: string}) => (
  <Typography 
    variant="caption" 
    weight="700" 
    color="#AAA" 
    style={styles.sectionHeader}
  >
    {title.toUpperCase()}
  </Typography>
);

export const DrawerContent = (props: DrawerContentComponentProps) => {
  const currentRoute = props.state.routes[props.state.index].name;
  const activeTabRoute = props.state.routes[props.state.index].state?.routes?.[props.state.routes[props.state.index].state?.index ?? 0]?.name;
  const currentScreenName = activeTabRoute || currentRoute;

  const navigateTo = (screen: string) => {
    if (['Home', 'Expenses', 'Investments', 'AI Advisor', 'Profile'].includes(screen)) {
      props.navigation.navigate('MainTabs', { screen });
    } else {
      props.navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{uri: 'https://i.pravatar.cc/150?u=talha'}} 
              style={styles.avatar}
            />
          </View>
          <Typography variant="h3" weight="700">Talha</Typography>
          <Typography variant="caption" color="#666">Premium Member</Typography>
        </View>

        {/* Principal */}
        <SectionHeader title="Principal" />
        <MenuItem 
          icon="home" 
          label="Home" 
          active={currentScreenName === 'Home'} 
          onPress={() => navigateTo('Home')} 
        />

        {/* Transact & Track */}
        <SectionHeader title="Transact & Track" />
        <MenuItem 
          icon="credit-card" 
          label="Expenses" 
          active={currentScreenName === 'Expenses'}
          onPress={() => navigateTo('Expenses')} 
        />
        <MenuItem icon="plus-circle" label="Add Expense" onPress={() => navigateTo('AddExpense')} />
        <MenuItem icon="bar-chart-2" label="Expense Analytics" onPress={() => navigateTo('Analytics')} />
        <MenuItem 
          icon="layout" 
          label="Budget Planner" 
          active={currentScreenName === 'BudgetPlanner'}
          onPress={() => navigateTo('BudgetPlanner')} 
        />

        {/* Growth */}
        <SectionHeader title="Growth" />
        <MenuItem 
          icon="trending-up" 
          label="Investments" 
          active={currentScreenName === 'Investments'}
          onPress={() => navigateTo('Investments')} 
        />
        <MenuItem 
          icon="activity" 
          label="Stock Market" 
          active={currentScreenName === 'StockMarket'}
          onPress={() => navigateTo('StockMarket')} 
        />
        <MenuItem 
          icon="zap" 
          label="Crypto Market" 
          active={currentScreenName === 'CryptoMarket'}
          onPress={() => navigateTo('CryptoMarket')} 
        />
        <MenuItem 
          icon="pie-chart" 
          label="Portfolio" 
          active={currentScreenName === 'Portfolio'}
          onPress={() => navigateTo('Portfolio')} 
        />

        {/* Intelligence */}
        <SectionHeader title="Intelligence" />
        <MenuItem 
          icon="cpu" 
          label="AI Financial Advisor" 
          onPress={() => navigateTo('AI Advisor')} 
          active={currentScreenName === 'AI Advisor'}
          hasBadge
        />

        {/* Account */}
        <SectionHeader title="Account" />
        <MenuItem 
          icon="bell" 
          label="Notifications" 
          active={currentScreenName === 'Notifications'}
          onPress={() => navigateTo('Notifications')} 
        />
        <MenuItem 
          icon="user" 
          label="Profile" 
          active={currentScreenName === 'Profile'}
          onPress={() => navigateTo('Profile')} 
        />
        <MenuItem 
          icon="settings" 
          label="Settings" 
          active={currentScreenName === 'Settings'}
          onPress={() => navigateTo('Settings')} 
        />

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingTop: 60,
  },
  profileContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#000',
    padding: 3,
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    borderRadius: 16,
  },
  activeItem: {
    backgroundColor: '#000',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  }
});
