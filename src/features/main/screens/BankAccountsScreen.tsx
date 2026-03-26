import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setAccounts, setLoading } from '../../../store/slices/bankAccountsSlice';
import { fetchAccounts } from '../../../services/bankAccountService';
import { getBankById } from '../../../constants/pakistaniBanks';

const BankAccountsScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { accounts, loading } = useAppSelector(state => state.bankAccounts);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const data = await fetchAccounts();
      dispatch(setAccounts(data));
    } catch (e) {
      console.error('Failed to load accounts:', e);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const formatCurrency = (amount: number) => {
    return `PKR ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const maskAccountNumber = (num: string) => {
    if (!num || num.length < 4) return num;
    return `●●●● ${num.slice(-4)}`;
  };

  const renderHeader = () => (
    <View>
      {/* Total Balance Card */}
      <Card style={styles.totalCard}>
        <View style={styles.totalCardInner}>
          <Typography variant="caption" weight="600" color="#999" style={{ letterSpacing: 1 }}>
            TOTAL BALANCE
          </Typography>
          <Typography variant="h1" weight="700" style={styles.totalAmount}>
            {formatCurrency(totalBalance)}
          </Typography>
          <View style={styles.accountsCountRow}>
            <Feather name="layers" size={14} color="#666" />
            <Typography variant="caption" color="#666" style={{ marginLeft: 6 }}>
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} Linked
            </Typography>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Typography variant="body" weight="700">My Accounts</Typography>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAccount')}
        >
          <Feather name="plus" size={16} color="#FFF" />
          <Typography variant="caption" weight="700" color="#FFF" style={{ marginLeft: 6 }}>
            Add
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccount = ({ item }: { item: any }) => {
    const bankData = getBankById(item.bankId);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
      >
        <Card style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={[styles.bankAvatar, { backgroundColor: item.bankColor || '#000', overflow: 'hidden' }]}>
              {bankData?.logo ? (
                <Image
                  source={{ uri: bankData.logo }}
                  style={styles.bankLogo}
                  resizeMode="contain"
                />
              ) : (
                <Typography variant="caption" weight="700" color="#FFF" style={{ fontSize: 11 }}>
                  {item.bankAbbreviation || item.bankName.substring(0, 2).toUpperCase()}
                </Typography>
              )}
            </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Typography variant="body" weight="700">{item.bankName}</Typography>
            <Typography variant="caption" color="#999" style={{ marginTop: 2 }}>
              {item.accountTitle} • {maskAccountNumber(item.accountNumber)}
            </Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography variant="body" weight="700">
              {formatCurrency(item.balance)}
            </Typography>
            <Feather name="chevron-right" size={16} color="#CCC" style={{ marginTop: 4 }} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="briefcase" size={48} color="#E0E0E0" />
      </View>
      <Typography variant="h3" weight="700" style={{ marginTop: 20 }}>
        No Accounts Yet
      </Typography>
      <Typography variant="body" color="#999" style={{ marginTop: 8, textAlign: 'center' }}>
        Add your bank accounts to manage{'\n'}your finances in one place
      </Typography>
      <TouchableOpacity
        style={styles.emptyAddBtn}
        onPress={() => navigation.navigate('AddAccount')}
      >
        <Feather name="plus" size={18} color="#FFF" />
        <Typography variant="body" weight="700" color="#FFF" style={{ marginLeft: 8 }}>
          Add Account
        </Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={item => item.id}
        renderItem={renderAccount}
        ListHeaderComponent={accounts.length > 0 ? renderHeader : null}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[
          styles.listContent,
          accounts.length === 0 && { flex: 1, justifyContent: 'center' },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      {accounts.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => navigation.navigate('AddAccount')}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  totalCard: {
    backgroundColor: '#000',
    padding: 28,
    borderRadius: 24,
    marginBottom: 24,
  },
  totalCardInner: {
    alignItems: 'center',
  },
  totalAmount: {
    color: '#FFF',
    fontSize: 32,
    marginTop: 8,
  },
  accountsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  accountCard: {
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default BankAccountsScreen;
