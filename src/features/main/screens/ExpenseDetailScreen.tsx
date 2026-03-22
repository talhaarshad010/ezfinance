import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Card } from '../../../components';
import { useNavigation } from '@react-navigation/native';

const ExpenseDetailScreen = () => {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="coffee" size={32} color="#000" />
        </View>
        
        <Typography variant="h1" align="center" style={styles.amount}>PKR 1,200</Typography>
        <Typography variant="body" color="#666" align="center" style={styles.merchant}>Office Catering</Typography>
        
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Typography variant="caption" color="#888">Date</Typography>
            <Typography variant="body" weight="600">Oct 24, 2023 at 1:30 PM</Typography>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Typography variant="caption" color="#888">Category</Typography>
            <View style={styles.badge}>
              <Typography variant="caption" weight="700" style={{color: '#000'}}>Food</Typography>
            </View>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Typography variant="caption" color="#888">Payment Method</Typography>
            <Typography variant="body" weight="600">Apple Pay (••• 4211)</Typography>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Typography variant="caption" color="#888">Status</Typography>
            <Typography variant="body" weight="600" color="#2E7D32">Completed</Typography>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 24,
  },
  amount: {
    fontSize: 40,
    marginBottom: 8,
  },
  merchant: {
    fontSize: 18,
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  badge: {
    backgroundColor: '#EEE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  }
});

export default ExpenseDetailScreen;
