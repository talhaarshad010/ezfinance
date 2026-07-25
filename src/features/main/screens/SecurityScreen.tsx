import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { setTwoFactorEnabled } from '../../../services/authService';
import {
  getActiveSessions,
  terminateSession,
  UserSession,
} from '../../../services/sessionService';
import auth from '@react-native-firebase/auth';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setTwoFactor } from '../../../store/slices/settingsSlice';

export const SecurityScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.user.profile);

  const twoFactor = useAppSelector(state => state.settings.twoFactorEnabled);

  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const user = auth().currentUser;
    if (user) {
      setIsLoadingSessions(true);
      const data = await getActiveSessions(user.uid);
      setSessions(data);
      setIsLoadingSessions(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setIsLoading2FA(true);
    try {
      await setTwoFactorEnabled(enabled);
      dispatch(setTwoFactor(enabled));
      showToast(
        enabled
          ? 'Two-Factor Authentication enabled!'
          : 'Two-Factor Authentication disabled.',
        enabled ? 'success' : 'info',
      );
    } catch (error) {
      showToast('Failed to update 2FA setting.', 'error');
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handleRemoveDevice = async (sessionId: string) => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      await terminateSession(user.uid, sessionId);
      showToast('Device logged out successfully.', 'success');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      showToast('Failed to remove device.', 'error');
    }
  };

  const getInitials = () => {
    if (!profile?.name) return 'TA';
    return profile.name
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

          <View style={styles.userHeaderGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.avatarWrap}
            >
              <View
                style={[
                  styles.avatarBorder,
                  { borderColor: theme.ACTIVE, backgroundColor: theme.MODAL },
                ]}
              >
                {profile?.photoURL ? (
                  <Image
                    source={{ uri: profile.photoURL }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={[styles.initialsText, { color: theme.TEXT }]}>
                      {getInitials()}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.settingsBadge,
                  { backgroundColor: theme.ACTIVE, borderColor: theme.BG },
                ]}
              >
                <Feather name="settings" size={9} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
                Account Security
              </Text>
              <Text style={[styles.headerSub, { color: theme.MUTED }]}>
                Manage your protection & sessions
              </Text>
            </View>
          </View>
        </View>

        {/* Security Rating Banner */}
        <View style={styles.sectionMargin}>
          <View
            style={[
              styles.ratingCard,
              { backgroundColor: `${theme.GREEN}14` },
            ]}
          >
            <View
              style={[
                styles.ratingIconBox,
                { backgroundColor: theme.GREEN },
              ]}
            >
              <Feather name="shield" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ratingTitle, { color: theme.TEXT }]}>
                Security Health: High (94%)
              </Text>
              <Text style={[styles.ratingSub, { color: theme.MUTED }]}>
                Biometrics active, 2FA enabled, 0 suspicious logins detected.
              </Text>
            </View>
          </View>
        </View>

        {/* Authentication Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            AUTHENTICATION
          </Text>

          <View style={[styles.cardGroup, { backgroundColor: theme.CARD }]}>
            {/* Change Password */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ChangePassword')}
              style={[
                styles.rowItem,
                { borderBottomWidth: 1, borderBottomColor: theme.BORDER },
              ]}
            >
              <View
                style={[
                  styles.iconSquare,
                  { backgroundColor: theme.MODAL },
                ]}
              >
                <Feather name="lock" size={18} color={theme.TEXT} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.TEXT }]}>
                  Change Password
                </Text>
                <Text style={[styles.itemSub, { color: theme.MUTED }]}>
                  Ensure your account is secure
                </Text>
              </View>

              <Feather name="chevron-right" size={18} color={theme.MUTED} />
            </TouchableOpacity>

            {/* Two-Factor Auth */}
            <View style={styles.rowItem}>
              <View
                style={[
                  styles.iconSquare,
                  { backgroundColor: theme.MODAL },
                ]}
              >
                <Feather name="shield" size={18} color={theme.TEXT} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.TEXT }]}>
                  Two-Factor Auth
                </Text>
                <Text style={[styles.itemSub, { color: theme.MUTED }]}>
                  {twoFactor
                    ? 'Email OTP verification on login'
                    : 'Extra security for your account'}
                </Text>
              </View>

              {isLoading2FA ? (
                <ActivityIndicator size="small" color={theme.ACTIVE} />
              ) : (
                <Switch
                  value={twoFactor}
                  onValueChange={handleToggle2FA}
                  trackColor={{
                    false: theme.MODAL,
                    true: theme.ACTIVE,
                  }}
                  thumbColor="#FFFFFF"
                />
              )}
            </View>
          </View>
        </View>

        {/* Active Devices & Sessions */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: theme.MUTED }]}>
            DEVICES & ACTIVE SESSIONS
          </Text>

          <View style={[styles.cardGroup, { backgroundColor: theme.CARD }]}>
            {isLoadingSessions ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={theme.TEXT} />
                <Text style={[styles.loadingText, { color: theme.MUTED }]}>
                  Fetching active sessions...
                </Text>
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Feather name="smartphone" size={24} color={theme.MUTED} />
                <Text style={[styles.emptyText, { color: theme.MUTED }]}>
                  No active sessions found
                </Text>
              </View>
            ) : (
              sessions.map((session, idx) => (
                <View
                  key={session.id}
                  style={[
                    styles.rowItem,
                    idx < sessions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconSquare,
                      { backgroundColor: theme.MODAL },
                    ]}
                  >
                    <Feather name="smartphone" size={18} color={theme.TEXT} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: theme.TEXT }]}>
                      {session.deviceName}{' '}
                      {session.isCurrent && (
                        <Text style={{ color: theme.GREEN, fontSize: 11 }}>
                          (Current)
                        </Text>
                      )}
                    </Text>
                    <Text style={[styles.itemSub, { color: theme.MUTED }]}>
                      {session.platform.toUpperCase()} • {session.osVersion}
                    </Text>
                  </View>

                  {!session.isCurrent && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRemoveDevice(session.id)}
                      style={[
                        styles.logoutPillBtn,
                        { backgroundColor: `${theme.RED}14` },
                      ]}
                    >
                      <Text style={[styles.logoutPillText, { color: theme.RED }]}>
                        Logout
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SecurityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    fontSize: 12,
  },
  userHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
    borderWidth: 1.8,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  initialsAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '800',
  },
  settingsBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionMargin: {
    marginBottom: 16,
  },
  ratingCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ratingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  ratingSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cardGroup: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 11,
  },
  logoutPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  logoutPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
});
