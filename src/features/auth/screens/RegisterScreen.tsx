import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile, UserProfile } from '../../../store/slices/userSlice';
import { useUserMode } from '../../../context/UserModeContext';
import {
  abandonSignUp,
  ApiError,
  completeSignUp,
  sendSignUpCode,
  verifySignUpCode,
} from '../../../services/authService';
import { clearSignUpProgress, loadSignUpProgress, saveSignUpProgress } from '../../../api/signupProgress';
import { AuthPalette, useAuthStyles } from '../components/authTheme';
import { BackChevron, PrimaryButton, TextButton } from '../components/AuthButtons';
import { GlassInput } from '../components/GlassInput';
import { GlassDropdown } from '../components/GlassDropdown';
import { FadeUp, SlideIn } from '../components/Entrance';
import { SignUpDone } from '../components/SignUpDone';
import { AuthBanners, FieldError, NoticeData } from '../components/AuthFeedback';
import { authErrorMessage, useAuthGuard } from '../components/AuthGuard';
import { MSG, validateEmail, validatePassword } from '../components/authMessages';
import { OtpVerification } from '../components/OtpVerification';

type Step = 'name' | 'email' | 'code' | 'password' | 'income' | 'city' | 'filer' | 'done';
type Filer = 'yes' | 'no' | 'unsure';

// The email is verified (and the account created) before the password is chosen.
const STEPS: Step[] = ['name', 'email', 'code', 'password', 'income', 'city', 'filer', 'done'];
const TOTAL = STEPS.length - 1; // "done" isn't counted in "n of 7"
const EMAIL_IDX = STEPS.indexOf('email');
const PASSWORD_IDX = STEPS.indexOf('password');
const SWIPE_DX = 60;

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

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'city' | 'province', string>>;

/**
 * Sign-up wizard, one question per screen: name → email → code → password → income → location →
 * filer → done. Continue or swipe left to advance, back arrow or swipe right to go back.
 */
export const RegisterScreen = () => {
  const { A, styles } = useAuthStyles(createStyles);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const { beginNewUser } = useUserMode();
  const guard = useAuthGuard();

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  /** The email whose code was verified in this session (its account is signed in, in memory). */
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [income, setIncome] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [filer, setFiler] = useState<Filer | ''>('');
  const [showFilerInfo, setShowFilerInfo] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<UserProfile | null>(null);
  const [restored, setRestored] = useState(false);

  const attempt = useRef(0);
  const touch = useRef({ x: 0, y: 0 });
  // Whether leaving this screen should discard an unfinished, verified sign-up session.
  const pendingSession = useRef(false);

  const step = STEPS[stepIdx];
  const isDone = step === 'done';
  const isCode = step === 'code';
  const isFinish = step === 'filer';
  const progress = Math.min(Math.round((stepIdx / TOTAL) * 100), 100);
  const normalizedEmail = email.trim().toLowerCase();

  // ── Saved progress ────────────────────────────────────────────────────
  useEffect(() => {
    loadSignUpProgress().then(saved => {
      if (saved && (saved.name || saved.email)) {
        setName(saved.name);
        setEmail(saved.email);
        setIncome(saved.income);
        setCity(saved.city);
        setProvince(saved.province);
        setFiler(saved.filer as Filer | '');
        // A verified code doesn't survive a restart, so resume no later than the email step.
        setStepIdx(Math.min(Math.max(saved.stepIndex, 0), EMAIL_IDX));
        setNotice({ tone: 'info', text: 'Welcome back. We saved your progress.' });
      }
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored || isDone) return;
    saveSignUpProgress({ stepIndex: stepIdx, name, email, income, city, province, filer });
  }, [restored, isDone, stepIdx, name, email, income, city, province, filer]);

  // Leaving mid-way (back, swipe, "Log in") drops the unfinished session; the account stays
  // without a password and signing up again with the same email simply continues.
  useEffect(
    () => () => {
      if (pendingSession.current) abandonSignUp();
    },
    [],
  );

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      easing: Easing.bezier(0.34, 1.26, 0.64, 1),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // ── Navigation between steps ─────────────────────────────────────────
  const goTo = useCallback((index: number, direction: 'right' | 'left') => {
    setDir(direction);
    setAnimKey(k => k + 1);
    setStepIdx(index);
  }, []);

  const goPrev = () => {
    attempt.current++;
    setLoading(false);
    setNotice(null);
    setErrors({});
    if (stepIdx === 0) {
      navigation.goBack();
      return;
    }
    // Once the email is verified, going back skips the code step.
    if (step === 'password' && verifiedEmail) goTo(EMAIL_IDX, 'left');
    else goTo(stepIdx - 1, 'left');
  };

  const leaveToLogin = () => {
    attempt.current++;
    if (pendingSession.current) {
      pendingSession.current = false;
      setVerifiedEmail(null);
      abandonSignUp();
    }
    navigation.navigate('Login');
  };

  const filled = (() => {
    switch (step) {
      case 'name':
        return name.trim().length > 0;
      case 'email':
        return email.trim().length > 0;
      case 'password':
        return password.length > 0 && confirm.length > 0;
      case 'city':
        return city.trim().length > 0 && province.length > 0;
      default:
        return true; // income & filer are optional
    }
  })();
  const skippable = step === 'income' || step === 'filer';
  const needsNetwork = step === 'email' || isFinish;

  const validate = (): Errors => {
    switch (step) {
      case 'name':
        return { name: name.trim() ? undefined : 'Enter your name.' };
      case 'email':
        return { email: validateEmail(email) ?? undefined };
      case 'password':
        return {
          password: validatePassword(password) ?? undefined,
          confirm: !confirm ? 'Confirm your password.' : confirm !== password ? MSG.mismatch : undefined,
        };
      case 'city':
        return {
          city: city.trim() ? undefined : 'Enter your city.',
          province: province ? undefined : 'Select your province.',
        };
      default:
        return {};
    }
  };

  // Runs a network step with a spinner; results arriving after Back are ignored.
  const request = async <T,>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown } | null> => {
    setNotice(null);
    setLoading(true);
    const id = ++attempt.current;
    try {
      const value = await fn();
      return id === attempt.current ? { ok: true, value } : null;
    } catch (error) {
      return id === attempt.current ? { ok: false, error } : null;
    } finally {
      if (id === attempt.current) setLoading(false);
    }
  };

  const showError = (error: unknown) => {
    const msg = authErrorMessage(error, guard);
    if (msg) setNotice({ tone: 'error', text: msg });
  };

  const onContinue = async (skip = false) => {
    if (loading || isDone || isCode) return;
    if (!skip) {
      const errs = validate();
      setErrors(errs);
      if (Object.values(errs).some(Boolean)) return;
    }

    if (step === 'email') {
      if (guard.blocked) return;
      if (verifiedEmail === normalizedEmail) {
        goTo(PASSWORD_IDX, 'right');
        return;
      }
      // Same response whether or not the email already has an account.
      const r = await request(() => sendSignUpCode(email, name));
      if (r?.ok) goTo(stepIdx + 1, 'right');
      else if (r) showError(r.error);
      return;
    }

    if (isFinish) {
      if (guard.blocked) return;
      const r = await request(() =>
        completeSignUp({
          name,
          password,
          monthlyIncome: income || null,
          city,
          province: province || null,
          filerStatus: skip ? null : filer || null,
        }),
      );
      if (r?.ok) {
        pendingSession.current = false;
        clearSignUpProgress();
        setCreated(r.value);
        goTo(stepIdx + 1, 'right');
      } else if (r) {
        if ((r.error as ApiError).status === 401) {
          // The verified session expired (e.g. a long pause): verify the email again.
          pendingSession.current = false;
          setVerifiedEmail(null);
          setNotice({ tone: 'error', text: 'Your session expired. Verify your email again to finish.' });
          goTo(EMAIL_IDX, 'left');
        } else {
          showError(r.error);
        }
      }
      return;
    }

    goTo(stepIdx + 1, 'right');
  };

  const onCodeVerified = async (code: string) => {
    const result = await verifySignUpCode(email, code);
    if (result.existingAccount) {
      // They proved they own the email, so it's safe to say it already has an account.
      clearSignUpProgress();
      beginNewUser({ tour: !result.profile.tourCompleted });
      dispatch(setProfile(result.profile));
      showToast('You already have an account with this email. You are signed in.', 'success');
      return;
    }
    pendingSession.current = true;
    setVerifiedEmail(normalizedEmail);
    setNotice(null);
    goTo(PASSWORD_IDX, 'right');
  };

  const finishSignUp = () => {
    if (!created) return;
    // A fresh account: empty states, Getting started checklist and the guided tour.
    beginNewUser({ tour: !created.tourCompleted });
    dispatch(setProfile(created));
    showToast('Account created successfully! Welcome to EZFinance.', 'success');
  };

  // Editing setters clear the matching inline message.
  const clear = (k: keyof Errors) => setErrors(e => ({ ...e, [k]: undefined }));

  const onEmailChange = (v: string) => {
    setEmail(v);
    clear('email');
    if (verifiedEmail && v.trim().toLowerCase() !== verifiedEmail) {
      // A different email: the verified session belongs to the old one.
      pendingSession.current = false;
      setVerifiedEmail(null);
      abandonSignUp();
    }
  };

  const strength = passwordStrength(password, A);

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <>
            <StepHeading title="What should we call you?" hint="This is how ezFinance will address you" />
            <GlassInput size="lg" placeholder="Your name" value={name} onChangeText={v => { setName(v); clear('name'); }} error={errors.name} autoFocus autoCapitalize="words" textContentType="name" returnKeyType="next" onSubmitEditing={() => onContinue()} />
          </>
        );
      case 'email':
        return (
          <>
            <StepHeading title="What's your email?" hint="Used to log in and for important notifications" />
            <GlassInput size="lg" placeholder="you@example.com" value={email} onChangeText={onEmailChange} error={errors.email} editable={!loading} autoFocus autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => onContinue()} />
          </>
        );
      case 'password':
        return (
          <>
            <StepHeading title="Create a password" hint="At least 8 characters with a number" />
            <GlassInput size="lg" placeholder="Password" value={password} onChangeText={v => { setPassword(v); clear('password'); }} error={errors.password} password autoFocus textContentType="newPassword" returnKeyType="next" />
            {strength && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, { width: strength.pct, backgroundColor: strength.color, boxShadow: `0 0 8px ${strength.color}` }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}
            <View style={styles.confirmField}>
              <GlassInput size="lg" placeholder="Confirm password" value={confirm} onChangeText={v => { setConfirm(v); clear('confirm'); }} error={errors.confirm} password textContentType="newPassword" returnKeyType="next" onSubmitEditing={() => onContinue()} />
            </View>
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
              <GlassInput size="lg" placeholder="City (e.g. Lahore)" value={city} onChangeText={v => { setCity(v); clear('city'); }} error={errors.city} autoCapitalize="words" textContentType="addressCity" />
              <View>
                <GlassDropdown placeholder="Select province" value={province} onChange={v => { setProvince(v); clear('province'); }} options={PROVINCES} />
                <FieldError>{errors.province}</FieldError>
              </View>
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
    <View
      style={styles.container}
      onTouchStart={e => {
        touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      }}
      onTouchEnd={e => {
        const dx = e.nativeEvent.pageX - touch.current.x;
        const dy = e.nativeEvent.pageY - touch.current.y;
        if (isDone || loading || Math.abs(dx) < SWIPE_DX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx < 0) onContinue();
        else goPrev();
      }}
    >
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />

      {/* Header + progress */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        {!isDone && (
          <View style={styles.headerRow}>
            <Pressable onPress={goPrev} hitSlop={10} accessibilityLabel="Back" style={({ pressed }) => [styles.headerBack, pressed && { opacity: 0.6 }]}>
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
      <AuthBanners notice={notice} />

      {isDone ? (
        <SignUpDone onContinue={finishSignUp} />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          {isCode ? (
            <SlideIn key={animKey} from={dir} style={styles.codeWrap}>
              <OtpVerification
                email={email}
                variant="wizard"
                onVerify={onCodeVerified}
                onResend={() => sendSignUpCode(email, name)}
                onChangeEmail={goPrev}
                onNotice={setNotice}
              />
            </SlideIn>
          ) : (
            <>
              <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.stepScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <SlideIn key={animKey} from={dir} style={[styles.stepBody, loading && styles.locked]}>
                  {renderStep()}
                </SlideIn>
              </ScrollView>

              <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
                <PrimaryButton
                  label={isFinish ? 'Finish' : 'Continue'}
                  onPress={() => onContinue()}
                  loading={loading}
                  loadingText={isFinish ? 'Creating account…' : 'Sending code…'}
                  disabled={needsNetwork && guard.blocked}
                  dim={!filled}
                />
                {skippable && !loading && (
                  <TextButton label="Skip for now" onPress={() => onContinue(true)} style={styles.skipBtn} textStyle={styles.skipText} />
                )}
                <View style={styles.loginRow}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TextButton label="Log in" onPress={leaveToLogin} textStyle={styles.loginLink} />
                </View>
              </View>
            </>
          )}
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
  confirmField: { marginTop: 14 },
  codeWrap: { flex: 1, paddingHorizontal: 24 },
  locked: { opacity: 0.6 },

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
});
