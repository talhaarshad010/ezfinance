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
        <View style={styles.greeting}>
          <Typography variant="h1">Hello {userName} 👋</Typography>
          <Typography variant="body" color={colors.text.muted}>
            Your financial summary is looking strong today.
          </Typography>
        </View>

        <Card style={styles.balanceCard}>
          <Typography variant="label" color="#AAA" style={{ letterSpacing: 1 }}>
            TOTAL BALANCE
          </Typography>
          <Typography variant="h1" color="#FFF" style={styles.balanceText}>
            {formatCurrency(totalBalance)}
          </Typography>
          <View style={styles.linkedAccounts}>
            {accounts.slice(0, 3).map((acc, index) => {
              const bank = getBankById(acc.bankId);
              return (
                <View
                  key={acc.id}
                  style={[
                    styles.miniAvatar,
                    {
                      backgroundColor: '#FFF',
                      marginLeft: index === 0 ? 0 : -10,
                      zIndex: 10 - index,
                      overflow: 'hidden',
                      borderWidth: 1.5,
                      borderColor: '#000',
                    },
                  ]}
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
                      style={{ fontSize: 8 }}
                    >
                      {acc.bankAbbreviation}
                    </Typography>
                  )}
                </View>
              );
            })}
            <Typography
              variant="caption"
              color="#AAA"
              style={{ marginLeft: 8 }}
            >
              {accounts.length > 0
                ? `${accounts.length} Linked accounts active`
                : 'No accounts linked'}
            </Typography>
          </View>
        </Card>

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

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <View style={styles.iconCircle}>
              <Feather name="plus" size={20} />
            </View>
            <Typography variant="body" weight="600" style={styles.actionText}>
              Add Expense
            </Typography>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <View style={styles.iconCircle}>
              <Feather name="pie-chart" size={20} />
            </View>
            <Typography variant="body" weight="600" style={styles.actionText}>
              View Portfolio
            </Typography>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, styles.aiAdvisor]}
            onPress={() =>
              showToast(
                'Ask our AI any financial question for immediate consultation.',
                'info',
                'AI Advisor',
              )
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: '#334155' }]}>
              <Feather name="zap" size={20} color="#FFF" />
            </View>
            <Typography
              variant="body"
              weight="600"
              color="#FFF"
              style={styles.actionText}
            >
              Ask AI Advisor
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
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
        </View>

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Typography variant="h2">Monthly Spending</Typography>
            <View style={styles.chartDots}>
              <View style={[styles.chartDot, { backgroundColor: '#000' }]} />
              <View style={styles.chartDot} />
            </View>
          </View>
          <View style={styles.barChartMock}>
            {historyData.map((h, i) => {
              const barHeight = (h.amount / maxSpending) * 120;
              const isCurrentMonth = i === 5;

              return (
                <View key={i} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 5), // Min visible height
                        backgroundColor: isCurrentMonth
                          ? '#000'
                          : h.amount > 0
                          ? '#0047AB'
                          : '#EEE',
                      },
                    ]}
                  />
                  <Typography variant="caption" style={{ marginTop: 8 }}>
                    {h.label}
                  </Typography>
                </View>
              );
            })}
          </View>
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
    paddingBottom: 40,
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
});

export default DashboardScreen;
