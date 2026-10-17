import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useUserMode } from '../../../context/UserModeContext';
import { ApiError } from '../../../api/client';
import { importApi, PickedStatement, StatementPreview, StatementRow } from '../../../api/importApi';
import { useBankAccounts, accountLabel } from './bankAccounts/useBankAccounts';
import { CAT_META } from '../newUser/shared';

type Phase = 'pick' | 'reading' | 'password' | 'review';

const EXPENSE_CATS = ['Groceries', 'Fuel', 'Bills', 'Dining', 'Other'];
const INCOME_CATS = ['Salary', 'Other'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Whole rupees without decimals; otherwise always two (72,819.50, not 72,819.5).
const fmtAmount = (n: number) => {
  const digits = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2;
  return n.toLocaleString('en-PK', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { day: String(d).padStart(2, '0'), month: MONTHS[m - 1], year: y };
};

/**
 * Import transactions from a bank statement (CSV, Excel or PDF). The backend reads and checks the
 * file; the user reviews every row (ticked rows are the ones whose balance adds up), picks the
 * account, and imports. Importing the same statement again never creates duplicates.
 */
export const ImportStatementScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const userMode = useUserMode();
  const { accounts } = useBankAccounts();
  // Opened from the Personal CA with a statement it already read: start at the review.
  const params = (useRoute<any>().params ?? {}) as {
    file?: PickedStatement;
    preview?: StatementPreview;
    scope?: 'all' | 'expenses' | 'income';
    accountId?: string;
  };
  const given = params.preview ?? null;
  const inScope = (r: StatementRow) =>
    !params.scope || params.scope === 'all' || (params.scope === 'expenses' ? r.type === 'expense' : r.type === 'income');

  const [phase, setPhase] = useState<Phase>(given ? 'review' : 'pick');
  const [file, setFile] = useState<PickedStatement | null>(params.file ?? null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StatementPreview | null>(given);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(given ? given.rows.filter(r => r.preselected && inScope(r)).map(r => r.id) : []),
  );
  const [categories, setCategories] = useState<Record<string, string>>(() =>
    given ? Object.fromEntries(given.rows.map(r => [r.id, r.category])) : {},
  );
  const [accountId, setAccountId] = useState<string | null>(
    params.accountId ?? (accounts.length === 1 ? accounts[0].id : null),
  );
  const [importing, setImporting] = useState(false);
  // With a single account (or once accounts load), there's nothing to choose.
  useEffect(() => {
    if (!accountId && accounts.length === 1) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  const read = async (picked: PickedStatement, pdfPassword?: string) => {
    setPhase('reading');
    try {
      const result = await importApi.preview(picked, pdfPassword);
      setPreview(result);
      setSelected(new Set(result.rows.filter(r => r.preselected).map(r => r.id)));
      setCategories(Object.fromEntries(result.rows.map(r => [r.id, r.category])));
      setPassword('');
      setPhase('review');
    } catch (error) {
      const e = error as ApiError;
      if (e instanceof ApiError && (e.code === 'password_required' || e.code === 'wrong_password')) {
        setPasswordError(e.code === 'wrong_password' ? e.message : null);
        setPhase('password');
        return;
      }
      showToast(e instanceof ApiError ? e.message : "Couldn't read this statement. Try again.", 'error');
      setPhase('pick');
    }
  };

  const chooseFile = async () => {
    try {
      const [res] = await pick({
        type: [types.csv, types.xls, types.xlsx, types.pdf, types.plainText],
        allowMultiSelection: false,
      });
      const picked = { uri: res.uri, name: res.name ?? 'statement', type: res.type ?? 'application/octet-stream' };
      setFile(picked);
      setPasswordError(null);
      read(picked);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      showToast("Couldn't open that file. Try another one.", 'error');
    }
  };

  const rows = useMemo(() => preview?.rows ?? [], [preview]);
  const chosen = useMemo(() => rows.filter(r => selected.has(r.id)), [rows, selected]);
  const totals = useMemo(
    () =>
      chosen.reduce(
        (t, r) => (r.type === 'income' ? { ...t, in: t.in + r.amount } : { ...t, out: t.out + r.amount }),
        { in: 0, out: 0 },
      ),
    [chosen],
  );
  const selectable = rows.filter(r => !r.alreadyImported);
  const allSelected = selectable.length > 0 && selectable.every(r => selected.has(r.id));

  const toggle = (row: StatementRow) => {
    if (row.alreadyImported) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  };

  const cycleCategory = (row: StatementRow) => {
    const list = row.type === 'income' ? INCOME_CATS : EXPENSE_CATS;
    setCategories(prev => {
      const current = prev[row.id] ?? row.category;
      return { ...prev, [row.id]: list[(list.indexOf(current) + 1) % list.length] };
    });
  };

  const doImport = async () => {
    if (!accountId) {
      showToast('Choose which account this statement is for.', 'error');
      return;
    }
    if (chosen.length === 0) return;
    setImporting(true);
    try {
      const result = await importApi.importRows(
        accountId,
        chosen.map(r => ({
          id: r.id,
          type: r.type,
          amount: r.amount,
          category: categories[r.id] ?? r.category,
          note: r.description,
          date: r.date,
        })),
      );
      await userMode.reloadTxs().catch(() => {});
      const added = result.imported + result.restored;
      showToast(
        added === 0
          ? 'These transactions were already imported.'
          : `${added} transaction${added === 1 ? '' : 's'} imported${result.skipped ? ` · ${result.skipped} already there` : ''}.`,
        added === 0 ? 'info' : 'success',
        added === 0 ? undefined : 'Statement Imported',
      );
      navigation.goBack();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't import. Try again.", 'error');
    } finally {
      setImporting(false);
    }
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <View style={styles.headerRow}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => (phase === 'review' || phase === 'password' ? setPhase('pick') : navigation.goBack())}
        style={styles.backBtn}
        accessibilityRole="button"
      >
        <Feather name="chevron-left" size={16} color={theme.MUTED} />
        <Text style={[styles.backText, { color: theme.MUTED }]}>
          {phase === 'review' || phase === 'password' ? 'Choose another file' : 'Back'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
        {phase === 'review' ? 'Review & import' : 'Import statement'}
      </Text>
      <Text style={[styles.headerSub, { color: theme.MUTED }]}>
        {phase === 'review'
          ? 'Ticked rows are ready. Tap a row to include or skip it, and a category to change it.'
          : 'Bring in your bank transactions from a CSV, Excel or PDF statement.'}
      </Text>
    </View>
  );

  // ── Choose a file ─────────────────────────────────────────────────────────
  if (phase === 'pick' || phase === 'reading') {
    const reading = phase === 'reading';
    return (
      <View style={[styles.container, { backgroundColor: theme.BG, paddingTop: insets.top + 16 }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.BG} />
        <View style={styles.pad}>
          {header}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={chooseFile}
            disabled={reading}
            style={[styles.dropCard, { backgroundColor: theme.CARD, borderColor: theme.BORDER }]}
            accessibilityRole="button"
            accessibilityLabel="Choose statement file"
          >
            {reading ? (
              <>
                <ActivityIndicator color={theme.ACTIVE} />
                <Text style={[styles.dropTitle, { color: theme.TEXT }]}>Reading {file?.name ?? 'statement'}…</Text>
                <Text style={[styles.dropSub, { color: theme.MUTED }]}>
                  {file?.name?.toLowerCase().endsWith('.pdf')
                    ? 'Reading and checking every row against your balance. This can take up to a minute.'
                    : 'Checking every row against your balance.'}
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.dropIcon, { backgroundColor: `${theme.ACTIVE}18` }]}>
                  <Feather name="upload" size={22} color={theme.ACTIVE} />
                </View>
                <Text style={[styles.dropTitle, { color: theme.TEXT }]}>Choose statement file</Text>
                <Text style={[styles.dropSub, { color: theme.MUTED }]}>CSV, Excel (XLS / XLSX) or PDF · up to 10 MB</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.infoCard, { backgroundColor: theme.CARD }]}>
            <InfoLine icon="check-circle" color={theme.GREEN} theme={theme}
              title="Best: CSV or Excel"
              line="In internet banking, open Account Statement and download it as Excel or CSV. It's read exactly, with no AI." />
            <InfoLine icon="file-text" color={theme.ACTIVE} theme={theme}
              title="PDF works too"
              line="Every row is checked against the balance printed on your statement. Rows that don't add up are flagged." />
            <InfoLine icon="lock" color={theme.MUTED} theme={theme}
              title="Private"
              line="Account numbers and CNIC are hidden before a PDF is read. PDF passwords are used once and never saved." />
          </View>
        </View>
      </View>
    );
  }

  // ── Password for a protected PDF ──────────────────────────────────────────
  if (phase === 'password') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: theme.BG, paddingTop: insets.top + 16 }]}
      >
        <View style={styles.pad}>
          {header}
          <View style={[styles.infoCard, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.label, { color: theme.MUTED }]}>STATEMENT PASSWORD</Text>
            <Text style={[styles.passwordHint, { color: theme.MUTED }]}>
              {file?.name} is password-protected. Banks usually use your CNIC (without dashes) or date of birth.
            </Text>
            <TextInput
              value={password}
              onChangeText={t => {
                setPassword(t);
                setPasswordError(null);
              }}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => file && password && read(file, password)}
              placeholder="Password"
              placeholderTextColor={theme.MUTED}
              style={[
                styles.passwordInput,
                { color: theme.TEXT, backgroundColor: theme.MODAL, borderColor: passwordError ? theme.RED : 'transparent' },
              ]}
              accessibilityLabel="Statement password"
            />
            {passwordError ? <Text style={[styles.errorText, { color: theme.RED }]}>{passwordError}</Text> : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!password}
            onPress={() => file && read(file, password)}
            style={[styles.primaryBtn, { backgroundColor: theme.TEXT, opacity: password ? 1 : 0.4 }]}
          >
            <Text style={[styles.primaryText, { color: theme.BG }]}>Open statement</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  const p = preview!;
  const period = (() => {
    const a = fmtDay(p.from);
    const b = fmtDay(p.to);
    return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  })();
  const check = {
    passed: {
      color: theme.GREEN,
      icon: 'check-circle',
      text:
        p.method === 'rules'
          ? 'Read exactly from your file, and the balances add up.'
          : 'Every ticked row was checked: its balance adds up with your statement.',
    },
    failed: { color: theme.RED, icon: 'alert-triangle', text: "Some rows don't add up with your statement. They're unticked; check them." },
    unavailable: {
      color: '#FF9500',
      icon: 'info',
      text:
        p.method === 'rules'
          ? 'Read exactly from your file. It has no balances to double-check against.'
          : 'This statement has no balances to check against. Review each row before ticking it.',
    },
  }[p.balanceCheck];
  const fileLabel = p.fileType === 'pdf' ? 'PDF' : p.fileType === 'excel' ? 'Excel' : 'CSV';

  const listHeader = (
    <View>
      {header}
      <View style={[styles.summaryCard, { backgroundColor: theme.HERO_BG }]}>
        <Text style={styles.summaryEyebrow}>
          {(p.bankName ?? 'BANK STATEMENT').toUpperCase()} · {fileLabel}
        </Text>
        <Text style={styles.summaryTitle}>{period}</Text>
        <Text style={styles.summarySub}>
          {rows.length} transaction{rows.length === 1 ? '' : 's'} found
          {rows.some(r => r.alreadyImported) ? ` · ${rows.filter(r => r.alreadyImported).length} already imported` : ''}
        </Text>
        <View style={[styles.checkPill, { backgroundColor: `${check.color}22` }]}>
          <Feather name={check.icon} size={13} color={check.color} />
          <Text style={[styles.checkText, { color: check.color }]}>{check.text}</Text>
        </View>
      </View>

      {p.warnings.map(w => (
        <View key={w} style={[styles.warning, { backgroundColor: `${theme.RED}10` }]}>
          <Feather name="alert-circle" size={13} color={theme.RED} />
          <Text style={[styles.warningText, { color: theme.TEXT }]}>{w}</Text>
        </View>
      ))}

      <Text style={[styles.label, styles.labelSpaced, { color: theme.MUTED }]}>IMPORT INTO</Text>
      {accounts.length === 0 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddAccount')}
          style={[styles.accountChip, { backgroundColor: theme.CARD }]}
        >
          <Feather name="plus" size={14} color={theme.ACTIVE} />
          <Text style={[styles.accountText, { color: theme.ACTIVE }]}>Add a bank account first</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.accountRow}>
          {accounts.map(a => {
            const on = a.id === accountId;
            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.8}
                onPress={() => setAccountId(a.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[styles.accountChip, { backgroundColor: on ? theme.TEXT : theme.CARD }]}
              >
                <Text style={[styles.accountText, { color: on ? theme.BG : theme.TEXT }]}>{accountLabel(a)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.listHead}>
        <Text style={[styles.label, { color: theme.MUTED }]}>TRANSACTIONS</Text>
        {selectable.length === 0 ? (
          // Rows already in the app can't be ticked, so there's nothing for "Tick all" to do.
          <Text style={[styles.selectAll, { color: theme.MUTED }]}>All already in the app</Text>
        ) : (
          <TouchableOpacity
            onPress={() => setSelected(allSelected ? new Set() : new Set(selectable.map(r => r.id)))}
            hitSlop={8}
          >
            <Text style={[styles.selectAll, { color: theme.ACTIVE }]}>{allSelected ? 'Untick all' : 'Tick all'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.BG} />
      <FlatList
        data={rows}
        keyExtractor={r => r.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.pad, { paddingTop: insets.top + 16, paddingBottom: 140 + insets.bottom }]}
        renderItem={({ item: r }) => {
          const on = selected.has(r.id);
          const d = fmtDay(r.date);
          const category = categories[r.id] ?? r.category;
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggle(r)}
              disabled={r.alreadyImported}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: r.alreadyImported }}
              style={[styles.row, { backgroundColor: theme.CARD, opacity: r.alreadyImported ? 0.5 : 1 }]}
            >
              <Feather
                name={on ? 'check-square' : 'square'}
                size={20}
                color={on ? theme.ACTIVE : theme.MUTED}
              />
              <View style={styles.rowDate}>
                <Text style={[styles.rowDay, { color: theme.TEXT }]}>{d.day}</Text>
                <Text style={[styles.rowMonth, { color: theme.MUTED }]}>{d.month}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowDesc, { color: theme.TEXT }]} numberOfLines={2}>{r.description}</Text>
                <View style={styles.rowMeta}>
                  <TouchableOpacity
                    onPress={() => cycleCategory(r)}
                    disabled={r.alreadyImported}
                    hitSlop={6}
                    style={[styles.catChip, { backgroundColor: `${CAT_META[category]?.color ?? theme.MUTED}1F` }]}
                    accessibilityLabel={`Category ${category}. Tap to change.`}
                  >
                    <Text style={[styles.catText, { color: CAT_META[category]?.color ?? theme.MUTED }]}>{category}</Text>
                  </TouchableOpacity>
                  {r.alreadyImported ? (
                    <Text style={[styles.status, { color: theme.MUTED }]}>Already imported</Text>
                  ) : r.check === 'verified' ? (
                    <Text style={[styles.status, { color: theme.GREEN }]}>✓ Adds up</Text>
                  ) : r.check === 'mismatch' ? (
                    <Text style={[styles.status, { color: theme.RED }]}>Doesn't add up</Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.rowAmount, { color: r.type === 'income' ? theme.GREEN : theme.TEXT }]}>
                {r.type === 'income' ? '+' : '−'}
                {fmtAmount(r.amount)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={[styles.footer, { backgroundColor: theme.BG, borderTopColor: theme.BORDER, paddingBottom: insets.bottom + 12 }]}>
        <Text style={[styles.footerTotals, { color: theme.MUTED }]}>
          In <Text style={{ color: theme.GREEN }}>PKR {fmtAmount(totals.in)}</Text> · Out{' '}
          <Text style={{ color: theme.TEXT }}>PKR {fmtAmount(totals.out)}</Text>
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={doImport}
          disabled={importing || chosen.length === 0 || !accountId}
          style={[
            styles.primaryBtn,
            { backgroundColor: theme.TEXT, opacity: importing || chosen.length === 0 || !accountId ? 0.4 : 1 },
          ]}
        >
          {importing ? (
            <ActivityIndicator color={theme.BG} />
          ) : (
            <Text style={[styles.primaryText, { color: theme.BG }]}>
              {!accountId
                ? 'Choose an account above'
                : selectable.length === 0
                ? 'Nothing new to import'
                : `Import ${chosen.length} transaction${chosen.length === 1 ? '' : 's'}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

function InfoLine({ icon, color, title, line, theme }: { icon: string; color: string; title: string; line: string; theme: any }) {
  return (
    <View style={styles.infoLine}>
      <Feather name={icon} size={16} color={color} style={styles.infoIcon} />
      <View style={styles.flex}>
        <Text style={[styles.infoTitle, { color: theme.TEXT }]}>{title}</Text>
        <Text style={[styles.infoText, { color: theme.MUTED }]}>{line}</Text>
      </View>
    </View>
  );
}

export default ImportStatementScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16 },
  headerRow: { marginBottom: 20, paddingHorizontal: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -1.2, marginBottom: 4 },
  headerSub: { fontSize: 12, lineHeight: 18 },
  dropCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dropIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dropTitle: { fontSize: 16, fontWeight: '700' },
  dropSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  infoCard: { borderRadius: 20, padding: 16, gap: 14, marginBottom: 16 },
  infoLine: { flexDirection: 'row', gap: 12 },
  infoIcon: { marginTop: 1 },
  infoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  infoText: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  labelSpaced: { marginTop: 18, marginBottom: 8, paddingHorizontal: 4 },
  passwordHint: { fontSize: 12, lineHeight: 18, marginTop: -6 },
  passwordInput: { height: 50, borderRadius: 14, paddingHorizontal: 14, fontSize: 15, borderWidth: 1.5 },
  errorText: { fontSize: 12, marginTop: -6 },
  primaryBtn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 14, fontWeight: '800' },
  summaryCard: { borderRadius: 24, padding: 20, gap: 4 },
  summaryEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6 },
  summarySub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  checkPill: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, padding: 10 },
  checkText: { fontSize: 12, fontWeight: '600', lineHeight: 17, flex: 1 },
  warning: { flexDirection: 'row', gap: 8, borderRadius: 14, padding: 12, marginTop: 10, alignItems: 'flex-start' },
  warningText: { fontSize: 12, lineHeight: 17, flex: 1 },
  accountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  accountText: { fontSize: 13, fontWeight: '600' },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
  selectAll: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, marginBottom: 8 },
  rowDate: { width: 34, alignItems: 'center' },
  rowDay: { fontSize: 16, fontWeight: '800' },
  rowMonth: { fontSize: 10, fontWeight: '600' },
  rowBody: { flex: 1, gap: 6 },
  rowDesc: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catText: { fontSize: 10, fontWeight: '700' },
  status: { fontSize: 10, fontWeight: '700' },
  rowAmount: { fontSize: 14, fontWeight: '800' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  footerTotals: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
