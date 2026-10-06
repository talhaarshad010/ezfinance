import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { AnimatedModal } from './AnimatedModal';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Renders a drag grabber instead of a title row. */
  grabber?: boolean;
  /** Use the MODAL surface colour instead of CARD. */
  tone?: 'card' | 'modal';
  /** Wrap children in a scroll view capped to 70% height. */
  scroll?: boolean;
  children: React.ReactNode;
}

/** Slide-up bottom sheet used across the ledger, goals and dashboard flows. */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  grabber,
  tone = 'card',
  scroll,
  children,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const surface = tone === 'modal' ? theme.MODAL : theme.CARD;

  const body = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scrollBody}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <AnimatedModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: surface, paddingBottom: insets.bottom + 20 },
        ]}
      >
        {grabber && (
          <View style={[styles.grabber, { backgroundColor: theme.BORDER }]} />
        )}

        {(title || subtitle) && (
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              {title && (
                <Text style={[styles.title, { color: theme.TEXT }]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, { color: theme.MUTED }]}>
                  {subtitle}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>
        )}

        {body}
      </View>
    </AnimatedModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: { maxHeight: 460 },
});

export default BottomSheet;
