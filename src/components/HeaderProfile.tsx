import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import Typography from './Typography';

export const HeaderProfile = () => {
  const navigation = useNavigation<any>();
  const profile = useAppSelector(state => state.user.profile);

  const getInitials = () => {
    if (!profile?.name) return '??';
    const nameParts = profile.name.split(' ');
    return nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : profile.name.slice(0, 2).toUpperCase();
  };

  const handlePress = () => {
    // We use a more robust way to navigate to the nested Profile tab.
    // This works from both the top-level stack and nested navigators.
    navigation.navigate('Drawer', {
      screen: 'MainTabs',
      params: { screen: 'Profile' },
    });
  };


  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL as string }} style={styles.avatar} />
        ) : (
          <Typography variant="caption" weight="700" style={styles.initials}>
            {getInitials()}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 10,
    color: '#000',
  },
});
