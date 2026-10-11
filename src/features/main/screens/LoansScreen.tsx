import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { AnimatedModal } from '../../../components/AnimatedModal';
import { DrawerMenuButton } from '../../../components';

interface LoanItem {
  id: number;
  icon: string;
  label: string;
  bank: string;
  remaining: number;
  emi: number;
  paidMonths: number;
  totalMonths: number;
  rate: string;
  dti: string;
}

const LOANS: LoanItem[] = [
  {
    id: 1,
    icon: 'truck',
    label: 'Toyota Corolla Auto Loan',
    bank: 'HBL Car Finance',
    remaining: 1240000,
    emi: 35000,
    paidMonths: 20,
    totalMonths: 36,
    rate: '14.5%',
    dti: '23%',
  },
  {
    id: 2,
    icon: 'home',
    label: 'Personal Loan — Meezan',
    bank: 'Meezan Bank',
    remaining: 185000,
    emi: 18500,
    paidMonths: 17,
    totalMonths: 24,
    rate: '18.0%',
    dti: '12%',
  },
  {
    id: 3,
    icon: 'credit-card',
    label: 'Alfalah Visa Platinum',
    bank: 'Bank Alfalah',
    remaining: 42000,
    emi: 7000,
    paidMonths: 1,
    totalMonths: 6,
    rate: '36% APR',
    dti: '4%',
  },
];

const PAY_METHODS = [
  { id: '1link', label: '1Link' },
  { id: 'easypaisa', label: 'Easypaisa' },
  { id: 'jazzcash', label: 'JazzCash' },
];

function Track({ pct }: { pct: number }) {
  const { theme } = useTheme();
  const fill =
    pct >= 75
      ? theme.GREEN
      : pct < 25
      ? theme.RED
      : theme.MUTED;

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

function PaymentKeypad({
  loan,
  onClose,
}: {
  loan: LoanItem;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [method, setMethod] = useState('1link');
  const [val, setVal] = useState(String(loan.emi));
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

  function tap(k: string) {
    if (k === '⌫') setVal(v => v.slice(0, -1) || '0');
    else if (val === '0') setVal(k === '000' ? '0' : k);
    else setVal(v => v + k);
  }

  function pay() {
    setDone(true);
    showToast(
      `Payment of PKR ${parseInt(val || '0').toLocaleString()} processed!`,
      'success',
      'EMI Payment',
    );
    setTimeout(close, 1800);
  }

  return (
    <AnimatedModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={close}
      onDismissed={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={close}>
        <Pressable
          style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
                Pay EMI
              </Text>
              <Text style={[styles.sheetSub, { color: theme.MUTED }]}>
                {loan.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={close}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {!done ? (
            <View style={styles.keypadBody}>
              <View style={styles.amountDisplayArea}>
                <Text style={[styles.currencyLabel, { color: theme.MUTED }]}>
                  PKR
                </Text>
                <Text style={[styles.amountText, { color: theme.TEXT }]}>
                  {parseInt(val || '0').toLocaleString()}
                </Text>
              </View>

              <Text style={[styles.sectionSubTitle, { color: theme.MUTED }]}>
                Payment Method
              </Text>
              <View style={styles.payMethodsRow}>
                {PAY_METHODS.map(m => {
                  const isSel = method === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.8}
                      onPress={() => setMethod(m.id)}
                      style={[
                        styles.payMethodBtn,
                        {
                          backgroundColor: isSel
                            ? theme.TEXT
                            : 'transparent',
                          borderColor: isSel ? theme.TEXT : theme.MODAL,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.payMethodText,
                          { color: isSel ? theme.BG : theme.MUTED },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.keysGrid}>
                {keys.map(k => (
                  <TouchableOpacity
                    key={k}
                    activeOpacity={0.7}
                    onPress={() => tap(k)}
                    style={[styles.keyBtn, { backgroundColor: theme.MODAL }]}
                  >
                    <Text style={[styles.keyText, { color: theme.TEXT }]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={pay}
                style={[styles.submitPayBtn, { backgroundColor: theme.TEXT }]}
              >
                <Text style={[styles.submitPayText, { color: theme.BG }]}>
                  Pay PKR {parseInt(val || '0').toLocaleString()} →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successArea}>
              <View
                style={[
                  styles.successCheckCircle,
                  { backgroundColor: theme.GREEN },
                ]}
              >
                <Feather name="check" size={26} color="#FFFFFF" />
              </View>
              <Text style={[styles.successTitle, { color: theme.TEXT }]}>
                Payment Successful
              </Text>
              <Text style={[styles.successSub, { color: theme.MUTED }]}>
                PKR {parseInt(val || '0').toLocaleString()} via{' '}
                {PAY_METHODS.find(m => m.id === method)?.label}
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

export const LoansScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [activeLoan, setActiveLoan] = useState<LoanItem | null>(null);

  const totalEMI = LOANS.reduce((s, l) => s + l.emi, 0);
  const totalDebt = LOANS.reduce((s, l) => s + l.remaining, 0);

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
            paddingBottom: insets.bottom + 110,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DrawerMenuButton />
            <View>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Liabilities
              </Text>
              <Text style={[styles.headerSub, { color: theme.MUTED }]}>
                Active loans & credit facilities
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Row */}
        <View style={styles.sectionMargin}>
          <View style={styles.summaryRow}>
            {[
              {
                label: 'TOTAL DEBT',
                value: `Rs. ${(totalDebt / 1000).toFixed(0)}K`,
                color: theme.RED,
              },
              {
                label: 'MONTHLY EMI',
                value: totalEMI.toLocaleString(),
                color: theme.RED,
              },
              {
                label: 'DEBT-TO-INC',
                value: '39%',
                color: theme.TEXT,
              },
            ].map(s => (
              <View
                key={s.label}
                style={[styles.summaryCard, { backgroundColor: theme.CARD }]}
              >
                <Text style={[styles.summaryLabel, { color: theme.MUTED }]}>
                  {s.label}
                </Text>
                <Text style={[styles.summaryValue, { color: s.color }]}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Loan Cards List */}
        <View style={styles.sectionMargin}>
          <View style={styles.loansList}>
            {LOANS.map(loan => {
              const pct = Math.round(
                (loan.paidMonths / loan.totalMonths) * 100,
              );
              const isHighProgress = pct >= 75;

              return (
                <View
                  key={loan.id}
                  style={[styles.loanCard, { backgroundColor: theme.CARD }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.iconSquare,
                        { backgroundColor: theme.MODAL },
                      ]}
                    >
                      <Feather
                        name={loan.icon}
                        size={16}
                        color={theme.MUTED}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.loanTitle, { color: theme.TEXT }]}>
                        {loan.label}
                      </Text>
                      <Text style={[styles.loanSub, { color: theme.MUTED }]}>
                        {loan.bank} · {loan.rate}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.remAmount, { color: theme.RED }]}>
                        {(loan.remaining / 1000).toFixed(0)}K
                      </Text>
                      <Text style={[styles.remLabel, { color: theme.MUTED }]}>
                        remaining
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricsGrid}>
                    {[
                      {
                        k: 'MONTHLY EMI',
                        v: `Rs. ${loan.emi.toLocaleString()}`,
                      },
                      {
                        k: 'PROGRESS',
                        v: `${loan.paidMonths}/${loan.totalMonths} mo`,
                      },
                      { k: 'DTI RATIO', v: loan.dti },
                    ].map(d => (
                      <View
                        key={d.k}
                        style={[
                          styles.metricBox,
                          { backgroundColor: theme.MODAL },
                        ]}
                      >
                        <Text
                          style={[
                            styles.metricBoxLabel,
                            { color: theme.MUTED },
                          ]}
                        >
                          {d.k}
                        </Text>
                        <Text
                          style={[
                            styles.metricBoxValue,
                            { color: theme.TEXT },
                          ]}
                        >
                          {d.v}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.progressArea}>
                    <View style={styles.progressHeader}>
                      <Text
                        style={[styles.progressLabel, { color: theme.MUTED }]}
                      >
                        Repayment Progress
                      </Text>
                      <Text
                        style={[
                          styles.progressPct,
                          {
                            color: isHighProgress
                              ? theme.GREEN
                              : pct < 25
                              ? theme.RED
                              : theme.TEXT,
                          },
                        ]}
                      >
                        {pct}%
                      </Text>
                    </View>
                    <Track pct={pct} />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveLoan(loan)}
                    style={[
                      styles.payEmiBtn,
                      { backgroundColor: theme.TEXT },
                    ]}
                  >
                    <Text style={[styles.payEmiText, { color: theme.BG }]}>
                      Pay EMI Rs. {loan.emi.toLocaleString()} →
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* CA Recommendation Banner */}
        <View style={styles.sectionMargin}>
          <View style={[styles.caCard, { backgroundColor: theme.ACTIVE }]}>
            <Text style={styles.caLabel}>CA RECOMMENDATION</Text>
            <Text style={styles.caText}>
              Clearing the <Text style={{ fontWeight: '800' }}>Alfalah Visa Platinum</Text>{' '}
              balance first saves approximately{' '}
              <Text style={{ fontWeight: '800' }}>PKR 12,600/yr</Text> in interest at
              its 36% APR — prioritise over auto loan pre-payment.
            </Text>
          </View>
        </View>
      </ScrollView>

      {activeLoan && (
        <PaymentKeypad
          loan={activeLoan}
          onClose={() => setActiveLoan(null)}
        />
      )}
    </View>
  );
};

export default LoansScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
  },
  sectionMargin: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  loansList: {
    gap: 12,
  },
  loanCard: {
    borderRadius: 24,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loanTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  loanSub: {
    fontSize: 11,
  },
  remAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  remLabel: {
    fontSize: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
  },
  metricBoxLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricBoxValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressArea: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 10,
  },
  progressPct: {
    fontSize: 10,
    fontWeight: '700',
  },
  trackBackground: {
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  payEmiBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payEmiText: {
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  caText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 20,
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
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBody: {
    marginTop: 6,
  },
  amountDisplayArea: {
    alignItems: 'center',
    marginVertical: 10,
  },
  currencyLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  amountText: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -2,
  },
  sectionSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  payMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  payMethodBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  keysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  keyBtn: {
    width: '31%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitPayBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  successArea: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successCheckCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 12,
  },
});
