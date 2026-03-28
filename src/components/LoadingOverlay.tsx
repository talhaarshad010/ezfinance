import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Typography from './Typography';
import { colors } from '../theme/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing secure login...',
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#000" />
          <Typography variant="body" weight="600" style={styles.message}>
            {message}
          </Typography>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  message: {
    marginTop: 20,
    color: '#000',
    textAlign: 'center',
  },
});
