import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Brand mark geometry (src/assets/images/ezfinance_logos/logo-*-tight.svg).
export const LOGO_VIEWBOX = { x: 185, y: 320, w: 760, h: 385 };
const CX = 480;
const CY = 512;
const TRACK_RIGHT = 612;

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

interface Stroke {
  d: string;
  len: number;
  start: number; // ms
  dur: number; // ms
}

// Choreography (ms), mirroring the brand video:
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

function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`;
}

function buildStrokes(): Stroke[] {
  const strokes: Stroke[] = [];
  const outerFirst = [...TRACKS].reverse();

  outerFirst.forEach((t, i) => {
    const yb = CY + t.r;
    const yt = CY - t.r;
    const start = T.trackStart + i * T.trackStagger;
    // bottom line, drawn left → right
    strokes.push({ d: `M 340 ${yb} L ${TRACK_RIGHT} ${yb}`, len: 272, start, dur: T.trackDur });
    // left arc up and over, then the top line left → right
    strokes.push({
      d: `M 340 ${yb} A ${t.r} ${t.r} 0 0 1 340 ${yt} L ${TRACK_RIGHT} ${yt}`,
      len: Math.PI * t.r + 272,
      start,
      dur: T.trackDur,
    });
    // wave tail, drawn after the rings
    strokes.push({
      d: `M ${TRACK_RIGHT} ${yt} ${t.wave}`,
      len: t.waveLen,
      start: T.waveStart + i * T.waveStagger,
      dur: T.waveDur,
    });
  });

  // centre circle: two halves growing up from the bottom point
  const bottom = `${CX} ${CY + CORE_R}`;
  const top = `${CX} ${CY - CORE_R}`;
  const halfLen = Math.PI * CORE_R;
  strokes.push({ d: `M ${bottom} A ${CORE_R} ${CORE_R} 0 0 1 ${top}`, len: halfLen, start: T.coreStart, dur: T.coreDur });
  strokes.push({ d: `M ${bottom} A ${CORE_R} ${CORE_R} 0 0 0 ${top}`, len: halfLen, start: T.coreStart, dur: T.coreDur });

  // rings: full circles drawn clockwise from the lower-left
  RINGS.forEach((r, i) => {
    const from = 120;
    strokes.push({
      d: `M ${point(r, from)} A ${r} ${r} 0 1 1 ${point(r, from + 180)} A ${r} ${r} 0 1 1 ${point(r, from)}`,
      len: 2 * Math.PI * r,
      start: T.ringStart + i * T.ringStagger,
      dur: T.ringDur,
    });
  });

  return strokes;
}

const DRAW_EASING = Easing.bezier(0.45, 0, 0.25, 1);

/** The ezFinance mark drawing itself stroke by stroke. */
export function LogoDrawAnimation({
  width,
  color,
  strokeWidth = 3.4,
  onDrawn,
}: {
  width: number;
  color: string;
  strokeWidth?: number;
  /** Fired once every stroke has finished drawing. */
  onDrawn?: () => void;
}) {
  const strokes = useMemo(buildStrokes, []);
  const clock = useRef(new Animated.Value(0)).current;
  const onDrawnRef = useRef(onDrawn);
  onDrawnRef.current = onDrawn;

  useEffect(() => {
    const anim = Animated.timing(clock, {
      toValue: LOGO_DRAW_MS,
      duration: LOGO_DRAW_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => finished && onDrawnRef.current?.());
    return () => anim.stop();
  }, [clock]);

  const height = width * (LOGO_VIEWBOX.h / LOGO_VIEWBOX.w);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${LOGO_VIEWBOX.x} ${LOGO_VIEWBOX.y} ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`}
    >
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {strokes.map((s, i) => {
          // Push a hidden dash well past the path start so its round cap
          // (radius = strokeWidth / 2) doesn't leave a dot behind.
          const pad = strokeWidth * 4;
          const hidden = s.len + pad;
          return (
            <AnimatedPath
              key={i}
              d={s.d}
              strokeDasharray={[s.len, s.len + pad * 2]}
              strokeDashoffset={clock.interpolate({
                inputRange: [s.start, s.start + s.dur],
                outputRange: [hidden, 0],
                easing: DRAW_EASING,
                extrapolate: 'clamp',
              })}
            />
          );
        })}
      </G>
    </Svg>
  );
}

export default LogoDrawAnimation;
