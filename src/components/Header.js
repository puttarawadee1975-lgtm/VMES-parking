import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ insets, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 12) }}
      className="bg-white border-b border-slate-200 shadow-sm px-4 sm:px-5 pb-3.5"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-9 h-9 bg-blue-600 rounded-xl items-center justify-center mr-2.5 shadow-sm shadow-blue-500/30">
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <View>
            <Text className="text-slate-900 font-black text-base">AU Parking</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
              <Text className="text-emerald-600 text-[10px] font-bold">System Online</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="bg-slate-100 py-1.5 px-2.5 sm:px-3 rounded-full border border-slate-200 flex-row items-center max-w-[150px]">
            <View className={`w-5 h-5 rounded-full items-center justify-center mr-1.5 ${isAdmin ? 'bg-amber-500' : 'bg-blue-600'}`}>
              <Text className="text-white text-[10px] font-bold">{currentUser?.name?.charAt(0)}</Text>
            </View>
            <Text className="text-slate-800 text-xs font-semibold" numberOfLines={1}>{currentUser?.name}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
