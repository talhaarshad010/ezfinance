import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography } from '../../../components';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../../context/ToastContext';
import { isTwoFactorEnabled, setTwoFactorEnabled } from '../../../services/authService';
import { getActiveSessions, terminateSession, UserSession } from '../../../services/sessionService';
import auth from '@react-native-firebase/auth';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setTwoFactor } from '../../../store/slices/settingsSlice';

const SecurityScreen = () => {
  const navigation = useNavigation<any>();
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
        enabled ? 'Two-Factor Authentication enabled!' : 'Two-Factor Authentication disabled.',
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
      showToast('Device removed and logged out.', 'success');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      showToast('Failed to remove device.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('EditProfile')}
          >
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarMock}>
                <Typography variant="h2" weight="700" color="#FFF">
                  {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </Typography>
              </View>
            )}
            <View style={styles.editBadge}>
              <Feather name="settings" size={10} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Typography variant="h2" weight="700">Account Security</Typography>
            <Typography variant="caption" color="#666" style={{ marginTop: 2 }}>
              Manage your protection & sessions
            </Typography>
          </View>
        </View>

        <View style={styles.section}>
          <Typography
            variant="caption"
            weight="700"
            color="#999"
            style={{ letterSpacing: 1, marginBottom: 16 }}
          >
            AUTHENTICATION
          </Typography>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={styles.iconCircle}>
              <Feather name="lock" size={18} color="#000" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography variant="body" weight="700">
                Change Password
              </Typography>
              <Typography
                variant="caption"
                color="#666"
                style={{ marginTop: 2 }}
              >
                Ensure your account is secure
              </Typography>
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Feather name="shield" size={18} color="#000" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography variant="body" weight="700">
                Two-Factor Auth
              </Typography>
              <Typography
                variant="caption"
                color="#666"
                style={{ marginTop: 2 }}
              >
                {twoFactor ? 'Email OTP verification on login' : 'Extra security for your account'}
              </Typography>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={handleToggle2FA}
              disabled={isLoading2FA}
              trackColor={{ false: '#EAEBEE', true: '#0047AB' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Typography
            variant="caption"
            weight="700"
            color="#999"
            style={{ letterSpacing: 1, marginBottom: 16, marginTop: 16 }}
          >
            DEVICES
          </Typography>

          {isLoadingSessions ? (
            <ActivityIndicator size="small" color="#000" style={{ marginVertical: 20 }} />
          ) : sessions.length === 0 ? (
            <Typography variant="caption" color="#999" style={{ textAlign: 'center', marginVertical: 20 }}>
              No active sessions found.
            </Typography>
          ) : (
            sessions.map(session => (
              <View key={session.id} style={styles.row}>
                <View style={styles.iconCircle}>
                  <Feather
                    name={session.platform === 'ios' ? 'smartphone' : 'smartphone'}
                    size={18}
                    color="#000"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Typography variant="body" weight="700">
                    {session.deviceName} {session.isCurrent && '(Current)'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="#666"
                    style={{ marginTop: 2 }}
                  >
                    {session.platform.toUpperCase()} • {session.osVersion}
                  </Typography>
                </View>
                {!session.isCurrent && (
                  <TouchableOpacity 
                    onPress={() => handleRemoveDevice(session.id)}
                    style={styles.removeBtn}
                  >
                    <Typography variant="caption" weight="700" color="#FF3B30">
                      Logout
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { padding: 24, paddingTop: 16 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF1F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarMock: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8F9FB',
  },
});

export default SecurityScreen;
