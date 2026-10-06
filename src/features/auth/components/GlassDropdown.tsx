import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { EASE_OUT_BEZIER, useAuthTheme } from './authTheme';

export interface DropdownOption {
  value: string;
  label: string;
}

const ITEM_H = 40;
const MAX_H = 248;

/** Glass select that expands an attached option list beneath the trigger. */
export function GlassDropdown({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
}) {
  const A = useAuthTheme();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const selected = options.find(o => o.value === value);
  const listH = Math.min(options.length * ITEM_H + 12, MAX_H);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: open ? 200 : 150,
      easing: Easing.bezier(...EASE_OUT_BEZIER),
      useNativeDriver: false,
    }).start();
  }, [open, anim]);

  const chevronRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View>
      <Pressable
        onPress={() => setOpen(o => !o)}
        style={[
          styles.trigger,
          {
            borderColor: open ? 'rgba(14,165,233,0.55)' : A.GLASS_BORDER,
            backgroundColor: open ? A.FOCUS_BG : A.GLASS,
            boxShadow: open ? '0 0 0 3px rgba(14,165,233,0.14), 0 0 20px rgba(14,165,233,0.10)' : A.REST_SHADOW,
            borderBottomLeftRadius: open ? 0 : 16,
            borderBottomRightRadius: open ? 0 : 16,
          },
        ]}
      >
        <Text numberOfLines={1} style={[styles.triggerText, { color: selected ? A.TEXT : A.PLACEHOLDER }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Animated.View style={[styles.chevron, { transform: [{ rotate: chevronRotate }] }]}>
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path d="M4 6l4 4 4-4" stroke={A.INK(0.35)} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </Pressable>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.list,
          {
            height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, listH] }),
            opacity: anim,
            borderWidth: open ? 1 : 0,
            backgroundColor: A.MENU_BG,
            boxShadow: A.isDark
              ? '0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(14,165,233,0.08)'
              : '0 16px 40px rgba(13,13,14,0.10), 0 0 24px rgba(14,165,233,0.06)',
          },
        ]}
      >
        <ScrollView nestedScrollEnabled contentContainerStyle={styles.listInner} showsVerticalScrollIndicator={false}>
          {options.map(o => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: active ? 'rgba(14,165,233,0.12)' : pressed ? A.INK(0.05) : 'transparent' },
                ]}
              >
                <Text style={[styles.itemText, { color: active ? A.LINK : A.INK(0.8), fontWeight: active ? '600' : '400' }]}>
                  {o.label}
                </Text>
                {active && (
                  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <Path d="M2.5 7l3 3 6-6" stroke={A.LINK} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 58,
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 20,
    paddingRight: 44,
    justifyContent: 'center',
  },
  triggerText: { fontSize: 17 },
  chevron: { position: 'absolute', right: 16 },
  list: {
    overflow: 'hidden',
    borderColor: 'rgba(14,165,233,0.4)',
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  listInner: { padding: 6 },
  item: {
    height: ITEM_H,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: { fontSize: 14 },
});

export default GlassDropdown;
