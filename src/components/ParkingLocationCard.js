import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ParkingLocationCard({
  parkedSpot,
  onOpenQRScanner,
  onExitBuilding
}) {
  // If user currently has a parked spot saved
  if (parkedSpot) {
    return (
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3.5 mb-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
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

        {/* Spot Details Grid */}
        <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
            <Text className="text-slate-500 text-xs font-semibold">Building:</Text>
            <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>{parkedSpot.building}</Text>
          </View>

          <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
            <Text className="text-slate-500 text-xs font-semibold">Floor & Zone:</Text>
            <Text className="text-blue-600 font-bold text-xs">{parkedSpot.floor} • {parkedSpot.zone}</Text>
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

        {/* Surrounding Map Visual Graphic */}
        <View className="bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="map" size={16} color="#60a5fa" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-xs">Surrounding Floor Plan Map</Text>
            </View>
            <Text className="text-slate-400 text-[10px]">{parkedSpot.floor}</Text>
          </View>

          {/* Interactive Floor Plan Box */}
          <View className="bg-slate-800 rounded-xl h-40 border border-slate-700 relative items-center justify-center overflow-hidden">
            {/* Map Grid Pillars */}
            <View className="absolute inset-0 opacity-25 flex-row flex-wrap justify-between p-2">
              {['A-01', 'A-02', 'B-13', 'B-14', 'B-15', 'C-01', 'C-02', 'D-10'].map((slot, i) => (
                <View
                  key={i}
                  className={`w-[22%] h-7 rounded m-1 items-center justify-center border ${
                    parkedSpot.pillar?.includes(slot)
                      ? 'bg-blue-600/40 border-blue-400'
                      : 'border-slate-500'
                  }`}
                >
                  <Text className="text-slate-400 text-[8px] font-bold">{slot}</Text>
                </View>
              ))}
            </View>

            {/* Landmarks */}
            <View className="absolute top-2 left-2 bg-blue-950/90 border border-blue-500/50 px-2 py-1 rounded">
              <Text className="text-blue-300 text-[8px] font-bold">🛗 Lift Lobby</Text>
            </View>
            <View className="absolute bottom-2 right-2 bg-emerald-950/90 border border-emerald-500/50 px-2 py-1 rounded">
              <Text className="text-emerald-300 text-[8px] font-bold">🚪 Exit Ramp</Text>
            </View>

            {/* Marker */}
            <View className="items-center z-10">
              <View className="w-11 h-11 rounded-full bg-blue-500/30 border-2 border-blue-400 items-center justify-center">
                <Text className="text-2xl">🛵</Text>
              </View>
              <View className="bg-blue-600 px-2.5 py-0.5 rounded-full mt-1 shadow-sm">
                <Text className="text-white text-[9px] font-bold">You are parked at {parkedSpot.pillar}</Text>
              </View>
            </View>
          </View>
          <Text className="text-slate-400 text-[9px] text-center mt-2">
            Surrounding floor map around parking pillar
          </Text>
        </View>

        {/* Exit Building Button */}
        <TouchableOpacity
          onPress={onExitBuilding}
          activeOpacity={0.85}
          className="bg-red-50 border border-red-200 py-3.5 px-4 rounded-2xl flex-row items-center justify-center active:bg-red-100 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 6 }} />
          <Text className="text-red-600 font-bold text-xs">Exit Building (Clear Parking Spot)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If no spot is currently saved, show the Scan QR Code Banner
  return (
    <View className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center mr-3">
            <Ionicons name="qr-code" size={22} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-sm">Where did you park?</Text>
            <Text className="text-slate-500 text-[11px] mt-0.5">Scan pillar QR code to save your spot & map</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onOpenQRScanner}
          activeOpacity={0.85}
          className="bg-blue-600 py-2.5 px-3.5 rounded-xl flex-row items-center shadow-sm shadow-blue-500/25 active:bg-blue-700"
        >
          <Ionicons name="scan" size={15} color="#ffffff" style={{ marginRight: 4 }} />
          <Text className="text-white font-bold text-xs">Scan QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
