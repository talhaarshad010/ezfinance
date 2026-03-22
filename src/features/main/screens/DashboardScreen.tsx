import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import {Typography, Card, Logo} from '../../../components';
import {colors} from '../../../theme/colors';

const DashboardScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greeting}>
            <Typography variant="h1">Hello Talha 👋</Typography>
            <Typography variant="body" color={colors.text.muted}>
                Your financial summary is looking strong today.
            </Typography>
        </View>

        <Card style={styles.balanceCard}>
            <Typography variant="label" color="#AAA">TOTAL BALANCE</Typography>
            <Typography variant="h1" color="#FFF" style={styles.balanceText}>PKR 120,500</Typography>
            <View style={styles.linkedAccounts}>
                <View style={[styles.miniAvatar, {backgroundColor: '#0047AB'}]} />
                <View style={[styles.miniAvatar, {backgroundColor: '#555', marginLeft: -8}]} />
                <Typography variant="caption" color="#AAA" style={{marginLeft: 8}}>
                    Linked accounts active
                </Typography>
            </View>
        </Card>

        <View style={styles.quickActions}>
            <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => navigation.navigate('AddExpense')}
            >
                <View style={styles.iconCircle}>
                    <Feather name="plus" size={20} />
                </View>
                <Typography variant="body" weight="600" style={styles.actionText}>Add Expense</Typography>
                <Feather name="chevron-right" size={20} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => navigation.navigate('Portfolio')}
            >
                <View style={styles.iconCircle}>
                    <Feather name="pie-chart" size={20} />
                </View>
                <Typography variant="body" weight="600" style={styles.actionText}>View Portfolio</Typography>
                <Feather name="chevron-right" size={20} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionItem, styles.aiAdvisor]}
                onPress={() => Alert.alert('AI Advisor', 'Ask our AI any financial question for immediate consultation.')}
            >
                <View style={[styles.iconCircle, {backgroundColor: '#334155'}]}>
                    <Feather name="zap" size={20} color="#FFF" />
                </View>
                <Typography variant="body" weight="600" color="#FFF" style={styles.actionText}>Ask AI Advisor</Typography>
            </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
             <Card style={styles.summaryItem}>
                <Typography variant="caption" color={colors.text.muted}>Monthly Income</Typography>
                <Typography variant="h2">PKR 85,000</Typography>
                <Typography variant="caption" color="#2E7D32">↗ 12% increase</Typography>
             </Card>
             <Card style={{...styles.summaryItem, marginTop: 16}}>
                <Typography variant="caption" color={colors.text.muted}>Monthly Expenses</Typography>
                <Typography variant="h2">PKR 42,300</Typography>
                <Typography variant="caption" color="#D32F2F">↘ 5% decrease</Typography>
             </Card>
        </View>

        <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Typography variant="h2">Monthly Spending</Typography>
                <View style={styles.chartDots}>
                    <View style={[styles.chartDot, {backgroundColor: '#000'}]} />
                    <View style={styles.chartDot} />
                </View>
            </View>
            <View style={styles.barChartMock}>
                {[0.4, 0.6, 0.8, 0.5, 1, 0.7].map((h, i) => (
                    <View key={i} style={styles.barCol}>
                        <View style={[styles.bar, {height: h * 120, backgroundColor: i === 4 ? '#000' : (i===2 ? '#0047AB' : '#EEE')}]} />
                        <Typography variant="caption" style={{marginTop: 8}}>{['Jan','Feb','Mar','Apr','May','Jun'][i]}</Typography>
                    </View>
                ))}
            </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFE0B2',
      overflow: 'hidden',
  },
  avatarMock: {
      flex: 1,
      backgroundColor: '#E6A23C',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  greeting: {
    marginVertical: 24,
  },
  balanceCard: {
      backgroundColor: '#000',
      padding: 32,
      borderRadius: 32,
      marginBottom: 24,
  },
  balanceText: {
      marginVertical: 12,
      fontSize: 32,
  },
  linkedAccounts: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
  },
  miniAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#000',
  },
  quickActions: {
      marginBottom: 16,
  },
  actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      padding: 16,
      borderRadius: 24,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
  },
  aiAdvisor: {
      backgroundColor: '#000',
  },
  iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  actionText: {
      flex: 1,
  },
  summaryGrid: {
      marginBottom: 24,
  },
  summaryItem: {
      padding: 20,
  },
  chartCard: {
      padding: 24,
  },
  chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
  },
  chartDots: {
      flexDirection: 'row',
  },
  chartDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EEE',
      marginLeft: 4,
  },
  barChartMock: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 160,
  },
  barCol: {
      alignItems: 'center',
      width: '14%',
  },
  bar: {
      width: '100%',
      borderRadius: 10,
  }
});

export default DashboardScreen;
