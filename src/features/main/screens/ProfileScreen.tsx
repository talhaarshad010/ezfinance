import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { colors } from '../../../theme/colors';
import { useToast } from '../../../context/ToastContext';
import {
  signOut,
  getUserProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
} from '../../../services/authService';
import auth from '@react-native-firebase/auth';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updatePhoto } from '../../../store/slices/userSlice';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.user.profile);

  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [userName, setUserName] = useState(profile?.name || '');
  const [userEmail, setUserEmail] = useState(profile?.email || '');
  const [photoURL, setPhotoURL] = useState<string | null>(
    profile?.photoURL || null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const loadUserData = useCallback(async () => {
    const user = auth().currentUser;
    if (user) {
      setUserName(user.displayName || 'User');
      setUserEmail(user.email || '');
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.photoURL) {
          setPhotoURL(profile.photoURL);
        } else {
          setPhotoURL(user.photoURL || null);
        }
        if (profile?.name) setUserName(profile.name);
      } catch (e) {
        // Use auth data as fallback
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData]),
  );

  const handleLogout = async () => {
    try {
      await signOut();
      showToast('You have been signed out.', 'success', 'Logout');
    } catch (error) {
      showToast('Failed to sign out. Please try again.', 'error', 'Logout');
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
        if (result.errorCode) {
          showToast('Failed to pick image.', 'error');
          return;
        }

        const asset = result.assets?.[0];
        if (asset?.base64) {
          setIsUploading(true);
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${
            asset.base64
          }`;
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
        if (result.errorCode) {
          showToast('Failed to take photo.', 'error');
          return;
        }

        const asset = result.assets?.[0];
        if (asset?.base64) {
          setIsUploading(true);
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${
            asset.base64
          }`;
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
    if (!userName) return '?';
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Profile Header */}
        <View style={styles.headerArea}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarMock}>
                <Typography
                  variant="h1"
                  weight="700"
                  color="#FFF"
                  style={{ fontSize: 32 }}
                >
                  {getInitials()}
                </Typography>
              </View>
            )}
            <TouchableOpacity
              style={styles.editBadge}
              onPress={() => setShowPhotoSheet(true)}
            >
              <Feather name="edit-2" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Typography
            variant="caption"
            weight="700"
            color="#AAA"
            style={{ letterSpacing: 1, marginTop: 16 }}
          >
            PREMIUM ACCOUNT
          </Typography>
          <Typography
            variant="h1"
            weight="700"
            style={{ marginTop: 4, fontSize: 32 }}
          >
            {userName}
          </Typography>
          <Typography variant="body" color="#666" style={{ marginTop: 4 }}>
            {userEmail}
          </Typography>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Feather name="check-circle" size={14} color="#000" />
              <Typography
                variant="caption"
                weight="700"
                style={{ marginLeft: 6 }}
              >
                Identity Verified
              </Typography>
            </View>
            <View style={styles.badge}>
              <Feather name="award" size={14} color="#0047AB" />
              <Typography
                variant="caption"
                weight="700"
                style={{ marginLeft: 6 }}
              >
                Tier 1 Investor
              </Typography>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Typography variant="caption" color="#AAA">
            Monthly Income
          </Typography>
          <Typography
            variant="h1"
            color="#FFF"
            style={{ fontSize: 28, marginTop: 4 }}
          >
            $12,450.00
          </Typography>

          <Typography variant="caption" color="#AAA" style={{ marginTop: 24 }}>
            Risk Tolerance
          </Typography>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
          >
            <Typography
              variant="body"
              weight="700"
              color="#FFF"
              style={{ marginRight: 12 }}
            >
              Aggressive
            </Typography>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[styles.riskBar, { backgroundColor: '#FFF' }]}
                />
              ))}
              <View style={[styles.riskBar, { backgroundColor: '#333' }]} />
            </View>
          </View>
        </Card>

        {/* Settings List */}
        <Typography
          variant="caption"
          weight="700"
          color="#999"
          style={{ letterSpacing: 1, marginLeft: 8, marginBottom: 8 }}
        >
          ACCOUNT SETTINGS
        </Typography>

        <SettingRow
          icon="user"
          title="Edit Profile"
          subtitle="Update your personal details and bio"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <SettingRow
          icon="shield"
          title="Security"
          subtitle="2FA, Password changes, and Login sessions"
          onPress={() => navigation.navigate('Security')}
        />
        <SettingRow
          icon="bell"
          title="Notifications"
          subtitle="Configure alerts and daily summaries"
          badge="3 NEW"
          onPress={() =>
            showToast(
              'Configure alerts and daily summaries.',
              'info',
              'Notifications',
            )
          }
        />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <View style={styles.logoutIconBox}>
            <Feather name="log-out" size={18} color={colors.accent.errorText} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Typography
              variant="body"
              weight="700"
              color={colors.accent.errorText}
            >
              Logout
            </Typography>
            <Typography variant="caption" color="#E57373">
              Securely sign out of your account
            </Typography>
          </View>
          <Feather
            name="arrow-right"
            size={20}
            color={colors.accent.errorText}
          />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Photo Bottom Sheet Modal */}
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

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleTakePhoto}
            >
              <View style={styles.sheetIconBox}>
                <Feather name="camera" size={20} color="#000" />
              </View>
              <Typography
                variant="body"
                weight="600"
                style={{ marginLeft: 16 }}
              >
                Take Photo
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleUploadPhoto}
            >
              <View style={styles.sheetIconBox}>
                <Feather name="image" size={20} color="#000" />
              </View>
              <Typography
                variant="body"
                weight="600"
                style={{ marginLeft: 16 }}
              >
                Choose from Gallery
              </Typography>
            </TouchableOpacity>

            {photoURL && (
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={handleDeletePhoto}
              >
                <View
                  style={[styles.sheetIconBox, { backgroundColor: '#FFEBEE' }]}
                >
                  <Feather
                    name="trash-2"
                    size={20}
                    color={colors.accent.errorText}
                  />
                </View>
                <Typography
                  variant="body"
                  weight="600"
                  color={colors.accent.errorText}
                  style={{ marginLeft: 16 }}
                >
                  Delete Photo
                </Typography>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setShowPhotoSheet(false)}
            >
              <Typography variant="body" weight="700" color="#666">
                Cancel
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const SettingRow = ({ icon, title, subtitle, badge, onPress }: any) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <View style={styles.iconBox}>
      <Feather name={icon} size={20} color="#000" />
    </View>
    <View style={{ flex: 1, marginLeft: 16 }}>
      <Typography variant="body" weight="700">
        {title}
      </Typography>
      <Typography variant="caption" color="#666" style={{ marginTop: 2 }}>
        {subtitle}
      </Typography>
    </View>
    {badge && (
      <View style={styles.notificationBadge}>
        <Typography
          variant="caption"
          weight="700"
          color="#FFF"
          style={{ fontSize: 10, textAlign: 'center' }}
        >
          3{'\n'}NEW
        </Typography>
      </View>
    )}
    <Feather
      name="chevron-right"
      size={20}
      color="#CCC"
      style={{ marginLeft: 12 }}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFCCBC',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8F9FB',
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  statsCard: {
    backgroundColor: '#000',
    padding: 32,
    borderRadius: 30,
    marginBottom: 32,
  },
  riskBar: {
    width: 24,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.errorText,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 20,
    borderRadius: 24,
    marginTop: 8,
  },
  logoutIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bottom Sheet Styles
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

export default ProfileScreen;
