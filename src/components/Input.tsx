import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Typography from './Typography';
import {colors} from '../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({label, containerStyle, ...props}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="label" style={styles.label}>
          {label}
        </Typography>
      )}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.muted}
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: colors.background.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
});

export default Input;
