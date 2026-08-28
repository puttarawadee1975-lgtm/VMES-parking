import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav({ insets, activeTab, setActiveTab, isAdmin }) {
  return (
    <View
      style={{
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        paddingTop: 10
      }}
      className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 flex-row justify-around shadow-lg"
    >
      <TouchableOpacity onPress={() => setActiveTab('monitor')} className="items-center flex-1 py-1">
        <Ionicons name="home" size={22} color={activeTab === 'monitor' ? '#2563eb' : '#94a3b8'} />
        <Text className={`text-[10px] mt-1 ${activeTab === 'monitor' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>Home</Text>
      </TouchableOpacity>

      {isAdmin && (
        <TouchableOpacity onPress={() => setActiveTab('analytics')} className="items-center flex-1 py-1">
          <Ionicons name="bar-chart" size={22} color={activeTab === 'analytics' ? '#2563eb' : '#94a3b8'} />
          <Text className={`text-[10px] mt-1 ${activeTab === 'analytics' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>Analytics</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setActiveTab('my-vehicle')} className="items-center flex-1 py-1">
        <Ionicons name="card" size={22} color={activeTab === 'my-vehicle' ? '#2563eb' : '#94a3b8'} />
        <Text className={`text-[10px] mt-1 ${activeTab === 'my-vehicle' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
          {isAdmin ? 'Staff ID' : 'My Vehicle'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab('account')} className="items-center flex-1 py-1">
        <Ionicons name="person" size={22} color={activeTab === 'account' ? '#2563eb' : '#94a3b8'} />
        <Text className={`text-[10px] mt-1 ${activeTab === 'account' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>Account</Text>
      </TouchableOpacity>
    </View>
  );
}
