import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THAI_PROVINCES } from '../utils/provincesData';

export default function ProvincePickerModal({ visible, onClose, onSelect, selectedProvince }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProvinces = useMemo(() => {
    if (!searchQuery.trim()) return THAI_PROVINCES;
    const q = searchQuery.trim().toLowerCase();
    return THAI_PROVINCES.filter(
      (item) =>
        item.en.toLowerCase().includes(q) ||
        item.th.includes(q) ||
        item.label.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (item) => {
    onSelect(item.label);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="map-outline" size={20} color="#2563eb" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Select Province / City</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search province (e.g. Bangkok / กรุงเทพ...)"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Province List */}
          <FlatList
            data={filteredProvinces}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected =
                selectedProvince === item.label ||
                selectedProvince === item.en ||
                selectedProvince?.toLowerCase() === item.en.toLowerCase();

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2563eb" />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={32} color="#cbd5e1" />
                <Text style={styles.emptyText}>No province found for "{searchQuery}"</Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
  },
  shortcutsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  shortcutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  shortcutBadgeSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb'
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  shortcutTextSelected: {
    color: '#2563eb',
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  itemRowSelected: {
    backgroundColor: '#eff6ff'
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  itemLabelSelected: {
    color: '#2563eb',
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8'
  }
});
