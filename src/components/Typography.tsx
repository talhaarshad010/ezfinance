import React from 'react';
import {Text, TextStyle, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption';

interface TypographyProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  style?: TextStyle;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
  align?: 'left' | 'center' | 'right';
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  style,
  color,
  weight,
  align,
}) => {
  const variantStyle = styles[variant] || styles.body;
  const customStyle: TextStyle = {
    color: color || variantStyle.color,
    fontWeight: weight || variantStyle.fontWeight,
    textAlign: align || 'left',
  };

  return <Text style={[variantStyle, customStyle, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 48,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.muted,
  },
});

export default Typography;
