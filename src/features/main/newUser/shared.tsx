import React, { ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { SyncOp, useNetwork } from '../../../context/NetworkContext';
import { UNLOCK_AT } from '../../../context/UserModeContext';
import { AnimatedModal } from '../../../components/AnimatedModal';
import { FieldError } from '../../../components/Feedback';
import { fullAmt } from '../../../utils/format';
import { SAVE_ERROR, simulateSave } from '../../../utils/validation';

export const TEAL = '#00BFA5';

export const CAT_META: Record<string, { color: string; icon: string }> = {
  Groceries: { color: '#00C853', icon: 'shopping-cart' },
  Fuel: { color: '#FF9500', icon: 'droplet' },
  Salary: { color: '#0055FF', icon: 'credit-card' },
  Bills: { color: '#AF52DE', icon: 'file-text' },
  Dining: { color: '#FF2D55', icon: 'coffee' },
  Other: { color: '#8E8E93', icon: 'dollar-sign' },
};
export const CATS = Object.keys(CAT_META);
export const ACCOUNTS = ['Cash', 'HBL Debit', 'Meezan Checking', 'JazzCash'];

// ── Layout ───────────────────────────────────────────────────────────────────

/** Scrollable new-user screen with eyebrow + title header and optional right action. */
export function ScreenShell({
  eyebrow,
  title,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[s.flex, { backgroundColor: theme.BG }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.BG} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }}
      >
        <View style={s.header}>
          <View style={[s.headerLeft, s.flexShrink]}>
            {/* Opens the side menu (works from the bottom tabs and from menu screens). */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              accessibilityLabel="Open menu"
              style={[s.menuBtn, { backgroundColor: theme.CARD }]}
            >
              <Feather name="menu" size={20} color={theme.TEXT} />
            </TouchableOpacity>
            <View style={s.flexShrink}>
              <Text style={[s.eyebrow, { color: theme.MUTED }]}>{eyebrow}</Text>
              <Text style={[s.title, { color: theme.TEXT }]}>{title}</Text>
            </View>
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  dim,
  style,
}: {
  label: string;
  onPress: () => void;
  /** Blocks taps (e.g. while saving). */
  disabled?: boolean;
  /** Looks inactive but still tappable — a tap on an incomplete form shows what's missing. */
  dim?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !disabled && onPress()}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[s.primary, { backgroundColor: theme.TEXT, opacity: disabled || dim ? 0.4 : 1 }, style]}
    >
      <Text style={[s.primaryText, { color: theme.BG }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function TextLink({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={s.textLink}>
      <Text style={[s.textLinkText, { color: color ?? theme.MUTED }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function RoundAdd({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityLabel="Add"
      style={[s.roundAdd, { backgroundColor: theme.TEXT }]}
    >
      <Feather name="plus" size={18} color={theme.BG} />
    </TouchableOpacity>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

export interface Sample {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

/** Empty state: what this is, why it matters, three one-tap samples, and the main action. */
export function EmptyState({
  icon,
  title,
  line,
  samples,
  primary,
}: {
  icon: string;
  title: string;
  line: string;
  /** Quick-add suggestions under "Try one"; omit for a plain empty state. */
  samples?: Sample[];
  primary?: { label: string; onPress: () => void };
}) {
  const { theme } = useTheme();
  return (
    <View style={[s.empty, { backgroundColor: theme.CARD }]}>
      <View style={[s.emptyIcon, { backgroundColor: `${TEAL}1c` }]}>
        <Feather name={icon} size={22} color={TEAL} />
      </View>
      <Text style={[s.emptyTitle, { color: theme.TEXT }]}>{title}</Text>
      <Text style={[s.emptyLine, { color: theme.MUTED }]}>{line}</Text>
      {samples && samples.length > 0 && <Text style={[s.tryOne, { color: theme.MUTED }]}>TRY ONE</Text>}
      <View style={s.samples}>
        {samples?.map(sm => (
          <TouchableOpacity
            key={sm.label}
            activeOpacity={0.8}
            disabled={sm.disabled}
            onPress={sm.onPress}
            style={[s.sample, { backgroundColor: theme.isDark ? theme.MODAL : '#FFFFFF', opacity: sm.disabled ? 0.45 : 1 }]}
          >
            <View style={[s.sampleIcon, { backgroundColor: `${sm.color}22` }]}>
              <Feather name={sm.icon} size={14} color={sm.color} />
            </View>
            <Text style={[s.sampleText, { color: theme.TEXT }]} numberOfLines={1}>
              {sm.label}
            </Text>
            <Feather name="plus" size={14} color={theme.MUTED} />
          </TouchableOpacity>
        ))}
      </View>
      {primary && <PrimaryButton label={primary.label} onPress={primary.onPress} />}
    </View>
  );
}

/** Placeholder for charts/scores that need data — never shows zeros or fake numbers. */
export function LockedInsight({ label, count }: { label: string; count: number }) {
  const { theme } = useTheme();
  const left = Math.max(0, UNLOCK_AT - count);
  const track = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  return (
    <View style={s.flex}>
      <Text style={[s.boxEyebrow, { color: theme.MUTED }]}>{label.toUpperCase()}</Text>
      <View style={[s.lockIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
        <Feather name="lock" size={13} color={theme.MUTED} />
      </View>
      <Text style={[s.lockText, { color: theme.TEXT }]}>
        Add {left} transaction{left === 1 ? '' : 's'} to unlock insights
      </Text>
      <View style={s.lockSegs}>
        {Array.from({ length: UNLOCK_AT }).map((_, i) => (
          <View key={i} style={[s.lockSeg, { backgroundColor: i < count ? TEAL : track }]} />
        ))}
      </View>
    </View>
  );
}

// ── Sheet + form pieces ──────────────────────────────────────────────────────

/** Bottom sheet for forms: slides up, keeps fields above the keyboard, scrolls when tall. */
export function Sheet({
  visible,
  onClose,
  onDismissed,
  title,
  sub,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <AnimatedModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismissed={onDismissed}
      statusBarTranslucent
    >
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetKav} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 20 }]}>
          <View style={[s.grabber, { backgroundColor: theme.MODAL }]} />
          <View style={s.sheetHeader}>
            <View style={s.flexShrink}>
              <Text style={[s.sheetTitle, { color: theme.TEXT }]}>{title}</Text>
              {sub ? <Text style={[s.sheetSub, { color: theme.MUTED }]}>{sub}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={[s.sheetClose, { backgroundColor: theme.MODAL }]}>
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AnimatedModal>
  );
}

export function FieldLabel({ children }: { children: string }) {
  const { theme } = useTheme();
  return <Text style={[s.fieldLabel, { color: theme.MUTED }]}>{children.toUpperCase()}</Text>;
}

export function Field({ label, error, children, mb = 14 }: { label?: string; error?: string; children: ReactNode; mb?: number }) {
  return (
    <View style={{ marginBottom: mb }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {children}
      <FieldError msg={error} />
    </View>
  );
}

/** PKR amount input: shows full grouping while typing; letters and minus signs can't be typed. */
export function AmountInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={[s.amountWrap, { backgroundColor: theme.BG }]}>
      <Text style={[s.amountPkr, { color: theme.MUTED }]}>PKR</Text>
      <TextInput
        autoFocus={autoFocus}
        keyboardType="number-pad"
        accessibilityLabel="Amount"
        value={value ? fullAmt(Number(value)) : ''}
        placeholder="0"
        placeholderTextColor={theme.MUTED}
        onChangeText={t => onChange(t.replace(/[^0-9]/g, '').slice(0, 12))}
        style={[s.amountInput, { color: theme.TEXT }]}
      />
    </View>
  );
}

export function TextField(props: React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.MUTED}
      {...props}
      style={[s.textField, { backgroundColor: theme.BG, color: theme.TEXT }, props.style]}
    />
  );
}

/** Pill chips for one-of-many choices (category, account, date). */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  colorOf,
  iconOf,
}: {
  options: T[];
  value: T | '';
  onChange: (v: T) => void;
  colorOf?: (v: T) => string | undefined;
  iconOf?: (v: T) => string | undefined;
}) {
  const { theme } = useTheme();
  return (
    <View style={s.chips}>
      {options.map(o => {
        const on = o === value;
        const tint = colorOf?.(o);
        const icon = iconOf?.(o);
        return (
          <TouchableOpacity
            key={o}
            activeOpacity={0.8}
            onPress={() => onChange(o)}
            accessibilityState={{ selected: on }}
            style={[
              s.chip,
              {
                backgroundColor: on ? (tint ? `${tint}22` : theme.TEXT) : theme.BG,
              },
            ]}
          >
            {on ? (
              <Feather name="check" size={12} color={tint ?? theme.BG} />
            ) : icon ? (
              <Feather name={icon} size={12} color={theme.MUTED} />
            ) : null}
            <Text style={[s.chipText, { color: on ? tint ?? theme.BG : theme.MUTED }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Save with the right edge-case behaviour:
 * - offline → kept on the device and queued; never fails just because there's no internet
 * - online  → "Saving…", then success toast, or an error toast with the form left open
 */
export function useSave() {
  const { online, record } = useNetwork();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function save(run: () => Omit<SyncOp, 'id' | 'at' | 'status'>, successText: string) {
    if (!online) {
      record(run());
      showToast(`${successText}. It'll sync when you're back online.`, 'info');
      return;
    }
    setSaving(true);
    try {
      await simulateSave();
      run();
      showToast(successText, 'success');
    } catch {
      showToast(SAVE_ERROR, 'error');
    } finally {
      setSaving(false);
    }
  }
  return { save, saving };
}

export const s = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  primary: { height: 50, borderRadius: 100, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { fontSize: 14, fontWeight: '700' },
  textLink: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textLinkText: { fontSize: 13, fontWeight: '600' },
  roundAdd: { width: 42, height: 42, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  empty: { marginHorizontal: 16, borderRadius: 24, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 20 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  emptyLine: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  tryOne: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  samples: { gap: 8, marginBottom: 18 },
  sample: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 16 },
  sampleIcon: { width: 32, height: 32, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  sampleText: { flex: 1, fontSize: 13, fontWeight: '600' },
  boxEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9, marginBottom: 10 },
  lockIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  lockText: { fontSize: 12, fontWeight: '600', lineHeight: 15 },
  lockSegs: { flexDirection: 'row', gap: 4, marginTop: 'auto', paddingTop: 10 },
  lockSeg: { flex: 1, height: 4, borderRadius: 2 },
  sheetKav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, maxHeight: '88%' },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 14, paddingBottom: 18, gap: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sheetSub: { fontSize: 12, marginTop: 3 },
  sheetClose: { width: 32, height: 32, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  amountPkr: { fontSize: 14, fontWeight: '700' },
  amountInput: { flex: 1, fontSize: 30, fontWeight: '800', letterSpacing: -1.2, padding: 0 },
  textField: { height: 46, borderRadius: 14, paddingHorizontal: 14, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 100 },
  chipText: { fontSize: 12, fontWeight: '600' },
});
