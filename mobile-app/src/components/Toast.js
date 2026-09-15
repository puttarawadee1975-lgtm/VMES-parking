import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ message, onClose, insets }) {
  if (!message) return null;

  const titleText = typeof message === 'object' ? (message.text || message.title || message.message || '') : String(message);
  const subText = typeof message === 'object' ? (message.subtext || message.body || '') : null;
  const isDanger = typeof message === 'object' && message.type === 'danger';
  const topPadding = (insets && typeof insets.top === 'number') ? insets.top : 40;

  return (
    <View
      style={{ top: topPadding + 10 }}
      className={`absolute left-5 right-5 p-4 rounded-2xl flex-row items-center justify-between shadow-2xl z-50 max-w-md mx-auto ${
        isDanger ? 'bg-red-600' : 'bg-slate-900'
      }`}
    >
      <View className="flex-1 mr-2">
        <Text className="text-white text-xs font-bold" numberOfLines={2}>
          {titleText}
        </Text>
        {subText ? (
          <Text className="text-white/80 text-[11px] font-medium mt-0.5" numberOfLines={2}>
            {subText}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
        <Ionicons name="close-circle" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
