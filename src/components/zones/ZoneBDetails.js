import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ZoneBDetails({ parkedSpot }) {
  const zoneSlots = ['B-01', 'B-02', 'B-03', 'B-04', 'B-05', 'B-06', 'B-07', 'B-08'];
  
  return (
    <View className="bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Ionicons name="map" size={16} color="#f472b6" style={{ marginRight: 6 }} />
          <Text className="text-white font-bold text-xs">Zone B Floor Plan (East Wing)</Text>
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
                  ? 'bg-pink-600/40 border-pink-400'
                  : 'border-slate-500'
              }`}
            >
              <Text className="text-slate-400 text-[8px] font-bold">{slot}</Text>
            </View>
          ))}
        </View>

        <View className="absolute top-2 right-2 bg-pink-950/90 border border-pink-500/50 px-2 py-1 rounded">
          <Text className="text-pink-300 text-[8px] font-bold">🚶‍♂️ Walkway to Campus</Text>
        </View>
        
        <View className="items-center z-10">
          <View className="w-12 h-12 rounded-full bg-pink-500/30 border-2 border-pink-400 items-center justify-center">
            <Text className="text-2xl">🛵</Text>
          </View>
          <View className="bg-pink-600 px-3 py-1 rounded-full mt-2 shadow-sm">
            <Text className="text-white text-[10px] font-bold">Parked at {parkedSpot.pillar}</Text>
          </View>
        </View>
      </View>
      <Text className="text-slate-400 text-[9px] text-center mt-3">
        Standard zone located at the East Wing
      </Text>
    </View>
  );
}
