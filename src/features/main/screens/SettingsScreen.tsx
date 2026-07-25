import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';

const BRACKETS = [
  { label: 'Up to 600K', range: '≤ PKR 6,00,000', rate: 'Exempt' },
  { label: '600K – 1.2M', range: 'PKR 6,00,001–12,00,000', rate: '5%' },
  { label: '1.2M – 2.2M', range: 'PKR 12,00,001–22,00,000', rate: '15%' },
  { label: '2.2M – 3.2M', range: 'PKR 22,00,001–32,00,000', rate: '25%' },
  { label: '3.2M – 4.1M', range: 'PKR 32,00,001–41,00,000', rate: '30%' },
  { label: 'Above 4.1M', range: '> PKR 41,00,000', rate: '35%' },
];

const PROVINCES = [
  { id: 'punjab', label: 'Punjab – PRA' },
  { id: 'sindh', label: 'Sindh – SRB' },
  { id: 'kpk', label: 'KPK – KPRA' },
  { id: 'balochistan', label: 'Balochistan – BRA' },
];

function PillToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.pillToggleContainer, { backgroundColor: theme.CARD }]}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <TouchableOpacity
            key={o.id}
            activeOpacity={0.8}
            onPress={() => onChange(o.id)}
            style={[
              styles.pillOptionBtn,
              {
                backgroundColor: active ? theme.TEXT : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.pillOptionText,
                {
                  color: active ? theme.BG : theme.MUTED,
                },
              ]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { theme } = useTheme();
  const animX = useRef(new Animated.Value(on ? 20 : 2)).current;

  useEffect(() => {
    Animated.spring(animX, {
      toValue: on ? 20 : 2,
      useNativeDriver: false,
      stiffness: 300,
      damping: 22,
    }).start();
  }, [on, animX]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[
        styles.toggleTrack,
        {
          backgroundColor: on ? theme.GREEN : theme.MODAL,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            transform: [{ translateX: animX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme, toggle, setTheme } = useTheme();
  const { showToast } = useToast();

  const [fbr, setFbr] = useState<string>('filer');
  const [province, setProvince] = useState<string>('punjab');
  const [bracket, setBracket] = useState(2);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [isolatedMode, setIsolatedMode] = useState(false);

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
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.headerBox}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}
          >
            <Feather name="chevron-left" size={16} color={theme.MUTED} />
            <Text style={[styles.subheadText, { color: theme.MUTED, marginBottom: 0 }]}>
              Preferences
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
            Settings
          </Text>
        </View>

        {/* ── Display Mode State Controller ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              Display Mode
            </Text>

            <View style={styles.themeRow}>
              {/* STARK LIGHT */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setTheme(false)}
                style={[
                  styles.themeCardBtn,
                  {
                    borderColor: !theme.isDark ? theme.ACTIVE : theme.BORDER,
                    backgroundColor: !theme.isDark
                      ? `${theme.ACTIVE}18`
                      : theme.MODAL,
                  },
                ]}
              >
                <Feather
                  name="sun"
                  size={20}
                  color={!theme.isDark ? theme.ACTIVE : theme.MUTED}
                />
                <View style={styles.alignCenter}>
                  <Text
                    style={[
                      styles.themeCardTitle,
                      {
                        color: !theme.isDark ? theme.ACTIVE : theme.MUTED,
                      },
                    ]}
                  >
                    STATE B
                  </Text>
                  <Text style={[styles.themeCardSub, { color: theme.MUTED }]}>
                    STARK LIGHT
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ABSOLUTE DARK */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setTheme(true)}
                style={[
                  styles.themeCardBtn,
                  {
                    borderColor: theme.isDark ? theme.ACTIVE : theme.BORDER,
                    backgroundColor: theme.isDark
                      ? `${theme.ACTIVE}18`
                      : theme.MODAL,
                  },
                ]}
              >
                <Feather
                  name="moon"
                  size={20}
                  color={theme.isDark ? theme.ACTIVE : theme.MUTED}
                />
                <View style={styles.alignCenter}>
                  <Text
                    style={[
                      styles.themeCardTitle,
                      {
                        color: theme.isDark ? theme.ACTIVE : theme.MUTED,
                      },
                    ]}
                  >
                    STATE A
                  </Text>
                  <Text style={[styles.themeCardSub, { color: theme.MUTED }]}>
                    ABSOLUTE DARK
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── FBR Profile Compliance ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              FBR Profile
            </Text>

            <PillToggle
              options={[
                { id: 'filer', label: 'FILER' },
                { id: 'nonfiler', label: 'NON-FILER' },
              ]}
              value={fbr}
              onChange={val => {
                setFbr(val);
                showToast(
                  `FBR profile updated to ${val.toUpperCase()}`,
                  'info',
                  'FBR Profile',
                );
              }}
            />

            <Text style={[styles.fbrDescText, { color: theme.MUTED }]}>
              {fbr === 'filer'
                ? 'Reduced withholding tax rates and full FBR return filing access.'
                : 'Higher WHT rates apply. File your return to unlock filer benefits.'}
            </Text>
          </View>
        </View>

        {/* ── Province / Revenue Authority ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.iconTitleRow}>
              <Feather name="map-pin" size={13} color={theme.MUTED} />
              <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
                Province · Revenue Authority
              </Text>
            </View>

            <View style={styles.listWrap}>
              {PROVINCES.map(p => {
                const isSelected = province === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => setProvince(p.id)}
                    style={[
                      styles.provRowBtn,
                      {
                        backgroundColor: isSelected
                          ? `${theme.ACTIVE}18`
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.provLabel,
                        {
                          color: isSelected ? theme.ACTIVE : theme.TEXT,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.activeDot,
                          { backgroundColor: theme.ACTIVE },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Salary Tax Bracket ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              Annual Salary Bracket
            </Text>

            <View style={styles.listWrap}>
              {BRACKETS.map((b, i) => {
                const isSelected = bracket === i;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    onPress={() => setBracket(i)}
                    style={[
                      styles.bracketRowBtn,
                      {
                        backgroundColor: isSelected
                          ? `${theme.ACTIVE}18`
                          : 'transparent',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bracketLabel,
                          { color: isSelected ? theme.ACTIVE : theme.TEXT },
                        ]}
                      >
                        {b.label}
                      </Text>
                      <Text style={[styles.bracketRange, { color: theme.MUTED }]}>
                        {b.range}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.bracketRate,
                        { color: isSelected ? theme.ACTIVE : theme.MUTED },
                      ]}
                    >
                      {b.rate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.slabSummaryBox, { backgroundColor: theme.MODAL }]}>
              <Text style={[styles.slabSummaryText, { color: theme.MUTED }]}>
                Selected slab:{' '}
                <Text style={{ color: theme.ACTIVE, fontWeight: '700' }}>
                  {BRACKETS[bracket].label} — {BRACKETS[bracket].rate} WHT
                </Text>
                . All tax projections in-app use this bracket.
              </Text>
            </View>
          </View>
        </View>

        {/* ── SMS & Privacy ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <View style={styles.iconTitleRow}>
              <Feather name="shield" size={13} color={theme.MUTED} />
              <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
                Privacy & SMS Engine
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: theme.TEXT }]}>
                  Bank SMS Parsing
                </Text>
                <Text style={[styles.toggleSub, { color: theme.MUTED }]}>
                  Auto-detect HBL, Meezan, Alfalah transactions
                </Text>
              </View>
              <Toggle
                on={smsEnabled}
                onToggle={() => setSmsEnabled(v => !v)}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: theme.TEXT }]}>
                  Isolated Wealth Mode
                </Text>
                <Text style={[styles.toggleSub, { color: theme.MUTED }]}>
                  Hides private cash flows from AI analysis
                </Text>
              </View>
              <Toggle
                on={isolatedMode}
                onToggle={() => setIsolatedMode(v => !v)}
              />
            </View>

            {isolatedMode && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: `${theme.RED}18` },
                ]}
              >
                <Text style={[styles.warningText, { color: theme.RED }]}>
                  Isolated Wealth Mode active — cash transactions excluded from
                  all AI projections.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── App Info Card ── */}
        <View style={styles.sectionMargin}>
          <View
            style={[
              styles.cardNoPadding,
              { backgroundColor: theme.CARD },
            ]}
          >
            {[
              { label: 'App Version', value: '2.4.1' },
              { label: 'FBR Data Updated', value: 'Finance Act 2024' },
              { label: 'SECP Rules', value: 'Compliant – 2024' },
            ].map((row, i) => (
              <TouchableOpacity
                key={row.label}
                activeOpacity={0.7}
                style={[
                  styles.infoRow,
                  {
                    borderBottomWidth: i < 2 ? 1 : 0,
                    borderBottomColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.infoLabel, { color: theme.MUTED }]}>
                  {row.label}
                </Text>
                <View style={styles.infoValueWrap}>
                  <Text style={[styles.infoValue, { color: theme.TEXT }]}>
                    {row.value}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={13}
                    color={theme.MUTED}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerBox: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  subheadText: {
    fontSize: 11,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  sectionMargin: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  cardNoPadding: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeCardBtn: {
    flex: 1,
    height: 80,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  alignCenter: {
    alignItems: 'center',
  },
  themeCardTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeCardSub: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  pillToggleContainer: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 3,
    gap: 3,
  },
  pillOptionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fbrDescText: {
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  listWrap: {
    gap: 2,
  },
  provRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  provLabel: {
    fontSize: 13,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bracketRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  bracketLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  bracketRange: {
    fontSize: 10,
  },
  bracketRate: {
    fontSize: 13,
    fontWeight: '800',
  },
  slabSummaryBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },
  slabSummaryText: {
    fontSize: 11,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  toggleSub: {
    fontSize: 11,
  },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
