import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import {
  SUPPORTED_BANKS,
  MOCK_STATEMENT_TXS,
  LedgerTransaction,
} from '../../../../constants/ledgerData';
import { AnimatedModal } from '../../../../components/AnimatedModal';

interface StatementImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (importedTxs: LedgerTransaction[]) => void;
}

type ImportStep = 'upload' | 'processing' | 'review';

interface StatementItem {
  id: number;
  date: string;
  merchant: string;
  cat: string;
  amount: number;
  checked: boolean;
  dup: boolean;
}

export default function StatementImportModal({
  visible,
  onClose,
  onImport,
}: StatementImportModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<ImportStep>('upload');
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<StatementItem[]>(
    MOCK_STATEMENT_TXS.map((t: StatementItem) => ({ ...t })),
  );

  useEffect(() => {
    if (visible) {
      setStep('upload');
      setProgress(0);
      setRows(MOCK_STATEMENT_TXS.map((t: StatementItem) => ({ ...t })));
    }
  }, [visible]);

  useEffect(() => {
    let timer: any;
    if (step === 'processing') {
      setProgress(15);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(timer);
            setTimeout(() => setStep('review'), 400);
            return 100;
          }
          return prev + 18;
        });
      }, 150);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  const toggleCheck = (id: number) => {
    setRows(prev =>
      prev.map((r: StatementItem) => (r.id === id ? { ...r, checked: !r.checked } : r)),
    );
  };

  const selectedRows = rows.filter((r: StatementItem) => r.checked);
  const selectedCount = selectedRows.length;

  const handleConfirm = () => {
    const converted: LedgerTransaction[] = selectedRows.map((r: StatementItem, i: number) => ({
      id: Date.now() + i,
      icon: r.cat === 'Salary' ? 'arrow-up-right' : 'shopping-cart',
      label: r.merchant,
      account: 'Bank Statement Import',
      category: r.cat || 'General',
      amount: r.amount,
      dateGroup: 'TODAY',
      time: '12:00 PM',
      type: r.amount > 0 ? 'income' : 'expense',
      smsRef: `STMT-${Date.now()}-${i}`,
      status: 'Imported',
    }));
    onImport(converted);
    onClose();
  };

  return (
    <AnimatedModal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.BG,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {/* Navigation Header */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={step === 'upload' ? onClose : () => setStep('upload')}
            style={[styles.navBtn, { backgroundColor: theme.MODAL }]}
          >
            <Feather
              name={step === 'upload' ? 'x' : 'chevron-left'}
              size={18}
              color={theme.TEXT}
            />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.TEXT }]}>
            {step === 'upload'
              ? 'Import Bank Statement'
              : step === 'processing'
              ? 'Parsing Statement'
              : 'Review Transactions'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.uploadScroll}
          >
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setStep('processing')}
              style={[
                styles.dropzone,
                {
                  borderColor: theme.MUTED + '55',
                  backgroundColor: theme.CARD,
                },
              ]}
            >
              <View style={[styles.dropIconBox, { backgroundColor: theme.MODAL }]}>
                <Feather name="file-text" size={32} color={theme.ACTIVE} />
              </View>
              <Text style={[styles.dropTitle, { color: theme.TEXT }]}>
                Select PDF or CSV statement
              </Text>
              <Text style={[styles.dropSubtitle, { color: theme.MUTED }]}>
                Tap to select file from your device
              </Text>
            </TouchableOpacity>

            {/* Privacy notice */}
            <View
              style={[
                styles.privacyBox,
                {
                  backgroundColor: theme.GREEN + '14',
                  borderColor: theme.GREEN + '30',
                },
              ]}
            >
              <Feather name="shield" size={18} color={theme.GREEN} />
              <Text style={[styles.privacyText, { color: theme.TEXT }]}>
                We only parse transactions in this file. Your bank login details and personal identity remain 100% on your device.
              </Text>
            </View>

            {/* Supported Banks */}
            <Text style={[styles.banksSectionTitle, { color: theme.MUTED }]}>
              SUPPORTED BANKS
            </Text>
            <View style={styles.banksWrap}>
              {SUPPORTED_BANKS.map((b: string) => (
                <View
                  key={b}
                  style={[styles.bankPill, { backgroundColor: theme.CARD }]}
                >
                  <Text style={[styles.bankPillText, { color: theme.MUTED }]}>
                    {b}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* STEP 2: PROCESSING */}
        {step === 'processing' && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.ACTIVE} style={{ marginBottom: 20 }} />
            <Text style={[styles.processingTitle, { color: theme.TEXT }]}>
              Reading your statement…
            </Text>
            <Text style={[styles.processingSub, { color: theme.MUTED }]}>
              Extracting merchants, dates, and amounts with automated duplicate detection.
            </Text>

            <View style={[styles.progressTrack, { backgroundColor: theme.CARD }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.ACTIVE,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPct, { color: theme.MUTED }]}>
              {progress}% processed
            </Text>
          </View>
        )}

        {/* STEP 3: REVIEW */}
        {step === 'review' && (
          <View style={{ flex: 1 }}>
            {/* Header info badge */}
            <View style={styles.reviewSubHeader}>
              <View>
                <Text style={{ fontSize: 11, color: theme.MUTED }}>
                  {rows.length} found · Total PKR 1,18,400
                </Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: theme.ACTIVE }]}>
                <Text style={styles.countBadgeText}>
                  {selectedCount} Selected
                </Text>
              </View>
            </View>

            {/* List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {rows.map((r: StatementItem) => {
                const isInc = r.amount > 0;
                return (
                  <TouchableOpacity
                    key={r.id}
                    activeOpacity={0.8}
                    onPress={() => toggleCheck(r.id)}
                    style={[
                      styles.rowCard,
                      {
                        borderBottomColor: theme.BORDER,
                        opacity: r.checked ? 1 : 0.45,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: r.checked ? theme.GREEN : 'transparent',
                          borderColor: r.checked ? theme.GREEN : theme.MUTED + '60',
                        },
                      ]}
                    >
                      {r.checked && <Feather name="check" size={13} color="#FFFFFF" />}
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <View style={styles.rowTop}>
                        <Text
                          numberOfLines={1}
                          style={[styles.rowMerchant, { color: theme.TEXT }]}
                        >
                          {r.merchant}
                        </Text>
                        <Text
                          style={[
                            styles.rowAmt,
                            { color: isInc ? theme.GREEN : theme.RED },
                          ]}
                        >
                          {isInc ? '+' : '−'} PKR {Math.abs(r.amount).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.rowTags}>
                        <Text style={[styles.rowDate, { color: theme.MUTED }]}>
                          {r.date}
                        </Text>
                        {r.cat ? (
                          <View style={[styles.catBadge, { backgroundColor: theme.CARD }]}>
                            <Text style={[styles.catBadgeText, { color: theme.MUTED }]}>
                              {r.cat}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.catBadge,
                              { backgroundColor: '#FF950020' },
                            ]}
                          >
                            <Text style={[styles.catBadgeText, { color: '#FF9500' }]}>
                              Uncategorized ⚠
                            </Text>
                          </View>
                        )}
                      </View>

                      {r.dup && (
                        <Text style={styles.dupWarning}>
                          ⚠ Duplicate — matches existing transaction on {r.date}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom Sticky CTA */}
            <View style={[styles.footer, { backgroundColor: theme.BG }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleConfirm}
                style={[styles.importBtn, { backgroundColor: theme.TEXT }]}
              >
                <Text style={[styles.importBtnText, { color: theme.BG }]}>
                  Add {selectedCount} Transactions →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  uploadScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dropIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dropTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropSubtitle: {
    fontSize: 12,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  banksSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  banksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  bankPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 30,
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
  progressPct: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
  },
  reviewSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowMerchant: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  rowAmt: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  rowTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDate: {
    fontSize: 11,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dupWarning: {
    fontSize: 10,
    color: '#FF9500',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  importBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
