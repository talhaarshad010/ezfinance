import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';
import {colors} from '../../../theme/colors';

const BudgetPlannerScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1.5}}>OCTOBER 2023</Typography>
          <Typography variant="h1" weight="700" style={{fontSize: 48, marginTop: 8}}>$14,500.00</Typography>
          <View style={styles.budgetMeta}>
            <Typography variant="body" color="#666">Total Monthly Budget</Typography>
            <View style={styles.usageBadge}>
              <Typography variant="caption" weight="700" color="#000">68% used</Typography>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.newCategoryBtn}
            onPress={() => Alert.alert('New Category', 'Add a new budget category.')}
          >
            <Feather name="plus-circle" size={20} color="#FFF" />
            <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 10}}>New Category</Typography>
          </TouchableOpacity>
        </View>

        {/* Housing & Utilities Large Card */}
        <Card style={styles.mainCard}>
          <View style={styles.rowBetween}>
            <View>
              <Typography variant="h2" weight="700" style={{fontSize: 28}}>Housing &</Typography>
              <Typography variant="h2" weight="700" style={{fontSize: 28}}>Utilities</Typography>
              <Typography variant="body" color="#666" style={{marginTop: 8}}>Fixed monthly</Typography>
              <Typography variant="body" color="#666">essentials</Typography>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Typography variant="h3" weight="700">$5,200 /</Typography>
              <Typography variant="h3" weight="700" color="#666">$6,000</Typography>
            </View>
          </View>

          <View style={styles.progressBarLarge}>
            <View style={[styles.progressFillLarge, {width: '86.6%'}]} />
          </View>

          <View style={styles.rowBetween}>
            <Typography variant="caption" weight="700" color="#AAA" style={{letterSpacing: 1}}>86.6% EXPENDED</Typography>
            <Typography variant="caption" color="#AAA" style={{letterSpacing: 1}}>$800 REMAINING</Typography>
          </View>

          {/* Large Goal Circle Mockup */}
          <View style={styles.circleContainer}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Typography variant="h1" weight="700" style={{fontSize: 40}}>86%</Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* Small Category Cards */}
        <BudgetCategory icon="coffee" name="Food & Dining" spent="1,450" limit="2,000" usage="72.5%" color="#0047AB" />
        <BudgetCategory icon="truck" name="Transport" spent="850" limit="1,200" usage="70.8%" color="#000" />
        <BudgetCategory icon="package" name="Shopping" spent="1,150" limit="1,000" usage="115%" color={colors.accent.errorText} overBudget />
        <BudgetCategory icon="tv" name="Entertainment" spent="420" limit="800" usage="52.5%" color="#0047AB" />

        {/* Goal Card */}
        <Card style={styles.goalCard}>
           <View style={styles.goalHeader}>
              <Feather name="briefcase" size={20} color="#FFF" />
              <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 12}}>Annual Vacation Fund</Typography>
           </View>
           <Typography variant="body" color="#AAA" style={{marginTop: 16, lineHeight: 22}}>
             You're on track to reach your $12,000 goal by December! Adding $1,000 this month.
           </Typography>
           
           <View style={[styles.rowBetween, {marginTop: 24}]}>
              <Typography variant="caption" weight="700" color="#FFF">$8,400 Saved</Typography>
              <Typography variant="caption" weight="700" color="#FFF">70%</Typography>
           </View>
           <View style={styles.goalProgressBg}>
              <View style={[styles.goalProgressFill, {width: '70%'}]} />
           </View>

           <TouchableOpacity 
            style={styles.viewProgressBtn}
            onPress={() => Alert.alert('Goal', 'Opening vacation fund details.')}
           >
              <Typography variant="body" weight="700">View Progress</Typography>
           </TouchableOpacity>
        </Card>

        {/* Smart Insights */}
        <Typography variant="h2" weight="700" style={{marginTop: 40, marginBottom: 20}}>Smart Insights</Typography>
        
        <Card style={styles.insightCard}>
          <View style={styles.insightIconCircle}>
            <Feather name="map-pin" size={20} color="#000" />
          </View>
          <View style={{flex: 1, marginLeft: 20}}>
            <Typography variant="h3" weight="700">Potential Savings Found</Typography>
            <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 22}}>
              We noticed your Shopping expenditure is 15% higher than usual. Switching to a weekly cap could save you approximately $340 by next month. Would you like to set an automated alert?
            </Typography>
            <View style={styles.insightActions}>
              <TouchableOpacity onPress={() => Alert.alert('Alert', 'Smart Alert enabled.')}>
                <Typography variant="body" weight="700">Enable Smart Alert</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={{marginLeft: 24}} onPress={() => Alert.alert('Dismissed')}>
                <Typography variant="body" color="#AAA">Dismiss</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const BudgetCategory = ({icon, name, spent, limit, usage, color, overBudget}: any) => (
  <Card style={styles.categoryCard}>
    <View style={styles.rowBetween}>
      <View style={styles.categoryIconBox}>
        <Feather name={icon} size={20} color={overBudget ? colors.accent.errorText : "#000"} />
      </View>
      <TouchableOpacity>
        <Feather name="more-vertical" size={24} color="#CCC" />
      </TouchableOpacity>
    </View>
    <Typography variant="body" weight="700" style={{marginTop: 20, fontSize: 18}}>{name}</Typography>
    <View style={{flexDirection: 'row', alignItems: 'flex-end', marginTop: 4}}>
      <Typography variant="h2" weight="700">${spent} / </Typography>
      <Typography variant="h3" weight="700" color="#666">${limit}</Typography>
    </View>

    <View style={styles.progressBarSmall}>
      <View style={[styles.progressFillSmall, {width: overBudget ? '100%' : usage, backgroundColor: color}]} />
    </View>

    <Typography 
      variant="caption" 
      weight="700" 
      color={overBudget ? colors.accent.errorText : "#AAA"} 
      style={{marginTop: 12, letterSpacing: 1}}
    >
      {overBudget ? '115% - OVER BUDGET' : `${usage} UTILIZED`}
    </Typography>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 40,
  },
  budgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  usageBadge: {
    backgroundColor: '#EAEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  newCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    alignSelf: 'flex-start',
    marginTop: 32,
  },
  mainCard: {
    padding: 32,
    borderRadius: 32,
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginVertical: 24,
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 6,
  },
  circleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  circleOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: '#F3F4F6',
    borderTopColor: '#000',
    borderLeftColor: '#000',
    borderBottomColor: '#000',
    transform: [{rotate: '-45deg'}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF',
    transform: [{rotate: '45deg'}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCard: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 16,
  },
  categoryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarSmall: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 4,
  },
  goalCard: {
    backgroundColor: '#000',
    padding: 32,
    borderRadius: 32,
    marginTop: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBg: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  viewProgressBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    alignSelf: 'flex-start',
    marginTop: 32,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 32,
    borderRadius: 32,
    marginBottom: 40,
  },
  insightIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightActions: {
    flexDirection: 'row',
    marginTop: 24,
  }
});

export default BudgetPlannerScreen;
