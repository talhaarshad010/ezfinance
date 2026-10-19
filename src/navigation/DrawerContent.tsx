import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import Feather from 'react-native-vector-icons/Feather';
import Typography from '../components/Typography';
import { useAppSelector } from '../store/hooks';
import { useTheme } from '../context/ThemeContext';
import { useUserMode, useUserUi } from '../context/UserModeContext';
import { FEATURES } from '../constants/features';
import { signOut } from '../services/authService';

const { width } = Dimensions.get('window');

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  hasBadge?: boolean;
}

const MenuItem = React.memo(
  ({ icon, label, onPress, active, hasBadge }: MenuItemProps) => {
    const { theme } = useTheme();

    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          {
            backgroundColor: active ? `${theme.ACTIVE}18` : 'transparent',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: active ? theme.ACTIVE : theme.MODAL,
            },
          ]}
        >
          <Feather
            name={icon}
            size={18}
            color={active ? '#FFFFFF' : theme.TEXT}
          />
        </View>
        <Typography
          variant="body"
          weight={active ? '700' : '600'}
          color={active ? theme.TEXT : theme.MUTED}
          style={{ flex: 1, marginLeft: 14 }}
        >
          {label}
        </Typography>
        {hasBadge && (
          <View style={[styles.badge, { backgroundColor: theme.ACTIVE }]} />
        )}
        <Feather
          name="chevron-right"
          size={14}
          color={active ? theme.TEXT : theme.MUTED}
          style={{ opacity: active ? 0.9 : 0.4 }}
        />
      </TouchableOpacity>
    );
  },
);

const SectionHeader = ({ title }: { title: string }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.sectionHeaderContainer}>
      <Typography
        variant="caption"
        weight="700"
        color={theme.MUTED}
        style={styles.sectionHeader}
      >
        {title.toUpperCase()}
      </Typography>
      <View style={[styles.sectionDivider, { backgroundColor: theme.BORDER }]} />
    </View>
  );
};

export const DrawerContent = React.memo((props: DrawerContentComponentProps) => {
  const { theme } = useTheme();
  const currentRoute = props.state.routes[props.state.index].name;
  const activeTabRoute =
    props.state.routes[props.state.index].state?.routes?.[
      props.state.routes[props.state.index].state?.index ?? 0
    ]?.name;
  const currentScreenName = activeTabRoute || currentRoute;
  const profile = useAppSelector(state => state.user.profile);
  const { isNewUser } = useUserMode();
  const { openTxSheet } = useUserUi();

  const drawerBg = theme.isDark ? '#0A0A0D' : '#F8F9FA';

  const getInitials = () => {
    if (!profile?.name) return '??';
    const nameParts = profile.name.split(' ');
    return nameParts.length > 1
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : profile.name.slice(0, 2).toUpperCase();
  };

  const navigateTo = (screen: string) => {
    props.navigation.closeDrawer();
    if (screen === 'AddExpense' && isNewUser) {
      // Real accounts log expenses with the same sheet as the rest of the new-user flow.
      props.navigation.navigate('MainTabs', { screen: 'Expenses' });
      setTimeout(() => openTxSheet({ type: 'expense' }), 300);
      return;
    }
    if (
      ['Home', 'Expenses', 'Investments', 'AI Advisor', 'Goals'].includes(screen)
    ) {
      props.navigation.navigate('MainTabs', { screen });
    } else {
      props.navigation.navigate(screen);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: drawerBg,
          borderRightWidth: 1,
          borderRightColor: theme.BORDER,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Section Header */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigateTo('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarBorder,
                { backgroundColor: theme.BORDER, borderColor: theme.ACTIVE },
              ]}
            >
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.initialsAvatar,
                    { backgroundColor: theme.CARD },
                  ]}
                >
                  <Typography variant="h3" weight="700" color={theme.TEXT}>
                    {getInitials()}
                  </Typography>
                </View>
              )}
            </View>
            <View
              style={[
                styles.onlineBadge,
                {
                  backgroundColor: theme.GREEN,
                  borderColor: drawerBg,
                },
              ]}
            />
          </View>
          <View style={styles.profileInfo}>
            <Typography variant="h3" weight="700" color={theme.TEXT}>
              {profile?.name || 'User'}
            </Typography>
            {/* Membership tiers aren't real yet: only the Explore demo shows the badge. */}
            {!isNewUser && (
              <View
                style={[
                  styles.membershipBadge,
                  { backgroundColor: theme.MODAL },
                ]}
              >
                <Feather name="award" size={12} color="#FFD700" />
                <Typography
                  variant="caption"
                  weight="700"
                  color="#FFD700"
                  style={{ marginLeft: 4 }}
                >
                  PREMIUM
                </Typography>
              </View>
            )}
          </View>
        </TouchableOpacity>

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
        <MenuItem
          icon="plus-circle"
          label="Add Expense"
          active={currentScreenName === 'AddExpense'}
          onPress={() => navigateTo('AddExpense')}
        />
        <MenuItem
          icon="bar-chart-2"
          label="Analytics"
          active={currentScreenName === 'Analytics'}
          onPress={() => navigateTo('Analytics')}
        />
        <MenuItem
          icon="pie-chart"
          label="Budget Planner"
          active={currentScreenName === 'BudgetPlanner'}
          onPress={() => navigateTo('BudgetPlanner')}
        />
        <MenuItem
          icon="briefcase"
          label="Bank Accounts"
          active={currentScreenName === 'BankAccounts'}
          onPress={() => navigateTo('BankAccounts')}
        />

        {/* Plan */}
        <SectionHeader title="Plan & Save" />
        <MenuItem
          icon="target"
          label="Savings Goals"
          active={currentScreenName === 'Goals'}
          onPress={() => navigateTo('Goals')}
        />
        {FEATURES.loans && (
          <MenuItem
            icon="layers"
            label="Loans & Liabilities"
            active={currentScreenName === 'Loans'}
            onPress={() => navigateTo('Loans')}
          />
        )}

        {/* Growth */}
        <SectionHeader title="Growth" />
        <MenuItem
          icon="trending-up"
          label="Investments"
          active={currentScreenName === 'Investments'}
          onPress={() => navigateTo('Investments')}
        />
        {FEATURES.stockMarket && (
          <MenuItem
            icon="activity"
            label="Stock Market"
            active={currentScreenName === 'StockMarket'}
            onPress={() => navigateTo('StockMarket')}
          />
        )}

        {/* Intelligence */}
        <SectionHeader title="Intelligence" />
        <MenuItem
          icon="cpu"
          label="AI Advisor"
          onPress={() => navigateTo('AI Advisor')}
          active={currentScreenName === 'AI Advisor'}
          hasBadge
        />

        {/* Preferences */}
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
          style={[styles.logoutButton, { borderTopColor: theme.BORDER }]}
          onPress={() => signOut()}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={20} color={theme.RED} />
          <Typography
            variant="body"
            weight="700"
            color={theme.RED}
            style={{ marginLeft: 16 }}
          >
            Sign Out
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 1.5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
  },
  initialsAvatar: {
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
    borderWidth: 2,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 10,
  },
  sectionHeader: {
    letterSpacing: 2,
    fontSize: 10,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 16,
    marginBottom: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 36,
    borderTopWidth: 1,
  },
});
