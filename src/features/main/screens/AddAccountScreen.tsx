import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../../components';
import BankSelectionModal from '../../../components/BankSelectionModal';
import { PakistaniBank } from '../../../constants/pakistaniBanks';
import { useToast } from '../../../context/ToastContext';
import { ScreenBackHeader } from '../../../components/ScreenBackHeader';
import { ApiError } from '../../../api/client';
import { SAVE_ERROR } from '../../../utils/validation';
import { useBankAccounts } from './bankAccounts/useBankAccounts';

const AddAccountScreen = () => {
  const navigation = useNavigation<any>();
  // Saves to the user's own accounts, or the sample accounts in the Explore demo.
  const bank = useBankAccounts();
  const { showToast } = useToast();

  const [selectedBank, setSelectedBank] = useState<PakistaniBank | null>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    if (!selectedBank) {
      showToast('Please select a bank', 'error', 'Missing Info');
      return false;
    }
    if (!accountTitle.trim()) {
      showToast('Please enter account title', 'error', 'Missing Info');
      return false;
    }
    if (accountNumber.replace(/\D/g, '').length < 4) {
      showToast('Enter the account number (at least its last 4 digits)', 'error', 'Missing Info');
      return false;
    }
    if (!balance.trim() || isNaN(parseFloat(balance))) {
      showToast('Please enter a valid balance', 'error', 'Missing Info');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;

    setSaving(true);
    try {
      await bank.add({
        bankId: selectedBank!.id,
        bankName: selectedBank!.shortName,
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim(),
        balance: parseFloat(balance),
      });
      showToast('Account added successfully!', 'success', 'Success');
      navigation.goBack();
    } catch (error) {
      // The form stays filled in so the user can try again.
      showToast(error instanceof ApiError ? error.message : SAVE_ERROR, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
    <ScreenBackHeader title="Add Account" back="Bank Accounts" />
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Bank Selection */}
      <Typography variant="caption" weight="700" color="#999" style={styles.label}>
        SELECT BANK
      </Typography>
      <TouchableOpacity
        style={styles.bankSelector}
        onPress={() => setBankModalVisible(true)}
        activeOpacity={0.7}
      >
        {selectedBank ? (
          <View style={[styles.bankSelected, { overflow: 'hidden' }]}>
            <View style={[styles.bankDot, { backgroundColor: selectedBank.color }]}>
              {selectedBank.logo ? (
                <Image
                  source={{ uri: selectedBank.logo }}
                  style={styles.bankLogo}
                  resizeMode="contain"
                />
              ) : (
                <Typography variant="caption" weight="700" color="#FFF" style={{ fontSize: 10 }}>
                  {selectedBank.abbreviation}
                </Typography>
              )}
            </View>
            <Typography variant="body" weight="600" style={{ flex: 1, marginLeft: 12 }}>
              {selectedBank.shortName}
            </Typography>
            <Feather name="chevron-down" size={18} color="#999" />
          </View>
        ) : (
          <View style={styles.bankPlaceholder}>
            <Feather name="search" size={18} color="#999" />
            <Typography variant="body" color="#999" style={{ flex: 1, marginLeft: 12 }}>
              Tap to select bank
            </Typography>
            <Feather name="chevron-down" size={18} color="#999" />
          </View>
        )}
      </TouchableOpacity>

      {/* Account Title */}
      <Typography variant="caption" weight="700" color="#999" style={styles.label}>
        ACCOUNT TITLE
      </Typography>
      <View style={styles.inputContainer}>
        <Feather name="user" size={18} color="#999" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g., Salary Account"
          placeholderTextColor="#CCC"
          value={accountTitle}
          onChangeText={setAccountTitle}
        />
      </View>

      {/* Account Number */}
      <Typography variant="caption" weight="700" color="#999" style={styles.label}>
        ACCOUNT NUMBER
      </Typography>
      <View style={styles.inputContainer}>
        <Feather name="hash" size={18} color="#999" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g., 12345678901234"
          placeholderTextColor="#CCC"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
        />
      </View>

      {/* Current Balance */}
      <Typography variant="caption" weight="700" color="#999" style={styles.label}>
        CURRENT BALANCE (PKR)
      </Typography>
      <View style={styles.inputContainer}>
        <Typography variant="body" weight="700" color="#999" style={styles.inputIcon}>₨</Typography>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#CCC"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Save Button */}
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
              Save Account
            </Typography>
          </>
        )}
      </TouchableOpacity>

      <BankSelectionModal
        visible={bankModalVisible}
        onClose={() => setBankModalVisible(false)}
        onSelect={(bank) => {
          setSelectedBank(bank);
          setBankModalVisible(false);
        }}
      />
    </ScrollView>
    </View>
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
  label: {
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
  },
  bankSelector: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankSelected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
  bankPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#000',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 40,
  },
});

export default AddAccountScreen;
