import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';
import {colors} from '../../../theme/colors';
import { useToast } from '../../../context/ToastContext';

const BudgetScreen = () => {
  const { showToast } = useToast();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#AAA" style={{letterSpacing: 1}}>OCTOBER 2023</Typography>
        <Typography variant="h1" weight="700" style={{fontSize: 40, marginTop: 4}}>$14,500.00</Typography>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
           <Typography variant="caption" color="#666">Total Monthly Budget</Typography>
           <View style={styles.badge}><Typography variant="caption" weight="700" color="#666" style={{fontSize: 10}}>68% used</Typography></View>
        </View>

        <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => showToast('Adding a new financial category.', 'info', 'New Budget')}
        >
           <Feather name="plus-circle" size={18} color="#FFF" />
           <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 8}}>New Category</Typography>
        </TouchableOpacity>
      </View>

      {/* Main Categories */}
      
      {/* Large Card: Housing & Utilities */}
      <Card style={{...styles.card, paddingTop: 32}}>
         <View style={styles.rowBetween}>
            <View>
               <Typography variant="h2" weight="700">Housing &</Typography>
               <Typography variant="h2" weight="700">Utilities</Typography>
               <Typography variant="caption" color="#666" style={{marginTop: 8}}>Fixed monthly</Typography>
               <Typography variant="caption" color="#666">essentials</Typography>
            </View>
            <View style={{alignItems: 'flex-end'}}>
               <Typography variant="body" weight="700">$5,200 /</Typography>
               <Typography variant="body" weight="700">$6,000</Typography>
            </View>
         </View>
         
         {/* Simple Progress Bar representation */}
         <View style={[styles.progressBar, {marginTop: 24}]}>
            <View style={[styles.progressFill, {width: '86.6%', backgroundColor: '#000'}]} />
         </View>
         
         <View style={[styles.rowBetween, {marginTop: 8}]}>
            <Typography variant="caption" weight="700" color="#AAA" style={{fontSize: 10}}>86.6% EXPENDED</Typography>
            <Typography variant="caption" color="#AAA" style={{fontSize: 10}}>$800 REMAINING</Typography>
         </View>

         {/* Circular representation (Mock) */}
         <View style={styles.circleMock}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                 <Typography variant="h2" weight="700">86%</Typography>
              </View>
            </View>
         </View>
      </Card>

      {/* Small Category Cards */}
      <CategoryCard icon="coffee" title="Food & Dining" spent="$1,450" limit="$2,000" percent="72.5%" fillWidth="72%" fillCol="#0047AB" />
      <CategoryCard icon="car" title="Transport" spent="$850" limit="$1,200" percent="70.8%" fillWidth="70%" fillCol="#000" />
      <CategoryCard icon="shopping-bag" title="Shopping" spent="$1,150" limit="$1,000" percent="115%" fillWidth="100%" fillCol={colors.accent.errorText} overBudget />
      <CategoryCard icon="youtube" title="Entertainment" spent="$420" limit="$800" percent="52.5%" fillWidth="52%" fillCol="#0047AB" />

      {/* Black Goal Card */}
      <Card style={styles.blackCard}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Feather name="briefcase" size={20} color="#FFF" />
             <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 12}}>Annual Vacation Fund</Typography>
         </View>
         <Typography variant="caption" color="#AAA" style={{marginTop: 16, lineHeight: 20}}>
           You're on track to reach your $12,000 goal by December! Adding $1,000 this month.
         </Typography>

         <View style={[styles.rowBetween, {marginTop: 24, marginBottom: 8}]}>
            <Typography variant="caption" weight="700" color="#FFF" style={{fontSize: 10}}>$8,400 Saved</Typography>
            <Typography variant="caption" weight="700" color="#FFF" style={{fontSize: 10}}>70%</Typography>
         </View>
         <View style={[styles.progressBar, {backgroundColor: '#333', height: 6}]}>
            <View style={[styles.progressFill, {width: '70%', backgroundColor: '#FFF'}]} />
         </View>

         <TouchableOpacity style={styles.whiteBtn}>
            <Typography variant="caption" weight="700">View Progress</Typography>
         </TouchableOpacity>
      </Card>

      {/* Insights */}
      <Typography variant="h2" weight="700" style={{marginTop: 24, marginBottom: 16}}>Smart Insights</Typography>
      
      <Card style={styles.insightCard}>
        <View style={styles.insightIconBox}>
          <Feather name="map-pin" size={16} color="#000" />
        </View>
        <View style={{flex: 1, marginLeft: 16}}>
          <Typography variant="body" weight="700">Potential Savings Found</Typography>
          <Typography variant="caption" color="#666" style={{marginTop: 8, lineHeight: 20}}>
            We noticed your Shopping expenditure is 15% higher than usual. Switching to a weekly cap could save you approximately $340 by next month. Would you like to set an automated alert?
          </Typography>
          <View style={{flexDirection: 'row', marginTop: 16}}>
             <TouchableOpacity onPress={() => showToast('Alert enabled for Shopping category.', 'success', 'Smart Alerts')}>
                <Typography variant="caption" weight="700" style={{marginRight: 16}}>Enable Smart Alert</Typography>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => showToast('Insight dismissed.', 'info', 'Dismissed')}>
                <Typography variant="caption" color="#AAA">Dismiss</Typography>
             </TouchableOpacity>
          </View>
        </View>
      </Card>

      <View style={{height: 100}} />
    </ScrollView>
  );
};

const CategoryCard = ({icon, title, spent, limit, percent, fillWidth, fillCol, overBudget}: any) => {
  const { showToast } = useToast();
  return (
    <Card style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.smallIconBox}>
          <Feather name={icon} size={16} color={overBudget ? colors.accent.errorText : "#000"} />
        </View>
        <TouchableOpacity onPress={() => showToast('Manage this category settings.', 'info', 'Options')}>
           <Feather name="more-vertical" size={20} color="#AAA" />
        </TouchableOpacity>
      </View>
      <Typography variant="body" weight="700" style={{marginTop: 16}}>{title}</Typography>
      <Typography variant="h2" weight="700" style={{marginTop: 4}}>{spent} / <Typography variant="h3" color="#666">{limit}</Typography></Typography>
      
      <View style={[styles.progressBar, {marginTop: 16}]}>
         <View style={[styles.progressFill, {width: fillWidth, backgroundColor: fillCol}]} />
      </View>
      
      <Typography variant="caption" weight="700" color={overBudget ? colors.accent.errorText : "#AAA"} style={{fontSize: 10, marginTop: 12}}>
        {overBudget ? '115% - OVER BUDGET' : `${percent} UTILIZED`}
      </Typography>
    </Card>
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
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  card: {
    padding: 24,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  circleMock: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  circleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 16,
    borderColor: '#000',
    borderRightColor: '#F3F4F6',
    borderTopColor: '#000',
    borderLeftColor: '#000',
    borderBottomColor: '#000',
    transform: [{rotate: '-45deg'}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFF',
    transform: [{rotate: '45deg'}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackCard: {
    backgroundColor: '#000',
    padding: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  whiteBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 24,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
  },
  insightIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BudgetScreen;
