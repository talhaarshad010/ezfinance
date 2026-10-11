import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { AnimatedModal } from '../../../../components/AnimatedModal';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../context/ToastContext';

interface ReceiptCameraScreenProps {
  visible: boolean;
  /** Called with the local file URI of the captured photo. */
  onCapture: (photoUri: string) => void;
  /** Optional fallback gallery callback */
  onGallery?: () => void;
  onClose: () => void;
}

export default function ReceiptCameraScreen({
  visible,
  onCapture,
  onClose,
}: ReceiptCameraScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [isLaunching, setIsLaunching] = React.useState(false);

  const handleCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'EzFinance needs camera access to scan your receipts.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showToast('Camera permission is required to scan receipts.', 'error', 'Permission Required');
          return;
        }
      }

      setIsLaunching(true);
      setTimeout(async () => {
        try {
          const result = await launchCamera({
            mediaType: 'photo',
            quality: 0.7,
            maxWidth: 1200,
            maxHeight: 1200,
            cameraType: 'back',
            saveToPhotos: false,
          });

          setIsLaunching(false);
          if (result.didCancel) return;
          if (result.errorCode) {
            showToast(result.errorMessage ?? 'Could not open camera.', 'error', 'Camera Error');
            return;
          }
          const asset = result.assets?.[0];
          if (asset?.uri) {
            onCapture(asset.uri);
          }
        } catch (err: any) {
          setIsLaunching(false);
          showToast(err?.message ?? 'Could not launch camera.', 'error');
        }
      }, 250);
    } catch (error: any) {
      setIsLaunching(false);
      showToast(error?.message ?? 'Could not request camera permission.', 'error');
    }
  };

  const handleGallery = async () => {
    setIsLaunching(true);
    setTimeout(async () => {
      try {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.7,
          maxWidth: 1200,
          maxHeight: 1200,
        });

        setIsLaunching(false);
        if (result.didCancel) return;
        if (result.errorCode) {
          showToast(result.errorMessage ?? 'Could not open photo library.', 'error');
          return;
        }
        const asset = result.assets?.[0];
        if (asset?.uri) {
          onCapture(asset.uri);
        }
      } catch (error) {
        setIsLaunching(false);
        showToast('Could not open photo library.', 'error');
      }
    }, 250);
  };

  return (
    <AnimatedModal
      visible={visible && !isLaunching}
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
          <View
            style={[styles.handleBar, { backgroundColor: theme.MUTED + '40' }]}
          />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Scan a receipt
              </Text>
              <Text style={[styles.headerSub, { color: theme.MUTED }]}>
                Take a photo or choose an image to read with AI
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          {/* Option 1: Live camera */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCamera}
            style={[styles.optionCard, { backgroundColor: theme.MODAL }]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: theme.TEXT },
              ]}
            >
              <Feather name="camera" size={20} color={theme.BG} />
            </View>
            <View style={styles.textBox}>
              <Text style={[styles.optionTitle, { color: theme.TEXT }]}>
                Take photo
              </Text>
              <Text style={[styles.optionDesc, { color: theme.MUTED }]}>
                Point camera at paper receipt or bill
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.MUTED} />
          </TouchableOpacity>

          {/* Option 2: Choose from photo library */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGallery}
            style={[styles.optionCard, { backgroundColor: theme.MODAL }]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${theme.ACTIVE}25` },
              ]}
            >
              <Feather name="image" size={20} color={theme.ACTIVE} />
            </View>
            <View style={styles.textBox}>
              <Text style={[styles.optionTitle, { color: theme.TEXT }]}>
                Choose from photo library
              </Text>
              <Text style={[styles.optionDesc, { color: theme.MUTED }]}>
                Upload a screenshot or photo of invoice
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.MUTED} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
  },
});
