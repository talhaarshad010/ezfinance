import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useAuthTheme } from './authTheme';

export type GlowTone = 'emerald' | 'teal';

/** Frosted card that frames each slide illustration, with a coloured halo. */
export function GlowCard({ tone, children }: { tone: GlowTone; children: React.ReactNode }) {
  const A = useAuthTheme();
  const emerald = tone === 'emerald';
  const halo = A.isDark
    ? emerald
      ? '0 0 60px rgba(0,230,138,0.16), 0 0 120px rgba(0,230,138,0.06), 0 16px 48px rgba(0,0,0,0.5)'
      : '0 0 60px rgba(14,165,233,0.20), 0 0 120px rgba(14,165,233,0.07), 0 16px 48px rgba(0,0,0,0.5)'
    : emerald
    ? '0 0 60px rgba(0,230,138,0.14), 0 0 120px rgba(0,230,138,0.05), 0 16px 40px rgba(13,13,14,0.06)'
    : '0 0 60px rgba(14,165,233,0.16), 0 0 120px rgba(14,165,233,0.05), 0 16px 40px rgba(13,13,14,0.06)';
  return (
    <View style={[styles.card, { backgroundColor: A.CARD, borderColor: A.CARD_BORDER, boxShadow: halo }]}>
      <View
        style={[
          styles.topEdge,
          {
            experimental_backgroundImage: emerald
              ? 'linear-gradient(90deg, transparent, rgba(0,230,138,0.4), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(14,165,233,0.45), transparent)',
          },
        ]}
      />
      {children}
    </View>
  );
}

const T = { fontFamily: 'System' } as const;

/**
 * Card fill: translucent glass on the dark theme; solid white on the light theme, where stacked
 * translucent fills turn grey and let the glow behind them show through.
 */
function glass(dark: boolean, ink: (a: number) => string, alpha: number) {
  return dark ? ink(alpha) : '#FFFFFF';
}

/**
 * Slide 1 — Track every rupee: three layered cards (grid, transaction rows, trend line) with
 * floating amount chips. Dark theme uses translucent glass fills; light theme uses solid white
 * cards so the layers stay crisp instead of stacking into grey.
 */
export function TrackIllustration() {
  const A = useAuthTheme();
  const ink = A.INK;
  const dark = A.isDark;
  const purpleText = dark ? 'rgba(216,205,255,0.9)' : '#7C3AED';
  return (
    <Svg width={280} height={200} viewBox="0 0 280 200" fill="none">
      <Defs>
        <LinearGradient id="trkBack" x1="64" y1="22" x2="216" y2="136" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#00E68A" stopOpacity={dark ? 0.1 : 0.08} />
          <Stop offset="1" stopColor={dark ? '#FFFFFF' : '#F4FBF8'} stopOpacity={dark ? 0.025 : 1} />
        </LinearGradient>
        <LinearGradient id="trkMid" x1="46" y1="48" x2="234" y2="152" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={dark ? 0.1 : 1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={dark ? 0.035 : 1} />
        </LinearGradient>
        <LinearGradient id="trkFront" x1="35" y1="104" x2="245" y2="180" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={dark ? 0.13 : 1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={dark ? 0.055 : 1} />
        </LinearGradient>
        <LinearGradient id="trkLine" x1="57" y1="164" x2="220" y2="122" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#059669" />
          <Stop offset="1" stopColor="#00E68A" />
        </LinearGradient>
        {/* Soft blurred glows, drawn as radial gradients (no SVG filters needed). */}
        <RadialGradient id="trkAmbient" cx="140" cy="127" rx="110" ry="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#00E68A" stopOpacity={dark ? 0.18 : 0.14} />
          <Stop offset="1" stopColor="#00E68A" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="trkPoint" cx="220" cy="121" r="11" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#00E68A" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#00E68A" stopOpacity={0} />
        </RadialGradient>
        <Pattern id="trkGrid" width="18" height="18" patternUnits="userSpaceOnUse">
          <Path d="M18 0H0V18" stroke={ink(dark ? 0.055 : 0.07)} strokeWidth="1" fill="none" />
        </Pattern>
        <ClipPath id="trkBackClip">
          <Rect x="64" y="22" width="152" height="112" rx="18" />
        </ClipPath>
      </Defs>

      {/* Soft emerald atmosphere */}
      <Ellipse cx="140" cy="127" rx="110" ry="50" fill="url(#trkAmbient)" />

      {/* Back depth: subtle grid and edge glow */}
      <G transform="rotate(5 140 78)">
        <Rect x="64" y="22" width="152" height="112" rx="18" fill="url(#trkBack)" stroke={dark ? 'rgba(0,230,138,0.12)' : 'rgba(0,230,138,0.3)'} />
        <Rect x="64" y="22" width="152" height="112" fill="url(#trkGrid)" clipPath="url(#trkBackClip)" opacity={0.7} />
        <Path d="M86 22H194" stroke="rgba(0,230,138,0.28)" strokeLinecap="round" />
      </G>

      {/* Middle depth: simple transaction rows */}
      <G transform="rotate(-3 140 101)">
        <Rect x="46" y="48" width="188" height="108" rx="18" fill="url(#trkMid)" stroke={ink(dark ? 0.14 : 0.1)} />
        <Circle cx="68" cy="72" r="8" fill="rgba(14,165,233,0.16)" stroke="rgba(14,165,233,0.28)" />
        <Path d="M65 72H71M68 69V75" stroke="#0EA5E9" strokeWidth="1.4" strokeLinecap="round" />
        <Rect x="84" y="67" width="58" height="6" rx="3" fill={ink(dark ? 0.22 : 0.16)} />
        <Rect x="84" y="78" width="36" height="4" rx="2" fill={ink(0.08)} />
        <Circle cx="68" cy="103" r="8" fill="rgba(168,139,250,0.14)" stroke="rgba(168,139,250,0.25)" />
        <Path d="M64.5 103H71.5" stroke={dark ? 'rgba(196,181,253,0.85)' : '#8B5CF6'} strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="84" y="98" width="72" height="6" rx="3" fill={ink(dark ? 0.18 : 0.13)} />
        <Rect x="84" y="109" width="45" height="4" rx="2" fill={ink(0.07)} />
      </G>

      {/* Front depth: focused trend card */}
      <G>
        <Rect x="35" y="104" width="210" height="76" rx="18" fill="url(#trkFront)" stroke={ink(dark ? 0.2 : 0.12)} />
        <Path d="M52 121H228M52 143H228M52 165H228" stroke={ink(0.045)} />
        <Path d="M55 161C76 158 83 143 104 147C124 151 137 133 155 137C177 142 190 119 220 121" stroke="url(#trkLine)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <Circle cx="220" cy="121" r="11" fill="url(#trkPoint)" />
        <Circle cx="220" cy="121" r="4" fill="#00E68A" />
        <Circle cx="220" cy="121" r="8" stroke="rgba(0,230,138,0.22)" />
        <Rect x="51" y="116" width="35" height="4" rx="2" fill={ink(0.14)} />
      </G>

      {/* Amount chips float above the cards */}
      <G>
        <Rect x="196" y="55" width="66" height="23" rx="11.5" fill={dark ? 'rgba(0,230,138,0.16)' : '#E6FBF2'} stroke="rgba(0,230,138,0.38)" />
        <SvgText x="229" y="70.5" textAnchor="middle" fill={A.EMERALD_TEXT} fontSize="10" fontWeight="700" {...T}>+Rs 500</SvgText>
        <Rect x="18" y="94" width="64" height="23" rx="11.5" fill={dark ? 'rgba(168,139,250,0.13)' : '#F3EEFF'} stroke="rgba(168,139,250,0.3)" />
        <SvgText x="50" y="109.5" textAnchor="middle" fill={purpleText} fontSize="10" fontWeight="700" {...T}>-Rs 200</SvgText>
      </G>
    </Svg>
  );
}

/** Slide 2 — Taxes in plain language: FBR document with filer badges and a check. */
export function TaxIllustration() {
  const { INK: ink, isDark: dark } = useAuthTheme();
  return (
    <Svg width={280} height={200} viewBox="0 0 280 200" fill="none">
      <Ellipse cx="140" cy="110" rx="80" ry="55" fill="rgba(14,165,233,0.08)" />
      <G transform="rotate(3 140 110)">
        <Rect x="70" y="28" width="130" height="160" rx="14" fill={glass(dark, ink, 0.05)} stroke={ink(dark ? 0.14 : 0.12)} strokeWidth="1" />
        <Path d="M170 28 L200 58 L170 58 Z" fill={dark ? ink(0.06) : '#F2F4F7'} stroke={ink(0.1)} strokeWidth="1" />
        <Rect x="84" y="72" width="80" height="6" rx="3" fill={ink(0.2)} />
        <Rect x="84" y="86" width="60" height="5" rx="2.5" fill={ink(0.12)} />
        <Rect x="84" y="98" width="70" height="5" rx="2.5" fill={ink(0.12)} />
        <Rect x="84" y="110" width="52" height="5" rx="2.5" fill={ink(0.08)} />
        <Rect x="84" y="124" width="44" height="18" rx="9" fill="rgba(14,165,233,0.2)" />
        <SvgText x="106" y="137" textAnchor="middle" fill="#0EA5E9" fontSize="10" fontWeight="700" {...T}>FBR</SvgText>
      </G>
      <Rect x="178" y="44" width="82" height="22" rx="11" fill={glass(dark, ink, 0.07)} stroke="rgba(14,165,233,0.35)" strokeWidth="1" />
      <SvgText x="219" y="59" textAnchor="middle" fill={ink(0.7)} fontSize="10" fontWeight="500" {...T}>Filer status</SvgText>
      <Rect x="18" y="100" width="76" height="22" rx="11" fill={glass(dark, ink, 0.07)} stroke="rgba(14,165,233,0.3)" strokeWidth="1" />
      <SvgText x="56" y="115" textAnchor="middle" fill={ink(0.7)} fontSize="10" fontWeight="500" {...T}>Tax proof</SvgText>
      <Line x1="180" y1="55" x2="168" y2="62" stroke="rgba(14,165,233,0.3)" strokeWidth="1" strokeDasharray="3 3" />
      <Line x1="94" y1="108" x2="94" y2="122" stroke="rgba(14,165,233,0.25)" strokeWidth="1" strokeDasharray="3 3" />
      <Circle cx="208" cy="152" r="26" fill="rgba(14,165,233,0.15)" />
      <Circle cx="208" cy="152" r="19" fill="#0EA5E9" />
      <Circle cx="208" cy="152" r="26" fill="none" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
      <Path d="M198 152 L205 159 L220 144" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M50 52 L52 46 L54 52 L60 54 L54 56 L52 62 L50 56 L44 54 Z" fill="#0EA5E9" opacity={0.5} />
    </Svg>
  );
}

/** Slide 3 — Save toward what matters: concentric goal rings with colour coded goal bars. */
export function SavingsIllustration() {
  const ink = useAuthTheme().INK;
  return (
    <Svg width={280} height={200} viewBox="0 0 280 200" fill="none">
      <Defs>
        <LinearGradient id="obRingEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0" stopColor="#00E68A" />
          <Stop offset="1" stopColor="#059669" />
        </LinearGradient>
        <LinearGradient id="obRingTeal" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0" stopColor="#00C2FF" />
          <Stop offset="1" stopColor="#0EA5E9" />
        </LinearGradient>
      </Defs>
      <Circle cx="130" cy="104" r="66" fill="rgba(0,230,138,0.07)" />
      <Circle cx="130" cy="104" r="62" fill="none" stroke={ink(0.07)} strokeWidth="9" />
      <Circle cx="130" cy="104" r="62" fill="none" stroke="url(#obRingEmerald)" strokeWidth="9" strokeLinecap="round" strokeDasharray="390" strokeDashoffset="86" transform="rotate(-90 130 104)" />
      <Circle cx="130" cy="104" r="46" fill="none" stroke={ink(0.06)} strokeWidth="8" />
      <Circle cx="130" cy="104" r="46" fill="none" stroke="url(#obRingTeal)" strokeWidth="8" strokeLinecap="round" strokeDasharray="289" strokeDashoffset="130" transform="rotate(-90 130 104)" />
      <Circle cx="130" cy="104" r="31" fill="none" stroke={ink(0.06)} strokeWidth="7" />
      <Circle cx="130" cy="104" r="31" fill="none" stroke="rgba(168,139,250,0.55)" strokeWidth="7" strokeLinecap="round" strokeDasharray="195" strokeDashoffset="127" transform="rotate(-90 130 104)" />
      <Circle cx="130" cy="104" r="19" fill={ink(0.05)} stroke={ink(0.12)} strokeWidth="1" />
      <Line x1="122" y1="101" x2="138" y2="101" stroke={ink(0.6)} strokeWidth="2" strokeLinecap="round" />
      <Line x1="122" y1="107" x2="134" y2="107" stroke={ink(0.35)} strokeWidth="2" strokeLinecap="round" />
      <Rect x="206" y="76" width="56" height="12" rx="6" fill="rgba(0,230,138,0.15)" stroke="rgba(0,230,138,0.35)" strokeWidth="1" />
      <Rect x="206" y="76" width="40" height="12" rx="6" fill="rgba(0,230,138,0.45)" />
      <Rect x="206" y="96" width="56" height="12" rx="6" fill="rgba(14,165,233,0.12)" stroke="rgba(14,165,233,0.3)" strokeWidth="1" />
      <Rect x="206" y="96" width="28" height="12" rx="6" fill="rgba(14,165,233,0.45)" />
      <Rect x="206" y="116" width="56" height="12" rx="6" fill="rgba(168,139,250,0.1)" stroke="rgba(168,139,250,0.25)" strokeWidth="1" />
      <Rect x="206" y="116" width="19" height="12" rx="6" fill="rgba(168,139,250,0.4)" />
      <Circle cx="202" cy="82" r="2" fill="rgba(0,230,138,0.5)" />
      <Circle cx="202" cy="102" r="2" fill="rgba(14,165,233,0.5)" />
      <Circle cx="202" cy="122" r="2" fill="rgba(168,139,250,0.5)" />
      <Circle cx="191" cy="52" r="4.5" fill="#00E68A" />
      <Circle cx="191" cy="52" r="9" fill="#00E68A" opacity={0.18} />
    </Svg>
  );
}

/** Slide 4 — Grow your money, the halal way: bar chart with a "✓ Halal" badge. */
export function InvestIllustration() {
  const { INK: ink, isDark: dark } = useAuthTheme();
  return (
    <Svg width={280} height={200} viewBox="0 0 280 200" fill="none">
      <Ellipse cx="140" cy="168" rx="110" ry="22" fill="rgba(14,165,233,0.13)" />
      <Rect x="20" y="22" width="240" height="152" rx="18" fill={glass(dark, ink, 0.05)} stroke={ink(dark ? 0.12 : 0.1)} strokeWidth="1" />
      <Line x1="60" y1="22" x2="200" y2="22" stroke="rgba(14,165,233,0.4)" strokeWidth="1" strokeLinecap="round" />
      <Rect x="172" y="34" width="72" height="20" rx="10" fill={dark ? 'rgba(0,230,138,0.15)' : '#E6FBF2'} stroke="rgba(0,230,138,0.4)" strokeWidth="1" />
      <SvgText x="186" y="48" fill={dark ? '#00E68A' : '#059669'} fontSize="10" fontWeight="600" {...T}>✓ Halal</SvgText>
      <Rect x="40" y="118" width="22" height="38" rx="5" fill={ink(0.1)} />
      <Rect x="70" y="100" width="22" height="56" rx="5" fill={ink(0.1)} />
      <Rect x="100" y="78" width="22" height="78" rx="5" fill="rgba(0,230,138,0.55)" />
      <Rect x="100" y="78" width="22" height="78" rx="5" fill="none" stroke="rgba(0,230,138,0.6)" strokeWidth="1" />
      <Rect x="130" y="88" width="22" height="68" rx="5" fill={ink(0.1)} />
      <Rect x="160" y="62" width="22" height="94" rx="5" fill="rgba(14,165,233,0.55)" />
      <Rect x="160" y="62" width="22" height="94" rx="5" fill="none" stroke="rgba(14,165,233,0.6)" strokeWidth="1" />
      <Rect x="190" y="82" width="22" height="74" rx="5" fill={ink(0.1)} />
      <Polyline points="51,148 81,130 111,100 141,114 171,84 201,104" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="111" cy="100" r="3.5" fill="#00E68A" />
      <Circle cx="171" cy="84" r="3.5" fill="#0EA5E9" />
      <Circle cx="201" cy="104" r="3" fill={ink(0.5)} />
      <Line x1="32" y1="158" x2="228" y2="158" stroke={ink(0.08)} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 248,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 1,
  },
});
