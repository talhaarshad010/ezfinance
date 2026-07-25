import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';

interface CoinOption {
  symbol: string;
  name: string;
  priceUSD: number;
}

const COINS: CoinOption[] = [
  { symbol: 'BTC', name: 'Bitcoin', priceUSD: 64231.5 },
  { symbol: 'ETH', name: 'Ethereum', priceUSD: 3450.2 },
  { symbol: 'SOL', name: 'Solana', priceUSD: 148.8 },
  { symbol: 'USDT', name: 'Tether USD', priceUSD: 1.0 },
];

export const BuyCryptoScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('500');
  const [selectedCoin, setSelectedCoin] = useState<CoinOption>(COINS[0]);
  const [paymentMethod, setPaymentMethod] = useState('Alfalah Visa **** 4892');
  const [isLoading, setIsLoading] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const receiveEstimate =
    selectedCoin.priceUSD > 0
      ? (numAmount / selectedCoin.priceUSD).toFixed(5)
      : '0.00000';

  const handleExecuteOrder = () => {
    if (numAmount <= 0) {
      showToast('Please enter a valid purchase amount', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast(
        `Successfully purchased ${receiveEstimate} ${selectedCoin.symbol}!`,
        'success',
        'Trade Executed',
      );
      navigation.goBack();
    }, 1200);
  };

  const addAmountChip = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
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
              Crypto Market
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
            Buy & Swap Crypto
          </Text>
          <Text style={[styles.headerSub, { color: theme.MUTED }]}>
            Purchase digital assets with instant fiat settlement.
          </Text>
        </View>

        {/* Coin Selection Selector */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            SELECT TARGET ASSET
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coinPillsRow}
          >
            {COINS.map(coin => {
              const isSel = selectedCoin.symbol === coin.symbol;
              return (
                <TouchableOpacity
                  key={coin.symbol}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCoin(coin)}
                  style={[
                    styles.coinPill,
                    {
                      backgroundColor: isSel
                        ? theme.TEXT
                        : theme.CARD,
                      borderColor: isSel ? theme.TEXT : theme.BORDER,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.coinSymbolText,
                      { color: isSel ? theme.BG : theme.TEXT },
                    ]}
                  >
                    {coin.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.coinNameText,
                      { color: isSel ? theme.BG : theme.MUTED },
                    ]}
                  >
                    {coin.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Exchange Trade Cards Container */}
        <View style={styles.sectionMargin}>
          {/* YOU PAY CARD */}
          <View style={[styles.tradeCard, { backgroundColor: theme.CARD }]}>
            <View style={styles.tradeCardHeader}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                YOU PAY (USD $)
              </Text>
              <Text style={[styles.walletBalanceText, { color: theme.MUTED }]}>
                Balance: $12,450.00
              </Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={[styles.currencyPrefix, { color: theme.MUTED }]}>
                $
              </Text>
              <TextInput
                style={[styles.amountInput, { color: theme.TEXT }]}
                placeholder="0.00"
                placeholderTextColor={theme.MUTED}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Quick Amount Chips */}
            <View style={styles.chipsRow}>
              {[100, 250, 500, 1000].map(val => (
                <TouchableOpacity
                  key={val}
                  activeOpacity={0.7}
                  onPress={() => addAmountChip(val)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: theme.MODAL },
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.TEXT }]}>
                    +${val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Floating Swap Divider Button */}
          <View style={styles.swapDividerWrap}>
            <View
              style={[
                styles.swapCircle,
                { backgroundColor: theme.TEXT, borderColor: theme.BG },
              ]}
            >
              <Feather name="arrow-down" size={16} color={theme.BG} />
            </View>
          </View>

          {/* YOU RECEIVE CARD */}
          <View style={[styles.tradeCard, { backgroundColor: theme.CARD }]}>
            <View style={styles.tradeCardHeader}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                YOU RECEIVE (ESTIMATED)
              </Text>
              <View
                style={[
                  styles.rateBadge,
                  { backgroundColor: `${theme.GREEN}15` },
                ]}
              >
                <Text style={[styles.rateBadgeText, { color: theme.GREEN }]}>
                  Best Rate
                </Text>
              </View>
            </View>

            <View style={styles.amountRow}>
              <TextInput
                style={[
                  styles.amountInput,
                  { color: theme.ACTIVE, flex: 1 },
                ]}
                value={receiveEstimate}
                editable={false}
              />
              <View
                style={[
                  styles.coinTag,
                  { backgroundColor: theme.MODAL },
                ]}
              >
                <Text style={[styles.coinTagText, { color: theme.TEXT }]}>
                  {selectedCoin.symbol}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trade Details Summary */}
        <View style={styles.sectionMargin}>
          <View style={[styles.summaryCard, { backgroundColor: theme.CARD }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.MUTED }]}>
                Exchange Rate
              </Text>
              <Text style={[styles.detailValue, { color: theme.TEXT }]}>
                1 {selectedCoin.symbol} = ${selectedCoin.priceUSD.toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.MUTED }]}>
                Network Processing Fee
              </Text>
              <Text style={[styles.detailValue, { color: theme.GREEN }]}>
                $0.00 (Instant Zero Fee)
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.MUTED }]}>
                Payment Source
              </Text>
              <Text style={[styles.detailValue, { color: theme.TEXT }]}>
                {paymentMethod}
              </Text>
            </View>
          </View>
        </View>

        {/* Action CTA Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleExecuteOrder}
          disabled={isLoading}
          style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.BG} />
          ) : (
            <Text style={[styles.submitText, { color: theme.BG }]}>
              Review & Buy {selectedCoin.symbol} →
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default BuyCryptoScreen;

const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  coinPillsRow: {
    gap: 8,
  },
  coinPill: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  coinSymbolText: {
    fontSize: 13,
    fontWeight: '800',
  },
  coinNameText: {
    fontSize: 10,
    marginTop: 1,
  },
  tradeCard: {
    borderRadius: 24,
    padding: 20,
  },
  tradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  walletBalanceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rateBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  rateBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: '800',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  chipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  swapDividerWrap: {
    alignItems: 'center',
    marginVertical: -16,
    zIndex: 10,
  },
  swapCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  coinTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  coinTagText: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
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
});
