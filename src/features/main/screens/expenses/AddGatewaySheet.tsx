import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import { AnimatedModal } from '../../../../components/AnimatedModal';

interface AddGatewaySheetProps {
  visible: boolean;
  onClose: () => void;
  onManual: () => void;
  onStatement: () => void;
  onReceipt?: () => void;
}

export default function AddGatewaySheet({
  visible,
  onClose,
  onManual,
  onStatement,
  onReceipt,
}: AddGatewaySheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <AnimatedModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.CARD,
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: theme.MUTED + '40' }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              New transaction
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {/* Primary CTA - Add manually */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              onClose();
              onManual();
            }}
            style={[styles.primaryCard, { backgroundColor: theme.TEXT }]}
          >
            <View style={[styles.primaryIconBox, { backgroundColor: theme.BG + '25' }]}>
              <Feather name="edit-3" size={20} color={theme.BG} />
            </View>
            <View style={styles.primaryTextBox}>
              <Text style={[styles.primaryTitle, { color: theme.BG }]}>
                Add manually
              </Text>
              <Text style={[styles.primarySubtitle, { color: theme.BG + 'AA' }]}>
                The quickest way to log a transaction
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={theme.BG + '80'} />
          </TouchableOpacity>

          {/* Section Divider */}
          <Text style={[styles.sectionLabel, { color: theme.MUTED }]}>
            OR USE
          </Text>

          {/* Secondary 2-up grid */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                if (onReceipt) onReceipt();
              }}
              style={[
                styles.secondaryCard,
                {
                  backgroundColor: theme.MODAL,
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <View style={[styles.secondaryIconWrap, { backgroundColor: theme.CARD }]}>
                <Feather name="camera" size={18} color={theme.MUTED} />
              </View>
              <Text style={[styles.secondaryTitle, { color: theme.TEXT }]}>
                Scan a receipt
              </Text>
              <Text style={[styles.secondarySubtitle, { color: theme.MUTED }]}>
                Use the camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onStatement();
              }}
              style={[
                styles.secondaryCard,
                {
                  backgroundColor: theme.MODAL,
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <View style={[styles.secondaryIconWrap, { backgroundColor: theme.CARD }]}>
                <Feather name="file-text" size={18} color={theme.MUTED} />
              </View>
              <Text style={[styles.secondaryTitle, { color: theme.TEXT }]}>
                Bank statement
              </Text>
              <Text style={[styles.secondarySubtitle, { color: theme.MUTED }]}>
                PDF / CSV import
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  primaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  primaryTextBox: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  primarySubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  secondaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  secondarySubtitle: {
    fontSize: 11,
  },
});
