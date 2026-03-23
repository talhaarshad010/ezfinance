import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, DeviceEventEmitter} from 'react-native';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import Feather from 'react-native-vector-icons/Feather';
import Typography from '../components/Typography';
import { colors } from '../theme/colors';
import { useAppSelector } from '../store/hooks';

const { width } = Dimensions.get('window');

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
    <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
      <Feather name={icon} size={20} color={active ? '#FFF' : '#8E8E93'} />
    </View>
    <Typography 
      variant="body" 
      weight={active ? "700" : "500"} 
      style={{flex: 1, marginLeft: 16}}
      color={active ? '#000' : '#8E8E93'}
    >
      {label}
    </Typography>
    {hasBadge && <View style={styles.badge} />}
    {active && <View style={{ opacity: 0.5 }}><Feather name="chevron-right" size={16} color="#FFF" /></View>}
  </TouchableOpacity>
);

const SectionHeader = ({title}: {title: string}) => (
  <View style={styles.sectionHeaderContainer}>
    <Typography 
      variant="caption" 
      weight="700" 
      color="#48484A" 
      style={styles.sectionHeader}
    >
      {title.toUpperCase()}
    </Typography>
    <View style={styles.sectionDivider} />
  </View>
);

export const DrawerContent = (props: DrawerContentComponentProps) => {
  const currentRoute = props.state.routes[props.state.index].name;
  const activeTabRoute = props.state.routes[props.state.index].state?.routes?.[props.state.routes[props.state.index].state?.index ?? 0]?.name;
  const currentScreenName = activeTabRoute || currentRoute;
  const profile = useAppSelector(state => state.user.profile);

  const getInitials = () => {
    if (!profile?.name) return '??';
    const nameParts = profile.name.split(' ');
    return nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : profile.name.slice(0, 2).toUpperCase();
  };

  const navigateTo = (screen: string) => {
    if (['Home', 'Expenses', 'Investments', 'AI Advisor', 'Profile'].includes(screen)) {
      props.navigation.navigate('MainTabs', { screen });
    } else {
      props.navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Glow Effect */}
      <View style={styles.glow} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigateTo('Profile')}
          >
            <View style={styles.avatarBorder}>
              {profile?.photoURL ? (
                <Image source={{uri: profile.photoURL}} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.initialsAvatar]}>
                  <Typography variant="h3" weight="700" color="#000">
                     {getInitials()}
                  </Typography>
                </View>
              )}
            </View>
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Typography variant="h3" weight="700" color="#FFF">{profile?.name || 'User'}</Typography>
            <View style={styles.membershipBadge}>
              <Feather name="award" size={12} color="#FFD700" />
              <Typography variant="caption" weight="700" color="#FFD700" style={{ marginLeft: 4 }}>
                PREMIUM
              </Typography>
            </View>
          </View>
        </View>

        {/* Principal */}
        <SectionHeader title="Principal" />
        <MenuItem 
          icon="grid" 
          label="Dashboard" 
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
        <MenuItem icon="bar-chart-2" label="Analytics" onPress={() => navigateTo('Analytics')} />
        <MenuItem 
          icon="pie-chart" 
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

        {/* Intelligence */}
        <SectionHeader title="Intelligence" />
        <MenuItem 
          icon="cpu" 
          label="AI Advisor" 
          onPress={() => navigateTo('AI Advisor')} 
          active={currentScreenName === 'AI Advisor'}
          hasBadge
        />

        {/* Account */}
        <SectionHeader title="Preferences" />
        <MenuItem 
          icon="bell" 
          label="Notifications" 
          active={currentScreenName === 'Notifications'}
          onPress={() => navigateTo('Notifications')} 
        />
        <MenuItem 
          icon="settings" 
          label="Settings" 
          active={currentScreenName === 'Settings'}
          onPress={() => navigateTo('Settings')} 
        />
        
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => DeviceEventEmitter.emit('LOGOUT')}
        >
          <Feather name="log-out" size={20} color="#FF3B30" />
          <Typography variant="body" weight="700" color="#FF3B30" style={{ marginLeft: 16 }}>
            Sign Out
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  glow: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  profileSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    backgroundColor: '#000',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    backgroundColor: '#F2F2F7',
  },
  initialsAvatar: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 12,
  },
  sectionHeader: {
    letterSpacing: 2,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    borderRadius: 16,
    marginBottom: 2,
  },
  activeItem: {
    backgroundColor: '#F2F2F7',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#000',
  },
  badge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  }
});
