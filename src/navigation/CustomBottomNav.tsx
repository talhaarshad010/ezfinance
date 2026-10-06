import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path, Line } from 'react-native-svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

type IconProps = { size: number; color: string; strokeWidth: number };

// Thin outline Home icon
const HomeIcon = ({ size, color, strokeWidth }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <Path d="M9 21V12h6v9" />
  </Svg>
);

// Thin outline Receipt icon
const ReceiptIcon = ({ size, color, strokeWidth }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 2h16v22l-2.5-1.5L15 22l-2.5-1.5L10 22l-2.5-1.5L5 22 4 22V2z" />
    <Line x1="8" y1="8" x2="16" y2="8" />
    <Line x1="8" y1="12" x2="16" y2="12" />
    <Line x1="8" y1="16" x2="12" y2="16" />
  </Svg>
);

export const CustomBottomNav = ({
  state,
  navigation,
}: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'home';
      case 'Expenses':
        return 'receipt';
      case 'AI Advisor':
        return 'message-square';
      case 'Investments':
        return 'trending-up';
      case 'Goals':
        return 'target';
      default:
        return 'grid';
    }
  };

  return (
    <View
      style={[
        styles.dockContainer,
        {
          bottom: Math.max(insets.bottom + 8, 20),
          backgroundColor: theme.DOCK_BG,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = getIconName(route.name);
        const iconColor = isFocused ? '#FFFFFF' : theme.DOCK_INACTIVE;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={[
              styles.tabButton,
              {
                backgroundColor: isFocused ? theme.ACTIVE : 'transparent',
              },
            ]}
          >
            {iconName === 'home' ? (
              <HomeIcon size={17} strokeWidth={isFocused ? 2.2 : 1.7} color={iconColor} />
            ) : iconName === 'receipt' ? (
              <ReceiptIcon size={17} strokeWidth={isFocused ? 2.2 : 1.7} color={iconColor} />
            ) : (
              <Feather
                name={iconName}
                size={17}
                color={iconColor}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomBottomNav;

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    alignSelf: 'center',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 400,
  },
  tabButton: {
    width: 46,
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
});
