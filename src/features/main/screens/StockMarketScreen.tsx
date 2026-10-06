import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

const KSE_CHART_DATA = [
  77800, 77950, 78100, 78020, 78250, 78180, 78350, 78290, 78412,
];

const STOCKS = [
  {
    ticker: 'HBL',
    name: 'Habib Bank Limited',
    price: '126.50',
    change: '+1.2%',
    isUp: true,
    volume: '12.4M',
    sparkline: [122, 123, 125, 124, 126.5],
  },
  {
    ticker: 'SYS',
    name: 'Systems Limited',
    price: '412.00',
    change: '+3.4%',
    isUp: true,
    volume: '8.1M',
    sparkline: [398, 402, 405, 410, 412],
  },
  {
    ticker: 'ENGRO',
    name: 'Engro Corporation',
    price: '318.50',
    change: '+0.6%',
    isUp: true,
    volume: '6.5M',
    sparkline: [315, 316, 317, 318, 318.5],
  },
  {
    ticker: 'LUCK',
    name: 'Lucky Cement Limited',
    price: '892.10',
    change: '-0.4%',
    isUp: false,
    volume: '4.2M',
    sparkline: [898, 896, 895, 893, 892.1],
  },
  {
    ticker: 'OGDC',
    name: 'Oil & Gas Development',
    price: '134.20',
    change: '+1.8%',
    isUp: true,
    volume: '18.9M',
    sparkline: [131, 132, 133, 133.5, 134.2],
  },
];

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

function KseIndexChart() {
  const { theme } = useTheme();
  const data = KSE_CHART_DATA;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const chartWidth = SCREEN_WIDTH - 72;
  const chartHeight = 85;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * chartWidth;
      const y = chartHeight - 8 - ((val - min) / range) * (chartHeight - 16);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints =
    `0,${chartHeight} ` + points + ` ${chartWidth},${chartHeight}`;

  return (
    <View style={styles.chartWrap}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="kseGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop stopColor={theme.GREEN} stopOpacity="0.3" offset="0" />
            <Stop stopColor={theme.GREEN} stopOpacity="0" offset="1" />
          </LinearGradient>
        </Defs>
        <Path d={`M ${areaPoints} Z`} fill="url(#kseGrad)" />
        <Polyline
          fill="none"
          stroke={theme.GREEN}
          strokeWidth="2.2"
          points={points}
        />
      </Svg>
    </View>
  );
}

export const StockMarketScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  const filteredStocks = STOCKS.filter(
    s =>
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
                PSX Live Feed & Equities
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Stock Market
            </Text>
          </View>

          {/* Market Status Pill */}
          <View style={styles.statusBadgeRow}>
            <View
              style={[
                styles.livePulseDot,
                { backgroundColor: theme.GREEN },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.GREEN }]}>
              OPEN · 2H LEFT
            </Text>
          </View>
        </View>

        {/* Hero KSE-100 Index Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroSubhead} numberOfLines={1}>
                PSX · KSE-100 INDEX
              </Text>
              <View style={styles.upBadge}>
                <Feather name="arrow-up-right" size={12} color={theme.GREEN} />
                <Text style={[styles.upBadgeText, { color: theme.GREEN }]}>
                  +0.84% (+651 pts)
                </Text>
              </View>
            </View>

            <Text style={styles.heroAmount}>78,412.30</Text>
            <Text style={styles.heroCurrency}>POINTS</Text>

            {/* Native SVG KSE-100 Chart */}
            <KseIndexChart />

            {/* Bottom 3-Column Stats Divider */}
            <View style={styles.heroStatsDividerRow}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Day High</Text>
                <Text style={[styles.heroStatValue, { color: '#FFFFFF' }]}>
                  78,650.10
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Day Low</Text>
                <Text style={[styles.heroStatValue, { color: '#FFFFFF' }]}>
                  77,920.40
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Volume</Text>
                <Text style={[styles.heroStatValue, { color: theme.ACTIVE }]}>
                  342.8M shares
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Portfolio Summary Card */}
        <View style={styles.sectionMargin}>
          <View style={[styles.portCard, { backgroundColor: theme.CARD }]}>
            <View style={styles.portHeaderRow}>
              <Text style={[styles.portLabel, { color: theme.MUTED }]}>
                YOUR PSX EQUITY PORTFOLIO
              </Text>
              <Text style={[styles.portGainText, { color: theme.GREEN }]}>
                +Rs. 64,200 (+8.2%)
              </Text>
            </View>

            <Text style={[styles.portAmount, { color: theme.TEXT }]}>
              Rs. 842,500
            </Text>
            <Text style={[styles.portSubText, { color: theme.MUTED }]}>
              4 active holdings · Automated dividend tracking
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                showToast(
                  'Opening PSX Order Execution Terminal.',
                  'info',
                  'Trading Platform',
                )
              }
              style={[styles.tradeBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.tradeBtnText, { color: theme.BG }]}>
                Open Trade Terminal →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.sectionMargin}>
          <View style={[styles.searchBox, { backgroundColor: theme.CARD }]}>
            <Feather name="search" size={16} color={theme.MUTED} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search company name or PSX ticker (e.g. HBL, SYS)..."
              placeholderTextColor={theme.MUTED}
              style={[styles.searchInput, { color: theme.TEXT }]}
            />
          </View>
        </View>

        {/* Featured PSX Stocks List */}
        <View style={styles.sectionMargin}>
          <View style={styles.listHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              PSX Equities
            </Text>
            <Text style={[styles.subText, { color: theme.MUTED }]}>
              {filteredStocks.length} Companies
            </Text>
          </View>

          <View style={styles.stocksList}>
            {filteredStocks.map(s => (
              <TouchableOpacity
                key={s.ticker}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedStock(s);
                  setTradeModalVisible(true);
                }}
                style={[styles.stockCard, { backgroundColor: theme.CARD }]}
              >
                <View style={styles.stockTopRow}>
                  <View
                    style={[
                      styles.tickerSquare,
                      { backgroundColor: theme.MODAL },
                    ]}
                  >
                    <Text style={[styles.tickerText, { color: theme.TEXT }]}>
                      {s.ticker}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stockName, { color: theme.TEXT }]}>
                      {s.name}
                    </Text>
                    <Text style={[styles.volumeText, { color: theme.MUTED }]}>
                      Vol: {s.volume} · PSX:{s.ticker}
                    </Text>
                  </View>

                  <MiniSparkline data={s.sparkline} isUp={s.isUp} />
                </View>

                <View style={styles.stockBottomRow}>
                  <Text style={[styles.stockPrice, { color: theme.TEXT }]}>
                    PKR {s.price}
                  </Text>
                  <View
                    style={[
                      styles.changePill,
                      {
                        backgroundColor: s.isUp
                          ? `${theme.GREEN}18`
                          : `${theme.RED}18`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.changePillText,
                        { color: s.isUp ? theme.GREEN : theme.RED },
                      ]}
                    >
                      {s.change}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECP Sahulat Compliance Banner */}
        <View style={styles.sectionMargin}>
          <View
            style={[
              styles.complianceCard,
              { backgroundColor: `${theme.ACTIVE}18` },
            ]}
          >
            <Feather name="shield" size={16} color={theme.ACTIVE} />
            <Text style={[styles.complianceText, { color: theme.TEXT }]}>
              <Text style={{ fontWeight: '700', color: theme.ACTIVE }}>
                SECP SAHULAT ACCOUNT COMPLIANT:{' '}
              </Text>
              All trades settle via NCCPL (T+2). CDC sub-account custody is
              protected under SBP guidelines.
            </Text>
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
                  {selectedStock?.name}
                </Text>
                <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
                  PSX: {selectedStock?.ticker} · PKR {selectedStock?.price}
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
                ORDER EXECUTION TYPE
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
                      `BUY order placed for ${selectedStock?.ticker} at PKR ${selectedStock?.price}`,
                      'success',
                      'Order Placed',
                    );
                  }}
                >
                  <Text style={styles.orderTypeBtnText}>BUY ORDER</Text>
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
                      `SELL order placed for ${selectedStock?.ticker} at PKR ${selectedStock?.price}`,
                      'error',
                      'Order Executed',
                    );
                  }}
                >
                  <Text style={styles.orderTypeBtnText}>SELL ORDER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </AnimatedModal>
    </View>
  );
};

export default StockMarketScreen;

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
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSubhead: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.36)',
    letterSpacing: 1.2,
    marginRight: 6,
  },
  upBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,200,83,0.15)',
    borderRadius: 100,
    flexShrink: 0,
  },
  upBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -3,
    lineHeight: 54,
  },
  heroCurrency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  chartWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  heroStatsDividerRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 16,
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
  portCard: {
    borderRadius: 24,
    padding: 20,
  },
  portHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  portLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  portGainText: {
    fontSize: 11,
    fontWeight: '700',
  },
  portAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 2,
  },
  portSubText: {
    fontSize: 11,
    marginBottom: 16,
  },
  tradeBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  subText: {
    fontSize: 11,
  },
  stocksList: {
    gap: 10,
  },
  stockCard: {
    borderRadius: 24,
    padding: 18,
  },
  stockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tickerSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tickerText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stockName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  volumeText: {
    fontSize: 11,
  },
  stockBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  changePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  changePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  complianceCard: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  complianceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
