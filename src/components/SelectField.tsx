import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { AnimatedModal } from './AnimatedModal';

export interface SelectOption<V extends string | number> {
  value: V;
  label: string;
  /** Second line under the label, e.g. a range. */
  sub?: string;
  /** Shown on the right, e.g. a rate. */
  trailing?: string;
}

/**
 * A dropdown: a field showing the current choice; tapping it opens a sheet with all options.
 * `onChange` is called only when a different option is picked.
 */
export function SelectField<V extends string | number>({
  title,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: {
  /** Heading of the options sheet. */
  title: string;
  value: V | null;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  placeholder?: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${selected?.label ?? placeholder}. Tap to change.`}
        style={[styles.field, { backgroundColor: theme.MODAL }]}
      >
        <View style={styles.fieldBody}>
          <Text numberOfLines={1} style={[styles.fieldLabel, { color: selected ? theme.TEXT : theme.MUTED }]}>
            {selected?.label ?? placeholder}
          </Text>
          {!!selected?.sub && (
            <Text numberOfLines={1} style={[styles.fieldSub, { color: theme.MUTED }]}>
              {selected.sub}
            </Text>
          )}
        </View>
        {!!selected?.trailing && (
          <Text style={[styles.trailing, { color: theme.ACTIVE }]}>{selected.trailing}</Text>
        )}
        <Feather name="chevron-down" size={16} color={theme.MUTED} />
      </TouchableOpacity>

      <AnimatedModal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.CARD, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: theme.BORDER }]} />
          <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>{title}</Text>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {options.map(o => {
              const on = o.value === value;
              return (
                <TouchableOpacity
                  key={String(o.value)}
                  activeOpacity={0.7}
                  onPress={() => {
                    setOpen(false);
                    if (!on) onChange(o.value);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.option, on && { backgroundColor: `${theme.ACTIVE}14` }]}
                >
                  <View style={styles.fieldBody}>
                    <Text style={[styles.optionLabel, { color: on ? theme.ACTIVE : theme.TEXT }]}>{o.label}</Text>
                    {!!o.sub && <Text style={[styles.fieldSub, { color: theme.MUTED }]}>{o.sub}</Text>}
                  </View>
                  {!!o.trailing && (
                    <Text style={[styles.trailing, { color: on ? theme.ACTIVE : theme.MUTED }]}>{o.trailing}</Text>
                  )}
                  <View style={styles.check}>
                    {on && <Feather name="check" size={16} color={theme.ACTIVE} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </AnimatedModal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
  },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  fieldSub: { fontSize: 11, marginTop: 2 },
  trailing: { fontSize: 13, fontWeight: '700' },
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, maxHeight: '75%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10, paddingHorizontal: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
  },
  optionLabel: { fontSize: 14, fontWeight: '600' },
  check: { width: 18, alignItems: 'center' },
});
