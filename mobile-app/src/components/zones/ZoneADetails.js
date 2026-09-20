import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ZoneADetails({ parkedSpot }) {
  const zoneSlots = ['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09', 'A-10'];
  
  return (
    <View className="bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Ionicons name="map" size={16} color="#60a5fa" style={{ marginRight: 6 }} />
          <Text className="text-white font-bold text-xs">Zone A • Floor G (VMES Building)</Text>
        </View>
        <Text className="text-blue-400 font-bold text-[10px]">{parkedSpot.floor || 'Floor G'}</Text>
      </View>

      <View className="bg-slate-800 rounded-xl h-48 border border-slate-700 relative items-center justify-center overflow-hidden">
        <View className="absolute inset-0 opacity-25 flex-row flex-wrap justify-between p-2">
          {zoneSlots.map((slot, i) => (
            <View
              key={i}
              className={`w-[18%] h-8 rounded m-1 items-center justify-center border ${
                parkedSpot.pillar === slot || (parkedSpot.pillar && slot.includes(parkedSpot.pillar.split('-')[0]))
                  ? 'bg-blue-600/40 border-blue-400'
                  : 'border-slate-500'
              }`}
            >
              <Text className="text-slate-400 text-[8px] font-bold">{slot}</Text>
            </View>
          ))}
        </View>

        <View className="absolute top-2 left-2 bg-blue-950/90 border border-blue-500/50 px-2 py-1 rounded">
          <Text className="text-blue-300 text-[8px] font-bold">🛗 Main Entrance / Lift</Text>
        </View>
        
        <View className="items-center z-10">
          <View className="w-12 h-12 rounded-full bg-blue-500/30 border-2 border-blue-400 items-center justify-center">
            <Text className="text-2xl">🛵</Text>
          </View>
          <View className="bg-blue-600 px-3 py-1 rounded-full mt-2 shadow-sm">
            <Text className="text-white text-[10px] font-bold">
              Parked at {(parkedSpot.pillar || 'A-01').replace(/^Spot\s+/i, '').replace(/^Pillar\s+/i, '').trim()}
            </Text>
          </View>
        </View>
      </View>
      <Text className="text-slate-400 text-[9px] text-center mt-3">
        Zone A • Floor G • VMES Building (VIP Front Entrance Zone)
      </Text>
    </View>
  );
}
