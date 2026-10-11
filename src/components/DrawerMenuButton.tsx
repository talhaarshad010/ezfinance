import React from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export interface DrawerMenuButtonProps {
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: number;
}

/**
 * Universal Hamburger menu button for all side menu and primary screens.
 * Safely dispatches DrawerActions.openDrawer() to work across all nested navigators.
 */
export function DrawerMenuButton({ style, color, size = 20 }: DrawerMenuButtonProps) {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      style={[
        styles.btn,
        {
          backgroundColor: theme.CARD,
          borderColor: theme.BORDER,
        },
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="menu" size={size} color={color ?? theme.TEXT} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default DrawerMenuButton;
