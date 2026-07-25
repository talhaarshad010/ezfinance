import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card, Button, CalendarPicker} from '../../../components';
import { useToast } from '../../../context/ToastContext';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { getBankById } from '../../../constants/pakistaniBanks';
import { saveTransaction } from '../../../services/bankAccountService';
import { addTransaction, updateAccountBalance } from '../../../store/slices/bankAccountsSlice';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AddExpenseScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  
  const { accounts } = useAppSelector(state => state.bankAccounts);
  const budgetCategories = useAppSelector(state => state.budget.categories);
  
  const [activeModal, setActiveModal] = useState<'category' | 'payment' | 'date' | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgetCategories[0]?.name || 'Other');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id || null);
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedBank = selectedAccount ? getBankById(selectedAccount.bankId) : null;

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error', 'Invalid Amount');
      return;
    }
    if (!selectedAccountId) {
      showToast('Please select a payment method (linked card)', 'error', 'Missing Account');
      return;
    }

    setIsSaving(true);
    try {
      const numAmount = parseFloat(amount);
      const txData = {
        description: description || category,
        amount: numAmount,
        type: 'expense' as const,
        category,
        date: date.toISOString(),
        createdAt: Date.now(),
      };

      await saveTransaction(selectedAccountId, txData);
      
      showToast('Expense recorded successfully!', 'success', 'Success');
      navigation.goBack();
    } catch (e) {
      console.error('Save expense error:', e);
      showToast('Failed to save expense. Please try again.', 'error', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="h1" weight="700" style={{fontSize: 28}}>Add Expense</Typography>
        <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 20}}>
          Log your spending and keep your editorial ledger clean.
        </Typography>
      </View>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>AMOUNT</Typography>
      <View style={styles.amountBox}>
        <Typography variant="h2" weight="500" color="#333" style={{marginRight: 8}}>PKR</Typography>
        <TextInput 
          placeholder="0.00"
          placeholderTextColor="#DDD"
          style={styles.amountInput}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>CATEGORY</Typography>
      <TouchableOpacity 
        style={styles.dropdownBox}
        onPress={() => setActiveModal('category')}
      >
        <Typography variant="body" color="#333">{category}</Typography>
        <Feather name="chevron-down" size={20} color="#AAA" />
      </TouchableOpacity>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>PAYMENT METHOD</Typography>
      <TouchableOpacity 
        style={styles.dropdownBox}
        onPress={() => setActiveModal('payment')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {selectedBank?.logo ? (
            <View style={styles.miniBankIcon}>
              <Image source={{ uri: selectedBank.logo }} style={styles.imageFull} resizeMode="contain" />
            </View>
          ) : (
            <Feather name="credit-card" size={20} color="#333" style={{ marginRight: 12 }} />
          )}
          <Typography variant="body" color="#333">
            {selectedAccount ? `${selectedAccount.bankAbbreviation} (••• ${selectedAccount.accountNumber.slice(-4)})` : 'Select Card'}
          </Typography>
        </View>
        <Feather name="chevron-down" size={20} color="#AAA" />
      </TouchableOpacity>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>DATE</Typography>
      <TouchableOpacity 
        style={styles.dropdownBox}
        onPress={() => setActiveModal('date')}
      >
        <Typography variant="body" color="#333">{date.toDateString()}</Typography>
        <Feather name="calendar" size={20} color="#333" />
      </TouchableOpacity>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>DESCRIPTION</Typography>
      <View style={styles.textAreaBox}>
        <TextInput 
          placeholder="What was this expense for?"
          placeholderTextColor="#AAA"
          style={styles.textAreaInput}
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Typography variant="body" weight="700" color="#FFF">
          {isSaving ? 'Processing...' : 'Save Expense'}
        </Typography>
      </TouchableOpacity>

      <Card style={styles.tipCard}>
        <Typography variant="body" weight="700" color="#000">Quick Tip</Typography>
        <Typography variant="caption" color="#666" style={{marginTop: 8, lineHeight: 20}}>
          Expenses over $500 are automatically flagged for your <Typography variant="caption" weight="700" color="#000" style={{fontStyle: 'italic'}}>AI Financial Advisor</Typography> to review for potential tax deductions.
        </Typography>
        <View style={styles.gearIcon}>
          <Feather name="settings" size={60} color="#EAEBEE" style={{opacity: 0.5}} />
        </View>
      </Card>

      <Modal visible={activeModal === 'category' || activeModal === 'payment'} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Typography variant="h2">
                    {activeModal === 'category' ? 'Select Category' : activeModal === 'payment' ? 'Select Payment Method' : 'Select Date'}
                </Typography>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                    <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
            </View>
            
            {activeModal === 'category' && budgetCategories.map((c, i) => (
                <TouchableOpacity key={i} style={styles.modalOption} onPress={() => { setCategory(c.name); setActiveModal(null); }}>
                    <Typography variant="body" weight={category === c.name ? '700' : '500'}>{c.name}</Typography>
                    {category === c.name && <Feather name="check" size={20} color="#000" />}
                </TouchableOpacity>
            ))}

            {activeModal === 'payment' && (
              accounts.length > 0 ? (
                accounts.map((acc) => {
                  const bank = getBankById(acc.bankId);
                  return (
                    <TouchableOpacity 
                      key={acc.id} 
                      style={styles.modalOption} 
                      onPress={() => { setSelectedAccountId(acc.id); setActiveModal(null); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.modalBankIcon}>
                          {bank?.logo && <Image source={{ uri: bank.logo }} style={styles.imageFull} resizeMode="contain" />}
                        </View>
                        <View>
                          <Typography variant="body" weight={selectedAccountId === acc.id ? '700' : '500'}>
                            {acc.bankName}
                          </Typography>
                          <Typography variant="caption" color="#666">
                            PKR {acc.balance.toLocaleString()} • •••{acc.accountNumber.slice(-4)}
                          </Typography>
                        </View>
                      </View>
                      {selectedAccountId === acc.id && <Feather name="check" size={20} color="#000" />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Typography variant="body" color="#666">No linked cards found.</Typography>
                  <Button 
                    title="Add Account" 
                    onPress={() => { setActiveModal(null); navigation.navigate('AddAccount'); }}
                    style={{ marginTop: 16 }}
                  />
                </View>
              )
            )}

          </View>
        </View>
      </Modal>

      <CalendarPicker 
         visible={activeModal === 'date'} 
         onClose={() => setActiveModal(null)} 
         onSelectDate={(d: Date) => setDate(d)} 
         initialDate={date} 
         maxDate={new Date()}
      />

      <View style={{height: 100}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  label: {
    letterSpacing: 1,
    marginBottom: 12,
    fontSize: 11,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEBEE',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 24,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 24,
  },
  textAreaBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 120,
    marginBottom: 32,
  },
  textAreaInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Inter-Medium',
  },
  saveBtn: {
    backgroundColor: '#222',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  tipCard: {
    backgroundColor: '#F3F4F6',
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gearIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dateCell: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 12,
  },
  miniBankIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBankIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9F9F9',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFull: {
    width: '100%',
    height: '100%',
  }
});

export default AddExpenseScreen;
