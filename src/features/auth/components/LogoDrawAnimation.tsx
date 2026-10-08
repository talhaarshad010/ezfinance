import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// Every frame is computed on the UI thread (Reanimated worklets), so the
// animation stays smooth regardless of what the JS thread is doing.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// Brand mark geometry (src/assets/images/ezfinance_logos/logo-*-tight.svg).
export const LOGO_VIEWBOX = { x: 185, y: 320, w: 760, h: 385 };
const CX = 480;
const CY = 512;
const TRACK_RIGHT = 612;
const STROKE_WIDTH = 6.5; // in viewBox units (~2.7pt at the default logo width)

/** One "track": half-stadium (bottom line + left arc + top line) that flows into a wave tail. */
const TRACKS = [
  { r: 25, wave: 'C 657 487 620 469 660 469 C 705 469 750 585 790 585 L 830 585', waveLen: 274.7 },
  { r: 40, wave: 'C 657 472 625.7 451.75 665.7 451.75 C 710.7 451.75 758.25 592.5 798.25 592.5 L 840.5 592.5', waveLen: 302.2 },
  { r: 55, wave: 'C 657 457 631.4 434.5 671.4 434.5 C 716.4 434.5 766.5 600 806.5 600 L 851 600', waveLen: 330.9 },
  { r: 70, wave: 'C 657 442 637.1 417.25 677.1 417.25 C 722.1 417.25 774.75 607.5 814.75 607.5 L 861.5 607.5', waveLen: 360.5 },
  { r: 85, wave: 'C 657 427 642.8 400 682.8 400 C 727.8 400 783 615 823 615 L 872 615', waveLen: 390.8 },
  { r: 100, wave: 'C 657 412 648.5 382.75 688.5 382.75 C 733.5 382.75 791.25 622.5 831.25 622.5 L 882.5 622.5', waveLen: 421.5 },
  { r: 115, wave: 'C 657 397 654.2 365.5 694.2 365.5 C 739.2 365.5 799.5 630 839.5 630 L 893 630', waveLen: 452.5 },
  { r: 130, wave: 'C 657 382 659.9 348.25 699.9 348.25 C 744.9 348.25 807.75 637.5 847.75 637.5 L 903.5 637.5', waveLen: 483.9 },
];

const RINGS = [130, 104, 78, 52]; // drawn outer → inner
const CORE_R = 26; // small centre circle, drawn as two halves rising from the bottom

// Draw choreography (ms), mirroring the brand video:
//   tracks grow out from their bottom-left point (outer first) → rings draw
//   clockwise (outer first) → wave tails fan out (outer first).
const T = {
  trackStart: 150,
  trackStagger: 80,
  trackDur: 800,
  coreStart: 250,
  coreDur: 1100,
  ringStart: 1050,
  ringStagger: 140,
  ringDur: 480,
  waveStart: 1600,
  waveStagger: 95,
  waveDur: 620,
};
export const LOGO_DRAW_MS = T.waveStart + T.waveStagger * (TRACKS.length - 1) + T.waveDur;

// "Netflix" split: once drawn, the camera dives into the mark's eye — every
// layer scales out at its own pace (inner first, outer furthest) so the lines
// fan apart, then fades past the viewer. Keep in sync with LogoDrawView.kt.
const HOLD_MS = 350;
const SPLIT_MS = 1150;
const SPLIT_AT = LOGO_DRAW_MS + HOLD_MS;
const SPLIT_STAGGER = 0.03; // per layer, fraction of SPLIT_MS
const SPLIT_SPAN = 0.6; // each layer's own share of SPLIT_MS
const SPLIT_SCALE = 2.6;
const SPLIT_SCALE_PER_LAYER = 0.45;
export const LOGO_TOTAL_MS = SPLIT_AT + SPLIT_MS;

const drawEase = Easing.bezierFn(0.45, 0, 0.25, 1);
const splitEase = Easing.bezierFn(0.55, 0, 0.85, 0.35); // accelerate, like a camera rushing in

interface Stroke {
  d: string;
  len: number;
  start: number; // ms
  dur: number; // ms
}

interface Layer {
  radius: number; // sort key: inner layers split first
  strokes: Stroke[];
}

function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`;
}

function buildLayers(): Layer[] {
  const layers: Layer[] = [];

  [...TRACKS].reverse().forEach((t, i) => {
    const yb = CY + t.r;
    const yt = CY - t.r;
    const start = T.trackStart + i * T.trackStagger;
    layers.push({
      radius: t.r,
      strokes: [
        // bottom line, drawn left → right
        { d: `M 340 ${yb} L ${TRACK_RIGHT} ${yb}`, len: 272, start, dur: T.trackDur },
        // left arc up and over, then the top line left → right
        {
          d: `M 340 ${yb} A ${t.r} ${t.r} 0 0 1 340 ${yt} L ${TRACK_RIGHT} ${yt}`,
          len: Math.PI * t.r + 272,
          start,
          dur: T.trackDur,
        },
        // wave tail, drawn after the rings
        {
          d: `M ${TRACK_RIGHT} ${yt} ${t.wave}`,
          len: t.waveLen,
          start: T.waveStart + i * T.waveStagger,
          dur: T.waveDur,
        },
      ],
    });
  });

  // centre circle: two halves growing up from the bottom point
  const bottom = `${CX} ${CY + CORE_R}`;
  const top = `${CX} ${CY - CORE_R}`;
  const halfLen = Math.PI * CORE_R;
  layers.push({
    radius: CORE_R,
    strokes: [
      { d: `M ${bottom} A ${CORE_R} ${CORE_R} 0 0 1 ${top}`, len: halfLen, start: T.coreStart, dur: T.coreDur },
      { d: `M ${bottom} A ${CORE_R} ${CORE_R} 0 0 0 ${top}`, len: halfLen, start: T.coreStart, dur: T.coreDur },
    ],
  });

  // rings: full circles drawn clockwise from the lower-left
  RINGS.forEach((r, i) => {
    const from = 120;
    layers.push({
      radius: r,
      strokes: [
        {
          d: `M ${point(r, from)} A ${r} ${r} 0 1 1 ${point(r, from + 180)} A ${r} ${r} 0 1 1 ${point(r, from)}`,
          len: 2 * Math.PI * r,
          start: T.ringStart + i * T.ringStagger,
          dur: T.ringDur,
        },
      ],
    });
  });

  return layers.sort((a, b) => a.radius - b.radius);
}

// Push a hidden dash well past the path start so its round cap
// (radius = strokeWidth / 2) doesn't leave a dot behind.
const DASH_PAD = STROKE_WIDTH * 4;

/** One stroke revealing itself along its length. */
function DrawStroke({ stroke, clock }: { stroke: Stroke; clock: SharedValue<number> }) {
  const { start, dur, len } = stroke;
  const animatedProps = useAnimatedProps(() => {
    const t = Math.min(Math.max((clock.value - start) / dur, 0), 1);
    return { strokeDashoffset: (len + DASH_PAD) * (1 - drawEase(t)) };
  });
  return (
    <AnimatedPath
      d={stroke.d}
      strokeDasharray={[len, len + DASH_PAD * 2]}
      animatedProps={animatedProps}
    />
  );
}

/** One layer of the mark, scaling out from the "eye" and fading during the split. */
function SplitLayer({
  index,
  clock,
  children,
}: {
  index: number;
  clock: SharedValue<number>;
  children: React.ReactNode;
}) {
  const animatedProps = useAnimatedProps(() => {
    const split = Math.min(Math.max((clock.value - SPLIT_AT) / SPLIT_MS, 0), 1);
    const local = Math.min(Math.max((split - index * SPLIT_STAGGER) / SPLIT_SPAN, 0), 1);
    const s = 1 + (SPLIT_SCALE + index * SPLIT_SCALE_PER_LAYER) * splitEase(local);
    const opacity = local <= 0.45 ? 1 : Math.max(0, 1 - (local - 0.45) / 0.55);
    // scale(s) about (CX, CY), as a column-major [a b c d e f] matrix
    return { matrix: [s, 0, 0, s, CX * (1 - s), CY * (1 - s)], opacity };
  });
  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
}

/**
 * The ezFinance mark drawing itself stroke by stroke, then splitting into
 * lines that rush past the viewer. Fills its parent (full screen) so the
 * expanding lines are never clipped; the mark itself is `logoWidth` wide.
 */
export function LogoDrawAnimation({
  logoWidth,
  color,
  onFinished,
}: {
  logoWidth: number;
  color: string;
  /** Fired once the split has played out and the screen is clear. */
  onFinished?: () => void;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const layers = useMemo(buildLayers, []);
  const clock = useSharedValue(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const finish = useCallback(() => onFinishedRef.current?.(), []);

  useEffect(() => {
    clock.value = withTiming(
      LOGO_TOTAL_MS,
      { duration: LOGO_TOTAL_MS, easing: Easing.linear },
      finished => {
        if (finished) runOnJS(finish)();
      },
    );
    return () => cancelAnimation(clock);
  }, [clock, finish]);

  // Full-screen viewBox centred on the mark, at the requested mark width.
  const k = logoWidth / LOGO_VIEWBOX.w;
  const vbW = screenW / k;
  const vbH = screenH / k;
  const vbX = LOGO_VIEWBOX.x + LOGO_VIEWBOX.w / 2 - vbW / 2;
  const vbY = LOGO_VIEWBOX.y + LOGO_VIEWBOX.h / 2 - vbH / 2;

  return (
    <Svg style={StyleSheet.absoluteFill} viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}>
      <G
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {layers.map((layer, li) => (
          <SplitLayer key={li} index={li} clock={clock}>
            {layer.strokes.map((s, si) => (
              <DrawStroke key={si} stroke={s} clock={clock} />
            ))}
          </SplitLayer>
        ))}
      </G>
    </Svg>
  );
}

export default LogoDrawAnimation;
