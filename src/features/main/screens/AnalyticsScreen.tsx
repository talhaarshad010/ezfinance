import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';

const AnalyticsScreen = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#666">Monthly Outflow</Typography>
        <Typography variant="h1" weight="700" style={{fontSize: 40, marginTop: 4}}>$12,480.00</Typography>
        <View style={styles.badge}>
           <Feather name="arrow-up" size={12} color="#0047AB" />
           <Typography variant="caption" weight="700" color="#0047AB" style={{marginLeft: 4}}>4.2% vs last month</Typography>
        </View>
      </View>

      <Card style={styles.card}>
         <View style={styles.rowBetween}>
            <Typography variant="h3" weight="700">Spending Trend</Typography>
            <View style={{flexDirection: 'row'}}>
               <View style={styles.tabActive}><Typography variant="caption" weight="700" color="#FFF" style={{fontSize: 10}}>6M</Typography></View>
               <View style={styles.tabInactive}><Typography variant="caption" weight="700" color="#000" style={{fontSize: 10}}>1Y</Typography></View>
            </View>
         </View>
         {/* Simplified Chart Mock */}
         <View style={styles.chartMockArea}>
             <View style={styles.bezierLine} />
         </View>
         <View style={styles.chartLabels}>
             <Typography variant="caption" color="#AAA" style={{fontSize: 9}}>JAN</Typography>
             <Typography variant="caption" color="#AAA" style={{fontSize: 9}}>FEB</Typography>
             <Typography variant="caption" color="#AAA" style={{fontSize: 9}}>MAR</Typography>
             <Typography variant="caption" color="#AAA" style={{fontSize: 9}}>APR</Typography>
             <Typography variant="caption" color="#AAA" style={{fontSize: 9}}>MAY</Typography>
             <Typography variant="caption" color="#AAA" style={{fontSize: 9}}>JUN</Typography>
         </View>
      </Card>

      <Card style={{...styles.card, paddingBottom: 32}}>
         <Typography variant="h3" weight="700">Breakdown</Typography>
         
         <View style={styles.pieChartMock}>
            <View style={styles.ringOuter}>
               <View style={styles.ringInner}>
                   <Typography variant="caption" weight="700" color="#666" style={{fontSize: 9}}>Top Category</Typography>
                   <Typography variant="body" weight="700">Housing</Typography>
               </View>
            </View>
         </View>

         <View style={{marginTop: 32}}>
             <BreakdownRow color="#000" label="Housing" percent="40%" />
             <BreakdownRow color="#0047AB" label="Investments" percent="25%" />
             <BreakdownRow color="#D32F2F" label="Food" percent="15%" />
         </View>
      </Card>
      
      <View style={[styles.rowBetween, {marginTop: 8, marginBottom: 16}]}>
          <Typography variant="h2" weight="700">Budget Status</Typography>
          <TouchableOpacity><Typography variant="caption" weight="600" style={{textDecorationLine: 'underline'}}>Adjust Limits</Typography></TouchableOpacity>
      </View>

      <Card style={styles.budgetCard}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <View style={styles.smallIconBox}><Feather name="coffee" size={16} color="#000" /></View>
             <View style={{flex: 1, marginLeft: 16}}>
                 <View style={styles.rowBetween}>
                     <View>
                        <Typography variant="body" weight="700" style={{fontSize: 12}}>Food Budget</Typography>
                        <Typography variant="caption" color="#AAA" style={{fontSize: 10}}>Monthly Allowance</Typography>
                     </View>
                     <Typography variant="caption" weight="700" color="#000" style={{fontSize: 10}}>$7,000 / $10,000</Typography>
                 </View>
             </View>
         </View>
         <View style={styles.progressBar}>
             <View style={[styles.progressFill, {width: '70%', backgroundColor: '#000'}]} />
         </View>
      </Card>

      <Card style={styles.budgetCard}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <View style={styles.smallIconBox}><Feather name="truck" size={16} color="#000" /></View>
             <View style={{flex: 1, marginLeft: 16}}>
                 <View style={styles.rowBetween}>
                     <View>
                        <Typography variant="body" weight="700" style={{fontSize: 12}}>Transport</Typography>
                        <Typography variant="caption" color="#AAA" style={{fontSize: 10}}>Monthly Allowance</Typography>
                     </View>
                     <Typography variant="caption" weight="700" color="#D32F2F" style={{fontSize: 10}}>$2,800 <Typography variant="caption" color="#000" style={{fontSize: 10}}>/ $3,000</Typography></Typography>
                 </View>
             </View>
         </View>
         <View style={styles.progressBar}>
             <View style={[styles.progressFill, {width: '93%', backgroundColor: '#D32F2F'}]} />
         </View>
      </Card>

      {/* AI Smart Savings */}
      <Card style={styles.aiCard}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <Feather name="cpu" size={16} color="#FFF" />
             <Typography variant="caption" weight="700" color="#FFF" style={{letterSpacing: 1, marginLeft: 8, fontSize: 10}}>AI ADVISOR</Typography>
         </View>
         <Typography variant="h2" weight="700" color="#FFF" style={{marginTop: 16}}>Smart Savings{'\n'}Opportunity</Typography>
         <Typography variant="caption" color="#AAA" style={{marginTop: 12, lineHeight: 20}}>
             We noticed your subscriptions increased by 15%. You could save up to $120/mo by consolidating your cloud storage plans.
         </Typography>
         <TouchableOpacity style={styles.optimizeBtn}>
             <Typography variant="caption" weight="700" color="#000">Optimize Now</Typography>
         </TouchableOpacity>
      </Card>

      <View style={{height: 100}} />
    </ScrollView>
  );
};

const BreakdownRow = ({color, label, percent}: any) => (
   <View style={[styles.rowBetween, {marginBottom: 12}]}>
       <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 12}} />
           <Typography variant="caption" color="#333">{label}</Typography>
       </View>
       <Typography variant="caption" weight="700">{percent}</Typography>
   </View>
);

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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabInactive: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chartMockArea: {
    height: 150,
    backgroundColor: '#EAEBEE',
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bezierLine: {
    width: '120%',
    height: 100,
    borderTopWidth: 4,
    borderColor: '#0047AB',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    marginTop: 80,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  pieChartMock: {
    alignItems: 'center',
    marginTop: 32,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 16,
    borderColor: '#000',
    borderRightColor: '#0047AB',
    borderBottomColor: '#D32F2F',
    borderLeftColor: '#EAEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  smallIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiCard: {
    backgroundColor: '#05131f',
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
  },
  optimizeBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 24,
  }
});

export default AnalyticsScreen;
