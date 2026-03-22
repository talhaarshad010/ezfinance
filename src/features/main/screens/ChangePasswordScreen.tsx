import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import {Typography, Card} from '../../../components';

const ChangePasswordScreen = () => {

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="h1" weight="700" style={{fontSize: 32}}>Change Password</Typography>
        <Typography variant="body" style={{marginTop: 8, lineHeight: 24}}>
          Ensure your new password meets the security requirements.
        </Typography>
      </View>

      <Card style={styles.card}>
         <Typography variant="caption" weight="700" style={styles.label}>CURRENT PASSWORD</Typography>
         <View style={styles.inputBox}>
            <TextInput 
              placeholder="••••••••"
              placeholderTextColor="#AAA"
              secureTextEntry
              style={styles.input}
            />
         </View>

         <View style={styles.divider} />

         <Typography variant="caption" weight="700" style={styles.label}>NEW PASSWORD</Typography>
         <View style={styles.inputBox}>
            <TextInput 
              placeholder="Enter new password"
              placeholderTextColor="#AAA"
              secureTextEntry
              style={styles.input}
            />
         </View>

         <Typography variant="caption" weight="700" style={styles.label}>CONFIRM NEW PASSWORD</Typography>
         <View style={[styles.inputBox, {marginBottom: 8}]}>
            <TextInput 
              placeholder="Repeat new password"
              placeholderTextColor="#AAA"
              secureTextEntry
              style={styles.input}
            />
         </View>

         <Typography variant="caption" color="#666" style={{fontSize: 11, marginTop: 12}}>
            • Minimum 8 characters long{'\n'}
            • At least one uppercase and one lowercase letter{'\n'}
            • At least one number and special character
         </Typography>

      </Card>

      <TouchableOpacity style={styles.saveBtn}>
         <Typography variant="body" weight="700" color="#FFF">Update Password</Typography>
      </TouchableOpacity>

      <View style={{height: 100}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  card: {
    marginBottom: 32,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputBox: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: '#EAEBEE',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#000',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    marginBottom: 24,
    backgroundColor: '#EAEBEE',
  },
  saveBtn: {
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  }
});

export default ChangePasswordScreen;
