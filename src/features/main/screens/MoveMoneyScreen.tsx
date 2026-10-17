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
import { ENVELOPE_BALANCES } from '../../../constants/envelopes';

/**
 * Envelope rebalancing — move money from one envelope to another.
 * Reached from the over-budget alert and the quick rebalance sheet.
 */
export const MoveMoneyScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [sourceIdx, setSourceIdx] = useState(0);
  const [destIdx, setDestIdx] = useState(1);
  const [amount, setAmount] = useState(5000);

  const source = ENVELOPE_BALANCES[sourceIdx];
  const dest = ENVELOPE_BALANCES[destIdx];
  const newSourceBal = source.available - amount;
  const newDestBal = dest.available + amount;

  const confirm = () => {
    showToast(
      `PKR ${amount.toLocaleString()} moved from ${source.label} to ${dest.label}.`,
      'success',
      'Categories Rebalanced',
    );
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.MODAL }]}
          >
            <Feather name="chevron-left" size={18} color={theme.TEXT} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.eyebrow, { color: theme.MUTED }]}>
              CATEGORY REBALANCING
            </Text>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Move Money
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* From */}
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
              FROM CATEGORY
            </Text>
            {ENVELOPE_BALANCES.map((e, i) => {
              const selected = sourceIdx === i;
              return (
                <TouchableOpacity
                  key={e.label}
                  activeOpacity={0.85}
                  disabled={i === destIdx}
                  onPress={() => setSourceIdx(i)}
                  style={[
                    styles.envRow,
                    {
                      borderColor: selected ? theme.ACTIVE : theme.BORDER,
                      backgroundColor: selected
                        ? `${theme.ACTIVE}14`
                        : 'transparent',
                      opacity: i === destIdx ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.envLabel,
                      { color: selected ? theme.ACTIVE : theme.TEXT },
                    ]}
                  >
                    {e.label}
                  </Text>
                  <Text
                    style={[
                      styles.envValue,
                      { color: e.available < 0 ? theme.RED : theme.MUTED },
                    ]}
                  >
                    PKR {Math.abs(e.available).toLocaleString()}
                    {e.available < 0 ? ' overdrawn' : ' avail'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount stepper */}
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
              MOVE AMOUNT
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAmount(a => Math.max(500, a - 500))}
                style={[styles.stepBtn, { borderColor: theme.BORDER }]}
              >
                <Feather name="minus" size={16} color={theme.TEXT} />
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: theme.TEXT }]}>
                PKR {amount.toLocaleString()}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAmount(a => a + 500)}
                style={[styles.stepBtn, { borderColor: theme.BORDER }]}
              >
                <Feather name="plus" size={16} color={theme.TEXT} />
              </TouchableOpacity>
            </View>
          </View>

          {/* To */}
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.cardLabel, { color: theme.MUTED }]}>
              TO CATEGORY
            </Text>
            {ENVELOPE_BALANCES.map((e, i) => {
              const selected = destIdx === i;
              return (
                <TouchableOpacity
                  key={e.label}
                  activeOpacity={0.85}
                  disabled={i === sourceIdx}
                  onPress={() => setDestIdx(i)}
                  style={[
                    styles.envRow,
                    {
                      borderColor: selected ? theme.GREEN : theme.BORDER,
                      backgroundColor: selected
                        ? `${theme.GREEN}14`
                        : 'transparent',
                      opacity: i === sourceIdx ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.envLabel,
                      { color: selected ? theme.GREEN : theme.TEXT },
                    ]}
                  >
                    {e.label}
                  </Text>
                  <Text style={[styles.envValue, { color: theme.MUTED }]}>
                    PKR {Math.abs(e.available).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Result preview */}
          <View
            style={[
              styles.preview,
              {
                backgroundColor: `${theme.GREEN}14`,
                borderColor: `${theme.GREEN}33`,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.GREEN }]}>
              RESULT PREVIEW
            </Text>
            <Text style={[styles.previewText, { color: theme.TEXT }]}>
              <Text style={{ color: theme.ACTIVE, fontWeight: '700' }}>
                {source.label}
              </Text>{' '}
              → PKR {Math.abs(newSourceBal).toLocaleString()}
              {newSourceBal < 0 ? ' ⚠ overdrawn' : ' remaining'}
            </Text>
            <Text
              style={[styles.previewText, { color: theme.TEXT, marginTop: 4 }]}
            >
              <Text style={{ color: theme.GREEN, fontWeight: '700' }}>
                {dest.label}
              </Text>{' '}
              balanced to{' '}
              <Text
                style={{ color: newDestBal >= 0 ? theme.GREEN : theme.RED }}
              >
                +PKR {Math.abs(newDestBal).toLocaleString()}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={confirm}
            style={[styles.confirmBtn, { backgroundColor: theme.ACTIVE }]}
          >
            <Text style={styles.confirmText}>Confirm Move</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default MoveMoneyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },

  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  envLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  envValue: { fontSize: 11, fontWeight: '700' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.5,
  },

  preview: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  previewText: { fontSize: 12, lineHeight: 18 },

  confirmBtn: {
    height: 54,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
