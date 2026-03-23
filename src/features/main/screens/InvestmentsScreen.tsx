import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Typography, Card } from '../../../components';
import { useToast } from '../../../context/ToastContext';

const InvestmentsScreen = () => {
  const [isBuyMode, setIsBuyMode] = useState(true);
  const { showToast } = useToast();

  const lineAnimHeight = useSharedValue(0);

  useEffect(() => {
    lineAnimHeight.value = withTiming(80, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => ({
    height: lineAnimHeight.value,
  }));
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#666">
          Total Portfolio Value
        </Typography>
        <Typography
          variant="h1"
          weight="700"
          style={{ fontSize: 40, marginTop: 4 }}
        >
          PKR 245,000
        </Typography>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
        >
          <View style={styles.badge}>
            <Feather name="arrow-up-right" size={12} color="#0047AB" />
            <Typography
              variant="caption"
              weight="700"
              color="#0047AB"
              style={{ marginLeft: 4 }}
            >
              +12.4%
            </Typography>
          </View>
          <Typography variant="caption" color="#666" style={{ marginLeft: 12 }}>
            vs last month
          </Typography>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isBuyMode
              ? { backgroundColor: '#000' }
              : {
                  backgroundColor: '#FFF',
                  borderWidth: 1,
                  borderColor: '#EAEBEE',
                },
          ]}
          onPress={() => setIsBuyMode(true)}
        >
          <Feather
            name="arrow-down-left"
            size={16}
            color={isBuyMode ? '#FFF' : '#000'}
            style={{ marginRight: 8 }}
          />
          <Typography
            variant="caption"
            weight="700"
            color={isBuyMode ? '#FFF' : '#000'}
          >
            Buy
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            !isBuyMode
              ? { backgroundColor: '#000' }
              : {
                  backgroundColor: '#FFF',
                  borderWidth: 1,
                  borderColor: '#EAEBEE',
                },
          ]}
          onPress={() => setIsBuyMode(false)}
        >
          <Feather
            name="arrow-up-right"
            size={16}
            color={!isBuyMode ? '#FFF' : '#000'}
            style={{ marginRight: 8 }}
          />
          <Typography
            variant="caption"
            weight="700"
            color={!isBuyMode ? '#FFF' : '#000'}
          >
            Sell
          </Typography>
        </TouchableOpacity>
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.rowBetween}>
          <Typography variant="h3" weight="700">
            Performance
          </Typography>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 16,
              padding: 4,
            }}
          >
            <View style={styles.tabInactive}>
              <Typography
                variant="caption"
                weight="700"
                color="#666"
                style={{ fontSize: 9 }}
              >
                1W
              </Typography>
            </View>
            <View style={styles.tabActive}>
              <Typography
                variant="caption"
                weight="700"
                color="#000"
                style={{ fontSize: 9 }}
              >
                1M
              </Typography>
            </View>
            <View style={styles.tabInactive}>
              <Typography
                variant="caption"
                weight="700"
                color="#666"
                style={{ fontSize: 9 }}
              >
                1Y
              </Typography>
            </View>
            <View style={styles.tabInactive}>
              <Typography
                variant="caption"
                weight="700"
                color="#666"
                style={{ fontSize: 9 }}
              >
                ALL
              </Typography>
            </View>
          </View>
        </View>

        <View style={styles.chartMockArea}>
          <Animated.View
            style={[
              styles.bezierLine,
              animatedLineStyle,
              isBuyMode
                ? { borderColor: '#0047AB' }
                : { borderColor: '#D32F2F' },
            ]}
          />
        </View>

        <View
          style={[
            styles.rowBetween,
            {
              marginTop: 24,
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
              paddingTop: 16,
            },
          ]}
        >
          <View>
            <Typography
              variant="caption"
              weight="700"
              color="#666"
              style={{ fontSize: 9 }}
            >
              INVESTED
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 4 }}>
              {isBuyMode ? '190K' : '45K'}
            </Typography>
          </View>
          <View>
            <Typography
              variant="caption"
              weight="700"
              color="#666"
              style={{ fontSize: 9 }}
            >
              RETURNS
            </Typography>
            <Typography
              variant="body"
              weight="700"
              color={isBuyMode ? '#0047AB' : '#D32F2F'}
              style={{ marginTop: 4 }}
            >
              {isBuyMode ? '+55K' : '-2K'}
            </Typography>
          </View>
          <View>
            <Typography
              variant="caption"
              weight="700"
              color="#666"
              style={{ fontSize: 9 }}
            >
              DIVIDENDS
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 4 }}>
              1.2K
            </Typography>
          </View>
          <View>
            <Typography
              variant="caption"
              weight="700"
              color="#666"
              style={{ fontSize: 9 }}
            >
              YIELD
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 4 }}>
              8.4%
            </Typography>
          </View>
        </View>
      </Card>

      {/* Stocks */}
      <Card style={styles.categoryCard}>
        <View style={[styles.rowBetween, { marginBottom: 24 }]}>
          <View>
            <Typography variant="h3" weight="700">
              Stocks
            </Typography>
            <Typography variant="caption" color="#666" style={{ marginTop: 4 }}>
              4 Holdings • Equity Market
            </Typography>
          </View>
          <Feather name="trending-up" size={24} color="#000" />
        </View>

        <AssetRow
          icon="AAPL"
          name="Apple Inc."
          shares="2.4 Shares"
          price="PKR 98,400"
          change="+2.4%"
          color="#0047AB"
        />
        <AssetRow
          icon="TSLA"
          name="Tesla Motor"
          shares="0.8 Shares"
          price="PKR 45,200"
          change="-1.2%"
          color="#D32F2F"
        />

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() =>
            showToast('Opening full stock inventory.', 'info', 'Inventory')
          }
        >
          <Typography variant="caption" weight="700">
            View All Stocks
          </Typography>
        </TouchableOpacity>
      </Card>

      {/* Crypto */}
      <Card style={{ ...styles.categoryCard, backgroundColor: '#05131f' }}>
        <Typography variant="h3" weight="700" color="#FFF">
          Crypto
        </Typography>
        <Typography variant="caption" color="#AAA" style={{ marginTop: 4 }}>
          Active Volatility
        </Typography>

        <Typography
          variant="caption"
          weight="700"
          color="#888"
          style={{ marginTop: 32, fontSize: 10, letterSpacing: 1 }}
        >
          BTC BALANCE
        </Typography>
        <Typography
          variant="h1"
          weight="700"
          color="#FFF"
          style={{ fontSize: 32, marginTop: 4 }}
        >
          0.024 BTC
        </Typography>
        <Typography variant="caption" color="#AAA" style={{ marginTop: 4 }}>
          ≈ PKR 32,450
        </Typography>

        <View style={{ flexDirection: 'row', marginTop: 24 }}>
          <View style={styles.cryptoBadge}>
            <Typography
              variant="caption"
              weight="700"
              color="#FFF"
              style={{ fontSize: 10 }}
            >
              BTC
            </Typography>
          </View>
          <View style={styles.cryptoBadge}>
            <Typography
              variant="caption"
              weight="700"
              color="#FFF"
              style={{ fontSize: 10 }}
            >
              ETH
            </Typography>
          </View>
          <View style={styles.cryptoBadge}>
            <Typography
              variant="caption"
              weight="700"
              color="#FFF"
              style={{ fontSize: 10 }}
            >
              SOL
            </Typography>
          </View>
        </View>
      </Card>

      {/* Mutual Funds */}
      <Card style={styles.categoryCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.largeIconBox}>
            <Feather name="briefcase" size={24} color="#000" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Typography variant="h3" weight="700">
              Mutual Funds
            </Typography>
            <Typography
              variant="caption"
              color="#666"
              style={{ marginTop: 4, lineHeight: 18 }}
            >
              Consistent growth with managed risk profiles.
            </Typography>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginTop: 32,
          }}
        >
          <Typography variant="h2" weight="700" style={{ fontSize: 28 }}>
            PKR 69,150
          </Typography>
          <Typography
            variant="caption"
            weight="700"
            color="#0047AB"
            style={{ marginBottom: 6, marginLeft: 8 }}
          >
            +5.2%
          </Typography>
        </View>

        <TouchableOpacity
          style={[
            styles.outlineBtn,
            {
              backgroundColor: '#FFF',
              borderWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              elevation: 2,
              marginTop: 24,
            },
          ]}
          onPress={() =>
            showToast(
              'Exploring diverse mutual fund portfolios.',
              'info',
              'Mutual Funds',
            )
          }
        >
          <Typography variant="caption" weight="700">
            Explore Funds
          </Typography>
        </TouchableOpacity>
      </Card>

      <View style={{ height: 100 }} />
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    marginHorizontal: 4,
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
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  tabInactive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chartMockArea: {
    height: 120,
    marginTop: 24,
    justifyContent: 'flex-end',
  },
  bezierLine: {
    width: '100%',
    height: 80,
    borderTopWidth: 2,
    borderColor: '#0047AB',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtn: {
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEBEE',
    alignItems: 'center',
    marginTop: 8,
  },
  cryptoBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  largeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const AssetRow = ({ icon, name, shares, price, change, color }: any) => {
  const { showToast } = useToast();
  return (
    <TouchableOpacity
      style={[styles.rowBetween, { marginBottom: 20 }]}
      onPress={() =>
        showToast(`Opening details for ${name}.`, 'info', 'Asset Details')
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.iconCircle}>
          <Typography variant="caption" weight="700" style={{ fontSize: 10 }}>
            {icon}
          </Typography>
        </View>
        <View style={{ marginLeft: 16 }}>
          <Typography variant="body" weight="700">
            {name}
          </Typography>
          <Typography variant="caption" color="#666" style={{ marginTop: 4 }}>
            {shares}
          </Typography>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Typography variant="body" weight="700" style={{ fontSize: 14 }}>
          {price}
        </Typography>
        <Typography
          variant="caption"
          weight="700"
          color={color}
          style={{ marginTop: 4 }}
        >
          {change}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

export default InvestmentsScreen;
