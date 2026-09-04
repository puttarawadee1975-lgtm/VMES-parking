import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ZoneCDetails({ parkedSpot }) {
  const zoneSlots = ['C-10', 'C-11', 'C-12', 'C-13', 'C-14', 'C-15', 'C-16', 'C-17'];
  
  return (
    <View className="bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Ionicons name="map" size={16} color="#fb923c" style={{ marginRight: 6 }} />
          <Text className="text-white font-bold text-xs">Zone C Floor Plan (Basement)</Text>
        </View>
        <Text className="text-slate-400 text-[10px]">{parkedSpot.floor}</Text>
      </View>

      <View className="bg-slate-800 rounded-xl h-48 border border-slate-700 relative items-center justify-center overflow-hidden">
        <View className="absolute inset-0 opacity-25 flex-row flex-wrap justify-between p-2">
          {zoneSlots.map((slot, i) => (
            <View
              key={i}
              className={`w-[22%] h-8 rounded m-1 items-center justify-center border ${
                parkedSpot.pillar === slot
                  ? 'bg-orange-600/40 border-orange-400'
                  : 'border-slate-500'
              }`}
            >
              <Text className="text-slate-400 text-[8px] font-bold">{slot}</Text>
            </View>
          ))}
        </View>

        <View className="absolute bottom-2 left-2 bg-orange-950/90 border border-orange-500/50 px-2 py-1 rounded">
          <Text className="text-orange-300 text-[8px] font-bold">🚪 Exit Ramp</Text>
        </View>
        
        <View className="items-center z-10">
          <View className="w-12 h-12 rounded-full bg-orange-500/30 border-2 border-orange-400 items-center justify-center">
            <Text className="text-2xl">🛵</Text>
          </View>
          <View className="bg-orange-600 px-3 py-1 rounded-full mt-2 shadow-sm">
            <Text className="text-white text-[10px] font-bold">Parked at {parkedSpot.pillar}</Text>
          </View>
        </View>
      </View>
      <Text className="text-slate-400 text-[9px] text-center mt-3">
        Basement zone, closest to the exit ramp
      </Text>
    </View>
  );
}
