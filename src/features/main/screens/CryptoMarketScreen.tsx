import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop, Polyline } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { AnimatedModal } from '../../../components/AnimatedModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COINS = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    priceUsd: '64,231.50',
    pricePkr: '17,910,000',
    change: '+2.45%',
    isUp: true,
    icon: 'cpu',
    sparkline: [62100, 62800, 63400, 63100, 64231.5],
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    priceUsd: '3,450.22',
    pricePkr: '962,500',
    change: '-1.12%',
    isUp: false,
    icon: 'layers',
    sparkline: [3520, 3500, 3480, 3460, 3450.22],
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    priceUsd: '145.89',
    pricePkr: '40,700',
    change: '+8.31%',
    isUp: true,
    icon: 'zap',
    sparkline: [134, 137, 140, 142, 145.89],
  },
  {
    name: 'Binance Coin',
    symbol: 'BNB',
    priceUsd: '584.10',
    pricePkr: '162,900',
    change: '+1.75%',
    isUp: true,
    icon: 'shield',
    sparkline: [572, 575, 580, 582, 584.1],
  },
  {
    name: 'Cardano',
    symbol: 'ADA',
    priceUsd: '0.485',
    pricePkr: '135',
    change: '-2.05%',
    isUp: false,
    icon: 'activity',
    sparkline: [0.50, 0.495, 0.49, 0.488, 0.485],
  },
];

const DOMINANCE_DATA = [
  { label: 'Bitcoin (BTC)', percent: 52.4, color: '#00A3FF' },
  { label: 'Ethereum (ETH)', percent: 18.1, color: '#FF9500' },
  { label: 'Altcoins & Stablecoins', percent: 29.5, color: '#00C853' },
];

const NEWS_PULSE = [
  {
    tag: 'REGULATION',
    title: 'SEC Approves Spot Ethereum ETF: What You Need To Know',
    time: '2h ago',
  },
  {
    tag: 'ANALYSIS',
    title: 'The Halving Cycle: Historical Data vs. Current Trends',
    time: '5h ago',
  },
  {
    tag: 'WEB3',
    title: 'Gaming Protocols Lead the Mid-Cap Recovery Surge',
    time: '8h ago',
  },
];

function Track({ pct, color }: { pct: number; color: string }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(pct, 100),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct, animWidth]);

  const interpolatedWidth = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.trackBackground}>
      <Animated.View
        style={[
          styles.trackFill,
          {
            backgroundColor: color,
            width: interpolatedWidth,
          },
        ]}
      />
    </View>
  );
}

function MiniSparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
  const { theme } = useTheme();
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 4);
      return `${x},${y}`;
    })
    .join(' ');

  const color = isUp ? theme.GREEN : theme.RED;

  return (
    <Svg width={w} height={h}>
      <Polyline fill="none" stroke={color} strokeWidth="1.8" points={points} />
    </Svg>
  );
}

export const CryptoMarketScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [activeTimeframe, setActiveTimeframe] = useState('24h');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={16} color={theme.MUTED} />
              <Text style={[styles.backText, { color: theme.MUTED }]}>
                Global Digital Assets
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Crypto Market
            </Text>
          </View>

          {/* Market Pulse Badge */}
          <View style={styles.statusBadgeRow}>
            <View
              style={[
                styles.livePulseDot,
                { backgroundColor: theme.GREEN },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.GREEN }]}>
              LIVE FEED
            </Text>
          </View>
        </View>

        {/* Hero Total Crypto Vault Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
            <Text style={styles.heroSubhead}>
              TOTAL CRYPTO PORTFOLIO VALUE
            </Text>
            <Text style={styles.heroAmount}>
              $42,892.<Text style={{ fontSize: 32, opacity: 0.6 }}>45</Text>
            </Text>
            <Text style={styles.heroCurrency}>~ PKR 11,940,000</Text>

            {/* Quick Action Buttons Row inside Hero */}
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BuyCrypto')}
                style={[styles.heroActionBtn, { backgroundColor: '#FFFFFF' }]}
              >
                <Feather name="plus" size={16} color="#000000" />
                <Text style={[styles.heroActionBtnText, { color: '#000000' }]}>
                  Buy Crypto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  showToast(
                    'Opening Crypto Swap Terminal.',
                    'info',
                    'Exchange Terminal',
                  )
                }
                style={[
                  styles.heroActionBtn,
                  { backgroundColor: 'rgba(255,255,255,0.12)' },
                ]}
              >
                <Feather name="repeat" size={15} color="#FFFFFF" />
                <Text style={[styles.heroActionBtnText, { color: '#FFFFFF' }]}>
                  Swap & Trade
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom 3-Column Stats Divider */}
            <View style={styles.heroStatsDividerRow}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>24h Profit</Text>
                <Text style={[styles.heroStatValue, { color: theme.GREEN }]}>
                  +$1,240.50
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Top Holding</Text>
                <Text style={[styles.heroStatValue, { color: theme.ACTIVE }]}>
                  Bitcoin (BTC)
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Staking APY</Text>
                <Text style={[styles.heroStatValue, { color: '#FFFFFF' }]}>
                  6.4% APY
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Crypto Market Asset Watchlist Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                Market Assets
              </Text>

              {/* Timeframe Filter Pills */}
              <View style={styles.timeframePillsRow}>
                {['24h', '7d', '30d'].map(t => {
                  const isActive = activeTimeframe === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      activeOpacity={0.8}
                      onPress={() => setActiveTimeframe(t)}
                      style={[
                        styles.tfPill,
                        {
                          backgroundColor: isActive
                            ? theme.TEXT
                            : theme.MODAL,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tfPillText,
                          {
                            color: isActive ? theme.BG : theme.MUTED,
                          },
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Coins List */}
            <View style={styles.coinsList}>
              {COINS.map((c, i) => (
                <TouchableOpacity
                  key={c.symbol}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedCoin(c);
                    setTradeModalVisible(true);
                  }}
                  style={[
                    styles.coinRowItem,
                    {
                      borderBottomWidth: i < COINS.length - 1 ? 1 : 0,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.coinIconSquare,
                      { backgroundColor: theme.MODAL },
                    ]}
                  >
                    <Feather name={c.icon} size={18} color={theme.ACTIVE} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.coinName, { color: theme.TEXT }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.coinSymbol, { color: theme.MUTED }]}>
                      {c.symbol} · PKR {c.pricePkr}
                    </Text>
                  </View>

                  <MiniSparkline data={c.sparkline} isUp={c.isUp} />

                  <View style={styles.priceCol}>
                    <Text style={[styles.coinPriceUsd, { color: theme.TEXT }]}>
                      ${c.priceUsd}
                    </Text>
                    <Text
                      style={[
                        styles.coinChangeText,
                        { color: c.isUp ? theme.GREEN : theme.RED },
                      ]}
                    >
                      {c.change}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Market Dominance Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
              Market Dominance
            </Text>
            <Text
              style={[
                styles.subText,
                { color: theme.MUTED, marginBottom: 14 },
              ]}
            >
              Global market cap breakdown
            </Text>

            <View style={styles.dominanceList}>
              {DOMINANCE_DATA.map(d => (
                <View key={d.label} style={styles.dominanceRow}>
                  <View style={styles.domLabelRow}>
                    <Text style={[styles.domLabelText, { color: theme.TEXT }]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.domPctText, { color: theme.TEXT }]}>
                      {d.percent}%
                    </Text>
                  </View>
                  <Track pct={d.percent} color={d.color} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* AI Financial Advisor Insights Card */}
        <View style={styles.sectionMargin}>
          <View
            style={[
              styles.aiCard,
              {
                backgroundColor: `${theme.ACTIVE}18`,
                borderColor: `${theme.ACTIVE}30`,
              },
            ]}
          >
            <View style={styles.aiHeaderRow}>
              <Feather name="zap" size={16} color={theme.ACTIVE} />
              <Text style={[styles.aiLabel, { color: theme.ACTIVE }]}>
                AI FINANCIAL ADVISOR
              </Text>
            </View>

            <Text style={[styles.aiBodyText, { color: theme.TEXT }]}>
              "Market volatility is currently low. Bitcoin is testing critical
              resistance at $65k. Consider diversifying 5% into Solana based on
              current momentum indicators."
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AIAdvisor')}
              style={[styles.aiCtaBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.aiCtaText, { color: theme.BG }]}>
                Get Full Analysis →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Pulse News Feed */}
        <View style={styles.sectionMargin}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.MUTED, paddingHorizontal: 4, marginBottom: 10 },
            ]}
          >
            Market Pulse & News
          </Text>

          <View style={styles.newsList}>
            {NEWS_PULSE.map(item => (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.8}
                onPress={() =>
                  showToast(
                    'Opening full crypto intelligence report.',
                    'info',
                    'Crypto News',
                  )
                }
                style={[styles.newsCard, { backgroundColor: theme.CARD }]}
              >
                <View style={styles.newsTagRow}>
                  <Text style={[styles.newsTag, { color: theme.ACTIVE }]}>
                    {item.tag}
                  </Text>
                  <Text style={[styles.newsTime, { color: theme.MUTED }]}>
                    {item.time}
                  </Text>
                </View>
                <Text style={[styles.newsTitleText, { color: theme.TEXT }]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Trade Modal Sheet */}
      <AnimatedModal
        visible={tradeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTradeModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setTradeModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                  {selectedCoin?.name} ({selectedCoin?.symbol})
                </Text>
                <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
                  Live Price: ${selectedCoin?.priceUsd} (~PKR {selectedCoin?.pricePkr})
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTradeModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.tradeModalBody}>
              <Text style={[styles.modalLabel, { color: theme.MUTED }]}>
                SWAP & SWIFT EXECUTION
              </Text>
              <View style={styles.orderTypeRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.orderTypeBtn,
                    { backgroundColor: theme.GREEN },
                  ]}
                  onPress={() => {
                    setTradeModalVisible(false);
                    showToast(
                      `Bought ${selectedCoin?.symbol} at $${selectedCoin?.priceUsd}`,
                      'success',
                      'Order Executed',
                    );
                  }}
                >
                  <Text style={styles.orderTypeBtnText}>BUY {selectedCoin?.symbol}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.orderTypeBtn,
                    { backgroundColor: theme.RED },
                  ]}
                  onPress={() => {
                    setTradeModalVisible(false);
                    showToast(
                      `Sold ${selectedCoin?.symbol} at $${selectedCoin?.priceUsd}`,
                      'error',
                      'Order Executed',
                    );
                  }}
                >
                  <Text style={styles.orderTypeBtnText}>SELL {selectedCoin?.symbol}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </AnimatedModal>
    </View>
  );
};

export default CryptoMarketScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,200,83,0.15)',
    borderRadius: 100,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sectionMargin: {
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroSubhead: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.36)',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 50,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -3,
    lineHeight: 52,
  },
  heroCurrency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroStatsDividerRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatColBordered: {
    flex: 1,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.07)',
    marginLeft: 14,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.32)',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeframePillsRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(128,128,128,0.12)',
    borderRadius: 100,
    padding: 2,
  },
  tfPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  tfPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  coinsList: {
    gap: 2,
  },
  coinRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  coinIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coinName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  coinSymbol: {
    fontSize: 11,
  },
  priceCol: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  coinPriceUsd: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  coinChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subText: {
    fontSize: 11,
  },
  dominanceList: {
    gap: 12,
  },
  dominanceRow: {
    gap: 4,
  },
  domLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  domLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  domPctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackBackground: {
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  aiCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  aiBodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiCtaBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCtaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  newsList: {
    gap: 8,
  },
  newsCard: {
    borderRadius: 20,
    padding: 16,
  },
  newsTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  newsTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  newsTime: {
    fontSize: 10,
  },
  newsTitleText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeModalBody: {
    marginTop: 10,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  orderTypeBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTypeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
