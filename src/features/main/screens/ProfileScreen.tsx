import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card } from '../../../components';
import { colors } from '../../../theme/colors';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.headerArea}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarMock} />
          <TouchableOpacity
            style={styles.editBadge}
            onPress={() =>
              Alert.alert('Profile Photo', 'Manage your photo', [
                { text: 'Update Image' },
                { text: 'Remove Image', style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
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
          Alex Sterling
        </Typography>
        <Typography variant="body" color="#666" style={{ marginTop: 4 }}>
          alex.sterling@executive.com
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
        onPress={() => Alert.alert('Notifications', 'Settings')}
      />

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() =>
          Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: () => DeviceEventEmitter.emit('LOGOUT'),
            },
          ])
        }
      >
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
        <Feather name="arrow-right" size={20} color={colors.accent.errorText} />
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
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
          3\nNEW
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
  avatarMock: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFAB91',
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
});

export default ProfileScreen;
