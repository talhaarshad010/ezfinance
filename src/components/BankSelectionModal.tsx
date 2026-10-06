import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Typography from './Typography';
import PAKISTANI_BANKS, { PakistaniBank } from '../constants/pakistaniBanks';
import { AnimatedModal } from './AnimatedModal';

interface BankSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (bank: PakistaniBank) => void;
}

const BankSelectionModal: React.FC<BankSelectionModalProps> = ({ visible, onClose, onSelect }) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return PAKISTANI_BANKS;
    const q = search.toLowerCase();
    return PAKISTANI_BANKS.filter(
      b => b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = (bank: PakistaniBank) => {
    setSearch('');
    onSelect(bank);
  };

  const renderItem = ({ item }: { item: PakistaniBank }) => (
    <TouchableOpacity style={styles.bankItem} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={[styles.bankAvatar, { backgroundColor: item.color, overflow: 'hidden' }]}>
        {item.logo ? (
          <Image
            source={{ uri: item.logo }}
            style={styles.bankLogo}
            resizeMode="contain"
          />
        ) : (
          <Typography variant="caption" weight="700" color="#FFF" style={{ fontSize: 11 }}>
            {item.abbreviation}
          </Typography>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Typography variant="body" weight="600">{item.shortName}</Typography>
        <Typography variant="caption" color="#999">{item.name}</Typography>
      </View>
      <Feather name="chevron-right" size={18} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <AnimatedModal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
          <Typography variant="h3" weight="700" style={{ flex: 1, textAlign: 'center' }}>
            Select Bank
          </Typography>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search banks..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bank List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Feather name="search" size={40} color="#E0E0E0" />
              <Typography variant="body" color="#999" style={{ marginTop: 12 }}>
                No banks found
              </Typography>
            </View>
          }
        />
      </View>
    </AnimatedModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#000',
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bankAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
});

export default BankSelectionModal;
