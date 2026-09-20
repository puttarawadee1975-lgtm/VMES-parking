import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ParkingLocationCard({
  parkedSpot,
  onOpenQRScanner,
  onOpenDetails
}) {
  // If user currently has a parked spot saved (Compact View)
  if (parkedSpot) {
    const zoneStr = parkedSpot.zone ? `${parkedSpot.zone} • ${parkedSpot.floor || 'Floor G'}` : (parkedSpot.floor || 'Floor G');
    const rawSpot = parkedSpot.pillar || 'A-01';
    const cleanSpot = rawSpot.replace(/^Spot\s+/i, '').replace(/^Pillar\s+/i, '').trim();

    return (
      <TouchableOpacity 
        onPress={onOpenDetails}
        activeOpacity={0.8}
        className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm mb-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center mr-3.5 border border-emerald-300">
            <Ionicons name="location" size={24} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              Find My Parking ({zoneStr})
            </Text>
            <Text className="text-slate-900 font-extrabold text-base" numberOfLines={1}>
              {(!parkedSpot.building || parkedSpot.building.startsWith('Zone')) ? 'VMES Building' : parkedSpot.building}
            </Text>
            <Text className="text-blue-600 font-bold text-xs mt-0.5">
              {cleanSpot} • {parkedSpot.savedDate || 'Today'}
            </Text>
          </View>
        </View>
        
        <View className="items-center justify-center ml-2 pl-3 border-l border-slate-100">
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          <Text className="text-[9px] text-slate-400 mt-1 font-medium">Details</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // If no spot is currently saved, show the Scan QR Code Banner
  return (
    <View className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 items-center justify-center mr-3">
            <Ionicons name="qr-code-outline" size={20} color="#64748b" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-sm">Find My Parking</Text>
            <Text className="text-slate-500 text-[11px] mt-0.5">Scan spot QR code to save your spot</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onOpenQRScanner}
          activeOpacity={0.85}
          className="bg-blue-600 py-2.5 px-3.5 rounded-xl flex-row items-center shadow-sm shadow-blue-500/25 active:bg-blue-700"
        >
          <Ionicons name="scan" size={15} color="#ffffff" style={{ marginRight: 4 }} />
          <Text className="text-white font-bold text-xs">Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
