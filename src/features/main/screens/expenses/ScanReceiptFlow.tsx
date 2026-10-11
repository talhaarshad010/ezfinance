import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import { AnimatedModal } from '../../../../components/AnimatedModal';
import { BottomSheet } from '../../../../components';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../context/ToastContext';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { useUserMode } from '../../../../context/UserModeContext';

import ReceiptCameraScreen from './ReceiptCameraScreen';
import { scanReceipt, ReceiptScanResult } from '../../../../api/receiptApi';

// ── Types ───────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'camera' | 'processing' | 'review' | 'correction';

interface ScanReceiptFlowProps {
  visible: boolean;
  onClose: () => void;
}

// ── Processing overlay ──────────────────────────────────────────────────────

function ProcessingOverlay({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <AnimatedModal
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={procStyles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={[procStyles.content, { paddingBottom: insets.bottom + 32 }]}>
          <ActivityIndicator color="#FFF" size="large" />
          <Text style={procStyles.title}>Reading receipt…</Text>
          <Text style={procStyles.sub}>
            Extracting merchant, amount, date, and items.
          </Text>
        </View>
      </View>
    </AnimatedModal>
  );
}

const procStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ── Review sheet (dynamic version of OcrResultSheet) ────────────────────────

function ReviewSheet({
  visible,
  data,
  onAccept,
  onEdit,
  onClose,
}: {
  visible: boolean;
  data: ReceiptScanResult;
  onAccept: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const fields = [
    { label: 'Merchant', value: data.merchant ?? '—', color: theme.TEXT },
    { label: 'NTN / Tax ID', value: data.taxId ?? '—', color: theme.TEXT },
    {
      label: 'Date',
      value: data.date
        ? new Date(data.date).toLocaleDateString('en-PK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
      color: theme.TEXT,
    },
    {
      label: 'Total',
      value: data.total != null ? `PKR ${data.total.toLocaleString()}` : '—',
      color: theme.RED,
    },
    {
      label: 'Tax',
      value: data.tax != null ? `PKR ${data.tax.toLocaleString()}` : '—',
      color: theme.MUTED,
    },
    { label: 'Category', value: data.category ?? 'Other', color: theme.ACTIVE },
  ];

  return (
    <AnimatedModal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[revStyles.fullScreen, { backgroundColor: theme.BG }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.BG}
        />

        {/* Header */}
        <View style={[revStyles.header, { paddingTop: insets.top + 16 }]}>
          <View style={revStyles.flex1}>
            <Text style={[revStyles.eyebrow, { color: theme.ACTIVE }]}>
              OCR · RECEIPT PARSED
            </Text>
            <Text style={[revStyles.title, { color: theme.TEXT }]}>
              Verify Extracted Data
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[revStyles.closeBtn, { backgroundColor: theme.MODAL }]}
          >
            <Feather name="x" size={14} color={theme.MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={revStyles.body}
        >
          {/* Receipt facsimile */}
          {data.items.length > 0 && (
            <View style={[revStyles.receiptCard, { backgroundColor: theme.CARD }]}>
              <Text style={[revStyles.receiptStore, { color: theme.TEXT }]}>
                {(data.merchant ?? 'RECEIPT').toUpperCase()}
              </Text>
              {data.taxId && (
                <Text style={[revStyles.receiptMeta, { color: theme.MUTED }]}>
                  NTN: {data.taxId}
                </Text>
              )}
              {data.date && (
                <Text style={[revStyles.receiptMetaLeft, { color: theme.MUTED }]}>
                  {data.date}
                </Text>
              )}
              <View style={revStyles.receiptDivider} />
              {data.items.map((item, i) => (
                <View key={`${item.name}-${i}`} style={revStyles.receiptRow}>
                  <Text style={[revStyles.receiptItem, { color: theme.MUTED }]}>
                    {item.name}
                  </Text>
                  <Text style={[revStyles.receiptItem, { color: theme.TEXT }]}>
                    PKR {item.price.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={revStyles.receiptDivider} />
              <View style={revStyles.receiptRow}>
                <Text style={[revStyles.receiptTotal, { color: theme.TEXT }]}>
                  TOTAL
                </Text>
                <Text style={[revStyles.receiptTotal, { color: theme.RED }]}>
                  PKR {(data.total ?? 0).toLocaleString()}
                </Text>
              </View>
              {data.tax != null && (
                <View style={revStyles.receiptRow}>
                  <Text style={[revStyles.receiptItem, { color: theme.MUTED }]}>
                    Tax
                  </Text>
                  <Text style={[revStyles.receiptItem, { color: theme.MUTED }]}>
                    PKR {data.tax.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Confidence indicator */}
          <View
            style={[
              revStyles.confidenceBar,
              { backgroundColor: theme.CARD },
            ]}
          >
            <View style={revStyles.confidenceRow}>
              <Text style={[revStyles.confidenceLabel, { color: theme.MUTED }]}>
                Accuracy
              </Text>
              <Text
                style={[
                  revStyles.confidenceValue,
                  {
                    color:
                      data.confidence >= 0.8
                        ? theme.GREEN
                        : data.confidence >= 0.5
                        ? '#FFA500'
                        : theme.RED,
                  },
                ]}
              >
                {Math.round(data.confidence * 100)}%
              </Text>
            </View>
            <View
              style={[revStyles.progressTrack, { backgroundColor: theme.MODAL }]}
            >
              <View
                style={[
                  revStyles.progressFill,
                  {
                    width: `${Math.round(data.confidence * 100)}%`,
                    backgroundColor:
                      data.confidence >= 0.8
                        ? theme.GREEN
                        : data.confidence >= 0.5
                        ? '#FFA500'
                        : theme.RED,
                  },
                ]}
              />
            </View>
          </View>

          {/* Extracted fields */}
          <View style={[revStyles.fieldCard, { backgroundColor: theme.CARD }]}>
            {fields.map((field, i) => (
              <View
                key={field.label}
                style={[
                  revStyles.fieldRow,
                  i < fields.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[revStyles.fieldLabel, { color: theme.MUTED }]}>
                  {field.label}
                </Text>
                <Text style={[revStyles.fieldValue, { color: field.color }]}>
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            revStyles.footer,
            { backgroundColor: theme.BG, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onEdit}
            style={[revStyles.btn, { backgroundColor: theme.MODAL }]}
          >
            <Text style={[revStyles.btnText, { color: theme.TEXT }]}>
              Edit Fields
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onAccept}
            style={[revStyles.btn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[revStyles.btnText, { color: theme.BG }]}>
              Accept & Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );
}

const revStyles = StyleSheet.create({
  fullScreen: { flex: 1 },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 16, paddingBottom: 24 },

  // Receipt card
  receiptCard: { borderRadius: 20, padding: 16, marginBottom: 14 },
  receiptStore: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  receiptMeta: { fontSize: 9, textAlign: 'center', marginBottom: 8 },
  receiptMetaLeft: { fontSize: 9, marginBottom: 8 },
  receiptDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128,128,128,0.3)',
    marginVertical: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptItem: { fontSize: 9 },
  receiptTotal: { fontSize: 10, fontWeight: '700' },

  // Confidence
  confidenceBar: { borderRadius: 16, padding: 14, marginBottom: 14 },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: { fontSize: 11, fontWeight: '600' },
  confidenceValue: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },

  // Fields
  fieldCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  fieldLabel: { fontSize: 11 },
  fieldValue: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 190,
    textAlign: 'right',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '700' },
});

// ── Correction sheet (dynamic version of OcrCorrectionSheet) ────────────────

function CorrectionSheet({
  visible,
  data,
  onSave,
  onClose,
}: {
  visible: boolean;
  data: ReceiptScanResult;
  onSave: (corrected: ReceiptScanResult) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [merchant, setMerchant] = useState(data.merchant ?? '');
  const [amount, setAmount] = useState(String(data.total ?? ''));
  const [date, setDate] = useState(data.date ?? '');
  const [ntn, setNtn] = useState(data.taxId ?? '');
  const [category, setCategory] = useState(data.category ?? 'Other');

  const fields = [
    { label: 'MERCHANT NAME', value: merchant, setter: setMerchant },
    { label: 'TOTAL AMOUNT', value: amount, setter: setAmount },
    { label: 'DATE (YYYY-MM-DD)', value: date, setter: setDate },
    { label: 'NTN / TAX ID', value: ntn, setter: setNtn },
    { label: 'CATEGORY', value: category, setter: setCategory },
  ];

  function handleSave() {
    onSave({
      ...data,
      merchant: merchant.trim() || null,
      total: parseFloat(amount.replace(/,/g, '')) || null,
      date: date.trim() || null,
      taxId: ntn.trim() || null,
      category: category.trim() || 'Other',
    });
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Fix Extracted Fields"
      subtitle="OCR CORRECTION MODE"
    >
      {fields.map(f => (
        <View key={f.label} style={corrStyles.field}>
          <Text style={[corrStyles.label, { color: theme.MUTED }]}>
            {f.label}
          </Text>
          <View
            style={[
              corrStyles.inputWrap,
              {
                backgroundColor: theme.MODAL,
                borderColor: 'rgba(255,160,0,0.28)',
              },
            ]}
          >
            <TextInput
              value={f.value}
              onChangeText={f.setter}
              style={[corrStyles.input, { color: theme.TEXT }]}
              placeholderTextColor={theme.MUTED}
            />
          </View>
        </View>
      ))}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSave}
        style={[corrStyles.saveBtn, { backgroundColor: theme.TEXT }]}
      >
        <Text style={[corrStyles.saveBtnText, { color: theme.BG }]}>
          Save Corrections
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const corrStyles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: { fontSize: 14, paddingVertical: 8 },
  saveBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
});

// ── Main flow orchestrator ──────────────────────────────────────────────────

export default function ScanReceiptFlow({
  visible,
  onClose,
}: ScanReceiptFlowProps) {
  const { showToast } = useToast();
  const txActions = useTransactionActions();
  const userMode = useUserMode();

  const [phase, setPhase] = useState<Phase>('idle');
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  // Reset when the flow opens
  React.useEffect(() => {
    if (visible) {
      setPhase('camera');
      setScanResult(null);
    } else {
      setPhase('idle');
    }
  }, [visible]);

  // ── Capture handlers ──

  const processImage = useCallback(
    async (imageUri: string) => {
      setPhase('processing');
      try {
        const result = await scanReceipt(imageUri);
        setScanResult(result);
        setPhase('review');
      } catch (err: any) {
        console.error('[ScanReceipt] OCR failed:', err);
        showToast(
          err?.message ?? 'Could not read receipt. Try again or enter manually.',
          'error',
          'Scan Failed',
        );
        setPhase('camera');
      }
    },
    [showToast],
  );

  const handleGalleryPick = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      if (result.assets?.[0]?.uri) {
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[ScanReceipt] Gallery pick failed:', err);
    }
  }, [processImage]);

  // ── Accept handler ──

  const handleAccept = useCallback(
    async (data: ReceiptScanResult) => {
      if (!data.total || data.total <= 0) {
        showToast('Total amount is required.', 'error', 'Missing Amount');
        return;
      }

      const accountId = userMode.bankAccounts[0]?.id;
      if (!accountId) {
        // Hand off to the transaction sheet so the user can link an account
        onClose();
        userMode.openTxSheet({
          source: 'scan',
          type: 'expense',
          category: data.category ?? 'Other',
          amount: data.total,
          note: data.merchant ?? undefined,
          date: data.date ? new Date(data.date) : new Date(),
        });
        return;
      }

      try {
        await txActions.create({
          type: 'expense',
          amount: data.total,
          category: data.category ?? 'Other',
          note: data.merchant ?? undefined,
          accountId,
          date: data.date ? new Date(data.date) : new Date(),
          source: 'scan',
        });

        showToast(
          `Receipt saved: PKR ${data.total.toLocaleString()}`,
          'success',
          'Transaction Recorded',
        );
        onClose();
      } catch (err: any) {
        showToast(
          err?.message ?? 'Failed to save transaction.',
          'error',
          'Save Failed',
        );
      }
    },
    [txActions, userMode, showToast, onClose],
  );

  // ── Correction handler ──

  const handleCorrectionSave = useCallback(
    (corrected: ReceiptScanResult) => {
      setScanResult(corrected);
      setPhase('review');
    },
    [],
  );

  if (!visible) return null;

  return (
    <>
      {/* Phase 1: Camera capture */}
      <ReceiptCameraScreen
        visible={phase === 'camera'}
        onCapture={processImage}
        onGallery={handleGalleryPick}
        onClose={onClose}
      />

      {/* Phase 2: Processing indicator */}
      <ProcessingOverlay visible={phase === 'processing'} />

      {/* Phase 3: Review extracted data */}
      {scanResult && (
        <ReviewSheet
          visible={phase === 'review'}
          data={scanResult}
          onAccept={() => handleAccept(scanResult)}
          onEdit={() => setPhase('correction')}
          onClose={() => setPhase('camera')}
        />
      )}

      {/* Phase 4: Edit / correct extracted fields */}
      {scanResult && (
        <CorrectionSheet
          visible={phase === 'correction'}
          data={scanResult}
          onSave={handleCorrectionSave}
          onClose={() => setPhase('review')}
        />
      )}
    </>
  );
}
