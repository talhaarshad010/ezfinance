import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { colors } from '../../../theme/colors';
import { useToast } from '../../../context/ToastContext';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAccounts } from '../../../services/bankAccountService';
import { setAccounts } from '../../../store/slices/bankAccountsSlice';
import { getBankById } from '../../../constants/pakistaniBanks';
import { Image } from 'react-native';
import { Transaction } from '../../../store/slices/bankAccountsSlice';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const profile = useAppSelector(state => state.user.profile);
  const { accounts } = useAppSelector(state => state.bankAccounts);
  const userName = profile?.name?.split(' ')[0] || 'User';

  const loadAccounts = React.useCallback(async () => {
    try {
      const data = await fetchAccounts();
      dispatch(setAccounts(data));
    } catch (e) {
      console.error('Dashboard load accounts error:', e);
    }
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, [loadAccounts]),
  );

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const transactions = Object.values(
    useAppSelector(state => state.bankAccounts.transactions),
  ).flat();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Calculate Monthly Summaries (Current Month)
  const monthlyIncome = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return (
        tx.type === 'income' &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    })
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyExpenses = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return (
        tx.type === 'expense' &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    })
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlySavings = monthlyIncome - monthlyExpenses;

  // 2. Calculate 6-Month Historical Spending Trend
  const historyData: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleString('en-PK', { month: 'short' });

    const amount = transactions
      .filter(tx => {
        const txD = new Date(tx.date);
        return (
          tx.type === 'expense' &&
          txD.getMonth() === m &&
          txD.getFullYear() === y
        );
      })
      .reduce((acc, tx) => acc + tx.amount, 0);

    historyData.push({ label, amount });
  }

  const maxSpending = Math.max(...historyData.map(h => h.amount), 1);

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topHeader}>
          <Typography variant="body" color={colors.text.muted}>
            Hello {userName} 👋
          </Typography>
          <Typography variant="h1" weight="700" style={styles.dashboardTitle}>
            Dashboard
          </Typography>
        </View>

        <Card style={styles.premiumCard}>
          <View style={styles.rowBetween}>
            <View>
              <Typography
                variant="caption"
                color="#666"
                style={{ letterSpacing: 1.5, marginBottom: 8 }}
              >
                TOTAL BALANCE
              </Typography>
              <Typography
                variant="h2"
                color="#FFF"
                style={styles.premiumBalanceText}
              >
                {formatCurrency(totalBalance)}
              </Typography>
            </View>
            <View style={styles.progressCircleWrapper}>
              <View style={styles.progressCircleOuter}>
                <View
                  style={[
                    styles.progressCircleInner,
                    { borderTopColor: '#00D1FF', borderRightColor: '#00D1FF' },
                  ]}
                />
                <Typography
                  variant="caption"
                  weight="700"
                  color="#333"
                  style={styles.progressPercent}
                >
                  85%
                </Typography>
              </View>
            </View>
          </View>

          <View style={[styles.rowBetween, { marginTop: 32 }]}>
            <View style={styles.insetCard}>
              <Typography
                variant="caption"
                color="#666"
                style={{ fontSize: 10 }}
              >
                INCOME
              </Typography>
              <Typography
                variant="body"
                weight="700"
                color="#4ADE80"
                style={{ marginTop: 4 }}
              >
                PKR {(monthlyIncome / 1000).toFixed(0)}k
              </Typography>
            </View>
            <View style={styles.insetCard}>
              <Typography
                variant="caption"
                color="#666"
                style={{ fontSize: 10 }}
              >
                EXPENSES
              </Typography>
              <Typography
                variant="body"
                weight="700"
                color="#FB7185"
                style={{ marginTop: 4 }}
              >
                PKR {(monthlyExpenses / 1000).toFixed(0)}k
              </Typography>
            </View>
            <View style={styles.insetCard}>
              <Typography
                variant="caption"
                color="#666"
                style={{ fontSize: 10 }}
              >
                SAVINGS
              </Typography>
              <Typography
                variant="body"
                weight="700"
                color="#2DD4BF"
                style={{ marginTop: 4 }}
              >
                PKR {(Math.max(0, monthlySavings) / 1000).toFixed(0)}k
              </Typography>
            </View>
          </View>
        </Card>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="plus" size={24} color="#0EA5E9" />
            </View>
            <Typography
              variant="caption"
              weight="700"
              style={{ marginTop: 12 }}
            >
              ADD
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="briefcase" size={24} color="#22C55E" />
            </View>
            <Typography
              variant="caption"
              weight="700"
              style={{ marginTop: 12 }}
            >
              PORTFOLIO
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              showToast('AI Assistant is ready to help.', 'info', 'AI ASK')
            }
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="message-square" size={24} color="#A855F7" />
            </View>
            <Typography
              variant="caption"
              weight="700"
              style={{ marginTop: 12 }}
            >
              AI ASK
            </Typography>
          </TouchableOpacity>
        </View>

        {accounts.length > 0 && (
          <View style={styles.linkedSection}>
            <View style={styles.sectionHeader}>
              <Typography variant="body" weight="700">
                Linked Accounts
              </Typography>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Drawer', { screen: 'BankAccounts' })
                }
              >
                <Typography
                  variant="caption"
                  color={colors.primary}
                  weight="600"
                >
                  View All
                </Typography>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.accountsScroll}
            >
              {accounts.map(acc => {
                const bank = getBankById(acc.bankId);
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={styles.accountMiniCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('AccountDetail', {
                        accountId: acc.id,
                      })
                    }
                  >
                    <View
                      style={[styles.bankCircle, { backgroundColor: '#FFF' }]}
                    >
                      {bank?.logo ? (
                        <Image
                          source={{ uri: bank.logo }}
                          style={styles.miniLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          weight="700"
                          color="#000"
                          style={{ fontSize: 10 }}
                        >
                          {acc.bankAbbreviation}
                        </Typography>
                      )}
                    </View>
                    <Typography
                      variant="caption"
                      weight="700"
                      style={{ marginTop: 8 }}
                    >
                      {acc.bankName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={colors.text.muted}
                      style={{ fontSize: 10 }}
                    >
                      PKR {acc.balance.toLocaleString()}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* <View style={styles.summaryGrid}>
          <Card style={styles.summaryItem}>
            <Typography variant="caption" color={colors.text.muted}>
              Monthly Income
            </Typography>
            <Typography variant="h2">
              {formatCurrency(monthlyIncome)}
            </Typography>
            <Typography variant="caption" color="#2E7D32">
              Current Month
            </Typography>
          </Card>
          <Card style={{ ...styles.summaryItem, marginTop: 16 }}>
            <Typography variant="caption" color={colors.text.muted}>
              Monthly Expenses
            </Typography>
            <Typography variant="h2">
              {formatCurrency(monthlyExpenses)}
            </Typography>
            <Typography variant="caption" color="#D32F2F">
              Current Month
            </Typography>
          </Card>
        </View> */}

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Typography variant="h2" weight="600">
              Spending Trends
            </Typography>
            <View style={styles.chartDots}>
              <View style={[styles.chartDot, { backgroundColor: '#000' }]} />
              <View style={styles.chartDot} />
            </View>
          </View>

          {/* New SVG Line Chart Mockup */}
          <View style={styles.lineChartContainer}>
            <Svg height="160" width="100%" viewBox="0 0 300 120">
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#22C55E" stopOpacity="0.2" />
                  <Stop offset="1" stopColor="#22C55E" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              {/* Area path */}
              <Path
                d="M 0 120 Q 75 110, 150 70 T 300 30 V 120 H 0 Z"
                fill="url(#grad)"
              />
              {/* Line path */}
              <Path
                d="M 0 120 Q 75 110, 150 70 T 300 30"
                fill="none"
                stroke="#22C55E"
                strokeWidth="3"
              />
              {/* Endpoint Tooltip Mock */}
              <Circle cx="260" cy="40" r="4" fill="#22C55E" />
              <View style={styles.tooltipBox}>
                <Typography
                  variant="caption"
                  weight="700"
                  style={{ fontSize: 10 }}
                >
                  PKR 80.60k
                </Typography>
              </View>
            </Svg>
          </View>

          {/* Time Range Selectors */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rangeSelector}
          >
            {['3D', '7D', '15D', '1M', '3M', '6M', '1Y'].map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.rangeBtn,
                  range === '15D' && styles.rangeBtnActive,
                ]}
              >
                <Typography
                  variant="caption"
                  weight="700"
                  color={range === '15D' ? '#FFF' : '#AAA'}
                >
                  {range}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE0B2',
    overflow: 'hidden',
  },
  avatarMock: {
    flex: 1,
    backgroundColor: '#E6A23C',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },
  greeting: {
    marginVertical: 24,
  },
  balanceCard: {
    backgroundColor: '#000',
    padding: 32,
    borderRadius: 32,
    marginBottom: 24,
  },
  balanceText: {
    marginVertical: 12,
    fontSize: 32,
  },
  linkedAccounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLogo: {
    width: '100%',
    height: '100%',
  },
  linkedSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  accountMiniCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    width: 130,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bankCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  quickActions: {
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aiAdvisor: {
    backgroundColor: '#000',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  summaryGrid: {
    marginBottom: 24,
  },
  summaryItem: {
    padding: 20,
  },
  chartCard: {
    padding: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartDots: {
    flexDirection: 'row',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEE',
    marginLeft: 4,
  },
  barChartMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barCol: {
    alignItems: 'center',
    width: '14%',
  },
  bar: {
    width: '100%',
    borderRadius: 10,
  },
  // Redesign Styles
  topHeader: {
    marginTop: 10,
    marginBottom: 30,
  },
  dashboardTitle: {
    fontSize: 34,
    lineHeight: 40,
    marginTop: 4,
  },
  premiumCard: {
    backgroundColor: '#000',
    padding: 32,
    borderRadius: 40,
    marginBottom: 30,
  },
  premiumBalanceText: {
    fontSize: 36,
    lineHeight: 44,
  },
  progressCircleWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressCircleInner: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#00FF94',
    borderRightColor: '#00FF94',
    transform: [{ rotate: '45deg' }],
  },
  progressPercent: {
    color: '#333',
    fontSize: 10,
    position: 'absolute',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // New Spending Chart Styles
  lineChartContainer: {
    height: 160,
    marginTop: 10,
    position: 'relative',
  },
  tooltipBox: {
    position: 'absolute',
    top: 10,
    right: 30,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rangeSelector: {
    marginTop: 20,
    flexDirection: 'row',
  },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  rangeBtnActive: {
    backgroundColor: '#2563EB',
  },
  insetCard: {
    backgroundColor: '#111',
    width: '31%',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#FFF',
    width: '31%',
    aspectRatio: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen;
