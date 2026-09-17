import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export const CustomBottomNav = ({
  state,
  navigation,
}: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'grid';
      case 'Expenses':
        return 'list';
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
            <Feather
              name={iconName}
              size={17}
              color={isFocused ? '#FFFFFF' : theme.DOCK_INACTIVE}
            />
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
