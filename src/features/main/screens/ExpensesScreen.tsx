import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Modal} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import {Typography, Card, Button, CalendarPicker} from '../../../components';

const ExpensesScreen = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState('All Categories');
  
  const categories = ['All Categories', 'Food', 'Transport', 'Shopping', 'Services', 'Rent'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="h1" weight="700" style={{fontSize: 32}}>Expenses</Typography>
        <Typography variant="body" color="#666" style={{marginTop: 4}}>Tracking your intentional spending.</Typography>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
                key={index}
                style={activeCategory === cat ? styles.filterBtnBlack : styles.filterBtnWhite}
                onPress={() => setActiveCategory(cat)}
            >
              {cat === 'All Categories' && <Feather name="layers" size={16} color={activeCategory === cat ? "#FFF" : "#000"} style={{marginRight: 8}} />}
              <Typography variant="caption" weight="700" color={activeCategory === cat ? "#FFF" : "#333"}>{cat}</Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={{flexDirection: 'row', marginBottom: 24}}>
          <TouchableOpacity 
              style={styles.filterBtnWhite}
              onPress={() => setShowCalendar(true)}
          >
            <Feather name="calendar" size={16} color="#000" style={{marginRight: 8}} />
            <Typography variant="caption" weight="600" color="#333">
              {selectedDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
            </Typography>
          </TouchableOpacity>
      </View>

      <CalendarPicker 
         visible={showCalendar} 
         onClose={() => setShowCalendar(false)} 
         onSelectDate={(d: Date) => setSelectedDate(d)} 
         initialDate={selectedDate} 
      />

      {/* Transactions List */}
      <ExpenseCard icon="coffee" category="Food" tag="LUNCH" date="Oct 24, 2023" desc="Office Catering" amount="1200" />
      <ExpenseCard icon="car" category="Transport" tag="FUEL" date="Oct 23, 2023" desc="Shell Station" amount="8500" />
      <ExpenseCard icon="shopping-bag" category="Shopping" tag="FASHION" date="Oct 21, 2023" desc="Brand Outlet" amount="14200" />
      <ExpenseCard icon="briefcase" category="Services" tag="MAINTENANCE" date="Oct 20, 2023" desc="Plumbing Fix" amount="3500" />
      <ExpenseCard icon="youtube" category="Entertainment" tag="DIGITAL" date="Oct 19, 2023" desc="Streaming Hub" amount="1900" />
      
      <View style={{height: 100}} />
    </ScrollView>
  );
};

const ExpenseCard = ({icon, category, tag, date, desc, amount}: any) => {
  const navigation = useNavigation<any>();
  return (
  <TouchableOpacity onPress={() => navigation.navigate('ExpenseDetail')} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.iconBox}>
          <Feather name={icon} size={20} color="#000" />
        </View>
        <View style={{flex: 1, marginLeft: 16}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Typography variant="body" weight="700">{category}</Typography>
            <Typography variant="caption" weight="700" color="#AAA" style={{marginLeft: 8, fontSize: 10, letterSpacing: 0.5}}>{tag}</Typography>
          </View>
          <Typography variant="caption" color="#666" style={{marginTop: 4}}>{date} • {desc}</Typography>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Typography variant="caption" weight="700" style={{fontSize: 10}}>PKR</Typography>
          <Typography variant="body" weight="700" style={{fontSize: 16}}>{amount}</Typography>
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
  }
});

export default ExpensesScreen;
