import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav({ insets, activeTab, setActiveTab, onOpenQR }) {
  // Use safe area padding, but since it's a pill floating above the bottom, we add margin
  const bottomMargin = Math.max(insets.bottom, 20);

  return (
    <View style={[styles.container, { bottom: bottomMargin }]}>
      {/* Left: Home */}
      <TouchableOpacity 
        onPress={() => setActiveTab('monitor')} 
        style={styles.navItem}
      >
        <Ionicons name="home-outline" size={24} color={activeTab === 'monitor' ? '#0f172a' : '#64748b'} />
        <Text style={[styles.navText, activeTab === 'monitor' && styles.activeText]}>Home</Text>
      </TouchableOpacity>

      {/* Center: Scan to Park */}
      <View style={styles.centerNavItem}>
        <TouchableOpacity 
          onPress={onOpenQR} 
          activeOpacity={0.8}
          style={styles.fab}
        >
          <Ionicons name="qr-code-outline" size={30} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.centerText}>Find My Parking</Text>
      </View>

      {/* Right: Profile */}
      <TouchableOpacity 
        onPress={() => setActiveTab('account')} 
        style={styles.navItem}
      >
        <Ionicons name="person-outline" size={24} color={activeTab === 'account' ? '#0f172a' : '#64748b'} />
        <Text style={[styles.navText, activeTab === 'account' && styles.activeText]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerNavItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
    paddingBottom: 8,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    color: '#64748b',
  },
  activeText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  centerText: {
    fontSize: 11,
    color: '#0f172a',
    marginTop: 24, // Push text down to make room for FAB
  },
  fab: {
    position: 'absolute',
    top: -24, // Float above the bar
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb', // Blue color matching active state
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#dbeafe', // Light blue outer ring effect matching the blue button
  }
});
