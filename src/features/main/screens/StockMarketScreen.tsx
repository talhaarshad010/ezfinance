import React, { useEffect } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';
import {Typography, Card} from '../../../components';
import {colors} from '../../../theme/colors';
import Feather from 'react-native-vector-icons/Feather';

const StockMarketScreen = () => {
  const navigation = useNavigation<any>();
  const barAnimHeights = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  useEffect(() => {
    const targetHeights = [40, 60, 45, 55, 80, 100];
    barAnimHeights.forEach((anim, i) => {
      anim.value = withDelay(i * 100, withTiming(targetHeights[i], { duration: 600, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1}}>MARKET LIVE • PSX</Typography>
        <Typography variant="h1" weight="700">Stock Market</Typography>
      </View>

      {/* Index Card */}
      <Card style={styles.indexCard}>
        <View>
          <Typography variant="caption" color="#666" weight="600">KSE-100 Index</Typography>
          <Typography variant="h2" weight="700">78,412.30</Typography>
        </View>
        <View style={styles.upBadge}>
          <Feather name="arrow-up" size={12} color={colors.accent.successText} />
          <Typography variant="caption" weight="700" color={colors.accent.successText}>+ 0.84%</Typography>
        </View>
      </Card>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color="#AAA" />
        <TextInput 
          placeholder="Search by company or ticker.." 
          style={styles.searchInput}
          placeholderTextColor="#AAA"
        />
      </View>

      {/* Featured Stock */}
      <Card style={styles.featuredCard}>
        <View style={styles.featuredHeader}>
          <View style={styles.hblLogo}><Typography variant="body" weight="700" color="#FFF">HBL</Typography></View>
          <View style={{flex: 1, marginLeft: 12}}>
            <Typography variant="h3" weight="700">Habib Bank Limited</Typography>
            <Typography variant="caption" color="#AAA">PSX: HBL</Typography>
          </View>
          <View style={{alignItems: 'flex-end'}}>
             <Typography variant="h2" weight="700">126.50</Typography>
             <Typography variant="caption" weight="700" color={colors.accent.infoText}>• +1.2%</Typography>
          </View>
        </View>
        
        {/* Simple Bar Chart Mock */}
        <View style={styles.barChart}>
          {barAnimHeights.map((anim, i) => {
             const style = useAnimatedStyle(() => ({ height: anim.value }));
             return <Animated.View key={i} style={[styles.bar, style, {backgroundColor: i > 3 ? '#003366' : '#EEE'}]} />;
          })}
        </View>
      </Card>

      {/* Portfolio Card */}
      <Card style={styles.portfolioCard}>
        <Typography variant="caption" color="#999">YOUR PORTFOLIO</Typography>
        <Typography variant="h2" weight="700" color="#FFF">Rs. 842k</Typography>
        <Typography variant="caption" color="#999">All stocks active</Typography>
        <TouchableOpacity 
            style={styles.tradeBtn}
            onPress={() => Alert.alert('Trading Platform', 'Opening the execution terminal.')}
        >
          <Typography variant="body" weight="700">Trade Now</Typography>
        </TouchableOpacity>
      </Card>

      {/* Market Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, {backgroundColor: colors.accent.infoText}]} />
          <Typography variant="body" weight="600">Open</Typography>
        </View>
        <Typography variant="caption" color="#666">Closing in 2h</Typography>
      </View>

      {/* Trending Tickers */}
      <Typography variant="h3" weight="700" style={{marginHorizontal: 24, marginTop: 24, marginBottom: 16}}>TRENDING TICKERS</Typography>
      
      <TickerItem logo="ENGR" name="Engro Corporation" category="Industrial/Fertilizers" price="342.15" change="-0.4%" changeColor={colors.accent.errorText} />
      <TickerItem logo="LUCK" name="Lucky Cement" category="Materials/Construction" price="718.40" change="-1.1%" changeColor={colors.accent.errorText} />
      <TickerItem logo="HUBC" name="Hub Power Company" category="Energy/Power" price="148.90" change="0.0%" changeColor="#AAA" />

      {/* AI Insight */}
      <View style={styles.aiInsightCard}>
        <View style={styles.aiIcon}><Feather name="cpu" size={24} color="#333" /></View>
        <View style={{flex: 1, marginLeft: 16}}>
          <Typography variant="body" weight="700">AI Financial Insight</Typography>
          <Typography variant="caption" color="#333" style={{marginTop: 4, lineHeight: 18}}>
             Based on PSX market trends, the banking sector (HBL, MCB) shows strong resistance levels. Consider diversifying into Energy stocks for long-term dividends.
          </Typography>
          <TouchableOpacity 
            style={{marginTop: 12}}
            onPress={() => Alert.alert('AI Advisor', 'Analyzing specific market opportunities for your portfolio.')}
          >
            <Typography variant="body" weight="700" color="#333">Ask AI Advisor →</Typography>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{height: 100}} />
    </ScrollView>
  );
};

const TickerItem = ({name, category, price, change, changeColor = colors.accent.successText, logo}: any) => {
  const navigation = useNavigation<any>();
  return (
  <TouchableOpacity style={styles.tickerItem} onPress={() => navigation.navigate('StockDetail')}>
    <View style={styles.assetLogo}><Typography variant="caption" weight="700">{logo}</Typography></View>
    <View style={{flex: 1, marginLeft: 12}}>
      <Typography variant="body" weight="700">{name}</Typography>
      <Typography variant="caption" color="#AAA">{category}</Typography>
    </View>
    <View style={{alignItems: 'flex-end', marginRight: 12}}>
      <Typography variant="body" weight="700">{price}</Typography>
      <Typography variant="caption" weight="600" color={changeColor}>{change}</Typography>
    </View>
    <Feather name="chevron-right" size={20} color="#CCC" />
  </TouchableOpacity>
)};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    padding: 24,
    paddingTop: 24,
  },
  indexCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: '#EEE',
    marginBottom: 24,
  },
  upBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  featuredCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#FFF',
    marginBottom: 24,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hblLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    marginTop: 24,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  portfolioCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#000',
    borderRadius: 24,
    marginBottom: 24,
  },
  tradeBtn: {
    backgroundColor: '#FFF',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    backgroundColor: '#EEE',
    padding: 16,
    borderRadius: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  tickerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiInsightCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#EEE',
    flexDirection: 'row',
    marginTop: 32,
    borderRadius: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  }
});

export default StockMarketScreen;
