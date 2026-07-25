import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  StatusBar,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';

type Tab = 'ledger' | 'sms';

const TRANSACTIONS = [
  {
    id: 1,
    icon: 'shopping-cart',
    label: 'Carrefour Hyperstar',
    sub: 'Groceries · HBL',
    amount: -3240,
    date: 'Today 11:42',
  },
  {
    id: 2,
    icon: 'truck',
    label: 'Uber Pakistan',
    sub: 'Transport · Meezan',
    amount: -380,
    date: 'Today 09:15',
  },
  {
    id: 3,
    icon: 'home',
    label: 'Rent — DHA Phase 6',
    sub: 'Housing · Alfalah',
    amount: -25000,
    date: 'May 1',
  },
  {
    id: 4,
    icon: 'zap',
    label: 'LESCO Bill',
    sub: 'Utilities · HBL',
    amount: -2800,
    date: 'Apr 28',
  },
  {
    id: 5,
    icon: 'coffee',
    label: 'Espresso — Gulberg',
    sub: 'Food · Meezan',
    amount: -1450,
    date: 'Apr 27',
  },
  {
    id: 6,
    icon: 'smartphone',
    label: 'Jazz Postpaid',
    sub: 'Telecom · UBL',
    amount: -1200,
    date: 'Apr 25',
  },
  {
    id: 7,
    icon: 'shopping-cart',
    label: 'Chase Up Superstore',
    sub: 'Groceries · Alfalah',
    amount: -4560,
    date: 'Apr 23',
  },
  {
    id: 8,
    icon: 'arrow-up-right',
    label: 'Salary Credit',
    sub: 'Income · HBL',
    amount: 150000,
    date: 'Apr 1',
  },
];

const SMS_LOGS = [
  {
    bank: 'HBL',
    conf: 98,
    raw: 'HBL: PKR 3,240.00 debited from a/c XX1234 at CARREFOUR HYPERSTAR DHA on 21-May-26. Avail Bal: PKR 67,180.',
    parsed: {
      Merchant: 'Carrefour Hyperstar',
      Category: 'Groceries',
      Amount: 'Rs. 3,240',
    },
  },
  {
    bank: 'Meezan',
    conf: 96,
    raw: 'Meezan Bank: Rs.380 debited from a/c ending 5678 for UBER PAKISTAN on 21-May-26. Avail Balance Rs.12,440.',
    parsed: {
      Merchant: 'Uber Pakistan',
      Category: 'Transport',
      Amount: 'Rs. 380',
    },
  },
  {
    bank: 'Alfalah',
    conf: 91,
    raw: 'Dear customer, Rs. 25,000 debited from Bank Alfalah a/c XX9012 as RENT PAYMENT on 01-May-26.',
    parsed: {
      Merchant: 'Rent — DHA Phase 6',
      Category: 'Housing',
      Amount: 'Rs. 25,000',
    },
  },
];

function SMSCard({ log }: { log: (typeof SMS_LOGS)[0] }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.smsCardContainer, { backgroundColor: theme.CARD }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(o => !o)}
        style={styles.smsHeaderBtn}
      >
        <View style={[styles.activeDot, { backgroundColor: theme.ACTIVE }]} />
        <View style={styles.smsHeaderInfo}>
          <Text style={[styles.smsBankTitle, { color: theme.TEXT }]}>
            {log.bank}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.smsRawPreview, { color: theme.MUTED }]}
          >
            {log.raw}
          </Text>
        </View>
        <View style={styles.smsHeaderRight}>
          <View style={[styles.confBadge, { backgroundColor: theme.ACTIVE }]}>
            <Text style={styles.confBadgeText}>{log.conf}%</Text>
          </View>
          <Feather
            name={open ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.MUTED}
          />
        </View>
      </TouchableOpacity>

      {open && (
        <View
          style={[styles.smsBodyContent, { borderTopColor: theme.BORDER }]}
        >
          <Text style={[styles.rawCodeBlock, { backgroundColor: theme.MODAL, color: theme.MUTED }]}>
            {log.raw}
          </Text>
          <View style={styles.parsedGrid}>
            {Object.entries(log.parsed).map(([k, v]) => (
              <View
                key={k}
                style={[styles.parsedGridItem, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.parsedKeyLabel, { color: theme.MUTED }]}>
                  {k}
                </Text>
                <Text style={[styles.parsedValueText, { color: theme.TEXT }]}>
                  {v}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [val, setVal] = useState('');
  const [cat, setCat] = useState('Food');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  function tap(k: string) {
    if (k === '⌫') {
      setVal(v => v.slice(0, -1));
    } else if (k === '.' && val.includes('.')) {
      return;
    } else {
      setVal(v => v + k);
    }
  }

  function handleAdd() {
    if (!val || val === '0') {
      showToast('Please enter an amount', 'error', 'Add Expense');
      return;
    }
    showToast(`Added PKR ${val} under ${cat}`, 'success', 'Transaction Recorded');
    onClose();
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
              Add Expense
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.MUTED }]}>
              Amount (PKR)
            </Text>
            <Text style={[styles.amountDisplay, { color: theme.TEXT }]}>
              {val || '0'}
            </Text>
          </View>

          {/* Categories Pill Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {['Food', 'Transport', 'Groceries', 'Utilities', 'Other'].map(
              c => {
                const isActive = cat === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    onPress={() => setCat(c)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isActive ? theme.TEXT : theme.MODAL,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isActive ? theme.BG : theme.TEXT },
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>

          {/* Custom Numeric Keypad */}
          <View style={styles.keypadGrid}>
            {keys.map(k => (
              <TouchableOpacity
                key={k}
                activeOpacity={0.7}
                onPress={() => tap(k)}
                style={[styles.keyBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.keyBtnText, { color: theme.TEXT }]}>
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.submitBtnText, { color: theme.BG }]}>
              Add PKR {val || '0'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const ExpensesScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [tab, setTab] = useState<Tab>('ledger');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = TRANSACTIONS.filter(
    tx =>
      tx.label.toLowerCase().includes(search.toLowerCase()) ||
      tx.sub.toLowerCase().includes(search.toLowerCase()),
  );

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
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: theme.TEXT }]}>
            Ledger
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowAdd(true)}
            style={[styles.addBtn, { backgroundColor: theme.TEXT }]}
          >
            <Feather name="plus" size={18} color={theme.BG} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher Pills */}
        <View style={styles.tabsRow}>
          {(['ledger', 'sms'] as Tab[]).map(t => {
            const isActive = tab === t;
            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.8}
                onPress={() => setTab(t)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive ? theme.TEXT : theme.CARD,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: isActive ? theme.BG : theme.MUTED,
                    },
                  ]}
                >
                  {t === 'ledger' ? 'Transactions' : 'SMS Engine'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Input Bar (Ledger tab only) */}
        {tab === 'ledger' && (
          <View style={[styles.searchBar, { backgroundColor: theme.CARD }]}>
            <Feather name="search" size={15} color={theme.MUTED} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search transactions…"
              placeholderTextColor={theme.MUTED}
              style={[styles.searchInput, { color: theme.TEXT }]}
            />
          </View>
        )}

        {/* Content Area */}
        {tab === 'ledger' ? (
          <View>
            {/* Top 2 Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.summaryLabel, { color: theme.MUTED }]}>
                  Total Out
                </Text>
                <Text style={[styles.summaryValue, { color: theme.RED }]}>
                  Rs. 38,630
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.summaryLabel, { color: theme.MUTED }]}>
                  Entries
                </Text>
                <Text style={[styles.summaryValue, { color: theme.TEXT }]}>
                  {filtered.length} items
                </Text>
              </View>
            </View>

            {/* Transactions Card List */}
            <View style={[styles.listCard, { backgroundColor: theme.CARD }]}>
              {filtered.map((tx, i) => {
                const pos = tx.amount > 0;
                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txRow,
                      {
                        borderBottomWidth: i < filtered.length - 1 ? 1 : 0,
                        borderBottomColor: theme.BORDER,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconSquare,
                        { backgroundColor: theme.MODAL },
                      ]}
                    >
                      <Feather
                        name={tx.icon}
                        size={16}
                        color={theme.MUTED}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text
                        numberOfLines={1}
                        style={[styles.txLabel, { color: theme.TEXT }]}
                      >
                        {tx.label}
                      </Text>
                      <Text style={[styles.txSub, { color: theme.MUTED }]}>
                        {tx.sub} · {tx.date}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: pos ? theme.GREEN : theme.RED },
                      ]}
                    >
                      {pos ? '+' : '–'}
                      {Math.abs(tx.amount).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View>
            {/* SMS Parsing Engine Hero Banner */}
            <View
              style={[
                styles.smsHeroBanner,
                { backgroundColor: theme.HERO_BG },
              ]}
            >
              <View style={styles.smsHeroHeaderRow}>
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: theme.ACTIVE },
                  ]}
                />
                <Text style={[styles.smsHeroTitle, { color: theme.ACTIVE }]}>
                  Parsing Engine Active
                </Text>
              </View>

              <Text style={styles.smsHeroDesc}>
                Intercepts bank SMS from HBL, Meezan, Alfalah, SCB, and UBL —
                mapping raw messages to verified ledger entries.
              </Text>

              <View style={styles.banksWrapRow}>
                {['HBL', 'Meezan', 'Alfalah', 'SCB', 'UBL'].map(b => (
                  <View key={b} style={styles.bankTagPill}>
                    <Text style={styles.bankTagText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Parsed SMS Accordion List */}
            {SMS_LOGS.map((log, i) => (
              <SMSCard key={i} log={log} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Sheet Modal */}
      {showAdd && <AddSheet onClose={() => setShowAdd(false)} />}
    </View>
  );
};

export default ExpensesScreen;

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
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  listCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  txSub: {
    fontSize: 11,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
  smsHeroBanner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  smsHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  smsHeroTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  smsHeroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 19,
    marginBottom: 14,
  },
  banksWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bankTagPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  bankTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  smsCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  smsHeaderBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smsHeaderInfo: {
    flex: 1,
  },
  smsBankTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  smsRawPreview: {
    fontSize: 10,
  },
  smsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confBadge: {
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  confBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  smsBodyContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  rawCodeBlock: {
    fontFamily: 'Platform',
    fontSize: 10,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
    lineHeight: 15,
  },
  parsedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  parsedGridItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 10,
  },
  parsedKeyLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  parsedValueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  amountLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  amountDisplay: {
    fontSize: 50,
    fontWeight: '800',
    letterSpacing: -2,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  keyBtn: {
    width: '31%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    marginTop: 14,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
