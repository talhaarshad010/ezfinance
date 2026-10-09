import React, { useState, useEffect } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Dimensions} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import {Typography, Card} from '../../../components';

const PortfolioScreen = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const barAnimHeights = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  useEffect(() => {
    const targetHeights = [40, 60, 50, 90, 120, 160];
    barAnimHeights.forEach((anim, i) => {
      anim.value = withDelay(i * 100, withTiming(targetHeights[i], { duration: 600, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#666">Total Portfolio Value</Typography>
        <Typography variant="h1" weight="700" style={{fontSize: 40, marginTop: 4}}>$124,892.45</Typography>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12}}>
           <View style={styles.badge}>
             <Feather name="arrow-up-right" size={12} color="#0047AB" />
             <Typography variant="caption" weight="700" color="#0047AB" style={{marginLeft: 4}}>+12.4%</Typography>
           </View>
           <Typography variant="caption" color="#666" style={{marginLeft: 12}}>vs last month</Typography>
        </View>
      </View>

      <View style={styles.statsRow}>
         <Card style={styles.statCard}>
            <Typography variant="caption" weight="700" color="#666" style={{fontSize: 9, letterSpacing: 1}}>TOTAL INVESTED</Typography>
            <Typography variant="body" weight="700" style={{marginTop: 8}}>$110,000.00</Typography>
         </Card>
         <View style={{width: 12}} />
         <Card style={styles.statCard}>
            <Typography variant="caption" weight="700" color="#666" style={{fontSize: 9, letterSpacing: 1}}>NET PROFIT</Typography>
            <Typography variant="body" weight="700" color="#0047AB" style={{marginTop: 8}}>+$14,892.45</Typography>
         </Card>
      </View>

      <Card style={styles.chartCard}>
         <View style={styles.rowBetween}>
            <View>
                <Typography variant="h2" weight="700">Performance</Typography>
                <Typography variant="h2" weight="700">Trend</Typography>
                <Typography variant="caption" color="#666" style={{marginTop: 4}}>Growth over the last 6 months</Typography>
            </View>
            <View style={{flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 16, padding: 4, alignSelf: 'flex-start'}}>
               {['6M', '1Y', 'ALL'].map((tab, idx) => (
                  <TouchableOpacity 
                     key={tab} 
                     style={activeTab === idx ? styles.tabActive : styles.tabInactive}
                     onPress={() => setActiveTab(idx)}
                  >
                     <Typography variant="caption" weight="700" color={activeTab === idx ? '#FFF' : '#000'} style={{fontSize: 9}}>{tab}</Typography>
                  </TouchableOpacity>
               ))}
            </View>
         </View>
         
         {/* Bar Chart Mock */}
         <View style={styles.barChartMock}>
            {barAnimHeights.map((anim, i) => {
               const style = useAnimatedStyle(() => ({ height: anim.value }));
               const color = i === 5 ? '#0047AB' : (i > 2 ? '#A0B9D6' : '#EAEBEE');
               return <Animated.View key={i} style={[styles.bar, style, {backgroundColor: color}]} />;
            })}
         </View>
      </Card>

      <Card style={styles.allocationCard}>
         <Typography variant="h2" weight="700" color="#FFF">Allocation</Typography>
         <Typography variant="caption" color="#AAA" style={{marginTop: 4}}>By Asset Class</Typography>
         
         <View style={{marginTop: 24}}>
             <AllocationRow label="Stocks" percent="70%" fillWidth="70%" />
             <AllocationRow label="Bonds" percent="30%" fillWidth="30%" />
         </View>

         <TouchableOpacity style={styles.whiteBtn}>
            <Typography variant="caption" weight="700">Optimization AI</Typography>
         </TouchableOpacity>
      </Card>

      <View style={[styles.rowBetween, {marginTop: 16, marginBottom: 16}]}>
          <Typography variant="h2" weight="700">Your Assets</Typography>
          <View style={{flexDirection: 'row'}}>
             <TouchableOpacity style={styles.iconBtn}><Feather name="filter" size={16} color="#000" /></TouchableOpacity>
             <TouchableOpacity style={[styles.iconBtn, {marginLeft: 8}]}><Feather name="search" size={16} color="#000" /></TouchableOpacity>
          </View>
      </View>

      <AssetDetailCard icon="pocket" title="Apple Inc." subtitle="AAPL • 140 Shares" invested="$21,420.00" current="$26,512.40" gain="+23.8%" gainColor="#0047AB" />
      <AssetDetailCard icon="triangle" title="Tesla Inc." subtitle="TSLA • 50 Shares" invested="$12,500.00" current="$11,210.00" gain="-10.3%" gainColor="#D32F2F" />

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
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  barChartMock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    marginTop: 32,
  },
  bar: {
    width: 35,
    borderRadius: 4,
  },
  allocationCard: {
    backgroundColor: '#000',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  progressTrackDark: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFillDark: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  whiteBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEBEE',
  },
  assetCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default PortfolioScreen;

const AllocationRow = ({label, percent, fillWidth}: any) => {
  const widthAnim = useSharedValue(0);
  useEffect(() => {
     widthAnim.value = withTiming(parseInt(fillWidth), { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);
  const style = useAnimatedStyle(() => ({ width: `${widthAnim.value}%` }));

  return (
  <View style={{marginBottom: 16}}>
     <View style={[styles.rowBetween, {marginBottom: 8}]}>
        <Typography variant="body" weight="700" color="#FFF" style={{fontSize: 12}}>{label}</Typography>
        <Typography variant="caption" weight="700" color="#FFF" style={{fontSize: 10}}>{percent}</Typography>
     </View>
     <View style={styles.progressTrackDark}>
         <Animated.View style={[styles.progressFillDark, style]} />
     </View>
  </View>
)};

const AssetDetailCard = ({icon, title, subtitle, invested, current, gain, gainColor}: any) => {
  const navigation = useNavigation<any>();
  return (
  <TouchableOpacity onPress={() => navigation.navigate('AssetDetail')}>
    <Card style={styles.assetCard}>
     <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
         <View style={styles.iconCircle}>
            <Feather name={icon} size={20} color="#000" />
         </View>
         <View style={{marginLeft: 16}}>
            <Typography variant="body" weight="700">{title}</Typography>
            <Typography variant="caption" color="#666" style={{marginTop: 4}}>{subtitle}</Typography>
         </View>
     </View>
     <View style={styles.rowBetween}>
         <View>
            <Typography variant="caption" weight="700" color="#AAA" style={{fontSize: 9, letterSpacing: 1}}>INVESTED</Typography>
            <Typography variant="body" weight="700" style={{marginTop: 4, fontSize: 13}}>{invested}</Typography>
         </View>
         <View>
            <Typography variant="caption" weight="700" color="#AAA" style={{fontSize: 9, letterSpacing: 1}}>CURRENT</Typography>
            <Typography variant="body" weight="700" style={{marginTop: 4, fontSize: 13}}>{current}</Typography>
         </View>
         <View>
            <Typography variant="caption" weight="700" color="#AAA" style={{fontSize: 9, letterSpacing: 1}}>GAIN/LOSS</Typography>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
               <Feather name={gain.startsWith('+') ? "arrow-up" : "arrow-down"} size={12} color={gainColor} />
               <Typography variant="body" weight="700" color={gainColor} style={{fontSize: 13, marginLeft: 2}}>{gain}</Typography>
            </View>
         </View>
     </View>
  </Card>
  </TouchableOpacity>
)};
