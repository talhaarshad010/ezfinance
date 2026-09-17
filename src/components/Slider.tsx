import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accentColor: string;
  trackColor?: string;
  thumbColor?: string;
}

/**
 * Lightweight horizontal slider built on PanResponder so the simulators can
 * ship without pulling in a native slider dependency.
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  accentColor,
  trackColor = 'rgba(128,128,128,0.22)',
  thumbColor = '#FFFFFF',
}) => {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startX = useRef(0);

  const clampToStep = (raw: number) => {
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  const valueFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return value;
    const ratio = Math.max(0, Math.min(1, x / w));
    return clampToStep(min + ratio * (max - min));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        startX.current = evt.nativeEvent.locationX;
        onChange(valueFromX(startX.current));
      },
      onPanResponderMove: (_evt, gesture) => {
        onChange(valueFromX(startX.current + gesture.dx));
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  const ratio = max === min ? 0 : (value - min) / (max - min);
  const thumbLeft = Math.max(0, Math.min(width - 20, ratio * width - 10));

  return (
    <View
      style={styles.hitArea}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%`, backgroundColor: accentColor },
          ]}
        />
      </View>
      <View
        style={[
          styles.thumb,
          { left: thumbLeft, backgroundColor: thumbColor, borderColor: accentColor },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hitArea: {
    height: 32,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
});

export default Slider;
