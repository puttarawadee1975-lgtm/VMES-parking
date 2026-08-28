import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ message, onClose, insets }) {
  if (!message) return null;

  return (
    <View
      style={{ top: insets.top + 10 }}
      className="absolute left-5 right-5 bg-slate-900 p-4 rounded-2xl flex-row items-center justify-between shadow-2xl z-50 max-w-md mx-auto"
    >
      <Text className="text-white text-xs font-bold flex-1 mr-2">{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close-circle" size={18} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
