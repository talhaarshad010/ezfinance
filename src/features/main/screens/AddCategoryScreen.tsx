import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { BudgetCategory } from '../../../store/slices/budgetSlice';
import { AnimatedModal } from '../../../components/AnimatedModal';
import { CAT_META, CATS } from '../newUser/shared';
import { useBudgetPlan } from './budget/useBudgetPlan';

// A user's envelope counts spending whose category has the same name, so suggest those names.
const SPENDING_CATS = CATS.filter(c => c !== 'Salary');

const ICONS = [
  'coffee',
  'truck',
  'package',
  'tv',
  'shopping-bag',
  'car',
  'home',
  'heart',
  'star',
  'tool',
  'music',
  'camera',
  'briefcase',
  'gift',
  'shield',
];

const COLORS = [
  '#0047AB',
  '#00C853',
  '#FF3B30',
  '#4CD964',
  '#FF9500',
  '#5856D6',
  '#AF52DE',
  '#5AC8FA',
];

export const AddCategoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const plan = useBudgetPlan();

  const editingCategory = route.params?.category as BudgetCategory | undefined;

  const { categories, totalMonthlyBudget } = plan;

  const [name, setName] = useState(editingCategory?.name || '');
  const [limit, setLimit] = useState(
    editingCategory?.limit?.toString() || '',
  );
  const [icon, setIcon] = useState(editingCategory?.icon || 'package');
  const [color, setColor] = useState(editingCategory?.color || '#0047AB');
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Calculate allocated budget
  const otherCategoriesTotal = categories
    .filter(c => c.id !== editingCategory?.id)
    .reduce((acc, curr) => acc + curr.limit, 0);

  const unallocatedBudget = Math.max(0, totalMonthlyBudget - otherCategoriesTotal);

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

    const newTotalCategoriesLimit = otherCategoriesTotal + numLimit;
    if (newTotalCategoriesLimit > totalMonthlyBudget) {
      const maxAllowed = totalMonthlyBudget - otherCategoriesTotal;
      showToast(
        `Category limit (${numLimit.toLocaleString()}) exceeds available budget. Maximum allowed: PKR ${maxAllowed.toLocaleString()}`,
        'error',
        'Budget Limit Exceeded',
      );
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingCategory) {
        const categoryData: BudgetCategory = {
          id: editingCategory.id,
          name: name.trim(),
          limit: parseFloat(limit),
          icon,
          color,
          isMain: editingCategory.isMain || false,
        };
        plan.update(categoryData);
        showToast('Category updated successfully.', 'success', 'Success');
      } else {
        const categoryData: BudgetCategory = {
          id: 'cat_' + Date.now(),
          name: name.trim(),
          limit: parseFloat(limit),
          icon,
          color,
          isMain: false,
        };
        plan.add(categoryData);
        showToast('New category added successfully.', 'success', 'Success');
      }
      setIsSaving(false);
      navigation.goBack();
    }, 200);
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
            paddingBottom: insets.bottom + 60,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={16} color={theme.MUTED} />
            <Text style={[styles.backText, { color: theme.MUTED }]}>
              Budget Planner
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
            {editingCategory ? 'Edit Category' : 'New Category'}
          </Text>
          <Text style={[styles.headerSub, { color: theme.MUTED }]}>
            {editingCategory
              ? 'Modify your budget category limits & icons.'
              : 'Create a new bucket to track monthly spending.'}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.sectionMargin}>
          <View style={styles.inputsStack}>
            {/* Category Name Field */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                CATEGORY NAME
              </Text>
              <View style={styles.inputInnerRow}>
                <View
                  style={[
                    styles.iconBoxPreview,
                    { backgroundColor: `${color}18` },
                  ]}
                >
                  <Feather name={icon} size={18} color={color} />
                </View>
                <TextInput
                  style={[styles.textInput, { color: theme.TEXT }]}
                  placeholder="e.g. Travel, Healthcare, Shopping"
                  placeholderTextColor={theme.MUTED}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              {plan.isUser && (
                <View style={styles.suggestRow}>
                  {SPENDING_CATS.filter(
                    c => !categories.some(x => x.id !== editingCategory?.id && x.name.toLowerCase() === c.toLowerCase()),
                  ).map(c => {
                    const selected = name.trim().toLowerCase() === c.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c}
                        activeOpacity={0.8}
                        onPress={() => {
                          setName(c);
                          setIcon(CAT_META[c]?.icon ?? icon);
                          setColor(CAT_META[c]?.color ?? color);
                        }}
                        style={[styles.suggestChip, { backgroundColor: selected ? theme.TEXT : theme.MODAL }]}
                      >
                        <Text style={[styles.suggestText, { color: selected ? theme.BG : theme.TEXT }]}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Monthly Limit Field */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <View style={styles.limitHeaderRow}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  MONTHLY BUDGET LIMIT
                </Text>
                <Text style={[styles.limitHintText, { color: theme.MUTED }]}>
                  Unallocated: PKR {unallocatedBudget.toLocaleString()}
                </Text>
              </View>

              <View style={styles.amountInputRow}>
                <Text style={[styles.currencyPrefix, { color: theme.MUTED }]}>
                  PKR
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.TEXT }]}
                  placeholder="0"
                  placeholderTextColor={theme.MUTED}
                  keyboardType="numeric"
                  value={limit}
                  onChangeText={setLimit}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Customization Grid Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            CUSTOMIZATION
          </Text>

          <View style={[styles.customCard, { backgroundColor: theme.CARD }]}>
            {/* Icon Picker Launcher */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowIconPicker(true)}
              style={styles.customRow}
            >
              <View style={styles.customRowLeft}>
                <View
                  style={[
                    styles.iconSquare,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Feather name={icon} size={20} color={color} />
                </View>
                <View>
                  <Text style={[styles.customTitle, { color: theme.TEXT }]}>
                    Category Icon
                  </Text>
                  <Text style={[styles.customSub, { color: theme.MUTED }]}>
                    Icon: {icon}
                  </Text>
                </View>
              </View>

              <View style={styles.changeBadge}>
                <Text style={[styles.changeBadgeText, { color: theme.TEXT }]}>
                  Change →
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: theme.BORDER }]}
            />

            {/* Color Palette Picker */}
            <View style={{ paddingTop: 4 }}>
              <Text style={[styles.colorTitle, { color: theme.TEXT }]}>
                Accent Theme Color
              </Text>
              <View style={styles.colorGrid}>
                {COLORS.map(c => {
                  const isSelected = color === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.8}
                      onPress={() => setColor(c)}
                      style={[
                        styles.colorPill,
                        { backgroundColor: c },
                        isSelected && styles.selectedColorPill,
                      ]}
                    >
                      {isSelected && (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Submit Save Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.BG} />
          ) : (
            <Text style={[styles.submitText, { color: theme.BG }]}>
              {editingCategory ? 'Update Category →' : 'Create Category →'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Icon Picker Bottom Sheet Modal */}
      <AnimatedModal
        visible={showIconPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowIconPicker(false)}
        >
          <Pressable
            style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
            onPress={e => e.stopPropagation()}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: theme.BORDER }]}
            />
            <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
              Select Category Icon
            </Text>

            <View style={styles.iconGridWrap}>
              {ICONS.map(i => {
                const isSelected = icon === i;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIcon(i);
                      setShowIconPicker(false);
                    }}
                    style={[
                      styles.iconGridBox,
                      {
                        backgroundColor: isSelected
                          ? theme.TEXT
                          : theme.MODAL,
                      },
                    ]}
                  >
                    <Feather
                      name={i}
                      size={22}
                      color={isSelected ? theme.BG : theme.TEXT}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowIconPicker(false)}
              style={styles.cancelBtn}
            >
              <Text style={[styles.cancelText, { color: theme.MUTED }]}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </AnimatedModal>
    </View>
  );
};

export default AddCategoryScreen;

const styles = StyleSheet.create({
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  suggestChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  suggestText: { fontSize: 12, fontWeight: '600' },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionMargin: {
    marginBottom: 16,
  },
  inputsStack: {
    gap: 10,
  },
  inputCard: {
    borderRadius: 20,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  limitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitHintText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBoxPreview: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  customCard: {
    borderRadius: 24,
    padding: 18,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSquare: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  customSub: {
    fontSize: 11,
  },
  changeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  colorTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorPill: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
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
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  iconGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  iconGridBox: {
    width: '22%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
