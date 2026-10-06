import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  deleteCategory,
  setTotalMonthlyBudget,
  BudgetCategory as IBudgetCategory,
} from '../../../store/slices/budgetSlice';
import { AnimatedModal } from '../../../components/AnimatedModal';

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

function Track({ pct }: { pct: number }) {
  const { theme } = useTheme();
  const fill =
    pct >= 100
      ? theme.RED
      : pct >= 80
      ? '#FF9500'
      : theme.GREEN;

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
            backgroundColor: fill,
            width: interpolatedWidth,
          },
        ]}
      />
    </View>
  );
}

export const BudgetPlannerScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const categories = useAppSelector(state => state.budget.categories);
  const totalMonthlyBudget = useAppSelector(
    state => state.budget.totalMonthlyBudget,
  );
  const accounts = useAppSelector(state => state.bankAccounts.accounts);
  const allTransactions = Object.values(
    useAppSelector(state => state.bankAccounts.transactions),
  ).flat();

  const [selectedCategory, setSelectedCategory] =
    useState<IBudgetCategory | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editBudgetVisible, setEditBudgetVisible] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(
    totalMonthlyBudget.toString(),
  );

  useEffect(() => {
    setNewBudgetInput(totalMonthlyBudget.toString());
  }, [totalMonthlyBudget]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = MONTHS[currentMonth];

  const totalAccountBalance = accounts.reduce(
    (acc, curr) => acc + curr.balance,
    0,
  );

  const spentByCategoryId: Record<string, number> = {};
  allTransactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (
      tx.type === 'expense' &&
      txDate.getUTCMonth() === currentMonth &&
      txDate.getUTCFullYear() === currentYear
    ) {
      const cat = categories.find(c => c.name === tx.category);
      if (cat) {
        spentByCategoryId[cat.id] = (spentByCategoryId[cat.id] || 0) + tx.amount;
      }
    }
  });

  const categoriesWithSpent = categories.map(cat => ({
    ...cat,
    spent: spentByCategoryId[cat.id] || 0,
  }));

  const totalSpentAll = categoriesWithSpent.reduce(
    (sum, c) => sum + c.spent,
    0,
  );
  const totalAllocatedAll = categoriesWithSpent.reduce(
    (sum, c) => sum + c.limit,
    0,
  );

  const handleEditCategory = (category: IBudgetCategory) => {
    setMenuVisible(false);
    navigation.navigate('AddCategory', { category });
  };

  const handleDeleteCategory = (id: string) => {
    setMenuVisible(false);
    dispatch(deleteCategory(id));
    showToast('Category envelope deleted successfully.', 'success', 'Deleted');
  };

  const handleUpdateTotalBudget = () => {
    const val = parseFloat(newBudgetInput);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid budget amount.', 'error', 'Invalid Input');
      return;
    }

    if (totalAccountBalance > 0 && val > totalAccountBalance) {
      showToast(
        `Monthly budget (PKR ${val.toLocaleString()}) cannot exceed total account balance (PKR ${totalAccountBalance.toLocaleString()}).`,
        'error',
        'Insufficient Funds',
      );
      return;
    }

    dispatch(setTotalMonthlyBudget(val));
    setEditBudgetVisible(false);
    showToast(
      `Total monthly budget updated to PKR ${val.toLocaleString()}`,
      'success',
      'Budget Updated',
    );
  };

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
                Envelopes & Caps
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Budget Planner
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddCategory')}
            style={[styles.addBtn, { backgroundColor: theme.TEXT }]}
          >
            <Feather name="plus" size={18} color={theme.BG} />
          </TouchableOpacity>
        </View>

        {/* Hero Budget Card (Always Dark / Premium Slate) */}
        <View style={styles.sectionMargin}>
          <View style={[styles.heroCard, { backgroundColor: theme.HERO_BG }]}>
            <View style={styles.heroHeaderRow}>
              <Text style={styles.heroSubhead}>
                TOTAL MONTHLY BUDGET · {monthName} {currentYear}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setEditBudgetVisible(true)}
                style={styles.editIconBtn}
              >
                <Feather name="edit-2" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroAmount}>
              {totalMonthlyBudget.toLocaleString()}
            </Text>
            <Text style={styles.heroCurrency}>PKR</Text>

            {/* Bottom 3-Column Stats Divider */}
            <View style={styles.heroStatsDividerRow}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Spent</Text>
                <Text style={[styles.heroStatValue, { color: theme.RED }]}>
                  PKR {totalSpentAll.toLocaleString()}
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Allocated</Text>
                <Text style={[styles.heroStatValue, { color: theme.ACTIVE }]}>
                  PKR {totalAllocatedAll.toLocaleString()}
                </Text>
              </View>

              <View style={styles.heroStatColBordered}>
                <Text style={styles.heroStatLabel}>Remaining</Text>
                <Text style={[styles.heroStatValue, { color: theme.GREEN }]}>
                  PKR {Math.max(0, totalMonthlyBudget - totalSpentAll).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Category Envelopes List */}
        <View style={styles.sectionMargin}>
          <View style={styles.listHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              Category Envelopes
            </Text>
            <Text style={[styles.subText, { color: theme.MUTED }]}>
              {categoriesWithSpent.length} Categories
            </Text>
          </View>

          <View style={styles.envelopesList}>
            {categoriesWithSpent.map(cat => {
              const pct =
                cat.limit > 0
                  ? Math.round((cat.spent / cat.limit) * 100)
                  : 0;

              return (
                <View
                  key={cat.id}
                  style={[styles.envelopeCard, { backgroundColor: theme.CARD }]}
                >
                  <View style={styles.envHeaderRow}>
                    <View
                      style={[
                        styles.envIconSquare,
                        { backgroundColor: theme.MODAL },
                      ]}
                    >
                      <Feather
                        name={cat.icon || 'folder'}
                        size={16}
                        color={theme.ACTIVE}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.envTitle, { color: theme.TEXT }]}>
                        {cat.name}
                      </Text>
                      <Text style={[styles.envSubText, { color: theme.MUTED }]}>
                        {cat.isMain ? 'Primary Envelope' : 'Flexible Cap'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setMenuVisible(true);
                      }}
                      style={styles.moreBtn}
                    >
                      <Feather
                        name="more-vertical"
                        size={16}
                        color={theme.MUTED}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.amountsRow}>
                    <Text style={[styles.spentText, { color: theme.TEXT }]}>
                      PKR {cat.spent.toLocaleString()}
                    </Text>
                    <Text style={[styles.allocatedText, { color: theme.MUTED }]}>
                      / PKR {cat.limit.toLocaleString()}
                    </Text>
                  </View>

                  <Track pct={pct} />

                  <View style={styles.envFooterRow}>
                    <Text
                      style={[
                        styles.pctBadgeText,
                        {
                          color:
                            pct >= 100
                              ? theme.RED
                              : pct >= 80
                              ? '#FF9500'
                              : theme.GREEN,
                        },
                      ]}
                    >
                      {pct}% utilized
                    </Text>
                    <Text style={[styles.remBadgeText, { color: theme.MUTED }]}>
                      PKR {Math.max(0, cat.limit - cat.spent).toLocaleString()}{' '}
                      left
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* CA Recommendation Banner */}
        <View style={styles.sectionMargin}>
          <View
            style={[
              styles.caCard,
              { backgroundColor: theme.ACTIVE },
            ]}
          >
            <Text style={styles.caLabel}>CA Recommendation</Text>
            <Text style={styles.caText}>
              Allocating{' '}
              <Text style={{ fontWeight: '800' }}>PKR 15,000 more</Text> into your
              groceries envelope will prevent unexpected mid-month deficit and align
              with FBR Section 62 savings benchmarks.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Budget Modal Sheet */}
      <AnimatedModal
        visible={editBudgetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditBudgetVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditBudgetVisible(false)}
        >
          <Pressable
            style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                Edit Monthly Budget
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEditBudgetVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              >
                <Feather name="x" size={14} color={theme.MUTED} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.balSubhead, { color: theme.MUTED }]}>
              Max available across linked accounts: PKR{' '}
              <Text style={{ fontWeight: '700', color: theme.TEXT }}>
                {totalAccountBalance > 0
                  ? totalAccountBalance.toLocaleString()
                  : '382,000'}
              </Text>
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.MUTED }]}>
                Budget Cap (PKR)
              </Text>
              <TextInput
                value={newBudgetInput}
                onChangeText={setNewBudgetInput}
                keyboardType="numeric"
                style={[styles.budgetInput, { color: theme.TEXT }]}
              />
            </View>

            {/* Presets Row */}
            <View style={styles.presetsRow}>
              {[50000, 100000, 150000, 200000].map(p => (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.8}
                  onPress={() => setNewBudgetInput(p.toString())}
                  style={[styles.presetBtn, { backgroundColor: theme.MODAL }]}
                >
                  <Text style={[styles.presetBtnText, { color: theme.TEXT }]}>
                    PKR {(p / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleUpdateTotalBudget}
              style={[styles.saveBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.saveBtnText, { color: theme.BG }]}>
                Save Budget Cap →
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </AnimatedModal>

      {/* Category Options Modal */}
      <AnimatedModal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[styles.menuContent, { backgroundColor: theme.CARD }]}
          >
            <Text style={[styles.menuTitle, { color: theme.TEXT }]}>
              {selectedCategory?.name} Envelope
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectedCategory && handleEditCategory(selectedCategory)
              }
              style={[styles.menuItem, { borderBottomColor: theme.BORDER }]}
            >
              <Feather name="edit-2" size={15} color={theme.TEXT} />
              <Text style={[styles.menuItemText, { color: theme.TEXT }]}>
                Edit Envelope
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectedCategory && handleDeleteCategory(selectedCategory.id)
              }
              style={styles.menuItem}
            >
              <Feather name="trash-2" size={15} color={theme.RED} />
              <Text style={[styles.menuItemText, { color: theme.RED }]}>
                Delete Envelope
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </AnimatedModal>
    </View>
  );
};

export default BudgetPlannerScreen;

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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionMargin: {
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSubhead: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.36)',
    letterSpacing: 1.4,
  },
  editIconBtn: {
    padding: 4,
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
  heroStatsDividerRow: {
    flexDirection: 'row',
    marginTop: 22,
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
  envelopesList: {
    gap: 10,
  },
  envelopeCard: {
    borderRadius: 24,
    padding: 18,
  },
  envHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  envIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  envTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  envSubText: {
    fontSize: 11,
  },
  moreBtn: {
    padding: 4,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  spentText: {
    fontSize: 16,
    fontWeight: '800',
  },
  allocatedText: {
    fontSize: 12,
  },
  trackBackground: {
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.18)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 6,
  },
  trackFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  envFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  remBadgeText: {
    fontSize: 11,
  },
  caCard: {
    borderRadius: 24,
    padding: 20,
  },
  caLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  caText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 21,
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balSubhead: {
    fontSize: 11,
    marginBottom: 14,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  budgetInput: {
    fontSize: 28,
    fontWeight: '800',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    paddingVertical: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuContent: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 20,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
