import React, { useCallback } from 'react';
import { StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogoDrawAnimation } from '../components/LogoDrawAnimation';
import { AuthPalette, useAuthStyles } from '../components/authTheme';

/**
 * Brand splash (from the ezFinance logo video): the mark draws itself line by
 * line, then splits into ribbons that rush past the viewer (Netflix-style)
 * before handing over to onboarding. Android plays the same sequence natively.
 */
export const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { A, styles } = useAuthStyles(createStyles);

  const handleFinished = useCallback(() => navigation.replace('Onboarding'), [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={A.STATUS_BAR} backgroundColor={A.BG} />
      <LogoDrawAnimation
        logoWidth={Math.min(width * 0.78, 340)}
        color={A.TEXT}
        onFinished={handleFinished}
      />
    </View>
  );
};

export default SplashScreen;

const createStyles = (A: AuthPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: A.BG,
    },
  });
