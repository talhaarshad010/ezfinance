import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Card } from '../../../components';
import { useAppSelector } from '../../../store/hooks';
import { getBankById } from '../../../constants/pakistaniBanks';
import { ScreenBackHeader } from '../../../components/ScreenBackHeader';
import type { BankAccount } from '../../../store/slices/bankAccountsSlice';
import { Image } from 'react-native';

const TransactionDetailScreen = () => {
  const route = useRoute<any>();
  const { transaction } = route.params;

  const { accounts } = useAppSelector(state => state.bankAccounts);
  // A user's account is passed in; sample accounts are looked up.
  const account: BankAccount | undefined =
    route.params.account ?? accounts.find(a => a.id === transaction.accountId);
  const bank = account ? getBankById(account.bankId) : null;

  const isIncome = transaction.type === 'income';

  const formatCurrency = (amount: number) =>
    `PKR ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d.getHours() === 0 && d.getMinutes() === 0) return null;
    return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
    <ScreenBackHeader title="Transaction" back="Account" />
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Amount Hero */}
      <View style={styles.amountSection}>
        <View style={[styles.amountIcon, { backgroundColor: isIncome ? '#E8F5E9' : '#FDECEA' }]}>
          <Feather
            name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
            size={32}
            color={isIncome ? '#2E7D32' : '#D32F2F'}
          />
        </View>
        <Typography
          variant="h1"
          weight="700"
          color={isIncome ? '#2E7D32' : '#D32F2F'}
          style={styles.amountText}
        >
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Typography>
        <View style={[styles.typeBadge, { backgroundColor: isIncome ? '#E8F5E9' : '#FDECEA' }]}>
          <Typography
            variant="caption"
            weight="700"
            color={isIncome ? '#2E7D32' : '#D32F2F'}
          >
            {isIncome ? 'INCOME' : 'EXPENSE'}
          </Typography>
        </View>
      </View>

      {/* Details Card */}
      <Card style={styles.detailsCard}>
        <DetailRow
          icon="file-text"
          label="Description"
          value={transaction.description}
        />
        <View style={styles.divider} />
        <DetailRow
          icon="calendar"
          label="Date"
          value={formatDate(transaction.date)}
        />
        {transaction.category ? (
          <>
            <View style={styles.divider} />
            <DetailRow
              icon="tag"
              label="Category"
              value={transaction.category}
            />
          </>
        ) : null}
        <View style={styles.divider} />
        <DetailRow
          icon="repeat"
          label="Type"
          value={isIncome ? 'Income / Credit' : 'Expense / Debit'}
        />
        <View style={styles.divider} />
        <DetailRow
          icon="hash"
          label="Transaction ID"
          value={transaction.id?.substring(0, 16) || 'N/A'}
        />
        {account && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                 <Feather name="credit-card" size={16} color="#999" />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="caption" color="#999" weight="600" style={{ letterSpacing: 0.5 }}>
                  Linked Account
                </Typography>
                <View style={styles.accountRef}>
                  <View style={styles.bankLogoSmall}>
                    {bank?.logo ? (
                      <Image source={{ uri: bank.logo }} style={styles.imageFull} resizeMode="contain" />
                    ) : (
                      <Typography variant="caption" weight="700" style={{ fontSize: 8 }}>
                        {account.bankAbbreviation}
                      </Typography>
                    )}
                  </View>
                  <Typography variant="body" weight="600">
                    {account.bankName} • {account.accountTitle}
                  </Typography>
                </View>
              </View>
            </View>
          </>
        )}
      </Card>
    </ScrollView>
    </View>
  );
};

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Feather name={icon} size={16} color="#999" />
    </View>
    <View style={{ flex: 1 }}>
      <Typography variant="caption" color="#999" weight="600" style={{ letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body" weight="600" style={{ marginTop: 2 }}>
        {value}
      </Typography>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  amountIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 36,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  accountRef: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bankLogoSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFull: {
    width: '100%',
    height: '100%',
  },
});

export default TransactionDetailScreen;
