import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface ProgressTrackProps {
  pct: number;
  color: string;
  height?: number;
  trackColor?: string;
}

/** Thin animated linear progress bar shared by the dashboard, goals and ledger cards. */
export const ProgressTrack: React.FC<ProgressTrackProps> = ({
  pct,
  color,
  height = 2,
  trackColor = 'rgba(128,128,128,0.18)',
}) => {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.max(0, Math.min(pct, 100)),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct, animWidth]);

  const width = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          width,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default ProgressTrack;
