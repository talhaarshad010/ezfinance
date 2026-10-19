import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import DeviceInfo from 'react-native-device-info';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useUserMode } from '../../../context/UserModeContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setProfile, UserProfile } from '../../../store/slices/userSlice';
import { ApiError, updateProfileDetails } from '../../../services/authService';
import { DrawerMenuButton } from '../../../components';
import { SelectField } from '../../../components/SelectField';
import { fullAmt } from '../../../utils/format';
import { monthlyIncomeOf } from '../../../utils/income';
import { loadCustomMemory } from './ca/memoryStore';
import { parsePkrNumber } from './ca/caActions';
import { computeAnnualSalariedTax } from './ca/caEngine';

// FBR salaried slabs (Finance Act 2024–25); `upTo` is the top of each slab's annual income.
const BRACKETS = [
  { upTo: 600_000, label: 'Up to 600K', range: '≤ PKR 6,00,000', rate: 'Exempt' },
  { upTo: 1_200_000, label: '600K – 1.2M', range: 'PKR 6,00,001–12,00,000', rate: '5%' },
  { upTo: 2_200_000, label: '1.2M – 2.2M', range: 'PKR 12,00,001–22,00,000', rate: '15%' },
  { upTo: 3_200_000, label: '2.2M – 3.2M', range: 'PKR 22,00,001–32,00,000', rate: '25%' },
  { upTo: 4_100_000, label: '3.2M – 4.1M', range: 'PKR 32,00,001–41,00,000', rate: '30%' },
  { upTo: Infinity, label: 'Above 4.1M', range: '> PKR 41,00,000', rate: '35%' },
];

const PROVINCES = [
  { id: 'punjab', label: 'Punjab – PRA' },
  { id: 'sindh', label: 'Sindh – SRB' },
  { id: 'kpk', label: 'KPK – KPRA' },
  { id: 'balochistan', label: 'Balochistan – BRA' },
  { id: 'ict', label: 'Islamabad – ICT' },
  { id: 'ajk', label: 'Azad Kashmir – AJK' },
  { id: 'gb', label: 'Gilgit-Baltistan – GB' },
];

// Settings ids ↔ the profile's stored values.
const PROVINCE_TO_PROFILE: Record<string, string> = {
  punjab: 'Punjab',
  sindh: 'Sindh',
  kpk: 'KPK',
  balochistan: 'Balochistan',
  ict: 'ICT',
  ajk: 'AJK',
  gb: 'GB',
};
const provinceIdOf = (value?: string | null) =>
  Object.keys(PROVINCE_TO_PROFILE).find(id => PROVINCE_TO_PROFILE[id] === value) ?? '';
const fbrIdOf = (value?: string | null) => (value === 'yes' ? 'filer' : value === 'no' ? 'nonfiler' : '');

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

// Read from the installed app, so it always matches the build ("1.0 (1)").
const APP_VERSION = `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Real accounts start from (and save to) their profile; the Explore demo keeps sample values.
  const { isNewUser } = useUserMode();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.user.profile);
  const [fbr, setFbr] = useState<string>(() => (isNewUser ? fbrIdOf(profile?.filerStatus) : 'filer'));
  const [province, setProvince] = useState<string>(() =>
    isNewUser ? provinceIdOf(profile?.province) : 'punjab',
  );

  /** Saves a tax detail to the profile (real accounts only). Reverts the choice if it fails. */
  const saveToProfile = async (
    changes: Partial<Pick<UserProfile, 'province' | 'filerStatus'>>,
    revert: () => void,
    savedMessage: string,
  ) => {
    if (!isNewUser || !profile) {
      showToast(savedMessage, 'info', 'FBR Profile');
      return;
    }
    try {
      dispatch(setProfile(await updateProfileDetails(profile, changes)));
      showToast(savedMessage, 'success', 'Saved');
    } catch (e) {
      revert();
      showToast((e as ApiError).message, 'error');
    }
  };
  // The bracket follows the salary the Personal CA uses: the Memory Bank salary if one is saved,
  // else this month's logged income or the profile's (whichever is more). Explore: the sample.
  const userMode = useUserMode();
  const [memorySalary, setMemorySalary] = useState<number | null>(null);
  // Read each time Settings is opened, so a salary just changed in the CA's Memory shows here.
  useFocusEffect(
    useCallback(() => {
      if (!isNewUser) return;
      let active = true;
      loadCustomMemory(profile?.uid || 'guest').then(m => {
        if (active) setMemorySalary(parsePkrNumber(m.facts.Salary));
      });
      return () => {
        active = false;
      };
    }, [isNewUser, profile?.uid]),
  );
  const monthlySalary = useMemo(() => {
    if (!isNewUser) return 150_000;
    if (memorySalary) return memorySalary;
    const now = new Date();
    const loggedThisMonth = userMode.txs
      .filter(t => t.type === 'income' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.max(loggedThisMonth, monthlyIncomeOf(profile?.monthlyIncome) ?? 0);
  }, [isNewUser, memorySalary, userMode.txs, profile?.monthlyIncome]);
  const annualSalary = monthlySalary * 12;
  const bracket = monthlySalary > 0 ? BRACKETS.findIndex(b => annualSalary <= b.upTo) : -1;
  const annualTax = Math.round(computeAnnualSalariedTax(annualSalary));

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DrawerMenuButton />
            <View>
              <Text style={[styles.subheadText, { color: theme.MUTED, marginBottom: 2 }]}>
                Preferences
              </Text>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Settings
              </Text>
            </View>
          </View>
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
                const previous = fbr;
                setFbr(val);
                saveToProfile(
                  { filerStatus: val === 'filer' ? 'yes' : 'no' },
                  () => setFbr(previous),
                  `FBR profile updated to ${val === 'filer' ? 'FILER' : 'NON-FILER'}`,
                );
              }}
            />

            <Text style={[styles.fbrDescText, { color: theme.MUTED }]}>
              {fbr === 'filer'
                ? 'Reduced withholding tax rates and full FBR return filing access.'
                : fbr === 'nonfiler'
                ? 'Higher WHT rates apply. File your return to unlock filer benefits.'
                : 'Not sure yet? Choose one to see the tax rates that apply to you.'}
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

            <SelectField
              title="Province · Revenue Authority"
              value={province}
              options={PROVINCES.map(p => ({ value: p.id, label: p.label }))}
              onChange={id => {
                const previous = province;
                setProvince(id);
                saveToProfile(
                  { province: PROVINCE_TO_PROFILE[id] },
                  () => setProvince(previous),
                  `Province updated to ${PROVINCES.find(p => p.id === id)?.label ?? id}`,
                );
              }}
            />
          </View>
        </View>

        {/* ── Salary Tax Bracket ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
              Annual Salary Bracket
            </Text>

            {bracket < 0 ? (
              <View style={[styles.slabSummaryBox, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.slabSummaryText, { color: theme.MUTED }]}>
                  Add your salary in Personal CA → Memory (or log your income) to see your tax bracket.
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.bracketField, { backgroundColor: theme.MODAL }]}>
                  <View style={styles.flex1}>
                    <Text style={[styles.bracketLabel, { color: theme.TEXT }]}>{BRACKETS[bracket].label}</Text>
                    <Text style={[styles.bracketRange, { color: theme.MUTED }]}>{BRACKETS[bracket].range}</Text>
                  </View>
                  <Text style={[styles.bracketRate, { color: theme.ACTIVE }]}>{BRACKETS[bracket].rate}</Text>
                </View>
                <View style={[styles.slabSummaryBox, { backgroundColor: theme.MODAL }]}>
                  <Text style={[styles.slabSummaryText, { color: theme.MUTED }]}>
                    Based on your salary of{' '}
                    <Text style={[styles.strong, { color: theme.TEXT }]}>PKR {fullAmt(monthlySalary)} / month</Text> (PKR{' '}
                    {fullAmt(annualSalary)} a year). Estimated tax:{' '}
                    <Text style={[styles.strong, { color: theme.ACTIVE }]}>
                      PKR {fullAmt(annualTax)} a year · PKR {fullAmt(Math.round(annualTax / 12))} / month
                    </Text>
                    . To change it, update your salary in Personal CA → Memory.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.sectionMargin}>
          <View style={[styles.cardNoPadding, { backgroundColor: theme.CARD }]}>
            {[
              { label: 'App version', value: APP_VERSION },
              { label: 'Tax rules', value: 'FBR Finance Act 2024–25' },
            ].map((row, i, rows) => (
              <View
                key={row.label}
                style={[
                  styles.infoRow,
                  { borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: theme.BORDER },
                ]}
              >
                <Text style={[styles.infoLabel, { color: theme.MUTED }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: theme.TEXT }]}>{row.value}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.aboutNote, { color: theme.MUTED }]}>
            Tax figures are estimates to help you plan. For filing, confirm with FBR or a tax advisor.
          </Text>
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
  flex1: { flex: 1 },
  strong: { fontWeight: '700' },
  bracketField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bracketLabel: { fontSize: 14, fontWeight: '600' },
  bracketRange: { fontSize: 11, marginTop: 2 },
  bracketRate: { fontSize: 15, fontWeight: '800' },
  slabSummaryBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },
  slabSummaryText: {
    fontSize: 11,
    lineHeight: 16,
  },
  aboutNote: { fontSize: 11, lineHeight: 16, marginTop: 10, paddingHorizontal: 6 },
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
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
