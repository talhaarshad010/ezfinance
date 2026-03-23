import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Typography, Card } from '../../../components';
import { colors } from '../../../theme/colors';
import Feather from 'react-native-vector-icons/Feather';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

const StockDetailScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.logoContainer}>
          <Feather name="briefcase" size={30} color="#000" />
        </View>
        <View style={{ marginLeft: 16 }}>
          <Typography variant="h1" weight="700">
            NVIDIA Corp.
          </Typography>
          <Typography variant="caption" color="#666" weight="700">
            NVDA • NASDAQ
          </Typography>
        </View>
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <Typography variant="h1" weight="700" style={{ fontSize: 48 }}>
          $788.17
        </Typography>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
        >
          <Feather
            name="trending-up"
            size={16}
            color={colors.accent.successText}
          />
          <Typography
            variant="body"
            weight="700"
            color={colors.accent.successText}
            style={{ marginLeft: 4 }}
          >
            +$12.40 (1.60%)
          </Typography>
          <Typography variant="body" color="#AAA" style={{ marginLeft: 8 }}>
            TODAY
          </Typography>
        </View>
      </View>

      {/* Chart Card */}
      <Card style={styles.chartCard}>
        <View style={styles.timeTabs}>
          {['1D', '1W', '1M', '1Y', '5Y'].map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.timeTab, i === 2 && styles.activeTimeTab]}
            >
              <Typography
                variant="caption"
                weight="700"
                color={i === 2 ? '#FFF' : '#333'}
              >
                {tab}
              </Typography>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.expandBtn}>
            <Feather name="maximize-2" size={16} color="#AAA" />
          </TouchableOpacity>
        </View>

        <View style={styles.chartWrapper}>
          <Svg height="200" width={width - 50}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primary} stopOpacity="0.1" />
                <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 160 Q 40 140, 80 150 T 160 110 T 240 120 T 320 80 V 200 H 0 Z"
              fill="url(#grad)"
            />
            <Path
              d="M0 160 Q 40 140, 80 150 T 160 110 T 240 120 T 320 80"
              fill="none"
              stroke={colors.primary}
              strokeWidth="3"
            />
            <Circle cx="320" cy="80" r="4" fill={colors.primary} />
          </Svg>
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatBox label="OPEN" val="$775.20" />
        <StatBox label="HIGH" val="$792.05" />
        <StatBox label="LOW" val="$771.50" />
        <StatBox label="PREV. CLOSE" val="$775.77" />
      </View>

      {/* Detailed Data */}
      <View style={styles.detailsList}>
        <DataRow label="Volume" val="42.8M" />
        <DataRow label="Market Cap" val="1.94T" />
        <DataRow label="P/E Ratio" val="66.12" />
        <DataRow label="Dividend Yield" val="0.02%" />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.portfolioBtn}>
          <Feather name="plus-circle" size={20} color="#FFF" />
          <Typography
            variant="body"
            weight="700"
            color="#FFF"
            style={{ marginLeft: 12 }}
          >
            ADD TO PORTFOLIO
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity style={styles.alertBtn}>
          <Feather name="bell" size={20} color="#333" />
          <Typography
            variant="body"
            weight="700"
            color="#333"
            style={{ marginLeft: 12 }}
          >
            SET ALERT
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Analyst Rating */}
      <Card style={styles.ratingCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="zap" size={20} color={colors.primary} />
          <Typography variant="body" weight="700" style={{ marginLeft: 8 }}>
            Analyst Rating
          </Typography>
        </View>
        <View style={styles.ratingBar}>
          <View
            style={[
              styles.ratingFill,
              { flex: 0.85, backgroundColor: '#003366' },
            ]}
          />
          <View
            style={[styles.ratingFill, { flex: 0.1, backgroundColor: '#AAA' }]}
          />
          <View
            style={[
              styles.ratingFill,
              { flex: 0.05, backgroundColor: colors.accent.errorText },
            ]}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <Typography variant="caption" weight="700" color="#AAA">
            85% BUY
          </Typography>
          <Typography variant="caption" weight="700" color="#AAA">
            5% SELL
          </Typography>
        </View>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const StatBox = ({ label, val }: { label: string; val: string }) => (
  <View style={styles.statBox}>
    <Typography variant="caption" color="#AAA" weight="600">
      {label}
    </Typography>
    <Typography variant="h3" weight="700" style={{ marginTop: 4 }}>
      {val}
    </Typography>
  </View>
);

const DataRow = ({ label, val }: { label: string; val: string }) => (
  <View style={styles.dataRow}>
    <Typography variant="body" color="#666">
      {label}
    </Typography>
    <Typography variant="body" weight="700">
      {val}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8F9FB',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  priceSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 40,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 30,
  },
  timeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
  },
  timeTab: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTimeTab: {
    backgroundColor: '#000',
  },
  expandBtn: {
    width: 36,
    alignItems: 'center',
  },
  chartWrapper: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 32,
  },
  statBox: {
    width: (width - 48) / 2,
    backgroundColor: '#F0F0F0',
    padding: 20,
    borderRadius: 24,
    margin: 4,
  },
  detailsList: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  actions: {
    paddingHorizontal: 24,
    marginTop: 40,
  },
  portfolioBtn: {
    backgroundColor: '#000',
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBtn: {
    backgroundColor: '#EEE',
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingCard: {
    marginHorizontal: 24,
    marginTop: 40,
    padding: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
  },
  ratingBar: {
    height: 6,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 3,
    marginTop: 24,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
  },
});

export default StockDetailScreen;
