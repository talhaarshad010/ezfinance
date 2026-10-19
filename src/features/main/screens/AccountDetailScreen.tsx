import { useUserUi } from '../../../context/UserModeContext';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { useAppDispatch } from '../../../store/hooks';
import {
  removeTransaction as removeTransactionAction,
  updateAccountBalance,
  Transaction,
} from '../../../store/slices/bankAccountsSlice';
import { useToast } from '../../../context/ToastContext';
import { ScreenBackHeader } from '../../../components/ScreenBackHeader';
import { TRANSFER_PREFIX, useBankAccounts } from './bankAccounts/useBankAccounts';
import { useLedgerActions } from '../../../hooks/useLedgerActions';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { ApiError } from '../../../api/client';
import { SAVE_ERROR } from '../../../utils/validation';
import { getBankById } from '../../../constants/pakistaniBanks';

const AccountDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { accountId } = route.params;

  // The user's own account and the transactions logged to it, or the sample account.
  const bank = useBankAccounts();
  const { isUser } = bank;
  const userUi = useUserUi();
  const txActions = useTransactionActions();
  const ledger = useLedgerActions();
  const account = bank.accounts.find(a => a.id === accountId);
  const transactions = bank.transactionsOf(accountId);

  // A user adds a transaction with the regular sheet, already set to this account.
  const addTransaction = () =>
    isUser && account
      ? userUi.openTxSheet({ type: 'expense', accountId: account.id, source: 'manual' })
      : navigation.navigate('AddTransaction', { accountId });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Remove "${tx.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (isUser && tx.id.startsWith(TRANSFER_PREFIX)) {
              ledger
                .deleteTransfer(tx.id.slice(TRANSFER_PREFIX.length))
                .then(removed =>
                  showToast('Transfer deleted', 'info', undefined, 5000, {
                    label: 'Undo',
                    onPress: () => {
                      ledger.restoreTransfer(removed).catch(() => showToast(SAVE_ERROR, 'error'));
                    },
                  }),
                )
                .catch(e => showToast(e instanceof ApiError ? e.message : SAVE_ERROR, 'error'));
              return;
            }
            if (isUser) {
              // The balance follows from the remaining transactions.
              txActions
                .remove(tx.id)
                .then(({ tx: removed, index }) =>
                  showToast('Transaction deleted', 'info', undefined, 5000, {
                    label: 'Undo',
                    onPress: () => {
                      txActions.restore(removed, index).catch(() => showToast(SAVE_ERROR, 'error'));
                    },
                  }),
                )
                .catch(e => showToast(e instanceof ApiError ? e.message : SAVE_ERROR, 'error'));
              return;
            }
            dispatch(removeTransactionAction({ accountId, transactionId: tx.id }));
            if (account) {
              const newBal = tx.type === 'income'
                ? account.balance - tx.amount
                : account.balance + tx.amount;
              dispatch(updateAccountBalance({ accountId, balance: newBal }));
            }
            showToast('Transaction deleted', 'success', 'Done');
          },
        },
      ],
    );
  };

  const formatCurrency = (amount: number) =>
    `PKR ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const maskAccountNumber = (num: string) => {
    if (!num || num.length < 4) return num;
    return `●●●● ${num.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderHeader = () => {
    const bankData = account ? getBankById(account.bankId) : null;
    return (
      <View>
        {/* Account Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.bankAvatar, { backgroundColor: account?.bankColor || '#000', overflow: 'hidden' }]}>
              {bankData?.logo ? (
                <Image
                  source={{ uri: bankData.logo }}
                  style={styles.bankLogo}
                  resizeMode="contain"
                />
              ) : (
                <Typography variant="caption" weight="700" color="#FFF" style={{ fontSize: 12 }}>
                  {account?.bankAbbreviation || 'BK'}
                </Typography>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Typography variant="body" weight="700">{account?.bankName}</Typography>
              <Typography variant="caption" color="#999" style={{ marginTop: 2 }}>
                {account?.accountTitle} • {maskAccountNumber(account?.accountNumber || '')}
              </Typography>
            </View>
          </View>
        <View style={styles.balanceSection}>
          <Typography variant="caption" weight="600" color="#999" style={{ letterSpacing: 1 }}>
            CURRENT BALANCE
          </Typography>
          <Typography variant="h2" weight="700" style={{ marginTop: 4 }}>
            {formatCurrency(account?.balance || 0)}
          </Typography>
        </View>
      </Card>

      {/* Section Title + Add */}
      <View style={styles.sectionHeader}>
        <Typography variant="body" weight="700">Transactions</Typography>
        <TouchableOpacity
          style={styles.addTxBtn}
          onPress={addTransaction}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={14} color="#FFF" />
          <Typography variant="caption" weight="700" color="#FFF" style={{ marginLeft: 6 }}>
            Add
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.txRow}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item, account })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[
        styles.txIcon,
        { backgroundColor: item.type === 'income' ? '#E8F5E9' : '#FDECEA' },
      ]}>
        <Feather
          name={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
          size={18}
          color={item.type === 'income' ? '#2E7D32' : '#D32F2F'}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Typography variant="body" weight="600">{item.description}</Typography>
        <Typography variant="caption" color="#999" style={{ marginTop: 2 }}>
          {formatDate(item.date)}
          {item.category ? ` • ${item.category}` : ''}
        </Typography>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
        <Typography
          variant="body"
          weight="700"
          color={item.type === 'income' ? '#2E7D32' : '#D32F2F'}
        >
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Typography>
        <Feather name="chevron-right" size={14} color="#CCC" style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Feather name="inbox" size={40} color="#E0E0E0" />
      <Typography variant="body" color="#999" style={{ marginTop: 12 }}>
        No transactions yet
      </Typography>
      <TouchableOpacity
        style={styles.emptyAddBtn}
        onPress={addTransaction}
      >
        <Typography variant="caption" weight="700" color="#FFF">Add Transaction</Typography>
      </TouchableOpacity>
    </View>
  );

  if (!account) {
    return (
      <View style={styles.container}>
        <ScreenBackHeader title="Account" back="Bank Accounts" />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Typography variant="body" color="#999">Account not found</Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenBackHeader title={account.bankName} back="Bank Accounts" />
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
  },
  infoRow: {
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
  balanceSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyAddBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 16,
  },
});

export default AccountDetailScreen;
