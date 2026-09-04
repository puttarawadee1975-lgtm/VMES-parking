import React from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ZoneADetails from './zones/ZoneADetails';
import ZoneBDetails from './zones/ZoneBDetails';
import ZoneCDetails from './zones/ZoneCDetails';

export default function ParkingDetailsModal({
  visible,
  onClose,
  parkedSpot,
  onExitBuilding
}) {
  if (!parkedSpot) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-200">
          <Text className="text-lg font-bold text-slate-900">รายละเอียดที่จอดรถ</Text>
          <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-5">
          {/* Main Info Card */}
          <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-2xl bg-emerald-100 items-center justify-center mr-3 border border-emerald-300">
                  <Ionicons name="location" size={22} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-sm">Parked Vehicle Location</Text>
                  <Text className="text-slate-500 text-[11px]">Saved via Pillar QR Code</Text>
                </View>
              </View>
              <View className="bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                <Text className="text-emerald-700 text-[10px] font-bold uppercase">Parked</Text>
              </View>
            </View>

            <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 text-xs font-semibold">Building:</Text>
                <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>{parkedSpot.building}</Text>
              </View>

              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 text-xs font-semibold">Floor & Zone:</Text>
                <Text className="text-blue-600 font-bold text-xs">{parkedSpot.floor || '-'} • {parkedSpot.zone || '-'}</Text>
              </View>

              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 text-xs font-semibold">Pillar / Slot:</Text>
                <Text className="text-emerald-600 font-black text-sm">{parkedSpot.pillar}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 text-xs font-semibold">Parked Since:</Text>
                <Text className="text-slate-700 font-bold text-xs">{parkedSpot.parkedAt || 'Just now'}</Text>
              </View>
            </View>
          </View>

          {/* Map Graphic (Dynamically rendered based on Zone) */}
          {parkedSpot.building === 'Zone A' && <ZoneADetails parkedSpot={parkedSpot} />}
          {parkedSpot.building === 'Zone B' && <ZoneBDetails parkedSpot={parkedSpot} />}
          {parkedSpot.building === 'Zone C' && <ZoneCDetails parkedSpot={parkedSpot} />}
          {!['Zone A', 'Zone B', 'Zone C'].includes(parkedSpot.building) && (
            <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-6 items-center justify-center h-48">
              <Ionicons name="map-outline" size={48} color="#475569" className="mb-2" />
              <Text className="text-slate-400 text-xs">No floor plan available for this location</Text>
            </View>
          )}

          {/* Exit Building Button */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              if (onExitBuilding) onExitBuilding();
            }}
            activeOpacity={0.85}
            className="bg-red-50 border border-red-200 py-4 px-4 rounded-2xl flex-row items-center justify-center active:bg-red-100 shadow-sm mb-10"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" style={{ marginRight: 8 }} />
            <Text className="text-red-600 font-bold text-sm">Exit Building (Clear Parking Spot)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
