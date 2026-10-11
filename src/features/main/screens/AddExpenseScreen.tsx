import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { getBankById } from '../../../constants/pakistaniBanks';
import { addTransaction as addTransactionAction, updateAccountBalance } from '../../../store/slices/bankAccountsSlice';
import { CalendarPicker, DrawerMenuButton } from '../../../components';

const CATEGORIES = [
  { name: 'Groceries', icon: 'shopping-cart' },
  { name: 'Food & Dining', icon: 'coffee' },
  { name: 'Transport', icon: 'truck' },
  { name: 'Utilities', icon: 'zap' },
  { name: 'Housing', icon: 'home' },
  { name: 'Shopping', icon: 'shopping-bag' },
  { name: 'Telecom', icon: 'smartphone' },
  { name: 'Income', icon: 'arrow-up-right' },
  { name: 'Other', icon: 'more-horizontal' },
];

export const AddExpenseScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const { accounts } = useAppSelector(state => state.bankAccounts);

  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts[0]?.id || null,
  );
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  function handleKeypadTap(k: string) {
    if (k === '⌫') {
      setAmount(v => v.slice(0, -1));
    } else if (k === '.' && amount.includes('.')) {
      return;
    } else {
      setAmount(v => v + k);
    }
  }

  function addQuickPreset(num: number) {
    const current = parseFloat(amount || '0');
    setAmount((current + num).toString());
  }

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid transaction amount', 'error', 'Invalid Amount');
      return;
    }
    if (!selectedAccountId && accounts.length > 0) {
      showToast('Please select a payment account', 'error', 'Missing Account');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const targetAccountId = selectedAccountId || accounts[0]?.id || 'acc_meezan_01';
      const txData = {
        id: 'tx_' + Date.now(),
        accountId: targetAccountId,
        description: description.trim() || category,
        amount: numAmount,
        type: txType,
        category,
        date: date.toISOString(),
        createdAt: Date.now(),
      };

      dispatch(addTransactionAction(txData));
      const targetAcc = accounts.find(a => a.id === targetAccountId);
      if (targetAcc) {
        const newBal = txType === 'income' ? targetAcc.balance + numAmount : targetAcc.balance - numAmount;
        dispatch(updateAccountBalance({ accountId: targetAccountId, balance: newBal }));
      }

      setIsSaving(false);
      showToast(
        `${txType === 'expense' ? 'Expense' : 'Income'} of PKR ${numAmount.toLocaleString()} saved!`,
        'success',
        'Transaction Recorded',
      );
      navigation.goBack();
    }, 200);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

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
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <DrawerMenuButton />
              <View>
                <Text style={[styles.backText, { color: theme.MUTED, marginBottom: 2 }]}>
                  Ledger Entry
                </Text>
                <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                  Record Transaction
                </Text>
              </View>
            </View>

            {navigation.canGoBack() && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="x" size={20} color={theme.MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Transaction Type Segment Controller */}
        <View style={styles.sectionMargin}>
          <View style={[styles.typePillContainer, { backgroundColor: theme.CARD }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTxType('expense')}
              style={[
                styles.typePillBtn,
                {
                  backgroundColor:
                    txType === 'expense' ? theme.RED : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  {
                    color: txType === 'expense' ? '#FFFFFF' : theme.MUTED,
                  },
                ]}
              >
                EXPENSE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTxType('income')}
              style={[
                styles.typePillBtn,
                {
                  backgroundColor:
                    txType === 'income' ? theme.GREEN : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  {
                    color: txType === 'income' ? '#FFFFFF' : theme.MUTED,
                  },
                ]}
              >
                INCOME
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Amount Input Display */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroAmountCard, { backgroundColor: theme.HERO_BG }]}>
            <Text style={styles.heroAmountLabel}>
              {txType.toUpperCase()} AMOUNT (PKR)
            </Text>

            <Text
              style={[
                styles.heroAmountDisplay,
                {
                  color:
                    txType === 'expense'
                      ? theme.RED
                      : theme.GREEN,
                },
              ]}
            >
              {amount || '0'}
            </Text>

            {/* Quick Amount Add Pills */}
            <View style={styles.presetsRow}>
              {[500, 1000, 5000, 10000].map(p => (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.8}
                  onPress={() => addQuickPreset(p)}
                  style={styles.presetPill}
                >
                  <Text style={styles.presetPillText}>+{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Custom Numeric Keypad */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.keypadGrid}>
              {keys.map(k => (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.7}
                  onPress={() => handleKeypadTap(k)}
                  style={[styles.keyBtn, { backgroundColor: theme.MODAL }]}
                >
                  <Text style={[styles.keyBtnText, { color: theme.TEXT }]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Category Selector Grid */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              Category
            </Text>
            <View style={styles.categoriesWrap}>
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    activeOpacity={0.8}
                    onPress={() => setCategory(cat.name)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected
                          ? theme.TEXT
                          : theme.MODAL,
                      },
                    ]}
                  >
                    <Feather
                      name={cat.icon}
                      size={14}
                      color={isSelected ? theme.BG : theme.TEXT}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? theme.BG : theme.TEXT },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Payment Account Selector */}
        {accounts.length > 0 && (
          <View style={styles.sectionMargin}>
            <View style={[styles.card, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
                Payment Account
              </Text>

              <View style={styles.accountsList}>
                {accounts.map(acc => {
                  const bank = getBankById(acc.bankId);
                  const isSelected = selectedAccountId === acc.id;

                  return (
                    <TouchableOpacity
                      key={acc.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedAccountId(acc.id)}
                      style={[
                        styles.accountRow,
                        {
                          backgroundColor: isSelected
                            ? `${theme.ACTIVE}18`
                            : theme.MODAL,
                          borderColor: isSelected
                            ? theme.ACTIVE
                            : 'transparent',
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.accBankTitle,
                            {
                              color: isSelected
                                ? theme.ACTIVE
                                : theme.TEXT,
                            },
                          ]}
                        >
                          {acc.bankName}
                        </Text>
                        <Text style={[styles.accSub, { color: theme.MUTED }]}>
                          a/c ···· {acc.accountNumber.slice(-4) || '1234'}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.accBalance,
                            { color: theme.TEXT },
                          ]}
                        >
                          PKR {acc.balance.toLocaleString()}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.activeDot,
                              { backgroundColor: theme.ACTIVE },
                            ]}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Details Card (Date & Notes) */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              Transaction Details
            </Text>

            {/* Date Picker Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowCalendar(true)}
              style={[styles.dateRowBtn, { backgroundColor: theme.MODAL }]}
            >
              <View style={styles.dateLeftRow}>
                <Feather name="calendar" size={16} color={theme.MUTED} />
                <Text style={[styles.dateText, { color: theme.TEXT }]}>
                  {date.toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Feather name="chevron-down" size={14} color={theme.MUTED} />
            </TouchableOpacity>

            {/* Notes TextInput */}
            <View style={[styles.notesInputBox, { backgroundColor: theme.MODAL }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes / description (e.g. Carrefour grocery haul)"
                placeholderTextColor={theme.MUTED}
                style={[styles.notesInput, { color: theme.TEXT }]}
              />
            </View>
          </View>
        </View>

        {/* Submit CTA Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSaving}
          onPress={handleSave}
          style={[
            styles.submitCtaBtn,
            {
              backgroundColor: theme.TEXT,
              opacity: isSaving ? 0.7 : 1,
            },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.BG} size="small" />
          ) : (
            <Text style={[styles.submitCtaText, { color: theme.BG }]}>
              Record PKR {parseFloat(amount || '0').toLocaleString()} →
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Picker Component */}
      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        initialDate={date}
        onSelectDate={(d: Date) => {
          setDate(d);
          setShowCalendar(false);
        }}
      />
    </View>
  );
};

export default AddExpenseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerBox: {
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
  sectionMargin: {
    marginBottom: 12,
  },
  typePillContainer: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 3,
    gap: 3,
  },
  typePillBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroAmountCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  heroAmountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  heroAmountDisplay: {
    fontSize: 50,
    fontWeight: '800',
    letterSpacing: -2,
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  keyBtn: {
    width: '31%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountsList: {
    gap: 8,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  accBankTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  accSub: {
    fontSize: 11,
  },
  accBalance: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dateRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  dateLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesInputBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    fontSize: 13,
    padding: 0,
  },
  submitCtaBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitCtaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  calendarModalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
  },
  closeModalBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
