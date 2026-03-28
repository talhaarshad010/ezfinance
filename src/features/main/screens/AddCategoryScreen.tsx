import React, { useState, useEffect } from 'react';
import {View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, FlatList} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addCategory, updateCategory, BudgetCategory } from '../../../store/slices/budgetSlice';
import { saveCategory, updateCategory as updateCategoryInDb } from '../../../services/budgetService';
import { useNavigation, useRoute } from '@react-navigation/native';

const ICONS = [
  'coffee', 'truck', 'package', 'tv', 'shopping-bag', 'car', 'home', 
  'heart', 'star', 'tool', 'music', 'camera', 'briefcase', 'gift', 'shield'
];

const COLORS = [
  '#0047AB', '#000000', '#FF3B30', '#4CD964', '#FF9500', '#5856D6', '#AF52DE', '#5AC8FA'
];

const AddCategoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  
  const editingCategory = route.params?.category as BudgetCategory | undefined;

  const categories = useAppSelector(state => state.budget.categories);
  const totalMonthlyBudget = useAppSelector(state => state.budget.totalMonthlyBudget);
  
  const [name, setName] = useState(editingCategory?.name || '');
  const [limit, setLimit] = useState(editingCategory?.limit?.toString() || '');
  const [icon, setIcon] = useState(editingCategory?.icon || 'package');
  const [color, setColor] = useState(editingCategory?.color || '#0047AB');
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Please enter a category name.', 'error', 'Missing Name');
      return;
    }
    const numLimit = parseFloat(limit);
    if (!limit || isNaN(numLimit) || numLimit <= 0) {
      showToast('Please enter a valid budget limit.', 'error', 'Invalid Limit');
      return;
    }

    // Validation: New Category Limit + Sum of Other Categories <= Total Monthly Budget
    const otherCategoriesTotal = categories
      .filter(c => c.id !== editingCategory?.id)
      .reduce((acc, curr) => acc + curr.limit, 0);

    const newTotalCategoriesLimit = otherCategoriesTotal + numLimit;
    if (newTotalCategoriesLimit > totalMonthlyBudget) {
      const maxAllowed = totalMonthlyBudget - otherCategoriesTotal;
      showToast(
        `Total category limits (${newTotalCategoriesLimit.toLocaleString()}) cannot exceed the monthly budget (${totalMonthlyBudget.toLocaleString()}). Maximum extra allowed: $${maxAllowed.toLocaleString()}`,
        'error',
        'Budget Limit Exceeded'
      );
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        const categoryData: BudgetCategory = {
          id: editingCategory.id,
          name: name.trim(),
          limit: parseFloat(limit),
          icon,
          color,
          isMain: editingCategory.isMain || false,
        };
        await updateCategoryInDb(categoryData);
        dispatch(updateCategory(categoryData));
        showToast('Category updated successfully.', 'success', 'Success');
      } else {
        const categoryData: Omit<BudgetCategory, 'id'> = {
          name: name.trim(),
          limit: parseFloat(limit),
          icon,
          color,
          isMain: false,
        };
        const savedCategory = await saveCategory(categoryData);
        dispatch(addCategory(savedCategory));
        showToast('New category added successfully.', 'success', 'Success');
      }
      navigation.goBack();
    } catch (e) {
      console.error('Save category error:', e);
      showToast('Failed to save category. Please try again.', 'error', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="h1" weight="700" style={{fontSize: 28}}>
          {editingCategory ? 'Edit Category' : 'New Category'}
        </Typography>
        <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 20}}>
          {editingCategory ? 'Modify your budget category details below.' : 'Create a new bucket to track your monthly spending.'}
        </Typography>
      </View>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>CATEGORY NAME</Typography>
      <View style={styles.inputBox}>
        <TextInput 
          placeholder="e.g. Travel, Health, etc."
          placeholderTextColor="#AAA"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      </View>

      <Typography variant="caption" weight="700" color="#666" style={styles.label}>MONTHLY LIMIT</Typography>
      <View style={styles.amountBox}>
        <Typography variant="h2" weight="500" color="#333" style={{marginRight: 8}}>$</Typography>
        <TextInput 
          placeholder="0"
          placeholderTextColor="#DDD"
          style={styles.amountInput}
          keyboardType="numeric"
          value={limit}
          onChangeText={setLimit}
        />
      </View>

      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 10}}>
          <Typography variant="caption" weight="700" color="#666" style={styles.label}>ICON</Typography>
          <TouchableOpacity 
            style={styles.pickerBtn}
            onPress={() => setShowIconPicker(true)}
          >
            <Feather name={icon} size={24} color="#000" />
            <Typography variant="body" style={{marginLeft: 12}}>Change</Typography>
          </TouchableOpacity>
        </View>

        <View style={{flex: 1, marginLeft: 10}}>
          <Typography variant="caption" weight="700" color="#666" style={styles.label}>THEME COLOR</Typography>
          <View style={styles.colorRow}>
            {COLORS.slice(0, 4).map(c => (
              <TouchableOpacity 
                key={c}
                style={[styles.colorCircle, {backgroundColor: c}, color === c && styles.selectedColor]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
          <View style={[styles.colorRow, {marginTop: 8}]}>
            {COLORS.slice(4).map(c => (
              <TouchableOpacity 
                key={c}
                style={[styles.colorCircle, {backgroundColor: c}, color === c && styles.selectedColor]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Typography variant="body" weight="700" color="#FFF">
          {isSaving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
        </Typography>
      </TouchableOpacity>

      <Modal visible={showIconPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h2" weight="700">Select Icon</Typography>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconGrid}>
              {ICONS.map(i => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.iconBox, icon === i && styles.selectedIconBox]}
                  onPress={() => {
                    setIcon(i);
                    setShowIconPicker(false);
                  }}
                >
                  <Feather name={i} size={24} color={icon === i ? '#FFF' : '#000'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
    paddingTop: 24,
  },
  header: {
    marginBottom: 32,
  },
  label: {
    letterSpacing: 1,
    marginBottom: 12,
    fontSize: 11,
  },
  inputBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Inter-Medium',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEBEE',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 24,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000',
    transform: [{scale: 1.1}],
  },
  saveBtn: {
    backgroundColor: '#000',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedIconBox: {
    backgroundColor: '#000',
  }
});

export default AddCategoryScreen;
