import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography, Card} from '../../../components';
import {useNavigation} from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" weight="700" style={{fontSize: 48}}>Settings</Typography>
          <Typography variant="body" style={styles.subtitle}>
            Configure your financial workspace and security protocols.
          </Typography>
        </View>

        {/* Change Password Card */}
        <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')} activeOpacity={0.9}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name="lock" size={20} color="#000" />
              </View>
              <Feather name="arrow-up-right" size={24} color="#CCC" />
            </View>
            <Typography variant="h2" weight="700" style={{marginTop: 24}}>Change Password</Typography>
            <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 22}}>
              Update your security credentials to keep your account safe.
            </Typography>
          </Card>
        </TouchableOpacity>

        {/* Notifications Card */}
        <Card style={styles.card}>
          <Feather name="bell" size={24} color="#000" />
          <Typography variant="h2" weight="700" style={{marginTop: 24}}>Notification Preferences</Typography>
          <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 22}}>
            Manage alerts for transactions, limits, and market updates.
          </Typography>
          <TouchableOpacity 
            style={styles.configureBtn} 
            onPress={() => Alert.alert('Notifications', 'Preferences configuration coming soon.')}
          >
            <Typography variant="body" weight="700" color="#FFF">Configure</Typography>
          </TouchableOpacity>
        </Card>

        {/* Export Card */}
        <Card style={styles.card}>
          <Feather name="layers" size={24} color="#000" />
          <Typography variant="h2" weight="700" style={{marginTop: 24}}>Export Financial Data</Typography>
          <Typography variant="body" color="#666" style={{marginTop: 8, lineHeight: 22}}>
            Download your complete transaction history in CSV or PDF format.
          </Typography>
          <TouchableOpacity 
            style={styles.exportLink}
            onPress={() => Alert.alert('Export', 'Financial data export is being prepared.')}
          >
            <Typography variant="body" weight="700" color="#000">Export now</Typography>
            <Feather name="download" size={16} color="#000" style={{marginLeft: 8}} />
          </TouchableOpacity>
        </Card>

        {/* App Settings Card */}
        <Card style={styles.card}>
          <View style={styles.appSettingsHeader}>
            <Feather name="settings" size={20} color="#000" />
            <Typography variant="h2" weight="700" style={{marginLeft: 12}}>App Settings</Typography>
          </View>

          {/* Display Mode */}
          <View style={styles.settingItem}>
            <View style={{flex: 1}}>
              <Typography variant="body" weight="700">Display Mode</Typography>
              <Typography variant="caption" color="#666" style={{marginTop: 4}}>Switch between Light and Dark interface</Typography>
            </View>
            <View style={styles.segmentControl}>
              <TouchableOpacity 
                style={[styles.segment, !isDarkMode && styles.segmentActive]} 
                onPress={() => setIsDarkMode(false)}
              >
                <Typography variant="caption" weight="700" color={!isDarkMode ? "#000" : "#666"}>Light</Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segment, isDarkMode && styles.segmentActive]} 
                onPress={() => setIsDarkMode(true)}
              >
                <Typography variant="caption" weight="700" color={isDarkMode ? "#000" : "#666"}>Dark</Typography>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Default Currency */}
          <View style={styles.settingItem}>
            <View style={{flex: 1}}>
              <Typography variant="body" weight="700">Default Currency</Typography>
              <Typography variant="caption" color="#666" style={{marginTop: 4}}>Used for global balance summaries</Typography>
            </View>
            <Typography variant="body" weight="700">USD ($)</Typography>
          </View>

          <View style={styles.divider} />

          {/* Biometric */}
          <View style={styles.settingItem}>
            <View style={{flex: 1}}>
               <Typography variant="body" weight="700">Biometric Login</Typography>
               <Typography variant="caption" color="#666" style={{marginTop: 4}}>Use FaceID or Fingerprint for access</Typography>
            </View>
            <Switch
               trackColor={{ false: "#EAEBEE", true: "#000" }}
               thumbColor={"#FFF"}
               ios_backgroundColor="#EAEBEE"
               onValueChange={(val) => Alert.alert('Biometrics', `Biometric login updated.`)}
               value={true}
            />
          </View>
        </Card>

        {/* Active Account Card */}
        <Card style={styles.accountCard}>
          <View style={styles.userIconCircle}>
            <Feather name="user" size={24} color="#000" />
          </View>
          <View style={{marginLeft: 16}}>
            <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1}}>ACTIVE ACCOUNT</Typography>
            <Typography variant="h3" weight="700" style={{marginTop: 4}}>alex.walker@ezfinance.com</Typography>
          </View>
        </Card>

        <View style={{height: 60}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 48,
  },
  subtitle: {
    marginTop: 12,
    lineHeight: 24,
    color: '#333',
    paddingRight: 20,
  },
  card: {
    marginBottom: 20,
    padding: 32,
    borderRadius: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  configureBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 32,
  },
  exportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  appSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    width: 140,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 32,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  userIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsScreen;
