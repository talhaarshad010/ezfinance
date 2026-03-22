import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { Typography, Button } from '../../../components';

const EditProfileScreen = ({ navigation }: any) => {
  const [name, setName] = useState('Alex Sterling');
  const [email, setEmail] = useState('alex.sterling@executive.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
           <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1, marginBottom: 8}}>FULL NAME</Typography>
           <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#AAA"
           />
        </View>

        <View style={styles.inputGroup}>
           <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1, marginBottom: 8}}>EMAIL ADDRESS</Typography>
           <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor="#AAA"
           />
        </View>

        <View style={styles.inputGroup}>
           <Typography variant="caption" weight="700" color="#666" style={{letterSpacing: 1, marginBottom: 8}}>PHONE NUMBER</Typography>
           <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#AAA"
           />
        </View>

        <Button title="Save Changes" style={{marginTop: 32}} onPress={() => navigation.goBack()} />
      </ScrollView>
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
  }
});

export default EditProfileScreen;
