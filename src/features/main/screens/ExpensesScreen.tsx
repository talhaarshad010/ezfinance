import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card, CalendarPicker } from '../../../components';
import { useAppSelector } from '../../../store/hooks';
import { getBankById } from '../../../constants/pakistaniBanks';
import { colors } from '../../../theme/colors';

const ExpensesScreen = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [activeBankId, setActiveBankId] = useState<string | null>(null);

  const { accounts, transactions } = useAppSelector(state => state.bankAccounts);

  // Unify and filter expenses from all cards
  const allExpenses = React.useMemo(() => {
    const list: any[] = [];
    Object.keys(transactions).forEach(accountId => {
      transactions[accountId].forEach(tx => {
        if (tx.type === 'expense') {
          const account = accounts.find(a => a.id === accountId);
          list.push({
            ...tx,
            bankName: account?.bankName || 'Unknown Bank',
            bankAbbreviation: account?.bankAbbreviation || '??',
            bankId: account?.bankId,
          });
        }
      });
    });

    // Sort by date descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [accounts, transactions]);

  const categories = [
    'All Categories',
    'Food',
    'Transport',
    'Shopping',
    'Services',
    'Rent',
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Typography variant="h1" weight="700" style={{ fontSize: 32 }}>
          Expenses
        </Typography>
        <Typography variant="body" color="#666" style={{ marginTop: 4 }}>
          Tracking your intentional spending.
        </Typography>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#AAA" />
        <TextInput
          placeholder="Search transactions..."
          placeholderTextColor="#AAA"
          style={styles.searchInput}
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={
                activeCategory === cat
                  ? styles.filterBtnBlack
                  : styles.filterBtnWhite
              }
              onPress={() => setActiveCategory(cat)}
            >
              <Typography
                variant="caption"
                weight="700"
                color={activeCategory === cat ? '#FFF' : '#333'}
              >
                {cat}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Typography variant="caption" weight="700" color="#AAA" style={{ marginBottom: 12, letterSpacing: 1 }}>FILTER BY CARD</Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={activeBankId === null ? styles.filterBtnBlack : styles.filterBtnWhite}
            onPress={() => setActiveBankId(null)}
          >
            <Typography variant="caption" weight="700" color={activeBankId === null ? '#FFF' : '#333'}>All Cards</Typography>
          </TouchableOpacity>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={activeBankId === acc.id ? styles.filterBtnBlack : styles.filterBtnWhite}
              onPress={() => setActiveBankId(acc.id)}
            >
              <View style={styles.bankFilterIcon}>
                <Image source={{ uri: getBankById(acc.bankId)?.logo }} style={styles.miniLogo} resizeMode="contain" />
              </View>
              <Typography variant="caption" weight="700" color={activeBankId === acc.id ? '#FFF' : '#333'}>
                {acc.bankAbbreviation}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 24, justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.filterBtnWhite}
          onPress={() => setShowCalendar(true)}
        >
          <Feather
            name="calendar"
            size={16}
            color="#000"
            style={{ marginRight: 8 }}
          />
          <Typography variant="caption" weight="600" color="#333">
            {selectedDate.toLocaleDateString('default', {
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
        </TouchableOpacity>

        {(activeCategory !== 'All Categories' || activeBankId !== null) && (
          <TouchableOpacity onPress={() => { setActiveCategory('All Categories'); setActiveBankId(null); }}>
             <Typography variant="caption" color={colors.primary} weight="700">Reset Filters</Typography>
          </TouchableOpacity>
        )}
      </View>

      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDate={(d: Date) => setSelectedDate(d)}
        initialDate={selectedDate}
      />

      {/* Transactions List */}
      {allExpenses.length > 0 ? (
        allExpenses
          .filter(exp => (activeCategory === 'All Categories' || exp.category === activeCategory) && (activeBankId === null || exp.accountId === activeBankId))
          .map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
            />
          ))
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="minus-circle" size={48} color="#CCC" />
          <Typography variant="body" color="#AAA" style={{ marginTop: 16 }}>
            No expenses found across your accounts.
          </Typography>
        </View>
      )}

    </ScrollView>
  );
};

const ExpenseCard = ({ expense }: { expense: any }) => {
  const navigation = useNavigation<any>();
  const bank = getBankById(expense.bankId);
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  };

  // Map category to icon
  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Food': return 'coffee';
      case 'Transport': return 'car';
      case 'Shopping': return 'shopping-bag';
      case 'Rent': return 'home';
      default: return 'credit-card';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('TransactionDetail', { transaction: expense })}
      activeOpacity={0.8}
    >
      <Card style={styles.card}>
        <View style={styles.iconBox}>
          {bank?.logo ? (
            <Image source={{ uri: bank.logo }} style={styles.bankLogo} resizeMode="contain" />
          ) : (
            <Feather name={getIcon(expense.category)} size={20} color="#000" />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Typography variant="body" weight="700">
              {expense.description}
            </Typography>
            <Typography
              variant="caption"
              weight="700"
              color={colors.primary}
              style={{ marginLeft: 8, fontSize: 10, letterSpacing: 0.5 }}
            >
              {expense.bankAbbreviation}
            </Typography>
          </View>
          <Typography variant="caption" color="#666" style={{ marginTop: 4 }}>
            {formatDate(expense.date)} • {expense.category || 'Uncategorized'}
          </Typography>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Typography variant="caption" weight="700" style={{ fontSize: 10 }}>
            PKR
          </Typography>
          <Typography variant="body" weight="700" style={{ fontSize: 16, color: '#D32F2F' }}>
            {expense.amount.toLocaleString()}
          </Typography>
        </View>
      </Card>
    </TouchableOpacity>
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
    paddingBottom: 140,
  },
  header: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEBEE',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Inter-Medium',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  filterBtnBlack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  filterBtnWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
    marginBottom: 16,
    borderRadius: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  bankFilterIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginRight: 8,
    overflow: 'hidden',
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
  miniLogo: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  dateCell: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
});

export default ExpensesScreen;
