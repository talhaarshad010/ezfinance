import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import Typography from './Typography';
import { useToast } from '../context/ToastContext';
import Logo from './Logo';

const { width } = Dimensions.get('window');

const Toast: React.FC = () => {
  const { toast, hideToast } = useToast();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (toast.visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(Platform.OS === 'ios' ? 60 : 40);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-100, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [toast.visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!toast.visible && opacity.value === 0) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'info':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };

  return (
    <Animated.View
      style={[styles.container, animatedStyle, { backgroundColor: '#000000' }]}
    >
      <View style={styles.content}>
        {/* <View style={styles.logoContainer}>
          <Logo size={24} />
        </View> */}
        <Feather name={getIcon()} size={18} color="#FFF" style={styles.icon} />
        <View style={styles.textContainer}>
          {toast.title && (
            <Typography
              variant="body"
              weight="700"
              color="#FFF"
              style={styles.title}
            >
              {toast.title}
            </Typography>
          )}
          <Typography
            variant="caption"
            weight="500"
            color="#FFF"
            style={styles.message}
          >
            {toast.message}
          </Typography>
        </View>
        {toast.action && (
          <TouchableOpacity
            onPress={() => {
              toast.action?.onPress();
              hideToast();
            }}
            hitSlop={10}
            accessibilityRole="button"
            style={styles.action}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#FFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logo: {
    width: 24,
    height: 24,
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    marginBottom: 2,
    fontSize: 14,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  action: {
    marginLeft: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export default Toast;
