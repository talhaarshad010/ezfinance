import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Button } from '../../../components';

const BuyCryptoScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [crypto, setCrypto] = useState('BTC');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h2" weight="700" style={{marginBottom: 24}}>Buy Crypto</Typography>

        <View style={styles.inputContainer}>
          <Typography variant="caption" weight="700" color="#666">YOU PAY</Typography>
          <View style={styles.row}>
            <Typography variant="h1" style={styles.currency}>$</Typography>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#AAA"
            />
          </View>
        </View>

        <View style={styles.swapIcon}>
          <Feather name="arrow-down" size={20} color="#666" />
        </View>

        <View style={styles.inputContainer}>
          <Typography variant="caption" weight="700" color="#666">YOU RECEIVE (EST.)</Typography>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, {color: '#0047AB'}]}
              placeholder="0.0000"
              editable={false}
              value={amount ? (parseFloat(amount) / 64000).toFixed(4) : ''}
              placeholderTextColor="#AAA"
            />
            <View style={styles.cryptoBadge}>
              <Typography variant="body" weight="700">BTC</Typography>
            </View>
          </View>
        </View>

        <View style={styles.detailsBox}>
           <View style={styles.detailRow}>
              <Typography variant="caption" color="#666">Exchange Rate</Typography>
              <Typography variant="caption" weight="700">1 BTC = $64,231.50</Typography>
           </View>
           <View style={styles.detailRow}>
              <Typography variant="caption" color="#666">Network Fee</Typography>
              <Typography variant="caption" weight="700">$2.50</Typography>
           </View>
        </View>

        <Button title="Review Order" style={{marginTop: 32}} onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { padding: 24, paddingTop: 40 },
  inputContainer: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  currency: { fontSize: 32, marginRight: 8, color: '#333' },
  input: { flex: 1, fontSize: 40, fontFamily: 'Inter-Bold', color: '#000' },
  swapIcon: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -16,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#F8F9FB',
  },
  cryptoBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  detailsBox: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#EAEBEE',
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  }
});

export default BuyCryptoScreen;
