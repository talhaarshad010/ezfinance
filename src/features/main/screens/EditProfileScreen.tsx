import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { Typography, Button } from '../../../components';
import { useToast } from '../../../context/ToastContext';
import { getUserProfile, updateUserProfile } from '../../../services/authService';
import auth from '@react-native-firebase/auth';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateName, updatePhone, updatePhoto } from '../../../store/slices/userSlice';
import { updateProfilePhoto, deleteProfilePhoto } from '../../../services/authService';
import { Modal, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../../theme/colors';

const EditProfileScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.user.profile);

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [photoURL, setPhotoURL] = useState<string | null>(profile?.photoURL || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await updateUserProfile({ name: name.trim(), phone: phone.trim() });
      dispatch(updateName(name.trim()));
      dispatch(updatePhone(phone.trim()));
      showToast('Profile updated successfully!', 'success');
      navigation.goBack();
    } catch (error) {
      showToast('Failed to update profile.', 'error');
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
          quality: 0.5,
          maxWidth: 400,
          maxHeight: 400,
          includeBase64: true,
        });

        if (result.didCancel) return;
        const asset = result.assets?.[0];
        if (asset?.base64) {
          setIsUploading(true);
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
          await updateProfilePhoto(dataUri);
          setPhotoURL(dataUri);
          dispatch(updatePhoto(dataUri));
          showToast('Profile photo updated!', 'success');
          setIsUploading(false);
        }
      } catch (error) {
        setIsUploading(false);
        showToast('Failed to update profile photo.', 'error');
      }
    }, 500);
  };

  const handleTakePhoto = () => {
    setShowPhotoSheet(false);
    setTimeout(async () => {
      try {
        const result = await launchCamera({
          mediaType: 'photo',
          quality: 0.5,
          maxWidth: 400,
          maxHeight: 400,
          includeBase64: true,
        });

        if (result.didCancel) return;
        const asset = result.assets?.[0];
        if (asset?.base64) {
          setIsUploading(true);
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
          await updateProfilePhoto(dataUri);
          setPhotoURL(dataUri);
          dispatch(updatePhoto(dataUri));
          showToast('Profile photo updated!', 'success');
          setIsUploading(false);
        }
      } catch (error) {
        setIsUploading(false);
        showToast('Failed to update profile photo.', 'error');
      }
    }, 500);
  };

  const handleDeletePhoto = async () => {
    setShowPhotoSheet(false);
    try {
      await deleteProfilePhoto();
      setPhotoURL(null);
      dispatch(updatePhoto(null));
      showToast('Profile photo removed.', 'success');
    } catch (error) {
      showToast('Failed to remove profile photo.', 'error');
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarWrapper} 
            onPress={() => setShowPhotoSheet(true)}
            activeOpacity={0.8}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarMock}>
                <Typography variant="h1" weight="700" color="#FFF" style={{ fontSize: 32 }}>
                  {getInitials()}
                </Typography>
              </View>
            )}
            <View style={styles.editBadge}>
              <Feather name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Typography variant="body" color="#666" style={{ marginTop: 12 }}>
            Tap to change profile picture
          </Typography>
        </View>

        <View style={styles.inputGroup}>
          <Typography variant="caption" weight="700" color="#666" style={{ letterSpacing: 1, marginBottom: 8 }}>
            FULL NAME
          </Typography>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#AAA"
            placeholder="Enter your full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Typography variant="caption" weight="700" color="#666" style={{ letterSpacing: 1, marginBottom: 8 }}>
            EMAIL ADDRESS
          </Typography>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
            placeholderTextColor="#AAA"
          />
          <Typography variant="caption" color="#999" style={{ marginTop: 6 }}>
            Email cannot be changed for security reasons.
          </Typography>
        </View>

        <View style={styles.inputGroup}>
          <Typography variant="caption" weight="700" color="#666" style={{ letterSpacing: 1, marginBottom: 8 }}>
            PHONE NUMBER
          </Typography>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#AAA"
            placeholder="Enter your phone number"
          />
        </View>

        <Button
          title="Save Changes"
          style={{ marginTop: 32 }}
          onPress={handleSave}
          isLoading={isLoading}
        />
      </ScrollView>

      <Modal
        visible={showPhotoSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoSheet(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPhotoSheet(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Typography variant="h2" weight="700" style={{ marginBottom: 24 }}>
              Profile Photo
            </Typography>

            <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto}>
              <View style={styles.sheetIconBox}>
                <Feather name="camera" size={20} color="#000" />
              </View>
              <Typography variant="body" weight="600" style={{ marginLeft: 16 }}>
                Take Photo
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handleUploadPhoto}>
              <View style={styles.sheetIconBox}>
                <Feather name="image" size={20} color="#000" />
              </View>
              <Typography variant="body" weight="600" style={{ marginLeft: 16 }}>
                Choose from Gallery
              </Typography>
            </TouchableOpacity>

            {photoURL && (
              <TouchableOpacity style={styles.sheetOption} onPress={handleDeletePhoto}>
                <View style={[styles.sheetIconBox, { backgroundColor: '#FFEBEE' }]}>
                  <Feather name="trash-2" size={20} color={colors.accent.errorText} />
                </View>
                <Typography variant="body" weight="600" color={colors.accent.errorText} style={{ marginLeft: 16 }}>
                  Delete Photo
                </Typography>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPhotoSheet(false)}>
              <Typography variant="body" weight="700" color="#666">
                Cancel
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { padding: 24, paddingTop: 32 },
  inputGroup: { marginBottom: 24 },
  input: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#000',
    borderWidth: 1,
    borderColor: '#EAEBEE',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#999',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarMock: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8F9FB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sheetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

export default EditProfileScreen;
