import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TouchableWithoutFeedback, TextInput, RefreshControl} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';
import {colors} from '../../../theme/colors';
import { useToast } from '../../../context/ToastContext';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useNavigation } from '@react-navigation/native';
import { deleteCategory, setTotalMonthlyBudget, BudgetCategory as IBudgetCategory } from '../../../store/slices/budgetSlice';
import { updateMonthlyBudget, deleteCategoryFromDb } from '../../../services/budgetService';

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const BudgetPlannerScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  
  const categories = useAppSelector(state => state.budget.categories);
  const totalMonthlyBudget = useAppSelector(state => state.budget.totalMonthlyBudget);
  const accounts = useAppSelector(state => state.bankAccounts.accounts);
  const allTransactions = Object.values(useAppSelector(state => state.bankAccounts.transactions)).flat();
  
  const [selectedCategory, setSelectedCategory] = useState<IBudgetCategory | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editBudgetVisible, setEditBudgetVisible] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(totalMonthlyBudget.toString());

  React.useEffect(() => {
    // Sync UI with Redux when component mounts (Redux already handles initial fetch in AppNavigator)
    setNewBudgetInput(totalMonthlyBudget.toString());
  }, [totalMonthlyBudget]);

  const onRefresh = async () => {
    // No-op as data is real-time
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = MONTHS[currentMonth];

  // Calculate Total Available Balance (Merged)
  const totalAccountBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Calculate Spent per Category from current month transactions
  const spentByCategoryId: Record<string, number> = {};
  allTransactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (
      tx.type === 'expense' &&
      txDate.getUTCMonth() === currentMonth &&
      txDate.getUTCFullYear() === currentYear
    ) {
      // Find matching budget category by name
      const cat = categories.find(c => c.name === tx.category);
      if (cat) {
        spentByCategoryId[cat.id] = (spentByCategoryId[cat.id] || 0) + tx.amount;
      }
    }
  });

  const categoriesWithSpent = categories.map(cat => ({
    ...cat,
    spent: spentByCategoryId[cat.id] || 0
  }));

  const mainCategory = categoriesWithSpent.find(c => c.isMain);
  const otherCategories = categoriesWithSpent.filter(c => !c.isMain);

  const handleEdit = (category: IBudgetCategory) => {
    setMenuVisible(false);
    navigation.navigate('AddCategory', { category });
  };

  const handleDelete = async (id: string) => {
    try {
      setMenuVisible(false);
      await deleteCategoryFromDb(id);
      dispatch(deleteCategory(id));
      showToast('Category deleted successfully.', 'success', 'Deleted');
    } catch (e) {
      showToast('Failed to delete category.', 'error', 'Error');
    }
  };

  const handleUpdateTotalBudget = async () => {
    const val = parseFloat(newBudgetInput);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid amount.', 'error', 'Invalid Input');
      return;
    }
    
    // Validation A: Total Monthly Budget <= Merged Account Balance
    if (val > totalAccountBalance) {
      showToast(
        `Total monthly budget ($${val.toLocaleString()}) cannot exceed your merged account balance ($${totalAccountBalance.toLocaleString()}).`,
        'error',
        'Insufficient Funds'
      );
      return;
    }

    // Validation B: Total Monthly Budget >= Sum of all Category Limits
    const totalCategoriesLimit = categories.reduce((acc, curr) => acc + curr.limit, 0);
    if (val < totalCategoriesLimit) {
      showToast(
        `Your total budget ($${val.toLocaleString()}) must be at least as high as your assigned category limits ($${totalCategoriesLimit.toLocaleString()}).`,
        'error',
        'Budget Conflict'
      );
      return;
    }

    try {
      await updateMonthlyBudget(val);
      dispatch(setTotalMonthlyBudget(val));
      setEditBudgetVisible(false);
      showToast('Monthly budget updated!', 'success', 'Updated');
    } catch (e) {
      showToast('Failed to update total budget.', 'error', 'Error');
    }
  };

  const totalSpent = categoriesWithSpent.reduce((acc, curr) => acc + curr.spent, 0);
  const totalUsagePercent = totalMonthlyBudget > 0 ? Math.round((totalSpent / totalMonthlyBudget) * 100) : 0;
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1.5}}>{monthName} {currentYear}</Typography>
          <Typography variant="h1" weight="700" style={{fontSize: 48, marginTop: 8}}>${totalSpent.toLocaleString()}</Typography>
          
          <View style={styles.budgetMeta}>
            <TouchableOpacity onPress={() => setEditBudgetVisible(true)} style={styles.row}>
              <Typography variant="body" color="#666">Total Monthly Budget: ${totalMonthlyBudget.toLocaleString()}</Typography>
              <Feather name="edit-3" size={14} color="#AAA" style={{marginLeft: 8}} />
            </TouchableOpacity>
            <View style={styles.usageBadge}>
              <Typography variant="caption" weight="700" color="#000">{totalUsagePercent}% used</Typography>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.newCategoryBtn}
              onPress={() => navigation.navigate('AddCategory')}
            >
              <Feather name="plus-circle" size={20} color="#FFF" />
              <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 10}}>New Category</Typography>
            </TouchableOpacity>

            <Card style={styles.mergedBalanceCard}>
              <Typography variant="caption" weight="700" color="#666">TOTAL BALANCE</Typography>
              <Typography variant="h3" weight="700" style={{marginTop: 4}}>${totalAccountBalance.toLocaleString()}</Typography>
            </Card>
          </View>
        </View>

        {/* Housing & Utilities Large Card */}
        {mainCategory && (
          <Card style={styles.mainCard}>
            <View style={styles.rowBetween}>
              <View>
                <Typography variant="h2" weight="700" style={{fontSize: 28}}>{mainCategory.name.split(' & ')[0]} &</Typography>
                <Typography variant="h2" weight="700" style={{fontSize: 28}}>{mainCategory.name.split(' & ')[1] || 'Utilities'}</Typography>
                <Typography variant="body" color="#666" style={{marginTop: 8}}>Fixed monthly</Typography>
                <Typography variant="body" color="#666">essentials</Typography>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedCategory(mainCategory);
                    setMenuVisible(true);
                  }}
                  style={{marginBottom: 10}}
                >
                  <Feather name="more-vertical" size={24} color="#CCC" />
                </TouchableOpacity>
                <Typography variant="h3" weight="700">${mainCategory.spent.toLocaleString()} /</Typography>
                <Typography variant="h3" weight="700" color="#666">${mainCategory.limit.toLocaleString()}</Typography>
              </View>
            </View>

            <View style={styles.progressBarLarge}>
              <View style={[styles.progressFillLarge, {width: `${Math.min(100, (mainCategory.spent / mainCategory.limit) * 100)}%`}]} />
            </View>

            <View style={styles.rowBetween}>
              <Typography variant="caption" weight="700" color="#AAA" style={{letterSpacing: 1}}>
                {Math.round((mainCategory.spent / mainCategory.limit) * 100)}% EXPENDED
              </Typography>
              <Typography variant="caption" color="#AAA" style={{letterSpacing: 1}}>
                ${Math.max(0, mainCategory.limit - mainCategory.spent).toLocaleString()} REMAINING
              </Typography>
            </View>

            {/* Large Goal Circle Mockup */}
            <View style={styles.circleContainer}>
              <View style={[styles.circleOuter, { 
                borderTopColor: (mainCategory.spent / mainCategory.limit) >= 0.25 ? '#000' : '#F3F4F6',
                borderLeftColor: (mainCategory.spent / mainCategory.limit) >= 0.50 ? '#000' : '#F3F4F6',
                borderBottomColor: (mainCategory.spent / mainCategory.limit) >= 0.75 ? '#000' : '#F3F4F6',
              }]}>
                <View style={styles.circleInner}>
                  <Typography variant="h1" weight="700" style={{fontSize: 40}}>
                    {Math.round((mainCategory.spent / mainCategory.limit) * 100)}%
                  </Typography>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Small Category Cards */}
        {otherCategories.map(cat => (
          <BudgetCategory 
            key={cat.id}
            category={cat}
            onMenuPress={() => {
              setSelectedCategory(cat);
              setMenuVisible(true);
            }}
          />
        ))}

        {/* Goal Card */}
        <Card style={styles.goalCard}>
           <View style={styles.goalHeader}>
              <Feather name="briefcase" size={20} color="#FFF" />
              <Typography variant="body" weight="700" color="#FFF" style={{marginLeft: 12}}>Annual Vacation Fund</Typography>
           </View>
           <Typography variant="body" color="#AAA" style={{marginTop: 16, lineHeight: 22}}>
             You're on track to reach your $12,000 goal by December! Adding $1,000 this month.
           </Typography>
           
           <View style={[styles.rowBetween, {marginTop: 24}]}>
              <Typography variant="caption" weight="700" color="#FFF">$8,400 Saved</Typography>
              <Typography variant="caption" weight="700" color="#FFF">70%</Typography>
           </View>
           <View style={styles.goalProgressBg}>
              <View style={[styles.goalProgressFill, {width: '70%'}]} />
           </View>

           <TouchableOpacity 
            style={styles.viewProgressBtn}
            onPress={() => showToast('Opening vacation fund details.', 'info', 'Goal')}
           >
              <Typography variant="body" weight="700">View Progress</Typography>
           </TouchableOpacity>
        </Card>

        {/* Smart Insights */}
        <Typography variant="h2" weight="700" style={{marginTop: 40, marginBottom: 20}}>Smart Insights</Typography>
        
        <Card style={styles.insightCard}>
          <View style={styles.insightIconCircle}>
            <Feather name="map-pin" size={20} color="#000" />
          </View>
          <View style={{flex: 1, marginLeft: 20}}>
            <Typography variant="h3" weight="700">Potential Savings Found</Typography>
            <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 22}}>
              We noticed your Shopping expenditure is 15% higher than usual. Switching to a weekly cap could save you approximately $340 by next month. Would you like to set an automated alert?
            </Typography>
            <View style={styles.insightActions}>
              <TouchableOpacity onPress={() => showToast('Smart Alert enabled.', 'success', 'Alert')}>
                <Typography variant="body" weight="700">Enable Smart Alert</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={{marginLeft: 24}} onPress={() => showToast('Insight dismissed.', 'info', 'Dismissed')}>
                <Typography variant="body" color="#AAA">Dismiss</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuContainer}>
              <Typography variant="h3" weight="700" style={{marginBottom: 16}}>{selectedCategory?.name}</Typography>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => selectedCategory && handleEdit(selectedCategory)}
              >
                <Feather name="edit-2" size={20} color="#000" />
                <Typography variant="body" weight="700" style={{marginLeft: 12}}>Edit Details</Typography>
              </TouchableOpacity>

              {!selectedCategory?.isMain && (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => selectedCategory && handleDelete(selectedCategory.id)}
                >
                  <Feather name="trash-2" size={20} color={colors.accent.errorText} />
                  <Typography variant="body" weight="700" color={colors.accent.errorText} style={{marginLeft: 12}}>Delete Category</Typography>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.menuItem, {borderBottomWidth: 0, marginTop: 8}]}
                onPress={() => setMenuVisible(false)}
              >
                <Typography variant="body" color="#AAA">Cancel</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Total Budget Modal */}
      <Modal visible={editBudgetVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.budgetModalContainer}>
            <Typography variant="h2" weight="700">Set Monthly Budget</Typography>
            <Typography variant="body" color="#666" style={{marginTop: 8, marginBottom: 24}}>
              Specify your total spending limit for {monthName}.
            </Typography>

            <View style={styles.amountInputContainer}>
              <Typography variant="h2" weight="700" color="#000">$</Typography>
              <TextInput 
                style={styles.amountInput}
                value={newBudgetInput}
                onChangeText={setNewBudgetInput}
                keyboardType="numeric"
                autoFocus
                placeholder="0"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, {backgroundColor: '#F3F4F6'}]}
                onPress={() => setEditBudgetVisible(false)}
              >
                <Typography variant="body" weight="700">Cancel</Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, {backgroundColor: '#000', marginLeft: 12}]}
                onPress={handleUpdateTotalBudget}
              >
                <Typography variant="body" weight="700" color="#FFF">Update Budget</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const BudgetCategory = ({category, onMenuPress}: {category: IBudgetCategory & {spent: number}, onMenuPress: () => void}) => {
  const { icon, name, spent, limit, color } = category;
  const usageFloat = spent / limit;
  const usagePercent = Math.round(usageFloat * 100);
  const overBudget = usageFloat > 1;

  return (
    <Card style={styles.categoryCard}>
      <View style={styles.rowBetween}>
        <View style={styles.categoryIconBox}>
          <Feather name={icon} size={20} color={overBudget ? colors.accent.errorText : "#000"} />
        </View>
        <TouchableOpacity onPress={onMenuPress}>
          <Feather name="more-vertical" size={24} color="#CCC" />
        </TouchableOpacity>
      </View>
      <Typography variant="body" weight="700" style={{marginTop: 20, fontSize: 18}}>{name}</Typography>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', marginTop: 4}}>
        <Typography variant="h2" weight="700">${spent.toLocaleString()} / </Typography>
        <Typography variant="h3" weight="700" color="#666">${limit.toLocaleString()}</Typography>
      </View>

      <View style={styles.progressBarSmall}>
        <View style={[styles.progressFillSmall, {width: `${Math.min(100, usagePercent)}%`, backgroundColor: color}]} />
      </View>

      <Typography 
        variant="caption" 
        weight="700" 
        color={overBudget ? colors.accent.errorText : "#AAA"} 
        style={{marginTop: 12, letterSpacing: 1} }
      >
        {overBudget ? `${usagePercent}% - OVER BUDGET` : `${usagePercent}% UTILIZED`}
      </Typography>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 40,
  },
  budgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  usageBadge: {
    backgroundColor: '#EAEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  newCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  mergedBalanceCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEBEE',
    shadowColor: 'transparent',
    minWidth: 140,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainCard: {
    padding: 32,
    borderRadius: 32,
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginVertical: 24,
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 6,
  },
  circleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  circleOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: '#F3F4F6',
    borderTopColor: '#000',
    borderLeftColor: '#000',
    borderBottomColor: '#000',
    transform: [{rotate: '-45deg'}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF',
    transform: [{rotate: '45deg'}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCard: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 16,
  },
  categoryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarSmall: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 4,
  },
  goalCard: {
    backgroundColor: '#000',
    padding: 32,
    borderRadius: 32,
    marginTop: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBg: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  viewProgressBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    alignSelf: 'flex-start',
    marginTop: 32,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 32,
    borderRadius: 32,
    marginBottom: 40,
  },
  insightIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  budgetModalContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 72,
    marginBottom: 32,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginLeft: 12,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BudgetPlannerScreen;
