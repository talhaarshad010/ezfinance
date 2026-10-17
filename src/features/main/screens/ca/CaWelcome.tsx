import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../../context/ThemeContext';
import { fullAmt } from '../../../../utils/format';
import { parsePkrNumber } from './caActions';

/** What the user told the CA in the quick setup, as Memory Bank facts (key → value). */
export type SetupFacts = Record<string, string>;

interface Props {
  name: string;
  /** Pre-fills: the income the app already knows about, and the profile's city / filer status. */
  knownIncome: number;
  knownCity?: string;
  knownFiler?: 'filer' | 'non_filer' | 'unsure';
  bottomInset: number;
  /** Called with the facts to save (none when skipped). */
  onDone: (facts: SetupFacts) => void;
}

const FEATURES = [
  {
    icon: 'percent',
    title: 'Your tax, worked out',
    line: 'FBR salary slabs, monthly tax and Section 62 savings.',
  },
  {
    icon: 'trending-up',
    title: 'Plans from your real spending',
    line: 'How to save for a goal, built from your own categories.',
  },
  {
    icon: 'moon',
    title: 'Zakat and Shariah investing',
    line: 'Nisab, Zakat due, and Shariah-compliant funds.',
  },
  {
    icon: 'message-circle',
    title: 'Log money by chatting',
    line: '"Spent 500 on lunch" — you check it before anything is saved.',
  },
];

const FILER = [
  { id: 'filer', label: 'Filer' },
  { id: 'non_filer', label: 'Non-filer' },
  { id: 'unsure', label: 'Not sure' },
] as const;
const DEPENDENTS = ['0', '1', '2', '3', '4+'];
const RISK = ['Low', 'Moderate', 'High'];

/**
 * First visit to the Personal CA: what it can do, then a short optional setup that fills the
 * Memory Bank (salary, tax status, city, dependents, risk) so the first answers are personal.
 */
export function CaWelcome({
  name,
  knownIncome,
  knownCity,
  knownFiler,
  bottomInset,
  onDone,
}: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState<'intro' | 'setup'>('intro');

  const [salary, setSalary] = useState(
    knownIncome > 0 ? fullAmt(knownIncome) : '',
  );
  const [filer, setFiler] = useState<string | null>(
    knownFiler && knownFiler !== 'unsure' ? knownFiler : null,
  );
  const [city, setCity] = useState(knownCity ?? '');
  const [dependents, setDependents] = useState<string | null>(null);
  const [risk, setRisk] = useState<string | null>(null);

  const salaryValue = parsePkrNumber(salary);
  const salaryInvalid =
    salary.trim() !== '' &&
    !(salaryValue && salaryValue > 0 && salaryValue < 1e9);

  function save() {
    const facts: SetupFacts = {};
    // An unchanged salary keeps following the income the app already tracks.
    if (
      salaryValue &&
      !salaryInvalid &&
      Math.round(salaryValue) !== Math.round(knownIncome)
    ) {
      facts.Salary = `PKR ${fullAmt(salaryValue)} / mo`;
    }
    if (filer && filer !== knownFiler) {
      facts['Tax Profile'] =
        filer === 'filer'
          ? 'Salaried · FBR Filer'
          : filer === 'non_filer'
          ? 'Salaried · Non-Filer'
          : 'Not sure';
    }
    if (city.trim() && city.trim() !== (knownCity ?? ''))
      facts.City = city.trim();
    if (dependents) facts.Dependents = dependents;
    if (risk) facts['Risk Score'] = risk;
    onDone(facts);
  }

  const chip = (on: boolean) => [
    styles.chip,
    {
      backgroundColor: on ? theme.TEXT : theme.CARD,
      borderColor: on ? theme.TEXT : theme.BORDER,
    },
  ];
  const chipText = (on: boolean) => [
    styles.chipText,
    { color: on ? theme.BG : theme.TEXT },
  ];

  if (step === 'intro') {
    return (
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.body, styles.bodyEnd]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.badge, { backgroundColor: theme.ACTIVE }]}>
            <MaterialCommunityIcons name="brain" size={30} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: theme.TEXT }]}>
            Meet your Personal CA
          </Text>
          <Text style={[styles.lead, { color: theme.MUTED }]}>
            Assalam-o-Alaikum, {name}. I'm an AI chartered accountant who knows
            Pakistan's tax rules and reads your own numbers from ezFinance.
          </Text>

          <View style={[styles.card, { backgroundColor: theme.CARD }]}>
            {FEATURES.map((f, i) => (
              <View
                key={f.title}
                style={[styles.feature, i > 0 && styles.featureGap]}
              >
                <View
                  style={[styles.featureIcon, { backgroundColor: theme.MODAL }]}
                >
                  <Feather name={f.icon} size={16} color={theme.TEXT} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.featureTitle, { color: theme.TEXT }]}>
                    {f.title}
                  </Text>
                  <Text style={[styles.featureLine, { color: theme.MUTED }]}>
                    {f.line}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.note}>
            <Feather name="lock" size={12} color={theme.MUTED} />
            <Text style={[styles.noteText, { color: theme.MUTED }]}>
              What you tell me is kept in your Memory Bank. Open Memory at any
              time to change or remove it.
            </Text>
          </View>
        </ScrollView>
        <View
          style={[
            styles.footer,
            { paddingBottom: bottomInset + 84, backgroundColor: theme.BG },
          ]}
        >
          <TouchableOpacity onPress={() => onDone({})} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: theme.MUTED }]}>
              Skip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep('setup')}
            style={[styles.primary, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.primaryText, { color: theme.BG }]}>
              Set up in 1 minute
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, styles.bodyEnd]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => setStep('intro')}
          style={styles.back}
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={18} color={theme.TEXT} />
        </TouchableOpacity>
        <Text style={[styles.title, styles.left, { color: theme.TEXT }]}>
          A few things about you
        </Text>
        <Text style={[styles.lead, styles.left, { color: theme.MUTED }]}>
          These make my tax and savings answers fit you. Leave anything blank
          you'd rather not share.
        </Text>

        <Text style={[styles.label, { color: theme.MUTED }]}>
          Monthly salary (before tax)
        </Text>
        <View
          style={[
            styles.input,
            {
              backgroundColor: theme.CARD,
              borderColor: salaryInvalid ? theme.RED : theme.BORDER,
            },
          ]}
        >
          <Text style={[styles.prefix, { color: theme.MUTED }]}>PKR</Text>
          <TextInput
            value={salary}
            onChangeText={setSalary}
            placeholder="e.g. 1,50,000"
            placeholderTextColor={theme.MUTED}
            keyboardType="numeric"
            style={[styles.inputText, { color: theme.TEXT }]}
          />
        </View>
        {salaryInvalid && (
          <Text style={[styles.error, { color: theme.RED }]}>
            Enter an amount, like 1,50,000.
          </Text>
        )}
        {knownIncome > 0 && !salaryInvalid && (
          <Text style={[styles.hint, { color: theme.MUTED }]}>
            Filled in from the income in your app.
          </Text>
        )}

        <Text style={[styles.label, { color: theme.MUTED }]}>
          FBR tax status
        </Text>
        <View style={styles.chips}>
          {FILER.map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFiler(filer === f.id ? null : f.id)}
              style={chip(filer === f.id)}
            >
              <Text style={chipText(filer === f.id)}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.MUTED }]}>City</Text>
        <View
          style={[
            styles.input,
            { backgroundColor: theme.CARD, borderColor: theme.BORDER },
          ]}
        >
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Lahore"
            placeholderTextColor={theme.MUTED}
            autoCapitalize="words"
            style={[styles.inputText, { color: theme.TEXT }]}
          />
        </View>

        <Text style={[styles.label, { color: theme.MUTED }]}>
          People who depend on you
        </Text>
        <View style={styles.chips}>
          {DEPENDENTS.map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => setDependents(dependents === d ? null : d)}
              style={[...chip(dependents === d), styles.chipSmall]}
            >
              <Text style={chipText(dependents === d)}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.MUTED }]}>
          Comfort with investment risk
        </Text>
        <View style={styles.chips}>
          {RISK.map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => setRisk(risk === r ? null : r)}
              style={chip(risk === r)}
            >
              <Text style={chipText(risk === r)}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          { paddingBottom: bottomInset + 84, backgroundColor: theme.BG },
        ]}
      >
        <TouchableOpacity onPress={() => onDone({})} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: theme.MUTED }]}>
            Skip
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={save}
          disabled={salaryInvalid}
          style={[
            styles.primary,
            { backgroundColor: theme.TEXT, opacity: salaryInvalid ? 0.4 : 1 },
          ]}
        >
          <Text style={[styles.primaryText, { color: theme.BG }]}>
            Save and start
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 12 },
  bodyEnd: { paddingBottom: 24 },
  // Buttons stay above the floating tab bar.
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  flex: { flex: 1 },
  left: { textAlign: 'left', alignSelf: 'stretch' },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: 16,
  },
  lead: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 22, padding: 16, marginTop: 22 },
  feature: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  featureGap: { marginTop: 16 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '700' },
  featureLine: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  noteText: { fontSize: 11, lineHeight: 16, flex: 1 },
  primary: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 15, fontWeight: '800' },
  secondary: {
    height: 52,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 13, fontWeight: '600' },
  back: { width: 36, height: 36, justifyContent: 'center' },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },
  prefix: { fontSize: 14, fontWeight: '700' },
  inputText: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 0 },
  hint: { fontSize: 11, marginTop: 6 },
  error: { fontSize: 11, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipSmall: { minWidth: 48, alignItems: 'center' },
  chipText: { fontSize: 13, fontWeight: '700' },
});
