import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';
import {colors} from '../../../theme/colors';

const NotificationsScreen = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      
      {/* Header Info is passed by Navigator, just subtitle here */}
      <View style={styles.intro}>
        <Typography variant="h1" weight="700" style={{fontSize: 28}}>Notifications</Typography>
        <Typography variant="body" color="#666" style={{marginTop: 8}}>
          Stay updated with your financial ecosystem.
        </Typography>
      </View>

      {/* Alert 1 */}
      <Card style={styles.alertCard}>
        <View style={styles.iconBox}><Feather name="credit-card" size={16} color="#000" /></View>
        <View style={styles.rowBetween}>
           <Typography variant="caption" weight="700" color="#AAA" style={styles.tag}>EXPENSE ALERT</Typography>
           <Typography variant="caption" color="#AAA">2m ago</Typography>
        </View>
        <Typography variant="body" weight="700" style={styles.title}>Subscription Renewal</Typography>
        <Typography variant="body" color="#666" style={styles.desc}>
          Your monthly Creative Cloud subscription of <Typography variant="body" weight="700">$52.99</Typography> will be debited tomorrow. Ensure your balance covers this transaction.
        </Typography>
        <TouchableOpacity style={styles.actionBtn}>
           <Typography variant="caption" weight="700">Manage</Typography>
        </TouchableOpacity>
      </Card>

      {/* Alert 2 */}
      <Card style={styles.alertCard}>
        <View style={[styles.iconBox, {backgroundColor: '#E8F0FE'}]}><Feather name="trending-up" size={16} color="#0047AB" /></View>
        <View style={styles.rowBetween}>
           <Typography variant="caption" weight="700" color="#0047AB" style={styles.tag}>MARKET ALERT</Typography>
           <Typography variant="caption" color="#AAA">1h ago</Typography>
        </View>
        <Typography variant="body" weight="700" style={styles.title}>NVIDIA Corp (NVDA){'\n'}Target Hit</Typography>
        <Typography variant="body" color="#666" style={styles.desc}>
          NVDA has surpassed your price target of <Typography variant="body" weight="700">$900.00</Typography>. Current market sentiment remains strongly bullish.
        </Typography>
        <View style={styles.infoBox}>
           <Typography variant="caption" color="#0047AB">+4.2% Volatility spike detected</Typography>
        </View>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#000', borderColor: '#000'}]}>
           <Typography variant="caption" weight="700" color="#FFF">Trade</Typography>
        </TouchableOpacity>
      </Card>

      {/* Alert 3 */}
      <Card style={styles.alertCard}>
        <View style={[styles.iconBox, {backgroundColor: '#000'}]}><Feather name="cpu" size={16} color="#FFF" /></View>
        <View style={styles.rowBetween}>
           <Typography variant="caption" weight="700" color="#666" style={styles.tag}>PORTFOLIO INSIGHTS</Typography>
           <Typography variant="caption" color="#AAA">4h ago</Typography>
        </View>
        <Typography variant="body" weight="700" style={styles.title}>Diversification Strategy</Typography>
        <Typography variant="body" color="#666" style={styles.desc}>
          AI Advisor suggests rebalancing. Your Tech sector exposure is currently 62%. Consider diversifying into Defensive sectors to mitigate risk.
        </Typography>
        <TouchableOpacity style={styles.actionBtn}>
           <Typography variant="caption" weight="700">Review</Typography>
        </TouchableOpacity>
      </Card>

      {/* Alert 4 */}
      <Card style={styles.alertCard}>
        <View style={[styles.iconBox, {backgroundColor: '#FFEBEE'}]}><Feather name="bell" size={16} color={colors.accent.errorText} /></View>
        <View style={styles.rowBetween}>
           <Typography variant="caption" weight="700" color={colors.accent.errorText} style={styles.tag}>CRITICAL ALERT</Typography>
           <Typography variant="caption" color="#AAA">Yesterday</Typography>
        </View>
        <Typography variant="body" weight="700" style={styles.title}>Unusual Login Attempt</Typography>
        <Typography variant="body" color="#666" style={styles.desc}>
          A login attempt was blocked from an unrecognized device in Paris, France. Security measures were successfully applied.
        </Typography>
        <TouchableOpacity style={[styles.actionBtn, {borderColor: '#FFCDD2'}]}>
           <Typography variant="caption" weight="700" color={colors.accent.errorText}>View Security</Typography>
        </TouchableOpacity>
      </Card>

      <TouchableOpacity style={styles.viewHistory}>
        <Typography variant="body" weight="700" color="#999" style={{letterSpacing: 2}}>VIEW ALL HISTORY</Typography>
        <Feather name="arrow-right" size={16} color="#999" style={{marginLeft: 8}} />
      </TouchableOpacity>

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
  intro: {
    marginBottom: 32,
  },
  alertCard: {
    padding: 24,
    backgroundColor: '#FFF',
    marginBottom: 16,
    borderRadius: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    marginTop: 12,
  },
  desc: {
    marginTop: 12,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#F0F4FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  viewHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 32,
  }
});

export default NotificationsScreen;
