import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { PendingBadge, useNetwork } from '../../../context/NetworkContext';
import { UserTx, useUserMode } from '../../../context/UserModeContext';
import { abbr, dayLabel, fullAmt } from '../../../utils/format';
import { CAT_META, PrimaryButton, Sheet } from './shared';

/** The new user's transactions; a tap opens the full detail with Edit and Delete. */
export function TxList({ limit }: { limit?: number }) {
  const { theme } = useTheme();
  const { txs } = useUserMode();
  const [openId, setOpenId] = useState<number | null>(null);
  const [lastOpen, setLastOpen] = useState<UserTx | null>(null);
  const rows = limit ? txs.slice(0, limit) : txs;
  const open = txs.find(t => t.id === openId) ?? null;

  return (
    <>
      <View style={[l.card, { backgroundColor: theme.CARD }]}>
        {rows.map((t, i) => {
          const m = CAT_META[t.category] ?? CAT_META.Other;
          const title = t.note ?? t.category;
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.75}
              onPress={() => {
                setOpenId(t.id);
                setLastOpen(t);
              }}
              accessibilityLabel={`${title}, ${t.type === 'income' ? 'income' : 'expense'} PKR ${fullAmt(t.amount)}`}
              style={[l.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.BORDER }]}
            >
              <View style={[l.icon, { backgroundColor: `${m.color}22` }]}>
                <Feather name={m.icon} size={15} color={m.color} />
              </View>
              <View style={l.flex}>
                <Text style={[l.title, { color: theme.TEXT }]} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={[l.sub, { color: theme.MUTED }]} numberOfLines={1}>
                  {t.category}
                  {t.account ? ` · ${t.account}` : ''} · {dayLabel(t.date)}
                </Text>
                <View style={l.badge}>
                  <PendingBadge entity="tx" id={t.id} />
                </View>
              </View>
              {/* Sign is always shown, so income vs expense never relies on colour alone. */}
              <Text style={[l.amount, { color: t.type === 'income' ? theme.GREEN : theme.TEXT }]}>
                {t.type === 'income' ? '+' : '−'}
                {abbr(t.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TxDetailSheet tx={open ?? lastOpen} visible={!!open} onClose={() => setOpenId(null)} />
    </>
  );
}

/** Full detail (full name + full amount), with Edit and Delete (Undo toast; queued while offline). */
function TxDetailSheet({ tx, visible, onClose }: { tx: UserTx | null; visible: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const { txs, deleteTx, restoreTx, openTxSheet } = useUserMode();
  const { record, remove } = useNetwork();
  const { showToast } = useToast();
  if (!tx) return null;

  function del() {
    if (!tx) return;
    const removed = tx;
    const index = txs.findIndex(t => t.id === removed.id);
    deleteTx(removed.id);
    const opId = record({ entity: 'tx', entityId: removed.id, action: 'delete', label: `Delete · ${removed.note ?? removed.category}` });
    onClose();
    showToast('Transaction deleted', 'info', undefined, 5000, {
      label: 'Undo',
      onPress: () => {
        restoreTx(removed, index);
        if (opId) remove(opId);
      },
    });
  }

  const rows: [string, string][] = [
    ['Category', tx.category],
    ['Account', tx.account ?? '—'],
    ['Date', tx.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
  ];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tx.note ?? tx.category}
      sub={`${tx.type === 'income' ? 'Income' : 'Expense'} · PKR ${fullAmt(tx.amount)}`}
    >
      <View style={l.badgeTop}>
        <PendingBadge entity="tx" id={tx.id} />
      </View>
      <View style={[l.detail, { backgroundColor: theme.BG }]}>
        {rows.map(([k, v], i) => (
          <View key={k} style={[l.detailRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.BORDER }]}>
            <Text style={[l.detailKey, { color: theme.MUTED }]}>{k}</Text>
            <Text style={[l.detailVal, { color: theme.TEXT }]}>{v}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton
        label="Edit"
        onPress={() => {
          onClose();
          setTimeout(
            () =>
              openTxSheet({
                editId: tx.id,
                type: tx.type,
                category: tx.category,
                amount: tx.amount,
                note: tx.note,
                account: tx.account,
                date: tx.date,
              }),
            280,
          );
        }}
      />
      <TouchableOpacity activeOpacity={0.7} onPress={del} style={l.delete}>
        <Feather name="trash-2" size={14} color={theme.RED} />
        <Text style={[l.deleteText, { color: theme.RED }]}>Delete transaction</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

const l = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
  icon: { width: 36, height: 36, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '600' },
  sub: { fontSize: 11, marginTop: 1 },
  badge: { marginTop: 3 },
  amount: { fontSize: 14, fontWeight: '700' },
  badgeTop: { marginBottom: 12 },
  detail: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  detailKey: { fontSize: 12 },
  detailVal: { flexShrink: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  delete: { height: 46, marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  deleteText: { fontSize: 13, fontWeight: '700' },
});
