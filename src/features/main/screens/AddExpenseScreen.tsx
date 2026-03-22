import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card, Button, CalendarPicker} from '../../../components';

const AddExpenseScreen = () => {
  const [activeModal, setActiveModal] = useState<'category' | 'payment' | 'date' | null>(null);
  const [category, setCategory] = useState('Dining & Drinks');
  const [payment, setPayment] = useState('Credit Card (Visa)');
  const [date, setDate] = useState<Date>(new Date());

  const categories = ['Dining & Drinks', 'Transport', 'Groceries', 'Entertainment', 'Shopping'];
  const paymentMethods = ['Credit Card (Visa)', 'Apple Pay', 'Cash', 'Bank Transfer'];

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
        <Typography variant="h2" weight="500" color="#333" style={{marginRight: 8}}>$</Typography>
        <TextInput 
          placeholder="0.00"
          placeholderTextColor="#DDD"
          style={styles.amountInput}
          keyboardType="numeric"
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
        <Typography variant="body" color="#333">{payment}</Typography>
        <Feather name="credit-card" size={20} color="#333" />
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
        />
      </View>

      <TouchableOpacity 
        style={styles.saveBtn}
        onPress={() => Alert.alert('Success', 'Expense saved successfully (demo mode).')}
      >
        <Typography variant="body" weight="700" color="#FFF">Save Expense</Typography>
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

      <Modal visible={activeModal !== null} transparent animationType="slide">
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
            
            {activeModal === 'category' && categories.map((c, i) => (
                <TouchableOpacity key={i} style={styles.modalOption} onPress={() => { setCategory(c); setActiveModal(null); }}>
                    <Typography variant="body" weight={category === c ? '700' : '500'}>{c}</Typography>
                    {category === c && <Feather name="check" size={20} color="#000" />}
                </TouchableOpacity>
            ))}

            {activeModal === 'payment' && paymentMethods.map((p, i) => (
                <TouchableOpacity key={i} style={styles.modalOption} onPress={() => { setPayment(p); setActiveModal(null); }}>
                    <Typography variant="body" weight={payment === p ? '700' : '500'}>{p}</Typography>
                    {payment === p && <Feather name="check" size={20} color="#000" />}
                </TouchableOpacity>
            ))}

          </View>
        </View>
      </Modal>

      <CalendarPicker 
         visible={activeModal === 'date'} 
         onClose={() => setActiveModal(null)} 
         onSelectDate={(d: Date) => setDate(d)} 
         initialDate={date} 
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
  }
});

export default AddExpenseScreen;
