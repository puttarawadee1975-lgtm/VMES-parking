import React from 'react';
import { View, Text } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <View className="space-y-4">
      <View className="mb-1">
        <Text className="text-xl font-bold text-slate-900">Safety Statistics & Reports</Text>
        <Text className="text-slate-500 text-xs mt-0.5">Violation analytics and hourly campus traffic volume</Text>
      </View>

      {/* Hourly Bar Chart visualization */}
      <View className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm">
        <Text className="text-slate-900 font-bold text-sm mb-4">Today's Helmet Compliance Rate (Hourly)</Text>
        <View className="h-36 sm:h-40 flex-row items-end justify-between px-1 pt-4">
          {[
            { label: '07:00', total: 35, compliance: 30 },
            { label: '08:00', total: 85, compliance: 73 },
            { label: '09:00', total: 65, compliance: 57 },
            { label: '10:00', total: 40, compliance: 36 },
            { label: '11:00', total: 50, compliance: 44 },
            { label: '12:00', total: 70, compliance: 60 },
            { label: '13:00', total: 45, compliance: 40 },
            { label: '16:00', total: 90, compliance: 75 }
          ].map((bar, i) => {
            const pctVal = (bar.compliance / bar.total) * 100;
            return (
              <View key={i} className="items-center w-[10%]">
                <View className="w-2.5 sm:w-3 h-24 sm:h-28 bg-slate-100 rounded-full overflow-hidden justify-end">
                  <View className="bg-blue-600 rounded-full" style={{ height: `${pctVal}%` }} />
                </View>
                <Text className="text-slate-400 text-[8px] mt-2 font-bold">{bar.label}</Text>
              </View>
            );
          })}
        </View>
        <View className="flex-row justify-center space-x-4 mt-4 pt-3 border-t border-slate-100">
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5" />
            <Text className="text-slate-500 text-[10px]">Helmet Compliant (%)</Text>
          </View>
        </View>
      </View>

      {/* Gate distribution table */}
      <View className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <Text className="text-slate-900 font-bold text-sm mb-3">Breakdown by Gate & Camera Point</Text>
        <View className="space-y-3">
          {[
            { name: 'Gate 1 (Main Entrance)', compliance: '91.2%', status: 'Active' },
            { name: 'Gate 2 (Dormitory Zone)', compliance: '82.4%', status: 'Active' },
            { name: 'Gate 3 (Faculty Complex)', compliance: '89.0%', status: 'Active' }
          ].map((gate, i) => (
            <View key={i} className="flex-row justify-between items-center pb-3 border-b border-slate-100">
              <View className="flex-1 pr-2">
                <Text className="text-slate-800 text-xs font-bold" numberOfLines={1}>{gate.name}</Text>
                <Text className="text-slate-400 text-[9px] mt-0.5">Camera AI-Cam 0{i + 1} • {gate.status}</Text>
              </View>
              <View className="items-end">
                <Text className="text-emerald-600 text-xs font-black">{gate.compliance}</Text>
                <Text className="text-slate-400 text-[8px]">Compliance</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
