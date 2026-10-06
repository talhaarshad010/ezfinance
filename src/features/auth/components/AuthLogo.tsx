import React from 'react';
import { Image, View } from 'react-native';
import { useAuthTheme } from './authTheme';

// Tightly cropped brand mark (3200×1621) so it can fill the tile.
const MARK_BLACK = require('../../../assets/images/ezfinance_logos/logo-black-tight-3200.png');
const MARK_WHITE = require('../../../assets/images/ezfinance_logos/logo-white-tight-3200.png');
const MARK_RATIO = 3200 / 1621;

/** ezFinance brand mark in a rounded app-icon tile, matching the current theme. */
export function AuthLogo({ size = 48 }: { size?: number }) {
  const A = useAuthTheme();
  const radius = size * (13 / 48);
  const markW = size * 0.7;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: A.isDark ? '#0A0A0C' : '#FFFFFF',
        borderWidth: 1,
        borderColor: A.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,13,14,0.08)',
        boxShadow: A.isDark ? undefined : '0 8px 24px rgba(13,13,14,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={A.isDark ? MARK_WHITE : MARK_BLACK}
        style={{ width: markW, height: markW / MARK_RATIO }}
        resizeMode="contain"
      />
    </View>
  );
}

export default AuthLogo;
