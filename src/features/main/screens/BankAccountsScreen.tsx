import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { BankAccount } from '../../../store/slices/bankAccountsSlice';
import { useBankAccounts } from './bankAccounts/useBankAccounts';
import { ApiError } from '../../../api/client';
import { SAVE_ERROR } from '../../../utils/validation';
import { getBankById } from '../../../constants/pakistaniBanks';
import { AnimatedModal } from '../../../components/AnimatedModal';

function maskAccountNumber(accNo: string): string {
  if (!accNo) return '•••• 0000';
  if (accNo.length <= 4) return `•••• ${accNo}`;
  return `•••• ${accNo.slice(-4)}`;
}

export const BankAccountsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  // The user's own accounts, or the sample accounts in the Explore demo.
  const bank = useBankAccounts();
  const { accounts, isUser } = bank;

  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const handleOpenBalanceModal = (acc: BankAccount) => {
    setSelectedAccount(acc);
    setNewBalanceInput(acc.balance.toString());
    setBalanceModalVisible(true);
  };

  const handleSaveBalance = () => {
    if (!selectedAccount) return;
    const val = parseFloat(newBalanceInput);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid balance amount.', 'error', 'Invalid Amount');
      return;
    }

    setIsUpdating(true);
    bank
      .setBalance(selectedAccount.id, val)
      .then(() => {
        setBalanceModalVisible(false);
        showToast(
          `Balance for ${selectedAccount.bankName} updated to PKR ${val.toLocaleString()}`,
          'success',
          'Balance Updated',
        );
      })
      .catch(error => showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error'))
      .finally(() => setIsUpdating(false));
  };

  const handleConfirmRemove = (acc: BankAccount) => {
    setActionMenuVisible(false);
    bank
      .remove(acc.id)
      .then(() =>
        showToast(
          isUser
            ? `${acc.bankName} account removed. Its transactions are kept.`
            : `${acc.bankName} account removed successfully.`,
          'success',
          'Account Removed',
        ),
      )
      .catch(error => showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error'));
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
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={16} color={theme.MUTED} />
              <Text style={[styles.backText, { color: theme.MUTED }]}>
                Assets & Vaults
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Bank Accounts
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddAccount')}
            style={[styles.addBtn, { backgroundColor: theme.TEXT }]}
          >
            <Feather name="plus" size={18} color={theme.BG} />
          </TouchableOpacity>
        </View>

        {/* Hero Consolidated Wealth Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
            <Text style={styles.heroSubhead}>
              {isUser ? 'TOTAL BALANCE · ALL ACCOUNTS' : 'TOTAL LIQUID ASSETS · 1LINK MERGED'}
            </Text>
            <Text style={styles.heroAmount}>
              {totalBalance.toLocaleString()}
            </Text>
            <Text style={styles.heroCurrency}>PKR</Text>

            {/* Bottom 3-Column Stats Divider */}
            <View style={styles.heroStatsDividerRow}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Accounts</Text>
                <Text style={[styles.heroStatValue, { color: theme.TEXT }]}>
                  {accounts.length} {isUser ? 'Added' : 'Linked'}
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Primary Vault</Text>
                <Text numberOfLines={1} style={[styles.heroStatValue, { color: theme.ACTIVE }]}>
                  {accounts[0]?.bankName || (isUser ? '—' : 'Meezan Bank')}
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>{isUser ? 'Updates' : 'Auto-Sync'}</Text>
                <Text style={[styles.heroStatValue, { color: isUser ? theme.MUTED : theme.GREEN }]}>
                  {isUser ? 'Manual' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bank Accounts List Header */}
        <View style={styles.sectionMargin}>
          <View style={styles.listHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              {isUser ? 'Your Accounts' : 'Linked Accounts'}
            </Text>
            <Text style={[styles.subText, { color: theme.MUTED }]}>
              {accounts.length} Accounts
            </Text>
          </View>

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.CARD }]}>
              <View
                style={[
                  styles.emptyIconSquare,
                  { backgroundColor: theme.MODAL },
                ]}
              >
                <Feather name="credit-card" size={24} color={theme.MUTED} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.TEXT }]}>
                {isUser ? 'No accounts yet' : 'No Bank Accounts Linked'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.MUTED }]}>
                {isUser
                  ? 'Add your bank accounts and wallets with their current balance. Transactions you log to an account keep its balance up to date.'
                  : 'Link your HBL, Meezan, Alfalah, or Easypaisa account to enable SMS transaction parsing.'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AddAccount')}
                style={[styles.linkCtaBtn, { backgroundColor: theme.TEXT }]}
              >
                <Text style={[styles.linkCtaText, { color: theme.BG }]}>
                  {isUser ? '+ Add Account' : '+ Link Bank Account'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountsList}>
              {accounts.map(acc => {
                const bankInfo = getBankById(acc.bankId);

                return (
                  <TouchableOpacity
                    key={acc.id}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('AccountDetail', { accountId: acc.id })}
                    style={[
                      styles.accountCard,
                      { backgroundColor: theme.CARD },
                    ]}
                  >
                    <View style={styles.accTopRow}>
                      <View
                        style={[
                          styles.bankIconSquare,
                          { backgroundColor: theme.MODAL },
                        ]}
                      >
                        <Feather
                          name="briefcase"
                          size={18}
                          color={theme.ACTIVE}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.accBankName, { color: theme.TEXT }]}>
                          {acc.bankName}
                        </Text>
                        <Text style={[styles.accTitleText, { color: theme.MUTED }]}>
                          {acc.accountTitle} · {maskAccountNumber(acc.accountNumber)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedAccount(acc);
                          setActionMenuVisible(true);
                        }}
                        style={styles.moreBtn}
                      >
                        <Feather
                          name="more-vertical"
                          size={16}
                          color={theme.MUTED}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.balanceDisplayRow}>
                      <Text style={[styles.balanceNum, { color: theme.TEXT }]}>
                        PKR {acc.balance.toLocaleString()}
                      </Text>
                      <Text style={[styles.availableLabel, { color: theme.GREEN }]}>
                        Available
                      </Text>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.accActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenBalanceModal(acc)}
                        style={[
                          styles.accActionPill,
                          { backgroundColor: theme.MODAL },
                        ]}
                      >
                        <Feather name="edit-3" size={13} color={theme.TEXT} />
                        <Text
                          style={[
                            styles.accActionPillText,
                            { color: theme.TEXT },
                          ]}
                        >
                          Update Balance
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedAccount(acc);
                          setActionMenuVisible(true);
                        }}
                        style={[
                          styles.accActionPill,
                          { backgroundColor: theme.MODAL },
                        ]}
                      >
                        <Feather name="settings" size={13} color={theme.MUTED} />
                        <Text
                          style={[
                            styles.accActionPillText,
                            { color: theme.MUTED },
                          ]}
                        >
                          Manage
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 1Link SECP Compliance Banner */}
        <View style={styles.sectionMargin}>
          <View
            style={[
              styles.complianceCard,
              { backgroundColor: `${theme.ACTIVE}18` },
            ]}
          >
            <Feather name="shield" size={16} color={theme.ACTIVE} />
            <Text style={[styles.complianceText, { color: theme.TEXT }]}>
              <Text style={{ fontWeight: '700', color: theme.ACTIVE }}>
                {isUser ? 'YOUR DATA, YOUR CONTROL: ' : "1LINK SECP PROTECTED: "}
              </Text>
              {isUser
                ? 'Balances come from what you enter and log. ezfinance never asks for your banking passwords or PINs.'
                : 'All linked accounts are encrypted under SBP digital banking protocols. No raw banking credentials are ever stored.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit / Update Balance Modal Sheet */}
      <AnimatedModal
        visible={balanceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBalanceModalVisible(false)}
        >
          <Pressable
            style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                Update Account Balance
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setBalanceModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
              {selectedAccount?.bankName} — {selectedAccount?.accountTitle}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.MUTED }]}>
                New Balance (PKR)
              </Text>
              <TextInput
                value={newBalanceInput}
                onChangeText={setNewBalanceInput}
                keyboardType="numeric"
                style={[styles.balanceInput, { color: theme.TEXT }]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isUpdating}
              onPress={handleSaveBalance}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: theme.TEXT,
                  opacity: isUpdating ? 0.7 : 1,
                },
              ]}
            >
              {isUpdating ? (
                <ActivityIndicator color={theme.BG} size="small" />
              ) : (
                <Text style={[styles.saveBtnText, { color: theme.BG }]}>
                  Update Balance →
                </Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </AnimatedModal>

      {/* Account Options Menu Modal */}
      <AnimatedModal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionMenuVisible(false)}
        >
          <View
            style={[styles.menuContent, { backgroundColor: theme.CARD }]}
          >
            <Text style={[styles.menuTitle, { color: theme.TEXT }]}>
              {selectedAccount?.bankName} ({selectedAccount?.accountTitle})
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActionMenuVisible(false);
                if (selectedAccount) handleOpenBalanceModal(selectedAccount);
              }}
              style={[styles.menuItem, { borderBottomColor: theme.BORDER }]}
            >
              <Feather name="edit-3" size={15} color={theme.TEXT} />
              <Text style={[styles.menuItemText, { color: theme.TEXT }]}>
                Update Account Balance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectedAccount && handleConfirmRemove(selectedAccount)
              }
              style={styles.menuItem}
            >
              <Feather name="trash-2" size={15} color={theme.RED} />
              <Text style={[styles.menuItemText, { color: theme.RED }]}>
                {isUser ? 'Remove Account' : 'Remove Linked Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </AnimatedModal>
    </View>
  );
};

export default BankAccountsScreen;

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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionMargin: {
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroSubhead: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.36)',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -3,
    lineHeight: 54,
  },
  heroCurrency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  heroStatsDividerRow: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatColBordered: {
    flex: 1,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.07)',
    marginLeft: 14,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.32)',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  subText: {
    fontSize: 11,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emptyIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  linkCtaBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  linkCtaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountsList: {
    gap: 10,
  },
  accountCard: {
    borderRadius: 24,
    padding: 18,
  },
  accTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accBankName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  accTitleText: {
    fontSize: 11,
  },
  moreBtn: {
    padding: 4,
  },
  balanceDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  balanceNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  accActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accActionPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  accActionPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  complianceCard: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  complianceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceInput: {
    fontSize: 28,
    fontWeight: '800',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    paddingVertical: 6,
  },
  saveBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuContent: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 20,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
