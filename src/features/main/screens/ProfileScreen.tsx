import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { useUserMode } from '../../../context/UserModeContext';
import { fullAmt } from '../../../utils/format';
import { useToast } from '../../../context/ToastContext';
import { signOut } from '../../../services/authService';
import { DrawerMenuButton } from '../../../components';

/** Sign-up income options, by stored value. */
const INCOME_LABELS: Record<string, string> = {
  '< 25,000': 'Under PKR 25k',
  '25,000 to 50,000': 'PKR 25k to 50k',
  '50,000 to 100,000': 'PKR 50k to 100k',
  '100,000 to 150,000': 'PKR 100k to 150k',
  '> 150,000': 'PKR 150k and above',
};

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const profile = useAppSelector(state => state.user.profile);
  const twoFactor = useAppSelector(state => state.settings.twoFactorEnabled);
  // Real accounts show their own data; the hard-coded figures are only for the Explore demo.
  const { isNewUser, txs, bankAccounts } = useUserMode();
  const income = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const spent = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const now = new Date();
  const spentThisMonth = txs
    .filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
    .reduce((a, t) => a + t.amount, 0);
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' })
    : '—';
  const incomeLabel = profile?.monthlyIncome ? INCOME_LABELS[profile.monthlyIncome] ?? profile.monthlyIncome : 'Not set';

  const getInitials = () => {
    if (!profile?.name) return 'TA';
    return profile.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 110,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DrawerMenuButton />
            <View>
              <Text style={[styles.backText, { color: theme.MUTED, marginBottom: 2 }]}>
                Account & Preferences
              </Text>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                My Profile
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
            style={[styles.editHeaderBtn, { backgroundColor: theme.CARD }]}
          >
            <Feather name="edit-3" size={15} color={theme.TEXT} />
            <Text style={[styles.editHeaderText, { color: theme.TEXT }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero User Profile Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroCard, { backgroundColor: theme.CARD }]}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatarBorder,
                    { borderColor: theme.ACTIVE, backgroundColor: theme.MODAL },
                  ]}
                >
                  {profile?.photoURL ? (
                    <Image
                      source={{ uri: profile.photoURL }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarImg,
                        styles.initialsAvatar,
                        { backgroundColor: theme.MODAL },
                      ]}
                    >
                      <Text style={[styles.initialsText, { color: theme.TEXT }]}>
                        {getInitials()}
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: theme.GREEN, borderColor: theme.CARD },
                  ]}
                />
              </View>

              <View style={styles.profileMeta}>
                <Text style={[styles.profileName, { color: theme.TEXT }]}>
                  {profile?.name || 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.MUTED }]}>
                  {profile?.email || ''}
                </Text>

                {!isNewUser && (
                  <View style={[styles.tierBadge, { backgroundColor: `${theme.ACTIVE}15` }]}>
                    <Feather name="award" size={12} color="#FFD700" />
                    <Text style={[styles.tierText, { color: theme.ACTIVE }]}>PRO MEMBER — TIER 1</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Metrics Divider Row */}
            <View
              style={[
                styles.metricsRow,
                { borderTopColor: theme.BORDER },
              ]}
            >
              <View style={styles.metricCol}>
                <Text style={[styles.metricLabel, { color: theme.MUTED }]}>
                  MEMBER SINCE
                </Text>
                <Text style={[styles.metricValue, { color: theme.TEXT }]}>
                  {isNewUser ? memberSince : 'Jan 2024'}
                </Text>
              </View>

              <View
                style={[
                  styles.metricColBordered,
                  { borderLeftColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.MUTED }]}>
                  ACCOUNTS
                </Text>
                <Text style={[styles.metricValue, { color: theme.TEXT }]}>
                  {isNewUser ? (bankAccounts.length ? `${bankAccounts.length} added` : 'None added') : '3 Banks Linked'}
                </Text>
              </View>

              <View
                style={[
                  styles.metricColBordered,
                  { borderLeftColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.MUTED }]}>
                  2FA SECURITY
                </Text>
                {isNewUser && !twoFactor ? (
                  <Text style={[styles.metricValue, { color: theme.MUTED }]}>Off</Text>
                ) : (
                  <View style={styles.secVerifiedRow}>
                    <Feather name="check-circle" size={12} color={theme.GREEN} />
                    <Text style={[styles.metricValue, { color: theme.GREEN }]}>Active</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Financial Snapshot Card */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            FINANCIAL STANDING
          </Text>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardSubText, { color: theme.MUTED }]}>
                  {isNewUser ? 'Net (income minus spending)' : 'Total Portfolio Net Worth'}
                </Text>
                <Text style={[styles.netWorthAmount, { color: theme.TEXT }]}>
                  {isNewUser ? (txs.length ? `PKR ${fullAmt(income - spent)}` : 'No data yet') : 'PKR 5,740,000'}
                </Text>
              </View>

              {!isNewUser && (
                <View style={[styles.scoreBadge, { backgroundColor: `${theme.GREEN}15` }]}>
                  <Text style={[styles.scoreText, { color: theme.GREEN }]}>Credit 784 — Excellent</Text>
                </View>
              )}
            </View>

            <View style={styles.snapshotGrid}>
              <View style={[styles.snapBox, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.snapLabel, { color: theme.MUTED }]}>
                  MONTHLY INCOME
                </Text>
                <Text style={[styles.snapVal, { color: theme.GREEN }]}>
                  {isNewUser ? incomeLabel : 'PKR 150,000'}
                </Text>
              </View>

              <View style={[styles.snapBox, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.snapLabel, { color: theme.MUTED }]}>
                  {isNewUser ? 'SPENT THIS MONTH' : 'MONTHLY BURN RATE'}
                </Text>
                <Text style={[styles.snapVal, { color: theme.TEXT }]}>
                  {isNewUser ? (spentThisMonth ? `PKR ${fullAmt(spentThisMonth)}` : 'Nothing yet') : 'PKR 80,000 (53%)'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Shortcuts List */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            ACCOUNT MANAGEMENT
          </Text>
          <View style={[styles.listCard, { backgroundColor: theme.CARD }]}>
            {[
              {
                icon: 'user',
                label: 'Personal Information',
                sub: 'Name, Email, Phone & Avatar',
                screen: 'EditProfile',
              },
              {
                icon: 'shield',
                label: 'Security & 2FA Authentication',
                sub: 'Password, Biometrics & Session management',
                screen: 'Security',
              },
              {
                icon: 'credit-card',
                label: 'Bank Accounts & Payment Cards',
                sub: isNewUser ? 'No accounts linked yet' : 'Meezan, HBL, Bank Alfalah linked',
                screen: 'BankAccounts',
              },
              {
                icon: 'pie-chart',
                label: 'Budget Categories & Limits',
                sub: 'Category caps, monthly targets',
                screen: 'BudgetPlanner',
              },
              {
                icon: 'settings',
                label: 'App Preferences & Tax Bracket',
                sub: 'Theme, FBR Tax Rates, PRA Province',
                screen: 'Settings',
              },
              {
                icon: 'bell',
                label: 'Notifications & Alert Rules',
                sub: 'Spending alerts, price triggers',
                screen: 'Notifications',
              },
            ].map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.screen)}
                style={[
                  styles.menuRowItem,
                  idx < arr.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Feather name={item.icon} size={18} color={theme.TEXT} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuItemTitle, { color: theme.TEXT }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuItemSub, { color: theme.MUTED }]}>
                    {item.sub}
                  </Text>
                </View>

                <Feather name="chevron-right" size={16} color={theme.MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            showToast('Signed out successfully', 'info');
            signOut();
          }}
          style={[styles.signOutBtn, { backgroundColor: theme.CARD }]}
        >
          <Feather name="log-out" size={18} color={theme.RED} />
          <Text style={[styles.signOutText, { color: theme.RED }]}>
            Sign Out of Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  editHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionMargin: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '800',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  metricCol: {
    flex: 1,
  },
  metricColBordered: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  secVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardSubText: {
    fontSize: 11,
    marginBottom: 2,
  },
  netWorthAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '800',
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  snapBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
  },
  snapLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  snapVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  listCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  menuItemSub: {
    fontSize: 11,
  },
  signOutBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
