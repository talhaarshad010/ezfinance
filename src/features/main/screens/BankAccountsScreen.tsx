import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  setAccounts,
  setLoading,
  removeAccount,
  updateAccountBalance,
  BankAccount,
} from '../../../store/slices/bankAccountsSlice';
import {
  fetchAccounts,
  deleteAccount,
  updateBalance,
} from '../../../services/bankAccountService';
import { getBankById } from '../../../constants/pakistaniBanks';
import { useToast } from '../../../context/ToastContext';

const BankAccountsScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { accounts, loading } = useAppSelector(state => state.bankAccounts);
  const [refreshing, setRefreshing] = useState(false);

  // Update Balance Modal state
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [saving, setSaving] = useState(false);

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

  // ==================== ACTIONS ====================

  const handleLongPress = (account: BankAccount) => {
    Alert.alert(
      account.bankName,
      `${account.accountTitle} • ${maskAccountNumber(account.accountNumber)}`,
      [
        {
          text: 'Update Balance',
          onPress: () => openBalanceModal(account),
        },
        {
          text: 'Remove Account',
          style: 'destructive',
          onPress: () => confirmRemoveAccount(account),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const confirmRemoveAccount = (account: BankAccount) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove "${account.bankName} - ${account.accountTitle}"? This will also delete all associated transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              dispatch(removeAccount(account.id));
              showToast('Account removed', 'success', 'Done');
            } catch (e) {
              showToast('Failed to remove account', 'error', 'Error');
            }
          },
        },
      ],
    );
  };

  const openBalanceModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setNewBalance(String(account.balance));
    setBalanceModalVisible(true);
  };

  const closeBalanceModal = () => {
    setBalanceModalVisible(false);
    setSelectedAccount(null);
    setNewBalance('');
  };

  const handleSaveBalance = async () => {
    if (!selectedAccount) return;
    const parsed = parseFloat(newBalance);
    if (isNaN(parsed) || parsed < 0) {
      showToast('Please enter a valid amount', 'error', 'Invalid');
      return;
    }
    setSaving(true);
    try {
      await updateBalance(selectedAccount.id, parsed);
      dispatch(updateAccountBalance({ accountId: selectedAccount.id, balance: parsed }));
      showToast('Balance updated', 'success', 'Done');
      closeBalanceModal();
    } catch (e) {
      showToast('Failed to update balance', 'error', 'Error');
    } finally {
      setSaving(false);
    }
  };

  // ==================== HELPERS ====================

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const formatCurrency = (amount: number) => {
    return `PKR ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const maskAccountNumber = (num: string) => {
    if (!num || num.length < 4) return num;
    return `●●●● ${num.slice(-4)}`;
  };

  // ==================== RENDER ====================

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

      {/* Hint */}
      <Typography variant="caption" color="#BBB" style={styles.hintText}>
        Long-press an account to update balance or remove
      </Typography>
    </View>
  );

  const renderAccount = ({ item }: { item: any }) => {
    const bankData = getBankById(item.bankId);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
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

  const renderBalanceModal = () => {
    const bankData = selectedAccount ? getBankById(selectedAccount.bankId) : null;
    return (
      <Modal
        visible={balanceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeBalanceModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeBalanceModal} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
              <Typography variant="h3" weight="700" style={{ flex: 1, textAlign: 'center' }}>
                Update Balance
              </Typography>
              <View style={{ width: 36 }} />
            </View>

            {/* Account Info */}
            {selectedAccount && (
              <View style={styles.modalAccountInfo}>
                <View style={[styles.modalBankAvatar, { backgroundColor: selectedAccount.bankColor || '#000', overflow: 'hidden' }]}>
                  {bankData?.logo ? (
                    <Image
                      source={{ uri: bankData.logo }}
                      style={styles.bankLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <Typography variant="caption" weight="700" color="#FFF" style={{ fontSize: 10 }}>
                      {selectedAccount.bankAbbreviation || 'BK'}
                    </Typography>
                  )}
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Typography variant="body" weight="700">{selectedAccount.bankName}</Typography>
                  <Typography variant="caption" color="#999">
                    {selectedAccount.accountTitle}
                  </Typography>
                </View>
              </View>
            )}

            {/* Current Balance */}
            <View style={styles.currentBalanceRow}>
              <Typography variant="caption" color="#999" weight="600" style={{ letterSpacing: 0.5 }}>
                CURRENT BALANCE
              </Typography>
              <Typography variant="body" weight="700" color="#999">
                {formatCurrency(selectedAccount?.balance || 0)}
              </Typography>
            </View>

            {/* Input */}
            <View style={styles.modalInputContainer}>
              <Typography variant="caption" weight="600" color="#666" style={{ marginBottom: 8 }}>
                NEW BALANCE (PKR)
              </Typography>
              <View style={styles.modalInputWrapper}>
                <Typography variant="h3" weight="700" color="#999" style={{ marginRight: 4 }}>
                  ₨
                </Typography>
                <TextInput
                  style={styles.modalInput}
                  value={newBalance}
                  onChangeText={setNewBalance}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#CCC"
                  autoFocus
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveBalance}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Feather name="check" size={18} color="#FFF" />
              <Typography variant="body" weight="700" color="#FFF" style={{ marginLeft: 8 }}>
                {saving ? 'Saving...' : 'Save Balance'}
              </Typography>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

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

      {/* Balance Update Modal */}
      {renderBalanceModal()}
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
    marginBottom: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: {
    marginBottom: 14,
    fontSize: 11,
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
  // ==================== MODAL STYLES ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalBankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  currentBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  modalInput: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#000',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 20,
  },
});

export default BankAccountsScreen;
