import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import { ALL_FUNDS, FundItem } from '../../../../constants/investmentData';
import { AnimatedModal } from '../../../../components/AnimatedModal';

// ── 1. Risk Selector Sheet ───────────────────────────────────────────────────
export function RiskSelectorSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: number;
  onChange: (v: number) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const snaps = [
    { label: 'Low Risk', range: [1, 4], color: theme.GREEN },
    { label: 'Medium Risk', range: [5, 7], color: theme.ACTIVE },
    { label: 'High Risk', range: [8, 10], color: theme.RED },
  ];
  const activeSnap = value <= 4 ? 0 : value <= 7 ? 1 : 2;

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Risk Level Selector
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginVertical: 18 }}>
            <Text
              style={[
                styles.largeValue,
                { color: snaps[activeSnap].color },
              ]}
            >
              {value}
            </Text>
            <Text style={[styles.largeValueSub, { color: snaps[activeSnap].color }]}>
              {snaps[activeSnap].label}
            </Text>
          </View>

          {/* Stepper / Slider Selector */}
          <View style={[styles.stepperTrack, { backgroundColor: theme.MODAL }]}>
            <TouchableOpacity
              onPress={() => onChange(Math.max(1, value - 1))}
              style={[styles.stepCircle, { backgroundColor: theme.CARD }]}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.TEXT }}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperPills}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                const isSel = num === value;
                const col = num <= 4 ? theme.GREEN : num <= 7 ? theme.ACTIVE : theme.RED;
                return (
                  <TouchableOpacity
                    key={num}
                    onPress={() => onChange(num)}
                    style={[
                      styles.stepperDot,
                      {
                        backgroundColor: isSel ? col : theme.CARD,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: isSel ? '#FFFFFF' : theme.MUTED,
                      }}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => onChange(Math.min(10, value + 1))}
              style={[styles.stepCircle, { backgroundColor: theme.CARD }]}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.TEXT }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* 3 Quick Tier Selectors */}
          <View style={styles.snapsRow}>
            {snaps.map((s, i) => (
              <TouchableOpacity
                key={s.label}
                activeOpacity={0.8}
                onPress={() => onChange(i === 0 ? 2 : i === 1 ? 6 : 9)}
                style={[
                  styles.snapBtn,
                  {
                    borderColor: activeSnap === i ? s.color : theme.BORDER,
                    backgroundColor: activeSnap === i ? s.color + '18' : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.snapBtnText,
                    { color: activeSnap === i ? s.color : theme.MUTED },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onClose}
            style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
              Apply Risk Level
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── 2. Fund Compare Sheet ─────────────────────────────────────────────────────
export function FundCompareSheet({
  visible,
  fund1Id,
  onClose,
}: {
  visible: boolean;
  fund1Id: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const f1 = ALL_FUNDS.find(f => f.id === fund1Id) ?? ALL_FUNDS[0];
  const f2 = ALL_FUNDS.find(f => f.id !== fund1Id) ?? ALL_FUNDS[1];

  const rows = [
    { label: 'NAV', v1: `PKR ${f1.nav?.toFixed(2)}`, v2: `PKR ${f2.nav?.toFixed(2)}` },
    {
      label: 'Annl. Yield',
      v1: `+${f1.yieldPct ?? f1.fiveYrReturn}%`,
      v2: `+${f2.yieldPct ?? f2.fiveYrReturn}%`,
    },
    { label: 'Fund Size', v1: f1.aum, v2: f2.aum },
    { label: 'Mgmt. Fee', v1: f1.mgmtFee, v2: f2.mgmtFee },
    { label: 'Exit Load', v1: f1.exitLoad, v2: f2.exitLoad },
    { label: 'Category', v1: f1.category, v2: f2.category },
  ];

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Compare Funds
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {/* Header 2 columns */}
          <View style={styles.compareHeaders}>
            <View style={[styles.compareColHeader, { backgroundColor: theme.MODAL }]}>
              <Text numberOfLines={1} style={[styles.colTitle, { color: theme.TEXT }]}>
                {f1.shortName || f1.name}
              </Text>
              <Text style={[styles.colSub, { color: theme.MUTED }]}>
                {f1.category}
              </Text>
            </View>
            <View style={[styles.compareColHeader, { backgroundColor: theme.MODAL }]}>
              <Text numberOfLines={1} style={[styles.colTitle, { color: theme.TEXT }]}>
                {f2.shortName || f2.name}
              </Text>
              <Text style={[styles.colSub, { color: theme.MUTED }]}>
                {f2.category}
              </Text>
            </View>
          </View>

          {/* Compare Rows */}
          <View style={[styles.compareTable, { backgroundColor: theme.MODAL }]}>
            {rows.map((row, i) => (
              <View
                key={row.label}
                style={[
                  styles.compareTableRow,
                  i < rows.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.tableVal, { color: theme.TEXT }]}>{row.v1}</Text>
                <Text style={[styles.tableLabel, { color: theme.MUTED }]}>{row.label}</Text>
                <Text style={[styles.tableVal, { color: theme.TEXT }]}>{row.v2}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── 3. Invest Keypad Sheet ────────────────────────────────────────────────────
export function InvestKeypadSheet({
  visible,
  fund,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  fund: FundItem;
  onClose: () => void;
  onConfirm: (amount: string) => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [val, setVal] = useState('50000');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  const presets = [
    { label: '5K', val: '5000' },
    { label: '10K', val: '10000' },
    { label: '25K', val: '25000' },
    { label: '50K', val: '50000' },
  ];

  const tap = (k: string) => {
    if (k === '⌫') {
      setVal(v => v.slice(0, -1) || '0');
    } else if (val === '0') {
      setVal(k === '000' ? '0' : k);
    } else if (val.length < 9) {
      setVal(v => v + k);
    }
  };

  const num = parseInt(val || '0', 10);
  const estMonthly = Math.round((num * ((fund.yieldPct ?? 12.8) / 100)) / 12);

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Investment Amount
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: theme.MUTED, marginTop: 2 }}>
                {fund.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.MUTED, letterSpacing: 0.8 }}>
              PKR
            </Text>
            <Text style={[styles.largeAmount, { color: theme.TEXT }]}>
              {num.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 11, color: theme.MUTED, marginTop: 4 }}>
              Est. yield:{' '}
              <Text style={{ color: theme.GREEN, fontWeight: '700' }}>
                +PKR {estMonthly.toLocaleString()} / mo
              </Text>
            </Text>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            {presets.map(p => (
              <TouchableOpacity
                key={p.label}
                onPress={() => setVal(p.val)}
                style={[styles.presetBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.presetText, { color: theme.TEXT }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Keypad */}
          <View style={styles.keypadGrid}>
            {keys.map(k => (
              <TouchableOpacity
                key={k}
                activeOpacity={0.7}
                onPress={() => tap(k)}
                style={[styles.keyBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.keyBtnText, { color: theme.TEXT }]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onConfirm(val)}
            style={[styles.primaryBtn, { backgroundColor: theme.TEXT, marginTop: 12 }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
              Invest PKR {num.toLocaleString()} →
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── 4. Order Execution Success Modal ──────────────────────────────────────────
export function ExecSuccessModal({
  visible,
  fundName,
  units,
  amount,
  onClose,
}: {
  visible: boolean;
  fundName: string;
  units: string;
  amount: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();

  return (
    <AnimatedModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.centerBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.successCard, { backgroundColor: theme.CARD }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.successIconBox, { backgroundColor: theme.GREEN + '20' }]}>
            <Feather name="check" size={32} color={theme.GREEN} />
          </View>

          <Text style={[styles.successBadge, { color: theme.GREEN }]}>
            ORDER EXECUTED SUCCESSFULLY
          </Text>
          <Text style={[styles.successFund, { color: theme.TEXT }]}>
            {fundName}
          </Text>
          <Text style={[styles.successDesc, { color: theme.MUTED }]}>
            {units} units allocated at current NAV.{'\n'}Settlement reference logged via CDC.
          </Text>

          <View style={[styles.investedAmtRow, { backgroundColor: theme.MODAL }]}>
            <Text style={{ fontSize: 11, color: theme.MUTED }}>Invested Amount</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.GREEN }}>
              PKR {parseInt(amount || '0', 10).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onClose}
            style={[styles.primaryBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
              View Portfolio
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── 5. Biometric Verification Sheet ───────────────────────────────────────────
export function BiometricSheet({
  visible,
  onClose,
  onComplete,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanning(false);
      setDone(false);
    }
  }, [visible]);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setDone(true);
    }, 2200);
  };

  return (
    <AnimatedModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.CARD,
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.MUTED + '35' }]} />

          <View style={styles.headerRow}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.ACTIVE, letterSpacing: 0.8 }}>
                NADRA LIVE BIOMETRIC
              </Text>
              <Text style={[styles.headerTitle, { color: theme.TEXT, marginTop: 2 }]}>
                Facial Live-Detection
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Circle */}
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <View
              style={[
                styles.viewfinder,
                {
                  borderColor: done
                    ? theme.GREEN
                    : scanning
                    ? theme.ACTIVE
                    : theme.MODAL,
                },
              ]}
            >
              {done ? (
                <Feather name="check" size={56} color={theme.GREEN} />
              ) : scanning ? (
                <ActivityIndicator size="large" color={theme.ACTIVE} />
              ) : (
                <Feather name="user-check" size={56} color={theme.MUTED} />
              )}
            </View>
            <Text
              style={[
                styles.biometricStatusText,
                {
                  color: done ? theme.GREEN : theme.MUTED,
                  fontWeight: done ? '700' : '400',
                },
              ]}
            >
              {done
                ? 'NADRA Biometric Verified ✓'
                : scanning
                ? 'Hold still. Scanning biometric traits…'
                : 'Position your face within the frame and blink to verify.'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={done ? onComplete : !scanning ? startScan : undefined}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: done ? theme.GREEN : theme.TEXT,
                opacity: scanning ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: done ? '#FFFFFF' : theme.BG }]}>
              {done
                ? 'Verification Complete →'
                : scanning
                ? 'Scanning…'
                : 'Start Biometric Scan'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

// ── 6. Verify Pending Dialog ──────────────────────────────────────────────────
export function VerifyPendingDialog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let id: any;
    if (visible) {
      setProgress(0);
      id = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(id);
            return 100;
          }
          return p + 12;
        });
      }, 180);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [visible]);

  const done = progress >= 100;

  return (
    <AnimatedModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.centerBackdrop} onPress={done ? onClose : undefined}>
        <Pressable
          style={[styles.successCard, { backgroundColor: theme.CARD }]}
          onPress={e => e.stopPropagation()}
        >
          <View
            style={[
              styles.successIconBox,
              { backgroundColor: theme.ACTIVE + '18' },
            ]}
          >
            <ActivityIndicator size="small" color={theme.ACTIVE} />
          </View>

          <Text style={[styles.successFund, { color: theme.TEXT, marginBottom: 6 }]}>
            {done ? 'Verification Complete' : 'Verifying Credentials'}
          </Text>
          <Text style={[styles.successDesc, { color: theme.MUTED, marginBottom: 20 }]}>
            {done
              ? 'NADRA and 1Link records confirmed.'
              : 'Verifying credentials with NADRA and 1Link...'}
          </Text>

          <View style={[styles.progressTrack, { backgroundColor: theme.MODAL }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.ACTIVE, width: `${progress}%` },
              ]}
            />
          </View>
          <Text style={{ fontSize: 10, color: theme.MUTED, marginTop: 8, textAlign: 'center' }}>
            {progress}% complete
          </Text>

          {done && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onClose}
              style={[styles.primaryBtn, { backgroundColor: theme.TEXT, marginTop: 18 }]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.BG }]}>
                Continue →
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 52,
  },
  largeValueSub: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 8,
    marginBottom: 16,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPills: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  stepperDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  snapBtn: {
    flex: 1,
    height: 38,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  compareHeaders: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  compareColHeader: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  colTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  colSub: {
    fontSize: 10,
  },
  compareTable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  compareTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableVal: {
    fontSize: 12,
    fontWeight: '700',
    width: 90,
    textAlign: 'center',
  },
  largeAmount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    height: 36,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  keyBtn: {
    width: '31.5%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  successCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successBadge: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  successFund: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  investedAmtRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  viewfinder: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  biometricStatusText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
