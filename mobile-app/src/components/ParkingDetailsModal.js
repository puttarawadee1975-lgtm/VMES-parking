import React from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ParkingDetailsModal({
  visible,
  onClose,
  parkedSpot,
  onExitBuilding,
  onOpenQRScanner
}) {
  const hasSpot = !!parkedSpot;

  // Safe property fallbacks
  const pillar = hasSpot ? (parkedSpot.pillar || 'G05-G09') : '-';
  const floorRaw = hasSpot ? (parkedSpot.floor || 'Floor G') : '-';
  const displayFloor = hasSpot ? (floorRaw.replace(/Floor/gi, '').trim() || 'G') : '-';
  const building = hasSpot ? (parkedSpot.building || 'VEMS Building') : '-';
  const zone = hasSpot ? (parkedSpot.zone || (parkedSpot.building && parkedSpot.building.startsWith('Zone') ? parkedSpot.building : 'Zone A')) : 'Not Saved';
  const savedDate = hasSpot ? (parkedSpot.savedDate || parkedSpot.date || '-') : 'No Date Saved';
  const savedTime = hasSpot ? (parkedSpot.savedTime || '') : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>My Parking Location</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* If no spot saved, show alert warning card at top */}
          {!hasSpot && (
            <View style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={24} color="#d97706" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#92400e', fontWeight: '800', fontSize: 13 }}>No Saved Parking Location</Text>
                <Text style={{ color: '#b45309', fontSize: 11, marginTop: 2 }}>You haven't scanned a QR code to save your parking spot yet.</Text>
              </View>
            </View>
          )}

          {/* Top Cards: Pillar & Floor */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Left Card: Pillar */}
            <View style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>Pillar</Text>
              <Text style={{ color: hasSpot ? '#1e3a8a' : '#94a3b8', fontWeight: '900', fontSize: 24, letterSpacing: -0.5 }}>
                {pillar}
              </Text>
            </View>

            {/* Right Card: Floor */}
            <View style={{ width: '35%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>Floor</Text>
              <Text style={{ color: hasSpot ? '#1e3a8a' : '#94a3b8', fontWeight: '900', fontSize: 24 }}>
                {displayFloor}
              </Text>
            </View>
          </View>

          {/* Building & Date Details Card */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ color: '#64748b', fontWeight: '500', fontSize: 13 }}>Building</Text>
              <Text style={{ color: '#1e3a8a', fontWeight: '800', fontSize: 14 }}>{building}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ color: '#64748b', fontWeight: '500', fontSize: 13 }}>Zone</Text>
              <Text style={{ color: hasSpot ? '#2563eb' : '#94a3b8', fontWeight: '700', fontSize: 14 }}>{zone}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
              <Text style={{ color: '#64748b', fontWeight: '500', fontSize: 13 }}>Date</Text>
              <Text style={{ color: hasSpot ? '#1e3a8a' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>
                {savedDate}{savedTime ? ` (${savedTime})` : ''}
              </Text>
            </View>
          </View>

          {/* Image / Floor Map Area (Blank Placeholder reserved for Admin Web) */}
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', padding: 24, marginBottom: 24, alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Ionicons name="image-outline" size={24} color="#64748b" />
            </View>
            <Text style={{ color: '#475569', fontWeight: '700', fontSize: 13, marginBottom: 4, textAlign: 'center' }}>
              Zone Map Image Placeholder
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', paddingHorizontal: 20 }}>
              Dynamic zone image configured via Admin Web Management Console
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginBottom: 40 }}>
            {onOpenQRScanner && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenQRScanner();
                }}
                activeOpacity={0.85}
                style={{ backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.25, shadowRadius: 8, elevation: 2 }}
              >
                <Ionicons name="scan-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  {hasSpot ? 'Scan to Update Spot' : 'Scan QR Code to Save Spot'}
                </Text>
              </TouchableOpacity>
            )}

            {hasSpot && onExitBuilding && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onExitBuilding();
                }}
                activeOpacity={0.85}
                style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 14 }}>Exit Building (Clear Spot)</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
