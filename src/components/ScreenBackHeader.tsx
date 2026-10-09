import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Back chevron and title for stack screens shown without the navigator header. */
export function ScreenBackHeader({ title, back }: { title: string; back?: string }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
        <Feather name="chevron-left" size={16} color="#8E8E93" />
        <Text style={styles.backText}>{back ?? 'Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 4, backgroundColor: '#F8F9FB' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, alignSelf: 'flex-start' },
  backText: { fontSize: 12, color: '#8E8E93' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -1.2, color: '#1C1C1E' },
});
