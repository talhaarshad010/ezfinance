import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogoDrawAnimation } from '../components/LogoDrawAnimation';
import { AuthPalette, useAuthStyles } from '../components/authTheme';

const HOLD_MS = 600; // full mark on screen before it settles
const SETTLE_MS = 800; // shrink + rise + dim
const EXIT_DELAY_MS = 150;
const SETTLED_SCALE = 0.45;
const SETTLED_CENTER_Y = 0.16; // fraction of screen height
const SETTLED_OPACITY = 0.75;

/**
 * Brand splash (from the ezFinance logo video): the mark draws itself line by
 * line, holds, then shrinks up toward the top before handing over to onboarding.
 */
export const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const { width, height } = useWindowDimensions();
  const { A, styles } = useAuthStyles(createStyles);
  const settle = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const handleDrawn = useCallback(() => {
    timers.current.push(
      setTimeout(() => {
        Animated.timing(settle, {
          toValue: 1,
          duration: SETTLE_MS,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;
          timers.current.push(setTimeout(() => navigation.replace('Onboarding'), EXIT_DELAY_MS));
        });
      }, HOLD_MS),
    );
  }, [navigation, settle]);

  const logoWidth = Math.min(width * 0.78, 340);
  const riseBy = height * (0.5 - SETTLED_CENTER_Y);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />
      <Animated.View
        style={{
          opacity: settle.interpolate({ inputRange: [0, 1], outputRange: [1, SETTLED_OPACITY] }),
          transform: [
            { translateY: settle.interpolate({ inputRange: [0, 1], outputRange: [0, -riseBy] }) },
            { scale: settle.interpolate({ inputRange: [0, 1], outputRange: [1, SETTLED_SCALE] }) },
          ],
        }}
      >
        <LogoDrawAnimation width={logoWidth} color={A.TEXT} onDrawn={handleDrawn} />
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: A.BG,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
