import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen({
  onOpenMicrosoftModal,
  onGuestLogin,
  insets,
  screenWidth
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: Math.min(28, screenWidth * 0.07)
      }}
      className="bg-slate-50 justify-center"
    >
      <View className="items-center mb-8 max-w-sm mx-auto w-full">
        <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
          <Ionicons name="shield-checkmark" size={40} color="#fff" />
        </View>
        <Text className="text-3xl font-black text-slate-900 tracking-tight text-center">AU Parking</Text>
        <Text className="text-blue-600 font-bold text-xs mt-1 uppercase tracking-wider text-center">
          Smart Campus Parking & Safety
        </Text>
        <Text className="text-slate-500 text-xs mt-2 text-center leading-relaxed px-2">
          Intelligent motorcycle parking management & automated safety monitoring system
        </Text>
      </View>

      <View className="space-y-3 max-w-sm mx-auto w-full">
        {/* Microsoft Sign In */}
        <TouchableOpacity
          onPress={onOpenMicrosoftModal}
          className="flex-row bg-white border border-slate-200 p-4 rounded-2xl items-center justify-center shadow-sm active:opacity-80"
        >
          <Ionicons name="logo-microsoft" size={20} color="#f25022" />
          <Text className="text-slate-800 font-bold text-sm ml-3 text-center">Sign in with Microsoft</Text>
        </TouchableOpacity>

        <View className="flex-row items-center my-3">
          <View className="flex-1 h-[1px] bg-slate-200" />
          <Text className="text-slate-400 mx-4 text-xs font-semibold uppercase">or</Text>
          <View className="flex-1 h-[1px] bg-slate-200" />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity
          onPress={onGuestLogin}
          className="bg-blue-600 p-4 rounded-2xl items-center justify-center shadow-md shadow-blue-500/25 active:opacity-90"
        >
          <Text className="text-white font-bold text-sm">Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
