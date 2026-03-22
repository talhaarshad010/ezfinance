import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Dimensions} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {Typography, Card} from '../../../components';
import {colors} from '../../../theme/colors';
import Feather from 'react-native-vector-icons/Feather';

const CryptoMarketScreen = () => {
  const [activeFilter, setActiveFilter] = useState(0);
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#666">TOTAL CRYPTO BALANCE</Typography>
        <Typography variant="h1" weight="700" style={{fontSize: 40}}>$42,892.<Typography variant="h3" color="#AAA">45</Typography></Typography>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, {backgroundColor: '#000'}]}
          onPress={() => navigation.navigate('BuyCrypto')}
        >
          <Feather name="plus" size={20} color="#FFF" />
          <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 8}}>Buy Crypto</Typography>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FFF'}]}>
          <Feather name="repeat" size={18} color="#333" />
          <Typography variant="body" weight="700" color="#333" style={{marginLeft: 8}}>Trade</Typography>
        </TouchableOpacity>
      </View>

      {/* Market List */}
      <Card style={styles.marketCard}>
        <View style={styles.marketHeader}>
          <Typography variant="h3" weight="700">Crypto Market</Typography>
          <View style={styles.timeFilter}>
            {['24h', '7d', '30d'].map((t, i) => (
              <TouchableOpacity 
                key={t} 
                style={[styles.filterBtn, activeFilter === i && styles.activeFilter]}
                onPress={() => setActiveFilter(i)}
              >
                <Typography variant="caption" weight="700" color={activeFilter === i ? '#333' : '#AAA'}>{t}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.listHeader}>
          <Typography variant="caption" color="#AAA" weight="700">ASSET</Typography>
          <Typography variant="caption" color="#AAA" weight="700" style={{marginLeft: 100}}>PRICE</Typography>
          <Typography variant="caption" color="#AAA" weight="700" style={{flex: 1, textAlign: 'right'}}>24H CHANGE</Typography>
        </View>

        <CoinItem name="Bitcoin" symbol="BTC" price="$64,231.50" change="+2.45" up />
        <CoinItem name="Ethereum" symbol="ETH" price="$3,450.22" change="-1.12" up={false} />
        <CoinItem name="Solana" symbol="SOL" price="$145.89" change="+8.31" up />
      </Card>

      {/* Market Dominance */}
      <Card style={styles.dominanceCard}>
        <Typography variant="h3" weight="700" color="#FFF">Market Dominance</Typography>
        <DominanceRow label="Bitcoin" percent={0.524} color="#FFF" />
        <DominanceRow label="Ethereum" percent={0.181} color="#AAA" />
      </Card>

      {/* AI Advisor */}
      <Card style={styles.aiCard}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <Feather name="zap" size={20} color="#000" />
           <Typography variant="body" weight="700" style={{marginLeft: 8}}>AI Financial Advisor</Typography>
         </View>
         <Typography variant="body" color="#666" style={{marginTop: 12, lineHeight: 20}}>
           "Market volatility is currently low. Bitcoin is testing critical resistance at \$65k. Consider diversifying 5% into Solana based on current momentum indicators."
         </Typography>
         <TouchableOpacity style={styles.analysisBtn}>
           <Typography variant="body" weight="700">Get Full Analysis</Typography>
         </TouchableOpacity>
      </Card>

      {/* Market Pulse */}
      <Typography variant="h2" weight="700" style={{marginLeft: 24, marginVertical: 24}}>Market Pulse</Typography>
      
      <PulseItem category="REGULATION" title="SEC Approves Spot Ethereum ETF: What You Need To Know" />
      <PulseItem category="ANALYSIS" title="The Halving Cycle: Historical Data vs. Current Trends" />
      <PulseItem category="WEB3" title="Gaming Protocols Lead the Mid-Cap Recovery Surge" />

      <View style={{height: 100}} />
    </ScrollView>
  );
};

const CoinItem = ({name, symbol, price, change, up}: any) => (
  <View style={styles.coinItem}>
    <View style={styles.coinLogo}><Feather name={symbol === 'BTC' ? 'italic' : 'layers'} size={20} color="#333" /></View>
    <View style={{flex: 1, marginLeft: 12}}>
      <Typography variant="body" weight="700">{name}</Typography>
      <Typography variant="caption" color="#AAA">{symbol}</Typography>
    </View>
    <Typography variant="body" weight="700">{price}</Typography>
    <View style={{flexDirection: 'row', alignItems: 'center', width: 80, justifyContent: 'flex-end'}}>
       <Feather name={up ? "trending-up" : "trending-down"} size={14} color={up ? colors.accent.successText : colors.accent.errorText} />
       <Typography variant="caption" weight="700" color={up ? colors.accent.successText : colors.accent.errorText} style={{marginLeft: 4}}>{change}%</Typography>
    </View>
  </View>
)

const DominanceRow = ({label, percent, color}: any) => (
  <View style={{marginTop: 20}}>
    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
      <Typography variant="body" color="#AAA">{label}</Typography>
      <Typography variant="body" weight="700" color="#FFF">{(percent * 100).toFixed(1)}%</Typography>
    </View>
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, {width: `${percent * 100}%`, backgroundColor: color}]} />
    </View>
  </View>
)

const StatBox = ({label, val}: {label: string; val: string}) => (
  <View style={styles.statBox}>
    <Typography variant="caption" color="#AAA" weight="600">{label}</Typography>
    <Typography variant="h3" weight="700" style={{marginTop: 4}}>{val}</Typography>
  </View>
);

const PulseItem = ({category, title}: any) => (
  <Card style={styles.pulseItem}>
    <Typography variant="caption" weight="700" color="#AAA" style={{letterSpacing: 1}}>{category}</Typography>
    <Typography variant="body" weight="700" style={{marginTop: 8}}>{title}</Typography>
    <Typography variant="caption" color="#666" style={{marginTop: 8}}>Analysts predict institutional inflows of \$15B in the first quarter post-launch...</Typography>
  </Card>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    padding: 24,
    paddingTop: 24,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  marketCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 30,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeFilter: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 4,
    borderRadius: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#FFF',
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  coinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  coinLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dominanceCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#000',
    padding: 24,
    borderRadius: 30,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  assetLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    backgroundColor: '#EEE',
    borderRadius: 30,
  },
  aiInsightCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    backgroundColor: '#EEE',
    borderRadius: 30,
  },
  analysisBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  pulseItem: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFF',
  },
  statBox: {
    width: (Dimensions.get('window').width - 48) / 2,
    backgroundColor: '#F0F0F0',
    padding: 20,
    borderRadius: 24,
    margin: 4,
  }
});

export default CryptoMarketScreen;
