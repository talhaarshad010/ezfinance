import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Card, Button } from '../../../components';

const AssetDetailScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Typography variant="body" weight="700">
              AAPL
            </Typography>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Typography variant="h2" weight="700">
              Apple Inc.
            </Typography>
            <Typography variant="caption" color="#666">
              Technology • NASDAQ
            </Typography>
          </View>
        </View>

        <Typography
          variant="h1"
          weight="700"
          style={{ fontSize: 40, marginTop: 24, marginBottom: 8 }}
        >
          $182.45
        </Typography>
        <Typography variant="caption" weight="700" color="#0047AB">
          +2.4% Today
        </Typography>

        <Card style={styles.chartCard}>
          <View style={styles.chartMockArea}>
            <View style={styles.bezierLine} />
          </View>
          <View style={styles.timeFilter}>
            {['1D', '1W', '1M', '1Y', 'ALL'].map((t, i) => (
              <View
                key={t}
                style={[styles.filterBtn, i === 2 && styles.activeFilter]}
              >
                <Typography
                  variant="caption"
                  weight="700"
                  color={i === 2 ? '#333' : '#AAA'}
                >
                  {t}
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Typography
              variant="caption"
              color="#666"
              style={{ letterSpacing: 1 }}
            >
              MARKET CAP
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 8 }}>
              2.84T
            </Typography>
          </View>
          <View style={styles.statBox}>
            <Typography
              variant="caption"
              color="#666"
              style={{ letterSpacing: 1 }}
            >
              VOL (AVG)
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 8 }}>
              54.2M
            </Typography>
          </View>
          <View style={styles.statBox}>
            <Typography
              variant="caption"
              color="#666"
              style={{ letterSpacing: 1 }}
            >
              P/E RATIO
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 8 }}>
              29.4
            </Typography>
          </View>
          <View style={styles.statBox}>
            <Typography
              variant="caption"
              color="#666"
              style={{ letterSpacing: 1 }}
            >
              DIV YIELD
            </Typography>
            <Typography variant="body" weight="700" style={{ marginTop: 8 }}>
              0.52%
            </Typography>
          </View>
        </View>

        <Typography
          variant="h3"
          weight="700"
          style={{ marginTop: 32, marginBottom: 16 }}
        >
          Your Position
        </Typography>
        <Card style={styles.positionCard}>
          <View style={styles.rowBetween}>
            <Typography variant="caption" color="#666">
              Shares Owned
            </Typography>
            <Typography variant="body" weight="700">
              140.5
            </Typography>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Typography variant="caption" color="#666">
              Average Cost
            </Typography>
            <Typography variant="body" weight="700">
              $150.20
            </Typography>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Typography variant="caption" color="#666">
              Total Return
            </Typography>
            <Typography variant="body" weight="700" color="#0047AB">
              +$4,531.12
            </Typography>
          </View>
        </Card>

        <Button
          title="Trade AAPL"
          style={{ marginTop: 32 }}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { padding: 24, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    marginTop: 24,
  },
  chartMockArea: { height: 160, justifyContent: 'flex-end', marginBottom: 24 },
  bezierLine: {
    width: '100%',
    height: 100,
    borderTopWidth: 2,
    borderColor: '#0047AB',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  timeFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 4,
    borderRadius: 12,
  },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  activeFilter: { backgroundColor: '#FFF', elevation: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  positionCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 24 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
});

export default AssetDetailScreen;
