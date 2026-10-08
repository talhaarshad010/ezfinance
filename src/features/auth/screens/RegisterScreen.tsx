import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile } from '../../../store/slices/userSlice';
import { useUserMode } from '../../../context/UserModeContext';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, PrimaryButton, TextButton } from '../components/AuthButtons';
import { GlassInput } from '../components/GlassInput';
import { GlassDropdown } from '../components/GlassDropdown';
import { Glow } from '../components/Glow';
import { FadeUp, LogoReveal, SlideIn } from '../components/Entrance';

type Step = 'name' | 'contact' | 'password' | 'income' | 'city' | 'filer' | 'done';
type Filer = 'yes' | 'no' | 'unsure';

const STEPS: Step[] = ['name', 'contact', 'password', 'income', 'city', 'filer', 'done'];
const TOTAL = STEPS.length - 1; // "done" isn't counted in "n of 6"

const INCOME_OPTIONS = [
  { label: 'Under 25k', value: '< 25,000' },
  { label: '25k to 50k', value: '25,000 to 50,000' },
  { label: '50k to 100k', value: '50,000 to 100,000' },
  { label: '100k to 150k', value: '100,000 to 150,000' },
  { label: '150k and above', value: '> 150,000' },
];

const PROVINCES = [
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Sindh', label: 'Sindh' },
  { value: 'KPK', label: 'Khyber Pakhtunkhwa' },
  { value: 'Balochistan', label: 'Balochistan' },
  { value: 'ICT', label: 'Islamabad Capital Territory' },
  { value: 'AJK', label: 'Azad Kashmir' },
  { value: 'GB', label: 'Gilgit-Baltistan' },
];

const FILER_OPTIONS: { id: Filer; label: string }[] = [
  { id: 'yes', label: 'Yes, I am a filer' },
  { id: 'no', label: 'No, I am not a filer' },
  { id: 'unsure', label: 'Not sure' },
];

function passwordStrength(pw: string, A: AuthPalette) {
  if (!pw) return null;
  if (pw.length < 8) return { label: 'Too short', color: A.RED, pct: '33%' as const };
  if (pw.length < 12) return { label: 'Good', color: A.LINK, pct: '66%' as const };
  return { label: 'Strong', color: A.EMERALD_TEXT, pct: '100%' as const };
}

function StepHeading({ title, hint }: { title: string; hint: string }) {
  const { styles } = useAuthStyles(createStyles);
  return (
    <>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepHint}>{hint}</Text>
    </>
  );
}

/** Six-step sign-up (name → contact → password → income → location → filer) + success. */
export const RegisterScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const { beginNewUser } = useUserMode();

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [income, setIncome] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [filer, setFiler] = useState<Filer | ''>('');
  const [showFilerInfo, setShowFilerInfo] = useState(false);

  const step = STEPS[stepIdx];
  const isDone = step === 'done';
  const progress = Math.min(Math.round((stepIdx / TOTAL) * 100), 100);

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      easing: Easing.bezier(0.34, 1.26, 0.64, 1),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const canContinue = (() => {
    switch (step) {
      case 'name':
        return name.trim().length > 0;
      case 'contact':
        return contact.trim().length > 0;
      case 'password':
        return password.length >= 8;
      case 'city':
        return city.trim().length > 0 && province.length > 0;
      default:
        return true; // income & filer are optional
    }
  })();
  const skippable = step === 'income' || step === 'filer';

  const goNext = () => {
    if (stepIdx >= STEPS.length - 1) return;
    setDir('right');
    setAnimKey(k => k + 1);
    setStepIdx(i => i + 1);
  };
  const goBack = () => {
    if (stepIdx === 0) {
      navigation.goBack();
      return;
    }
    setDir('left');
    setAnimKey(k => k + 1);
    setStepIdx(i => i - 1);
  };

  const finishSignUp = () => {
    const value = contact.trim();
    const isEmail = value.includes('@');
    // A fresh account: empty states, Getting started checklist and the guided tour.
    beginNewUser();
    dispatch(
      setProfile({
        uid: 'usr_demo_01',
        name: name.trim(),
        email: isEmail ? value : '',
        photoURL: null,
        phone: isEmail ? null : value,
        monthlyIncome: income || null,
        city: city.trim() || null,
        province: province || null,
        filerStatus: filer || 'unsure',
      }),
    );
    showToast('Account created successfully! Welcome to EZFinance.', 'success');
  };

  const strength = passwordStrength(password, A);

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <>
            <StepHeading title="What should we call you?" hint="This is how ezFinance will address you" />
            <GlassInput size="lg" placeholder="Your name" value={name} onChangeText={setName} autoFocus autoCapitalize="words" textContentType="name" returnKeyType="next" onSubmitEditing={canContinue ? goNext : undefined} />
          </>
        );
      case 'contact':
        return (
          <>
            <StepHeading title="Phone or email?" hint="Used to log in and for important notifications" />
            <GlassInput size="lg" placeholder="+92 3xx xxxx xxx or email" value={contact} onChangeText={setContact} autoFocus autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" returnKeyType="next" onSubmitEditing={canContinue ? goNext : undefined} />
          </>
        );
      case 'password':
        return (
          <>
            <StepHeading title="Create a password" hint="Minimum 8 characters" />
            <GlassInput size="lg" placeholder="Password" value={password} onChangeText={setPassword} password autoFocus textContentType="newPassword" returnKeyType="next" onSubmitEditing={canContinue ? goNext : undefined} />
            {strength && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, { width: strength.pct, backgroundColor: strength.color, boxShadow: `0 0 8px ${strength.color}` }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}
          </>
        );
      case 'income':
        return (
          <>
            <StepHeading title="Monthly income" hint="Helps us set realistic budgets and tax estimates for you" />
            <View style={styles.chips}>
              {INCOME_OPTIONS.map(o => {
                const active = income === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setIncome(active ? '' : o.value)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        );
      case 'city':
        return (
          <>
            <StepHeading title="Your location" hint="Tax rules vary by province" />
            <View style={styles.cityFields}>
              <GlassInput size="lg" placeholder="City (e.g. Lahore)" value={city} onChangeText={setCity} autoCapitalize="words" textContentType="addressCity" />
              <GlassDropdown placeholder="Select province" value={province} onChange={setProvince} options={PROVINCES} />
            </View>
          </>
        );
      case 'filer':
        return (
          <>
            <View style={styles.filerHead}>
              <Text style={[styles.stepTitle, styles.filerTitle]}>Are you a tax filer?</Text>
              <TextButton label="What is this?" onPress={() => setShowFilerInfo(v => !v)} textStyle={styles.whatIs} style={styles.whatIsBtn} />
            </View>
            {showFilerInfo && (
              <FadeUp distance={-8} duration={220} style={styles.infoBox}>
                <Text style={styles.infoText}>
                  A <Text style={styles.infoStrong}>filer</Text> is registered with FBR and submits an annual income tax
                  return. Filers pay lower withholding tax on bank transactions, property, and vehicles.
                </Text>
              </FadeUp>
            )}
            <Text style={[styles.stepHint, styles.filerHint]}>Defaults to not sure. You can update this later.</Text>
            <View style={styles.filerList}>
              {FILER_OPTIONS.map(o => {
                const active = filer === o.id;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => setFiler(active ? '' : o.id)}
                    style={[styles.filerOption, active && styles.filerOptionActive]}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.filerLabel, active && styles.filerLabelActive]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />

      {/* Header + progress */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        {!isDone && (
          <View style={styles.headerRow}>
            <Pressable onPress={goBack} hitSlop={10} style={({ pressed }) => [styles.headerBack, pressed && { opacity: 0.6 }]}>
              <BackChevron />
            </Pressable>
            <Text style={styles.headerTitle}>Create account</Text>
            <Text style={styles.headerCount}>
              {stepIdx + 1} of {TOTAL}
            </Text>
          </View>
        )}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
      </View>

      {isDone ? (
        <View style={[styles.done, { paddingBottom: insets.bottom + 28 }]}>
          <LogoReveal style={styles.doneIconWrap}>
            <Glow size={130} stops={[[0, '#00E68A', 0.22], [0.72, '#00E68A', 0]]} />
            <View style={styles.doneIcon}>
              <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
                <Circle cx="20" cy="20" r="18" fill="rgba(0,230,138,0.2)" />
                <Circle cx="20" cy="20" r="13" fill={A.EMERALD} />
                <Path d="M13 20l5.5 5.5 9.5-10" stroke="#0D0D0E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </LogoReveal>
          <FadeUp delay={140} style={styles.doneText}>
            <Text style={styles.doneTitle}>You are all set!</Text>
            <Text style={styles.doneBody}>
              Your ezFinance account is ready. Let us take control of your finances together.
            </Text>
          </FadeUp>
          <FadeUp delay={260} style={styles.doneCta}>
            <PrimaryButton label="Go to my dashboard" height={58} onPress={finishSignUp} />
          </FadeUp>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.stepScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SlideIn key={animKey} from={dir} style={styles.stepBody}>
              {renderStep()}
            </SlideIn>
          </ScrollView>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
            <PrimaryButton
              label={stepIdx === TOTAL - 1 ? 'Finish' : 'Continue'}
              onPress={goNext}
              disabled={!canContinue}
            />
            {skippable && (
              <TextButton label="Skip for now" onPress={goNext} style={styles.skipBtn} textStyle={styles.skipText} />
            )}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TextButton label="Log in" onPress={() => navigation.navigate('Login')} textStyle={styles.loginLink} />
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default RegisterScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: A.BG },
  flex: { flex: 1 },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  headerBack: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: A.TEXT,
    letterSpacing: -0.2,
  },
  headerCount: {
    fontSize: 13,
    color: A.FAINT,
    fontWeight: '500',
  },
  progressTrack: {
    height: 2,
    backgroundColor: A.DIVIDER,
    borderRadius: 100,
  },
  progressFill: {
    height: 2,
    borderRadius: 100,
    backgroundColor: A.SKY,
    boxShadow: '0 0 8px rgba(14,165,233,0.8)',
  },

  stepScroll: { flexGrow: 1 },
  stepBody: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: A.TEXT,
    marginBottom: 10,
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  stepHint: {
    fontSize: 14,
    color: A.HINT,
    marginBottom: 28,
    lineHeight: 22,
  },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  strengthTrack: {
    flex: 1,
    height: 2,
    borderRadius: 100,
    backgroundColor: A.DIVIDER,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 100 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 60 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: A.GLASS_BORDER,
    backgroundColor: A.GLASS,
  },
  chipActive: {
    borderColor: 'rgba(14,165,233,0.6)',
    backgroundColor: 'rgba(14,165,233,0.14)',
    boxShadow: '0 0 14px rgba(14,165,233,0.22)',
  },
  chipText: { fontSize: 15, color: A.INK(0.7) },
  chipTextActive: { color: A.LINK, fontWeight: '600' },

  cityFields: { gap: 12 },

  filerHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  filerTitle: { flex: 1, marginBottom: 0 },
  whatIsBtn: { marginTop: 8 },
  whatIs: { color: A.LINK, fontSize: 13, fontWeight: '500' },
  infoBox: {
    backgroundColor: 'rgba(14,165,233,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  infoText: { fontSize: 13, color: A.INK(0.65), lineHeight: 21 },
  infoStrong: { color: A.INK(0.9), fontWeight: '700' },
  filerHint: { marginBottom: 20 },
  filerList: { gap: 10 },
  filerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: A.INK(0.1),
    backgroundColor: A.INK(0.04),
  },
  filerOptionActive: {
    borderColor: 'rgba(14,165,233,0.5)',
    backgroundColor: 'rgba(14,165,233,0.1)',
    boxShadow: '0 0 20px rgba(14,165,233,0.14)',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: A.INK(0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: A.SKY,
    backgroundColor: A.SKY,
    boxShadow: '0 0 10px rgba(14,165,233,0.4)',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }, // on the sky radio
  filerLabel: { fontSize: 16, color: A.INK(0.7) },
  filerLabelActive: { color: A.TEXT, fontWeight: '600' },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { color: A.FAINT, fontSize: 14, fontWeight: '500' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 13, color: A.FAINT },
  loginLink: { fontSize: 13, color: A.LINK, fontWeight: '600' },

  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  doneIconWrap: { alignItems: 'center', justifyContent: 'center' },
  doneIcon: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(0,230,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,230,138,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 48px rgba(0,230,138,0.22)',
  },
  doneText: { alignItems: 'center' },
  doneTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: A.TEXT,
    letterSpacing: -0.7,
  },
  doneBody: {
    fontSize: 16,
    color: A.MUTED,
    lineHeight: 26,
    maxWidth: 260,
    marginTop: 14,
    textAlign: 'center',
  },
  doneCta: { width: '100%', marginTop: 8 },
});
