import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { colors } from '../../../theme/colors';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  target: string;
  params?: any;
  category: 'Menu' | 'Expense' | 'Market' | 'Setting';
  icon: string;
}

const SEARCH_DATABASE: SearchItem[] = [
  // Menus & Features
  { id: 'm1', title: 'Dashboard', subtitle: 'Overview of your finances', target: 'Home', category: 'Menu', icon: 'grid' },
  { id: 'm2', title: 'Expenses', subtitle: 'Track your spending', target: 'Expenses', category: 'Menu', icon: 'credit-card' },
  { id: 'm3', title: 'Investments', subtitle: 'Portfolio and assets', target: 'Investments', category: 'Menu', icon: 'trending-up' },
  { id: 'm4', title: 'AI Advisor', subtitle: 'Get financial insights', target: 'AI Advisor', category: 'Menu', icon: 'cpu' },
  { id: 'm5', title: 'Budget Planner', subtitle: 'Plan your monthly budget', target: 'BudgetPlanner', category: 'Menu', icon: 'pie-chart' },
  { id: 'm6', title: 'Analytics', subtitle: 'Detailed spending reports', target: 'Analytics', category: 'Menu', icon: 'bar-chart-2' },
  { id: 'm7', title: 'Portfolio', subtitle: 'Manage your assets', target: 'Portfolio', category: 'Menu', icon: 'briefcase' },
  { id: 'm8', title: 'Stock Market', subtitle: 'Real-time stock news & data', target: 'StockMarket', category: 'Menu', icon: 'activity' },
  { id: 'm9', title: 'Crypto Market', subtitle: 'Digital currency trends', target: 'CryptoMarket', category: 'Menu', icon: 'zap' },
  
  // Settings & Account
  { id: 's1', title: 'Profile Settings', subtitle: 'Edit your name, email, and photo', target: 'EditProfile', category: 'Setting', icon: 'user' },
  { id: 's2', title: 'Security', subtitle: '2FA, Biometrics, and Passwords', target: 'Security', category: 'Setting', icon: 'shield' },
  { id: 's3', title: 'Change Password', subtitle: 'Update your login credentials', target: 'ChangePassword', category: 'Setting', icon: 'lock' },
  { id: 's4', title: 'Notifications', subtitle: 'Alerts and sound settings', target: 'Notifications', category: 'Setting', icon: 'bell' },
  { id: 's5', title: 'Main Settings', subtitle: 'General app configuration', target: 'Settings', category: 'Setting', icon: 'settings' },
  
  // Expenses (Mock Transactions)
  { id: 'e1', title: 'Coffee / Lunch', subtitle: 'Office Catering • $1,200', target: 'ExpenseDetail', category: 'Expense', icon: 'coffee' },
  { id: 'e2', title: 'Fuel / Transport', subtitle: 'Shell Station • $8,500', target: 'ExpenseDetail', category: 'Expense', icon: 'truck' },
  { id: 'e3', title: 'Adobe Subscription', subtitle: 'Software • $52.99', target: 'ExpenseDetail', category: 'Expense', icon: 'layers' },
  { id: 'e4', title: 'Add New Expense', subtitle: 'Record a new transaction', target: 'AddExpense', category: 'Expense', icon: 'plus-circle' },
  
  // Markets & Assets
  { id: 'mk1', title: 'Apple Inc (AAPL)', subtitle: 'Stock • Technology', target: 'StockDetail', params: { symbol: 'AAPL' }, category: 'Market', icon: 'activity' },
  { id: 'mk2', title: 'Bitcoin (BTC)', subtitle: 'Crypto • Digital Gold', target: 'AssetDetail', params: { id: 'bitcoin' }, category: 'Market', icon: 'zap' },
  { id: 'mk3', title: 'Ethereum (ETH)', subtitle: 'Crypto • Smart Contracts', target: 'AssetDetail', params: { id: 'ethereum' }, category: 'Market', icon: 'circle' },
];

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return SEARCH_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const handleNavigation = (item: SearchItem) => {
    // These screens are inside the 'MainTabs' navigator
    const tabScreens = ['Home', 'Expenses', 'Investments', 'AI Advisor', 'Profile'];
    // These screens are direct children of 'Drawer'
    const drawerScreens = [
      'StockMarket', 'CryptoMarket', 'AddExpense', 'Analytics', 
      'BudgetPlanner', 'Portfolio', 'Settings', 'Notifications'
    ];

    if (tabScreens.includes(item.target)) {
      navigation.navigate('Drawer', {
        screen: 'MainTabs',
        params: {
          screen: item.target,
          params: item.params
        }
      });
    } else if (drawerScreens.includes(item.target)) {
      navigation.navigate('Drawer', {
        screen: item.target,
        params: item.params
      });
    } else {
      // Direct children of Stack (default)
      navigation.navigate(item.target, item.params);
    }
  };

  const renderItem = ({ item }: { item: SearchItem }) => (
    <TouchableOpacity
      onPress={() => handleNavigation(item)}
      activeOpacity={0.7}
    >

      <Card style={styles.resultCard}>
        <View style={[styles.iconBox, { backgroundColor: getCategoryColor(item.category) }]}>
          <Feather name={item.icon} size={20} color="#FFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Typography variant="body" weight="700">{item.title}</Typography>
            <View style={styles.categoryBadge}>
              <Typography variant="caption" weight="700" color="#666" style={{ fontSize: 10 }}>
                {item.category.toUpperCase()}
              </Typography>
            </View>
          </View>
          <Typography variant="caption" color="#666" style={{ marginTop: 2 }}>
            {item.subtitle}
          </Typography>
        </View>
        <Feather name="chevron-right" size={20} color="#CCC" />
      </Card>
    </TouchableOpacity>
  );

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Menu': return '#000';
      case 'Expense': return colors.accent.errorText;
      case 'Market': return '#0047AB';
      case 'Setting': return '#666';
      default: return '#000';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#999" />
            <TextInput
              autoFocus
              placeholder="Search anything..."
              placeholderTextColor="#999"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Feather name="x" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.emptyState}>
                <Feather name="search" size={48} color="#EEE" />
                <Typography variant="body" color="#999" style={{ marginTop: 16 }}>
                  No results found for "{query}"
                </Typography>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Typography variant="body" color="#999">
                  Type to search for screens, expenses, or assets
                </Typography>
              </View>
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#000',
  },
  listContent: {
    padding: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 12,
    borderRadius: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
});

export default SearchScreen;
