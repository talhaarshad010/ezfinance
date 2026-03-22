import React from 'react';
import Svg, {Path, Circle, Rect} from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({size = 40, color = '#000000'}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Stadium Shape 1 (Outer) */}
      <Rect
        x="10"
        y="30"
        width="50"
        height="40"
        rx="20"
        stroke={color}
        strokeWidth="2"
      />
      <Rect
        x="15"
        y="35"
        width="40"
        height="30"
        rx="15"
        stroke={color}
        strokeWidth="2"
      />
      <Rect
        x="20"
        y="40"
        width="30"
        height="20"
        rx="10"
        stroke={color}
        strokeWidth="2"
      />

      {/* Concentric Circles */}
      <Circle cx="45" cy="50" r="15" stroke={color} strokeWidth="2" />
      <Circle cx="45" cy="50" r="10" stroke={color} strokeWidth="2" />
      <Circle cx="45" cy="50" r="5" stroke={color} strokeWidth="2" />

      {/* Wave extension lines */}
      <Path
        d="M60 30 C 70 30, 75 40, 80 50 S 90 70, 100 70"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M60 35 C 70 35, 75 45, 80 55 S 90 75, 100 75"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M60 40 C 70 40, 75 50, 80 60 S 90 80, 100 80"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M60 25 C 70 25, 75 35, 80 45 S 90 65, 100 65"
        stroke={color}
        strokeWidth="2"
      />
       <Path
        d="M60 45 C 70 45, 75 55, 80 65 S 90 85, 100 85"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
};

export default Logo;
