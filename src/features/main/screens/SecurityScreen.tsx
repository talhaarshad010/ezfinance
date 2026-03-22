import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography } from '../../../components';

const SecurityScreen = () => {
  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Typography
            variant="caption"
            weight="700"
            color="#999"
            style={{ letterSpacing: 1, marginBottom: 16 }}
          >
            AUTHENTICATION
          </Typography>

          <TouchableOpacity style={styles.row}>
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
                Last updated 3 months ago
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
                Extra security for your account
              </Typography>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{ false: '#EAEBEE', true: '#0047AB' }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Feather name="smile" size={18} color="#000" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography variant="body" weight="700">
                Biometric Login
              </Typography>
              <Typography
                variant="caption"
                color="#666"
                style={{ marginTop: 2 }}
              >
                Use Face ID / Touch ID
              </Typography>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
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

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Feather name="smartphone" size={18} color="#000" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography variant="body" weight="700">
                iPhone 14 Pro Max
              </Typography>
              <Typography
                variant="caption"
                color="#666"
                style={{ marginTop: 2 }}
              >
                Current Device • London, UK
              </Typography>
            </View>
          </View>
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
});

export default SecurityScreen;
