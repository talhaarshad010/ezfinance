import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Typography } from '../../../components';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addTransaction as addTransactionAction, updateAccountBalance } from '../../../store/slices/bankAccountsSlice';
import { saveTransaction } from '../../../services/bankAccountService';

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'coffee' },
  { id: 'transport', label: 'Transport', icon: 'truck' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'file-text' },
  { id: 'salary', label: 'Salary', icon: 'dollar-sign' },
  { id: 'transfer', label: 'Transfer', icon: 'repeat' },
  { id: 'health', label: 'Health', icon: 'heart' },
  { id: 'education', label: 'Education', icon: 'book' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film' },
  { id: 'other', label: 'Other', icon: 'grid' },
];

const AddTransactionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { accountId } = route.params;

  const account = useAppSelector(state =>
    state.bankAccounts.accounts.find(a => a.id === accountId),
  );

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) {
      showToast('Enter a description', 'error', 'Missing Info');
      return;
    }
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showToast('Enter a valid amount', 'error', 'Missing Info');
      return;
    }

    setSaving(true);
    try {
      const txData = {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category: CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Other',
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
      };

      const savedTx = await saveTransaction(accountId, txData);
      dispatch(addTransactionAction(savedTx));

      // Update local balance
      if (account) {
        const newBalance = type === 'income'
          ? account.balance + parseFloat(amount)
          : account.balance - parseFloat(amount);
        dispatch(updateAccountBalance({ accountId, balance: newBalance }));
      }

      showToast('Transaction added!', 'success', 'Success');
      navigation.goBack();
    } catch (e) {
      console.error('Save transaction error:', e);
      showToast('Failed to save transaction', 'error', 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
          onPress={() => setType('expense')}
        >
          <Feather name="arrow-up-right" size={16} color={type === 'expense' ? '#FFF' : '#D32F2F'} />
          <Typography
            variant="body"
            weight="700"
            color={type === 'expense' ? '#FFF' : '#D32F2F'}
            style={{ marginLeft: 6 }}
          >
            Expense
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, styles.typeBtnIncome, type === 'income' && styles.typeBtnIncomeActive]}
          onPress={() => setType('income')}
        >
          <Feather name="arrow-down-left" size={16} color={type === 'income' ? '#FFF' : '#2E7D32'} />
          <Typography
            variant="body"
            weight="700"
            color={type === 'income' ? '#FFF' : '#2E7D32'}
            style={{ marginLeft: 6 }}
          >
            Income
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <View style={styles.amountSection}>
        <Typography variant="caption" weight="700" color="#999" style={styles.label}>
          AMOUNT (PKR)
        </Typography>
        <View style={styles.amountInputContainer}>
          <Typography variant="h2" weight="700" color="#999">₨</Typography>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor="#CCC"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Description */}
      <Typography variant="caption" weight="700" color="#999" style={styles.label}>
        DESCRIPTION
      </Typography>
      <View style={styles.inputContainer}>
        <Feather name="edit-3" size={18} color="#999" style={{ marginRight: 12 }} />
        <TextInput
          style={styles.input}
          placeholder="e.g., Grocery shopping"
          placeholderTextColor="#CCC"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Category */}
      <Typography variant="caption" weight="700" color="#999" style={styles.label}>
        CATEGORY
      </Typography>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Feather
              name={cat.icon}
              size={14}
              color={selectedCategory === cat.id ? '#FFF' : '#666'}
            />
            <Typography
              variant="caption"
              weight="600"
              color={selectedCategory === cat.id ? '#FFF' : '#666'}
              style={{ marginLeft: 6 }}
            >
              {cat.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Feather name="check" size={20} color="#FFF" />
            <Typography variant="body" weight="700" color="#FFF" style={{ marginLeft: 10 }}>
              Save Transaction
            </Typography>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FDECEA',
  },
  typeBtnActive: {
    backgroundColor: '#D32F2F',
  },
  typeBtnIncome: {
    backgroundColor: '#E8F5E9',
    marginLeft: 4,
  },
  typeBtnIncomeActive: {
    backgroundColor: '#2E7D32',
  },
  amountSection: {
    marginBottom: 20,
  },
  label: {
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#000',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#000',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryChipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 32,
  },
});

export default AddTransactionScreen;
