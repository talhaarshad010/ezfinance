import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Svg, Path, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';
import {Typography, Card, CalendarPicker} from '../../../components';
import { useAppSelector } from '../../../store/hooks';
import { Transaction } from '../../../store/slices/bankAccountsSlice';

const AnalyticsScreen = () => {
  const transactionRecord = useAppSelector(state => state.bankAccounts.transactions);
  const { categories, totalMonthlyBudget } = useAppSelector(state => state.budget);

  // Flatten transactions from all accounts
  const transactions = Object.values(transactionRecord).flat();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Previous Month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthTransactions = transactions.filter((tx: Transaction) => 
    tx.type === 'expense' &&
    new Date(tx.date).getMonth() === currentMonth &&
    new Date(tx.date).getFullYear() === currentYear
  );

  const prevMonthTransactions = transactions.filter((tx: Transaction) => 
    tx.type === 'expense' &&
    new Date(tx.date).getMonth() === prevMonth &&
    new Date(tx.date).getFullYear() === prevMonthYear
  );

  const totalSpentThisMonth = currentMonthTransactions.reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);
  const totalSpentLastMonth = prevMonthTransactions.reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);

  // Percentage change
  let percentChange = 0;
  if (totalSpentLastMonth > 0) {
    percentChange = ((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100;
  }

  // Category Breakdown
  const categoriesWithSpent = categories.map(cat => {
    const spent = currentMonthTransactions
      .filter((tx: Transaction) => tx.category === cat.name)
      .reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);
    return { ...cat, spent };
  });

  const topCategories = [...categoriesWithSpent]
    .sort((a, b) => b.spent - a.spent)
    .filter(c => c.spent > 0)
    .slice(0, 3);

  const totalOtherSpent = categoriesWithSpent
    .filter(cat => !topCategories.find(tc => tc.id === cat.id))
    .reduce((acc, curr) => acc + curr.spent, 0);

  // Filters State
  const [activeFilter, setActiveFilter] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  // Spending Trend Calculation
  const chartData: number[] = [];
  const chartLabels: string[] = [];
  
  if (activeFilter === 'custom' && customDate) {
    // 7 Days starting from selected date (Local-day correct)
    for (let i = 0; i < 7; i++) {
        const d = new Date(customDate);
        d.setDate(customDate.getDate() + i);
        const dayLabel = `${d.toLocaleString('en-PK', { month: 'short' }).toUpperCase()} ${d.getDate()}`;
        
        const daySpent = transactions
            .filter((tx: Transaction) => {
                if (tx.type !== 'expense') return false;
                const txD = new Date(tx.date);
                return (
                    txD.getFullYear() === d.getFullYear() &&
                    txD.getMonth() === d.getMonth() &&
                    txD.getDate() === d.getDate()
                );
            })
            .reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);
        
        chartData.push(daySpent);
        chartLabels.push(dayLabel);
    }
  } else if (activeFilter === 'weekly') {
    // Last 7 Days (Local-day correct)
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayLabel = d.toLocaleString('en-PK', { weekday: 'short' }).toUpperCase();
        
        const daySpent = transactions
            .filter((tx: Transaction) => {
                if (tx.type !== 'expense') return false;
                const txD = new Date(tx.date);
                return (
                    txD.getFullYear() === d.getFullYear() &&
                    txD.getMonth() === d.getMonth() &&
                    txD.getDate() === d.getDate()
                );
            })
            .reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);
        
        chartData.push(daySpent);
        chartLabels.push(dayLabel);
    }
  } else if (activeFilter === 'monthly') {
    // Divide current month into 4 weeks
    for (let i = 0; i < 4; i++) {
        const weekLabel = `W${i + 1}`;
        const startDay = i * 7 + 1;
        const endDay = i === 3 ? 31 : (i + 1) * 7;
        
        const weekSpent = transactions
            .filter((tx: Transaction) => {
                if (tx.type !== 'expense') return false;
                const txD = new Date(tx.date);
                return (
                    txD.getMonth() === currentMonth &&
                    txD.getFullYear() === currentYear &&
                    txD.getDate() >= startDay &&
                    txD.getDate() <= endDay
                );
            })
            .reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);
        
        chartData.push(weekSpent);
        chartLabels.push(weekLabel);
    }
  } else {
    // Last 6 Months (as Yearly proxy for better mobile density)
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const month = d.getMonth();
        const year = d.getFullYear();
        const monthLabel = d.toLocaleString('en-PK', { month: 'short' }).toUpperCase();
        
        const monthSpent = transactions
            .filter((tx: Transaction) => 
                tx.type === 'expense' && 
                new Date(tx.date).getMonth() === month && 
                new Date(tx.date).getFullYear() === year
            )
            .reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);
        
        chartData.push(monthSpent);
        chartLabels.push(monthLabel);
    }
  }

  const maxVal = Math.max(...chartData, 1000); 
  const chartHeight = 150;
  const chartWidth = 320; 
  const padding = 20;
  const barWidth = 24;

  const barPoints = chartData.map((val, i) => {
    const x = padding + (i * (chartWidth - 2 * padding) / (chartData.length - 1)) - barWidth / 2;
    const h = (val / maxVal) * (chartHeight - 2 * padding);
    const y = chartHeight - padding - h;
    return { x, y, h, val };
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="caption" weight="700" color="#666">Monthly Outflow</Typography>
        <Typography variant="h1" weight="700" style={{fontSize: 40, marginTop: 4}}>PKR {totalSpentThisMonth.toLocaleString()}</Typography>
        <View style={[styles.badge, { backgroundColor: percentChange >= 0 ? '#FDECEA' : '#E8F5E9' }]}>
           <Feather name={percentChange >= 0 ? "arrow-up" : "arrow-down"} size={12} color={percentChange >= 0 ? "#D32F2F" : "#2E7D32"} />
           <Typography variant="caption" weight="700" color={percentChange >= 0 ? "#D32F2F" : "#2E7D32"} style={{marginLeft: 4}}>
             {Math.abs(percentChange).toFixed(1)}% vs last month
           </Typography>
        </View>
      </View>

      <Card style={styles.card}>
         <View style={styles.rowBetween}>
            <Typography variant="h3" weight="700">Spending Trend</Typography>
            <View style={{flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 2}}>
               {(['weekly', 'monthly', 'yearly'] as const).map((filter) => (
                   <TouchableOpacity 
                     key={filter} 
                     onPress={() => setActiveFilter(filter)}
                     style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
                   >
                       <Typography variant="caption" weight="700" color={activeFilter === filter ? '#FFF' : '#666'} style={{fontSize: 9}}>
                           {filter.toUpperCase()}
                       </Typography>
                   </TouchableOpacity>
               ))}
               <TouchableOpacity 
                 onPress={() => setShowCalendar(true)}
                 style={[styles.filterTab, activeFilter === 'custom' && styles.filterTabActive]}
               >
                   <Feather name="calendar" size={12} color={activeFilter === 'custom' ? '#FFF' : '#666'} />
               </TouchableOpacity>
            </View>
         </View>
         <View style={styles.chartAreaWrapper}>
            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#0047AB" stopOpacity="1" />
                        <Stop offset="1" stopColor="#0047AB" stopOpacity="0.6" />
                    </LinearGradient>
                </Defs>
                {barPoints.map((p, i) => (
                    <React.Fragment key={i}>
                        <Rect
                            x={p.x}
                            y={p.y}
                            width={barWidth}
                            height={p.h}
                            fill="url(#barGrad)"
                            rx={6}
                            ry={6}
                        />
                        {/* Shadow/Overlay for a bit more depth */}
                        <Rect
                            x={p.x}
                            y={p.y + p.h - 4}
                            width={barWidth}
                            height={4}
                            fill="#002D6B"
                            rx={2}
                            opacity={0.3}
                        />
                    </React.Fragment>
                ))}
            </Svg>
         </View>
         <View style={styles.chartLabels}>
             {chartLabels.map((m, i) => (
                 <Typography key={i} variant="caption" color="#AAA" style={{fontSize: 9}}>{m}</Typography>
             ))}
         </View>
      </Card>

      <Card style={{...styles.card, paddingBottom: 32}}>
         <Typography variant="h3" weight="700">Breakdown</Typography>
         
         <View style={styles.pieChartMock}>
            <View style={[styles.ringOuter, { borderTopColor: topCategories[0]?.color || '#EAEBEE', borderRightColor: topCategories[1]?.color || '#EAEBEE', borderBottomColor: topCategories[2]?.color || '#EAEBEE', borderLeftColor: totalOtherSpent > 0 ? '#AAA' : '#EAEBEE' }]}>
               <View style={styles.ringInner}>
                   <Typography variant="caption" weight="700" color="#666" style={{fontSize: 9}}>Top Category</Typography>
                   <Typography variant="body" weight="700">{topCategories[0]?.name || 'N/A'}</Typography>
               </View>
            </View>
         </View>

         <View style={{marginTop: 32}}>
             {topCategories.map(cat => (
                 <BreakdownRow 
                   key={cat.id} 
                   color={cat.color} 
                   label={cat.name} 
                   percent={`${totalSpentThisMonth > 0 ? Math.round((cat.spent / totalSpentThisMonth) * 100) : 0}%`} 
                 />
             ))}
             {totalOtherSpent > 0 && (
                 <BreakdownRow 
                   color="#AAA" 
                   label="Other" 
                   percent={`${totalSpentThisMonth > 0 ? Math.round((totalOtherSpent / totalSpentThisMonth) * 100) : 0}%`} 
                 />
             )}
         </View>
      </Card>
      
      <View style={[styles.rowBetween, {marginTop: 8, marginBottom: 16}]}>
          <Typography variant="h2" weight="700">Budget Status</Typography>
      </View>

      {categoriesWithSpent.map(cat => {
        const usagePercent = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
        const color = usagePercent > 90 ? '#D32F2F' : '#000';
        
        return (
          <Card key={cat.id} style={styles.budgetCard}>
             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <View style={styles.smallIconBox}><Feather name={cat.icon} size={16} color={cat.color} /></View>
                 <View style={{flex: 1, marginLeft: 16}}>
                     <View style={styles.rowBetween}>
                         <View>
                            <Typography variant="body" weight="700" style={{fontSize: 12}}>{cat.name}</Typography>
                            <Typography variant="caption" color="#AAA" style={{fontSize: 10}}>Monthly Allowance</Typography>
                         </View>
                         <Typography variant="caption" weight="700" color={color} style={{fontSize: 10}}>
                            PKR {cat.spent.toLocaleString()} / {cat.limit.toLocaleString()}
                         </Typography>
                     </View>
                 </View>
             </View>
             <View style={styles.progressBar}>
                 <View style={[styles.progressFill, {width: `${Math.min(usagePercent, 100)}%`, backgroundColor: cat.color}]} />
             </View>
          </Card>
        );
      })}

      {/* AI Smart Savings */}
      <Card style={styles.aiCard}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <Feather name="cpu" size={16} color="#FFF" />
             <Typography variant="caption" weight="700" color="#FFF" style={{letterSpacing: 1, marginLeft: 8, fontSize: 10}}>AI ADVISOR</Typography>
         </View>
         <Typography variant="h2" weight="700" color="#FFF" style={{marginTop: 16}}>Smart Savings{'\n'}Opportunity</Typography>
         <Typography variant="caption" color="#AAA" style={{marginTop: 12, lineHeight: 20}}>
             We noticed your subscriptions increased by 15%. You could save up to $120/mo by consolidating your cloud storage plans.
         </Typography>
         <TouchableOpacity style={styles.optimizeBtn}>
             <Typography variant="caption" weight="700" color="#000">Optimize Now</Typography>
         </TouchableOpacity>
      </Card>

       <View style={{height: 100}} />
       <CalendarPicker 
         visible={showCalendar}
         onClose={() => setShowCalendar(false)}
         onSelectDate={(date) => {
           setCustomDate(date);
           setActiveFilter('custom');
         }}
       />
    </ScrollView>
  );
};

const BreakdownRow = ({color, label, percent}: any) => (
   <View style={[styles.rowBetween, {marginBottom: 12}]}>
       <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 12}} />
           <Typography variant="caption" color="#333">{label}</Typography>
       </View>
       <Typography variant="caption" weight="700">{percent}</Typography>
   </View>
);

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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  card: {
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
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabInactive: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chartAreaWrapper: {
    height: 150,
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: '#000',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  pieChartMock: {
    alignItems: 'center',
    marginTop: 32,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 16,
    borderColor: '#EAEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  smallIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiCard: {
    backgroundColor: '#05131f',
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
  },
  optimizeBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 24,
  }
});

export default AnalyticsScreen;
