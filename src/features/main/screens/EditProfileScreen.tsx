import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  updateName,
  updatePhone,
  updatePhoto,
} from '../../../store/slices/userSlice';
import {
  updateUserProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
} from '../../../services/authService';

export const EditProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.user.profile);

  const [name, setName] = useState(profile?.name || 'Talha Arshad');
  const [email] = useState(profile?.email || 'talhaarshad010@gmail.com');
  const [phone, setPhone] = useState(profile?.phone || '+92 300 1234567');
  const [city, setCity] = useState('Lahore, Punjab');
  const [photoURL, setPhotoURL] = useState<string | null>(
    profile?.photoURL || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Full name cannot be empty', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await updateUserProfile({ name: name.trim(), phone: phone.trim() });
      dispatch(updateName(name.trim()));
      dispatch(updatePhone(phone.trim()));
      showToast('Profile saved successfully!', 'success');
      navigation.goBack();
    } catch (error) {
      showToast('Failed to update profile details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = () => {
    setShowPhotoSheet(false);
    setTimeout(async () => {
      try {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.6,
          maxWidth: 500,
          maxHeight: 500,
          includeBase64: true,
        });

        if (result.didCancel) return;
        const asset = result.assets?.[0];
        if (asset?.base64) {
          setIsUploading(true);
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${
            asset.base64
          }`;
          await updateProfilePhoto(dataUri);
          setPhotoURL(dataUri);
          dispatch(updatePhoto(dataUri));
          showToast('Profile picture updated!', 'success');
          setIsUploading(false);
        }
      } catch (error) {
        setIsUploading(false);
        showToast('Failed to upload picture', 'error');
      }
    }, 400);
  };

  const handleTakePhoto = () => {
    setShowPhotoSheet(false);
    setTimeout(async () => {
      try {
        const result = await launchCamera({
          mediaType: 'photo',
          quality: 0.6,
          maxWidth: 500,
          maxHeight: 500,
          includeBase64: true,
        });

        if (result.didCancel) return;
        const asset = result.assets?.[0];
        if (asset?.base64) {
          setIsUploading(true);
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${
            asset.base64
          }`;
          await updateProfilePhoto(dataUri);
          setPhotoURL(dataUri);
          dispatch(updatePhoto(dataUri));
          showToast('Photo captured & updated!', 'success');
          setIsUploading(false);
        }
      } catch (error) {
        setIsUploading(false);
        showToast('Failed to capture photo', 'error');
      }
    }, 400);
  };

  const handleDeletePhoto = async () => {
    setShowPhotoSheet(false);
    try {
      await deleteProfilePhoto();
      setPhotoURL(null);
      dispatch(updatePhoto(null));
      showToast('Profile photo removed', 'info');
    } catch (error) {
      showToast('Failed to remove photo', 'error');
    }
  };

  const getInitials = () => {
    if (!name) return 'TA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 60,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={16} color={theme.MUTED} />
              <Text style={[styles.backText, { color: theme.MUTED }]}>
                My Profile
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              Edit Profile
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveHeaderBtn, { backgroundColor: theme.TEXT }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.BG} />
            ) : (
              <>
                <Feather name="check" size={15} color={theme.BG} />
                <Text style={[styles.saveHeaderText, { color: theme.BG }]}>
                  Save
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar Selection Hero */}
        <View style={styles.sectionMargin}>
          <View style={[styles.avatarHeroCard, { backgroundColor: theme.CARD }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowPhotoSheet(true)}
              style={styles.avatarTouchArea}
            >
              <View
                style={[
                  styles.avatarRing,
                  { borderColor: theme.ACTIVE, backgroundColor: theme.MODAL },
                ]}
              >
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={[styles.initialsText, { color: theme.TEXT }]}>
                      {getInitials()}
                    </Text>
                  </View>
                )}
                {isUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: theme.ACTIVE, borderColor: theme.CARD },
                ]}
              >
                <Feather name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.avatarHintText, { color: theme.MUTED }]}>
              Tap avatar to upload photo or take a picture
            </Text>
          </View>
        </View>

        {/* Form Inputs Group */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            PERSONAL INFORMATION
          </Text>

          <View style={styles.inputsStack}>
            {/* Full Name */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                FULL NAME
              </Text>
              <View style={styles.inputInnerRow}>
                <Feather name="user" size={18} color={theme.MUTED} />
                <TextInput
                  style={[styles.textInput, { color: theme.TEXT }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.MUTED}
                />
              </View>
            </View>

            {/* Email Address (Read-Only) */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <View style={styles.labelLockRow}>
                <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                  EMAIL ADDRESS
                </Text>
                <View style={styles.lockTag}>
                  <Feather name="lock" size={10} color={theme.MUTED} />
                  <Text style={[styles.lockTagText, { color: theme.MUTED }]}>
                    Read Only
                  </Text>
                </View>
              </View>
              <View style={styles.inputInnerRow}>
                <Feather name="mail" size={18} color={theme.MUTED} />
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.MUTED, opacity: 0.8 },
                  ]}
                  value={email}
                  editable={false}
                />
              </View>
              <Text style={[styles.helperText, { color: theme.MUTED }]}>
                Email address is verified via Firebase Auth and cannot be modified.
              </Text>
            </View>

            {/* Phone Number */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                PHONE NUMBER
              </Text>
              <View style={styles.inputInnerRow}>
                <Feather name="phone" size={18} color={theme.MUTED} />
                <TextInput
                  style={[styles.textInput, { color: theme.TEXT }]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.MUTED}
                />
              </View>
            </View>

            {/* City / Province */}
            <View style={[styles.inputCard, { backgroundColor: theme.CARD }]}>
              <Text style={[styles.fieldLabel, { color: theme.MUTED }]}>
                CITY / PROVINCE
              </Text>
              <View style={styles.inputInnerRow}>
                <Feather name="map-pin" size={18} color={theme.MUTED} />
                <TextInput
                  style={[styles.textInput, { color: theme.TEXT }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city name"
                  placeholderTextColor={theme.MUTED}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Verification Status Banner */}
        <View style={styles.sectionMargin}>
          <View style={[styles.verifyCard, { backgroundColor: theme.CARD }]}>
            <View
              style={[
                styles.verifyIconBox,
                { backgroundColor: `${theme.GREEN}15` },
              ]}
            >
              <Feather name="check-circle" size={20} color={theme.GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyTitle, { color: theme.TEXT }]}>
                CNIC & Biometric Verified
              </Text>
              <Text style={[styles.verifySub, { color: theme.MUTED }]}>
                Tier 1 Financial Compliance Active (Nadra Verified)
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Save Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isLoading}
          style={[styles.saveBigBtn, { backgroundColor: theme.TEXT }]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.BG} />
          ) : (
            <Text style={[styles.saveBigText, { color: theme.BG }]}>
              Save Profile Changes →
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Photo Picker Bottom Sheet Modal */}
      <Modal
        visible={showPhotoSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoSheet(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPhotoSheet(false)}
        >
          <Pressable
            style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.BORDER }]} />
            <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
              Update Profile Picture
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTakePhoto}
              style={[styles.sheetOption, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="camera" size={20} color={theme.TEXT} />
              <Text style={[styles.sheetOptionText, { color: theme.TEXT }]}>
                Take a New Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUploadPhoto}
              style={[styles.sheetOption, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="image" size={20} color={theme.TEXT} />
              <Text style={[styles.sheetOptionText, { color: theme.TEXT }]}>
                Choose from Photo Gallery
              </Text>
            </TouchableOpacity>

            {photoURL && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDeletePhoto}
                style={[
                  styles.sheetOption,
                  { backgroundColor: `${theme.RED}14` },
                ]}
              >
                <Feather name="trash-2" size={20} color={theme.RED} />
                <Text style={[styles.sheetOptionText, { color: theme.RED }]}>
                  Remove Profile Picture
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowPhotoSheet(false)}
              style={styles.sheetCancelBtn}
            >
              <Text style={[styles.sheetCancelText, { color: theme.MUTED }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  saveHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionMargin: {
    marginBottom: 16,
  },
  avatarHeroCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  avatarTouchArea: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  initialsAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 28,
    fontWeight: '800',
  },
  uploadingOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  avatarHintText: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  inputsStack: {
    gap: 10,
  },
  inputCard: {
    borderRadius: 20,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  labelLockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  helperText: {
    fontSize: 11,
    marginTop: 8,
  },
  verifyCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  verifyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  verifySub: {
    fontSize: 11,
  },
  saveBigBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBigText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  sheetOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetCancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
