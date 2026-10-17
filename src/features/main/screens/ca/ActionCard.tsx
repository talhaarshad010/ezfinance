import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../../context/ThemeContext';
import { fullAmt } from '../../../../utils/format';
import { CAT_META } from '../../newUser/shared';
import { parsePkrNumber, TX_CATEGORIES, toIsoDate, type CaExecutableAction, type ValidTxCategory } from './caActions';

export type RowStatus = 'pending' | 'saved' | 'queued' | 'failed';

export interface ProposalRow {
  action: CaExecutableAction;
  /** Account for a transaction. */
  accountId?: string;
  /** Goal for a contribution. */
  goalId?: string;
  status: RowStatus;
  error?: string;
}

export interface Proposal {
  rows: ProposalRow[];
  state: 'pending' | 'saving' | 'done' | 'cancelled';
}

interface Props {
  proposal: Proposal;
  accounts: { id: string; label: string }[];
  goals: { id: string; name: string }[];
  onChange: (index: number, patch: Partial<ProposalRow>) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onAddAccount: () => void;
}

const EXPENSE_CATS = TX_CATEGORIES.filter(c => c !== 'Salary');
const INCOME_CATS: ValidTxCategory[] = ['Salary', 'Other'];

function dateLabel(iso?: string) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (!iso || iso === toIsoDate(today)) return 'Today';
  if (iso === toIsoDate(yesterday)) return 'Yesterday';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: y === today.getFullYear() ? undefined : 'numeric' });
}

/** A missing account / goal has to be chosen before the proposal can be confirmed. */
export function rowIsReady(row: ProposalRow) {
  if (!(row.action.amount > 0)) return false;
  if (row.action.kind === 'add_transaction') return !!row.accountId;
  if (row.action.kind === 'add_contribution') return !!row.goalId;
  return true;
}

/**
 * What the CA is about to change, shown under its reply. Nothing is saved until Confirm; a row the
 * server turns down stays here with the reason and can be retried.
 */
export function ActionCard({ proposal, accounts, goals, onChange, onConfirm, onCancel, onAddAccount }: Props) {
  const { theme } = useTheme();
  const editable = proposal.state === 'pending';
  // The row whose amount is being typed over, and the text so far.
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);

  function finishEditing() {
    if (!editing) return;
    const amount = parsePkrNumber(editing.text);
    const row = proposal.rows[editing.index];
    if (row && amount && amount > 0 && amount <= 1e9) {
      onChange(editing.index, { action: { ...row.action, amount: Math.round(amount * 100) / 100 }, status: 'pending', error: undefined });
    }
    setEditing(null);
  }
  const remaining = proposal.rows.filter(r => r.status !== 'saved' && r.status !== 'queued');
  const ready = remaining.every(rowIsReady);
  const needsAccount = proposal.rows.some(r => r.action.kind === 'add_transaction') && accounts.length === 0;
  const failed = proposal.rows.some(r => r.status === 'failed');

  return (
    <View style={[styles.card, { backgroundColor: theme.CARD, borderColor: theme.BORDER }]}>
      {proposal.rows.map((row, i) => {
        const a = row.action;
        const income = a.kind === 'add_transaction' && a.txType === 'income';
        const title =
          a.kind === 'add_transaction'
            ? `${income ? 'Income' : 'Expense'}${a.note ? ` · ${a.note}` : ''}`
            : a.kind === 'add_goal'
            ? `New goal · ${a.goalName}`
            : a.kind === 'set_budget'
            ? 'Monthly budget'
            : `Add to goal${row.goalId ? ` · ${goals.find(g => g.id === row.goalId)?.name ?? a.goalName}` : ''}`;
        const amountColor = a.kind === 'add_transaction' && !income ? theme.RED : theme.GREEN;
        const cats = income ? INCOME_CATS : EXPENSE_CATS;
        return (
          <View key={i} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: theme.BORDER }]}>
            <View style={styles.rowHead}>
              <Text style={[styles.title, { color: theme.TEXT }]} numberOfLines={1}>{title}</Text>
              {editing?.index === i ? (
                <TextInput
                  autoFocus
                  value={editing.text}
                  onChangeText={text => setEditing({ index: i, text })}
                  onBlur={finishEditing}
                  onSubmitEditing={finishEditing}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={[styles.amount, styles.amountInput, { color: theme.TEXT, borderColor: theme.BORDER }]}
                />
              ) : (
                <TouchableOpacity
                  disabled={!editable || row.status === 'saved' || row.status === 'queued'}
                  onPress={() => setEditing({ index: i, text: a.amount > 0 ? String(a.amount) : '' })}
                  accessibilityLabel={`Amount PKR ${fullAmt(a.amount)}. Tap to edit.`}
                  style={styles.amountTap}
                >
                  {a.amount > 0 ? (
                    <Text style={[styles.amount, { color: amountColor }]}>
                      {a.kind === 'add_transaction' ? (income ? '+' : '−') : ''}PKR {fullAmt(a.amount)}
                    </Text>
                  ) : (
                    <Text style={[styles.amount, { color: theme.ACTIVE }]}>Add target</Text>
                  )}
                  {editable && row.status !== 'saved' && row.status !== 'queued' && (
                    <Feather name="edit-2" size={11} color={theme.MUTED} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {a.kind === 'add_goal' && (
              <View style={styles.chips}>
                <View style={[styles.chip, { backgroundColor: theme.MODAL }]}>
                  <Feather name="flag" size={11} color={theme.MUTED} />
                  <Text style={[styles.chipText, { color: theme.TEXT }]}>
                    {a.deadline ? `By ${dateLabel(a.deadline)}` : 'No deadline'}
                  </Text>
                </View>
                {a.amount <= 0 && editable && (
                  <Text style={[styles.meta, { color: theme.MUTED }]}>Tap "Add target" to enter the amount.</Text>
                )}
              </View>
            )}

            {(a.kind === 'add_transaction' || a.kind === 'add_contribution') && (
              <View style={styles.chips}>
                <View style={[styles.chip, { backgroundColor: theme.MODAL }]}>
                  <Feather name="calendar" size={11} color={theme.MUTED} />
                  <Text style={[styles.chipText, { color: theme.TEXT }]}>{dateLabel(a.date)}</Text>
                </View>
                {a.kind === 'add_transaction' && a.category && (
                  <TouchableOpacity
                    disabled={!editable}
                    onPress={() =>
                      onChange(i, { action: { ...a, category: cats[(cats.indexOf(a.category!) + 1) % cats.length] } })
                    }
                    accessibilityLabel={`Category ${a.category}. Tap to change.`}
                    style={[styles.chip, { backgroundColor: `${CAT_META[a.category]?.color ?? theme.MUTED}1F` }]}
                  >
                    <Text style={[styles.chipText, { color: CAT_META[a.category]?.color ?? theme.MUTED, fontWeight: '700' }]}>
                      {a.category}
                    </Text>
                    {editable && <Feather name="refresh-cw" size={9} color={CAT_META[a.category]?.color ?? theme.MUTED} />}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {a.kind === 'add_transaction' && accounts.length > 0 && (accounts.length > 1 || !row.accountId) && editable && (
              <View style={styles.chips}>
                {accounts.map(acc => {
                  const on = acc.id === row.accountId;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => onChange(i, { accountId: acc.id })}
                      style={[styles.chip, { backgroundColor: on ? theme.TEXT : theme.MODAL }]}
                    >
                      <Text style={[styles.chipText, { color: on ? theme.BG : theme.TEXT }]}>{acc.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {a.kind === 'add_transaction' && (accounts.length === 1 || !editable) && row.accountId && (
              <Text style={[styles.meta, { color: theme.MUTED }]}>
                {accounts.find(acc => acc.id === row.accountId)?.label}
              </Text>
            )}

            {a.kind === 'add_contribution' && editable && (goals.length === 0 ? (
              <Text style={[styles.meta, { color: theme.RED }]}>You don't have a goal yet. Create one first.</Text>
            ) : (
              <View style={styles.chips}>
                {goals.map(g => {
                  const on = g.id === row.goalId;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => onChange(i, { goalId: g.id })}
                      style={[styles.chip, { backgroundColor: on ? theme.TEXT : theme.MODAL }]}
                    >
                      <Text style={[styles.chipText, { color: on ? theme.BG : theme.TEXT }]}>{g.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {row.status === 'saved' && <Status icon="check-circle" color={theme.GREEN} text="Saved" />}
            {row.status === 'queued' && <Status icon="clock" color={theme.MUTED} text="Saved on this device · syncs when you're online" />}
            {row.status === 'failed' && <Status icon="alert-circle" color={theme.RED} text={row.error ?? "Couldn't save. Try again."} />}
          </View>
        );
      })}

      {needsAccount && proposal.state === 'pending' ? (
        <TouchableOpacity onPress={onAddAccount} style={[styles.primary, { backgroundColor: theme.TEXT }]}>
          <Text style={[styles.primaryText, { color: theme.BG }]}>Add a bank account first</Text>
        </TouchableOpacity>
      ) : proposal.state === 'pending' || proposal.state === 'saving' ? (
        <View style={styles.buttons}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={proposal.state === 'saving'}
            style={[styles.secondary, { borderColor: theme.BORDER }]}
          >
            <Text style={[styles.secondaryText, { color: theme.MUTED }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!ready || proposal.state === 'saving'}
            style={[styles.primary, styles.flex, { backgroundColor: theme.TEXT, opacity: ready ? 1 : 0.4 }]}
          >
            {proposal.state === 'saving' ? (
              <ActivityIndicator color={theme.BG} />
            ) : (
              <Text style={[styles.primaryText, { color: theme.BG }]}>
                {failed ? 'Try again' : remaining.length > 1 ? `Confirm ${remaining.length}` : 'Confirm'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[styles.done, { color: proposal.state === 'done' ? theme.GREEN : theme.MUTED }]}>
          {proposal.state === 'done' ? '✓ Done' : 'Cancelled — nothing was changed'}
        </Text>
      )}
    </View>
  );
}

function Status({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <View style={styles.status}>
      <Feather name={icon} size={12} color={color} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 8, borderRadius: 18, borderWidth: 1, padding: 14, gap: 4, maxWidth: '92%', alignSelf: 'stretch' },
  flex: { flex: 1 },
  row: { paddingVertical: 8, gap: 8 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  amount: { fontSize: 15, fontWeight: '800' },
  amountTap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  amountInput: { minWidth: 96, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 11 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  primary: { height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 6 },
  primaryText: { fontSize: 13, fontWeight: '800' },
  secondary: { height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 6 },
  secondaryText: { fontSize: 13, fontWeight: '700' },
  done: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
