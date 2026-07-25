import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const blackLogo = require('../assets/images/ezfinance_logos/logo-black-tight-3200.png');
const whiteLogo = require('../assets/images/ezfinance_logos/logo-white-1024.png');

interface LogoProps {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  variant?: 'auto' | 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 52,
  width,
  height,
  style,
  variant = 'auto',
}) => {
  const { theme } = useTheme();

  let logoSource = theme.isDark ? whiteLogo : blackLogo;
  if (variant === 'light') {
    logoSource = whiteLogo;
  } else if (variant === 'dark') {
    logoSource = blackLogo;
  }

  const w = width || size;
  const h = height || size;

  return (
    <Image
      source={logoSource}
      style={[{ width: w, height: h }, style]}
      resizeMode="contain"
    />
  );
};

export default Logo;
