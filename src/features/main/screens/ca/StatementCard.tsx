import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../../context/ThemeContext';
import { fullAmt } from '../../../../utils/format';
import type { StatementPreview, StatementRow } from '../../../../api/importApi';

export type StatementScope = 'all' | 'expenses' | 'income';

/** A bank statement attached in the CA chat: read by the backend, added only when confirmed. */
export interface StatementAttachment {
  fileName: string;
  state: 'reading' | 'password' | 'ready' | 'importing' | 'done' | 'cancelled' | 'failed' | 'expired';
  scope: StatementScope;
  accountId?: string;
  /** The read statement. Not kept when the chat is saved (it can be large); see "expired". */
  preview?: StatementPreview;
  passwordError?: string;
  error?: string;
  result?: { imported: number; restored: number; skipped: number; accountLabel: string };
}

/** The rows a scope adds: ticked by the backend (their balance adds up) and not imported before. */
export function rowsFor(preview: StatementPreview | undefined, scope: StatementScope): StatementRow[] {
  return (preview?.rows ?? []).filter(
    r => r.preselected && !r.alreadyImported && (scope === 'all' || (scope === 'expenses' ? r.type === 'expense' : r.type === 'income')),
  );
}

interface Props {
  statement: StatementAttachment;
  accounts: { id: string; label: string }[];
  onChange: (patch: Partial<StatementAttachment>) => void;
  onPassword: (password: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReview: () => void;
  onAddAccount: () => void;
}

const SCOPES: { id: StatementScope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'income', label: 'Income' },
];

export function StatementCard({ statement: s, accounts, onChange, onPassword, onConfirm, onCancel, onReview, onAddAccount }: Props) {
  const { theme } = useTheme();
  const [password, setPassword] = useState('');
  const rows = rowsFor(s.preview, s.scope);
  const out = rows.filter(r => r.type === 'expense').reduce((t, r) => t + r.amount, 0);
  const inn = rows.filter(r => r.type === 'income').reduce((t, r) => t + r.amount, 0);
  const chip = (on: boolean) => [styles.chip, { backgroundColor: on ? theme.TEXT : theme.MODAL }];
  const chipText = (on: boolean) => [styles.chipText, { color: on ? theme.BG : theme.TEXT }];

  return (
    <View style={[styles.card, { backgroundColor: theme.CARD, borderColor: theme.BORDER }]}>
      <View style={styles.fileRow}>
        <View style={[styles.fileIcon, { backgroundColor: theme.MODAL }]}>
          <Feather name="file-text" size={16} color={theme.TEXT} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.fileName, { color: theme.TEXT }]} numberOfLines={1}>
            {s.fileName}
          </Text>
          {s.preview && (
            <Text style={[styles.meta, { color: theme.MUTED }]} numberOfLines={1}>
              {[s.preview.bankName, `${s.preview.rows.length} rows`].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </View>

      {s.state === 'reading' && (
        <View style={styles.status}>
          <ActivityIndicator color={theme.MUTED} />
          <Text style={[styles.statusText, { color: theme.MUTED }]}>Reading the statement… (a PDF can take a minute)</Text>
        </View>
      )}

      {s.state === 'password' && (
        <View style={styles.block}>
          <Text style={[styles.meta, { color: s.passwordError ? theme.RED : theme.MUTED }]}>
            {s.passwordError ?? 'This PDF is password-protected. Enter its password to open it.'}
          </Text>
          <View style={[styles.input, { borderColor: theme.BORDER, backgroundColor: theme.BG }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="PDF password"
              placeholderTextColor={theme.MUTED}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.inputText, { color: theme.TEXT }]}
            />
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onCancel} style={[styles.secondary, { borderColor: theme.BORDER }]}>
              <Text style={[styles.secondaryText, { color: theme.MUTED }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPassword(password)}
              disabled={!password}
              style={[styles.primary, styles.flex, { backgroundColor: theme.TEXT, opacity: password ? 1 : 0.4 }]}
            >
              <Text style={[styles.primaryText, { color: theme.BG }]}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(s.state === 'ready' || s.state === 'importing') && s.preview && (
        <View style={styles.block}>
          <View style={styles.chips}>
            {SCOPES.map(sc => (
              <TouchableOpacity
                key={sc.id}
                disabled={s.state !== 'ready'}
                onPress={() => onChange({ scope: sc.id })}
                style={chip(s.scope === sc.id)}
              >
                <Text style={chipText(s.scope === sc.id)}>{sc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.summary, { color: theme.TEXT }]}>
            {rows.length} transaction{rows.length === 1 ? '' : 's'} to add
          </Text>
          <Text style={[styles.meta, { color: theme.MUTED }]}>
            {out > 0 ? `PKR ${fullAmt(out)} out` : ''}
            {out > 0 && inn > 0 ? ' · ' : ''}
            {inn > 0 ? `PKR ${fullAmt(inn)} in` : ''}
          </Text>

          {rows.length === 0 ? (
            <>
              <Text style={[styles.meta, { color: theme.MUTED }]}>
                {s.preview.rows.every(r => r.alreadyImported)
                  ? 'All of these are already in the app.'
                  : 'Nothing new to add in this selection.'}
              </Text>
              <TouchableOpacity onPress={onReview} style={styles.reviewLink}>
                <Feather name="list" size={13} color={theme.ACTIVE} />
                <Text style={[styles.reviewText, { color: theme.ACTIVE }]}>Review rows one by one</Text>
              </TouchableOpacity>
            </>
          ) : accounts.length === 0 ? (
            <TouchableOpacity onPress={onAddAccount} style={[styles.primary, { backgroundColor: theme.TEXT }]}>
              <Text style={[styles.primaryText, { color: theme.BG }]}>Add a bank account first</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.MUTED }]}>Add to account</Text>
              <View style={styles.chips}>
                {accounts.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    disabled={s.state !== 'ready'}
                    onPress={() => onChange({ accountId: a.id })}
                    style={chip(a.id === s.accountId)}
                  >
                    <Text style={chipText(a.id === s.accountId)}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {s.error && <Text style={[styles.meta, { color: theme.RED }]}>{s.error}</Text>}
              <TouchableOpacity onPress={onReview} disabled={s.state !== 'ready'} style={styles.reviewLink}>
                <Feather name="list" size={13} color={theme.ACTIVE} />
                <Text style={[styles.reviewText, { color: theme.ACTIVE }]}>Review rows one by one</Text>
              </TouchableOpacity>
              <View style={styles.buttons}>
                <TouchableOpacity
                  onPress={onCancel}
                  disabled={s.state !== 'ready'}
                  style={[styles.secondary, { borderColor: theme.BORDER }]}
                >
                  <Text style={[styles.secondaryText, { color: theme.MUTED }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onConfirm}
                  disabled={s.state !== 'ready' || !s.accountId || rows.length === 0}
                  style={[
                    styles.primary,
                    styles.flex,
                    { backgroundColor: theme.TEXT, opacity: s.accountId && rows.length > 0 ? 1 : 0.4 },
                  ]}
                >
                  {s.state === 'importing' ? (
                    <ActivityIndicator color={theme.BG} />
                  ) : (
                    <Text style={[styles.primaryText, { color: theme.BG }]}>
                      {s.error ? 'Try again' : `Add ${rows.length}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {s.state === 'done' && s.result && (
        <Text style={[styles.done, { color: theme.GREEN }]}>
          ✓ Added {s.result.imported + s.result.restored} to {s.result.accountLabel}
          {s.result.skipped ? ` · ${s.result.skipped} were already there` : ''}
        </Text>
      )}
      {s.state === 'cancelled' && (
        <Text style={[styles.done, { color: theme.MUTED }]}>Cancelled — nothing was added</Text>
      )}
      {s.state === 'failed' && (
        <Text style={[styles.meta, { color: theme.RED }]}>{s.error ?? "Couldn't read this statement."}</Text>
      )}
      {s.state === 'expired' && (
        <Text style={[styles.meta, { color: theme.MUTED }]}>Attach the file again to add these transactions.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 8, borderRadius: 18, borderWidth: 1, padding: 14, gap: 10, maxWidth: '92%', alignSelf: 'stretch' },
  flex: { flex: 1 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, lineHeight: 17 },
  block: { gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 12, flexShrink: 1 },
  summary: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  chipText: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 14, height: 46, paddingHorizontal: 12, justifyContent: 'center' },
  inputText: { fontSize: 14, paddingVertical: 0 },
  reviewLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  reviewText: { fontSize: 12, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 8 },
  primary: { height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryText: { fontSize: 13, fontWeight: '800' },
  secondary: { height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondaryText: { fontSize: 13, fontWeight: '700' },
  done: { fontSize: 12, fontWeight: '700' },
});
