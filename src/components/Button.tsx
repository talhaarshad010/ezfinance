import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Typography from './Typography';
import {colors} from '../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'social';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  style?: ViewStyle;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  style,
  icon,
  disabled,
}) => {
  const isPrimary = variant === 'primary';
  const isSocial = variant === 'social';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        isSocial && styles.social,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        <Typography
          variant="body"
          weight="600"
          color={isPrimary ? colors.text.white : colors.text.primary}
          style={styles.text}>
          {title}
        </Typography>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  secondary: {
    backgroundColor: colors.background.surface,
  },
  social: {
    backgroundColor: colors.background.surface,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    paddingVertical: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconContainer: {
    marginLeft: 10,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
