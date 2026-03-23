import React from 'react';
import { Image } from 'react-native';

const logoSource = require('../assets/images/black-logo.png');

interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({size = 40, color}) => {
  return (
    <Image 
      source={logoSource} 
      style={{ width: size, height: size }} 
      resizeMode="contain"
    />
  );
};

export default Logo;
