import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { isRouteEnabled } from '../../../constants/features';
import { DrawerMenuButton } from '../../../components';

type FilterType = 'all' | 'unread' | 'transactions' | 'markets' | 'ai';

interface NotificationItem {
  id: string;
  tag: string;
  tagColor: string;
  icon: string;
  time: string;
  title: string;
  description: string;
  unread: boolean;
  highlightText?: string;
  actionText: string;
  screenTarget?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    tag: 'EXPENSE ALERT',
    tagColor: '#FF9500',
    icon: 'credit-card',
    time: '2m ago',
    title: 'Subscription Renewal — Adobe CC',
    description:
      'Your monthly Creative Cloud subscription of $52.99 (~PKR 14,800) will be debited tomorrow from Meezan Bank.',
    unread: true,
    actionText: 'Manage Subscription',
    screenTarget: 'Expenses',
  },
  {
    id: '2',
    tag: 'MARKET ALERT',
    tagColor: '#00A3FF',
    icon: 'trending-up',
    time: '1h ago',
    title: 'KSE-100 & NVDA Target Surpassed',
    description:
      'KSE-100 Index surged past 78,400 points (+0.84%). NVDA reached your target price of $900.00.',
    unread: true,
    highlightText: '+4.2% Volatility spike detected',
    actionText: 'Open Trade Terminal',
    screenTarget: 'StockMarket',
  },
  {
    id: '3',
    tag: 'PORTFOLIO INSIGHT',
    tagColor: '#00C853',
    icon: 'cpu',
    time: '4h ago',
    title: 'AI Advisor Diversification Strategy',
    description:
      'AI CA suggests rebalancing. Your Tech sector exposure is currently 62%. Consider reallocating 10% into PSX defensive equities.',
    unread: false,
    actionText: 'Review Strategy',
    screenTarget: 'AIAdvisor',
  },
  {
    id: '4',
    tag: 'SYSTEM WARNING',
    tagColor: '#FF3B30',
    icon: 'bell',
    time: '1d ago',
    title: 'Groceries Budget Envelope 92% Utilized',
    description:
      'You have spent PKR 15,560 of your PKR 17,000 grocery allocation for May 2026. Only PKR 1,440 remaining.',
    unread: false,
    actionText: 'Adjust Envelope Cap',
    screenTarget: 'BudgetPlanner',
  },
];

export const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    // Leave out alerts that open a switched-off feature (see constants/features).
    INITIAL_NOTIFICATIONS.filter(n => !n.screenTarget || isRouteEnabled(n.screenTarget)),
  );

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast('All notifications marked as read', 'success', 'Cleared');
  };

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'transactions') return n.tag.includes('EXPENSE');
    if (filter === 'markets') return n.tag.includes('MARKET');
    if (filter === 'ai') return n.tag.includes('INSIGHT');
    return true;
  });

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DrawerMenuButton />
            <View>
              <Text style={[styles.backText, { color: theme.MUTED, marginBottom: 2 }]}>
                Live Feed & Activity
              </Text>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Notifications
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleMarkAllRead}
            style={[styles.readAllBtn, { backgroundColor: theme.CARD }]}
          >
            <Feather name="check-circle" size={14} color={theme.ACTIVE} />
            <Text style={[styles.readAllText, { color: theme.TEXT }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills Row */}
        <View style={styles.sectionMargin}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {[
              { id: 'all', label: `All (${notifications.length})` },
              {
                id: 'unread',
                label: `Unread (${notifications.filter(n => n.unread).length})`,
              },
              { id: 'transactions', label: 'Transactions' },
              { id: 'markets', label: 'Markets' },
              { id: 'ai', label: 'AI Insights' },
            ].map(p => {
              const isActive = filter === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  onPress={() => setFilter(p.id as FilterType)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isActive
                        ? theme.TEXT
                        : theme.CARD,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: isActive ? theme.BG : theme.MUTED,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <View style={styles.sectionMargin}>
          {filteredList.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.CARD }]}>
              <Feather name="bell-off" size={24} color={theme.MUTED} />
              <Text style={[styles.emptyTitle, { color: theme.TEXT }]}>
                No Notifications Found
              </Text>
              <Text style={[styles.emptySub, { color: theme.MUTED }]}>
                You are all caught up! Check back later for financial alerts.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filteredList.map(item => (
                <View
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: theme.CARD,
                      borderColor: item.unread ? theme.ACTIVE : 'transparent',
                      borderWidth: item.unread ? 1.5 : 0,
                    },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.iconSquare,
                        { backgroundColor: theme.MODAL },
                      ]}
                    >
                      <Feather
                        name={item.icon}
                        size={16}
                        color={item.tagColor}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.tagTimeRow}>
                        <Text
                          style={[
                            styles.tagText,
                            { color: item.tagColor },
                          ]}
                        >
                          {item.tag}
                        </Text>
                        <Text style={[styles.timeText, { color: theme.MUTED }]}>
                          {item.time}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: theme.TEXT }]}>
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.cardDescription, { color: theme.MUTED }]}
                  >
                    {item.description}
                  </Text>

                  {item.highlightText && (
                    <View
                      style={[
                        styles.highlightBox,
                        { backgroundColor: `${theme.ACTIVE}14` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.highlightText,
                          { color: theme.ACTIVE },
                        ]}
                      >
                        {item.highlightText}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (item.screenTarget) {
                        navigation.navigate(item.screenTarget);
                      } else {
                        showToast(
                          `Action dispatched for ${item.title}`,
                          'info',
                          'Notification',
                        );
                      }
                    }}
                    style={[
                      styles.actionPillBtn,
                      { backgroundColor: theme.MODAL },
                    ]}
                  >
                    <Text style={[styles.actionPillText, { color: theme.TEXT }]}>
                      {item.actionText} →
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

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
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  readAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionMargin: {
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listWrap: {
    gap: 12,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  notificationCard: {
    borderRadius: 24,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tagTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeText: {
    fontSize: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  highlightBox: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillBtn: {
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
