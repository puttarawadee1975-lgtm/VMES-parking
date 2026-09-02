import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParkingLocationCard from '../components/ParkingLocationCard';

export default function StudentHomeScreen({
  currentUser,
  kpiAvailable,
  kpiOccupied,
  parkedSpot,
  onOpenQRScanner,
  onExitBuilding,
  activeSimVeh,
  triggerScan
}) {
  const isGuest = currentUser?.role === 'guest';
  const hasHelmet = activeSimVeh ? activeSimVeh.helmet === 'HELMET' : true;
  const plateText = isGuest
    ? 'XXXX-XXXX (Guest)'
    : (currentUser?.vehicles?.[0]?.plate || activeSimVeh?.plateShort || '1AB 8924 BKK');

  return (
    <View className="space-y-4">
      {/* Title */}
      <View className="mb-1">
        <Text className="text-xl font-bold text-slate-900">Parking Availability Monitor</Text>
        <Text className="text-slate-500 text-xs mt-0.5">
          Real-time motorcycle parking occupancy & density tracking
        </Text>
      </View>

      {/* 1. Available Slots & Occupied KPI Cards */}
      <View className="flex-row space-x-3 mb-2">
        <View className="flex-1 bg-white border border-slate-200 py-6 px-4 sm:py-7 sm:px-5 rounded-3xl items-center justify-center shadow-sm min-h-[140px]">
          <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-2">
            <Ionicons name="checkmark-circle" size={26} color="#059669" />
          </View>
          <Text className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 text-center">
            Available Slots
          </Text>
          <Text className="text-3xl sm:text-4xl font-black text-emerald-600">{kpiAvailable}</Text>
        </View>

        <View className="flex-1 bg-white border border-slate-200 py-6 px-4 sm:py-7 sm:px-5 rounded-3xl items-center justify-center shadow-sm min-h-[140px]">
          <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-2">
            <Ionicons name="bicycle" size={26} color="#2563eb" />
          </View>
          <Text className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 text-center">
            Occupied
          </Text>
          <Text className="text-3xl sm:text-4xl font-black text-blue-600">{kpiOccupied}</Text>
        </View>
      </View>

      {/* 2. Where did you park? (Parking Location QR Card) */}
      <ParkingLocationCard
        parkedSpot={parkedSpot}
        onOpenQRScanner={onOpenQRScanner}
        onExitBuilding={onExitBuilding}
      />

      {/* 3. Gate Helmet Detection Check */}
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3.5 mb-2">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1 mr-2">
            <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 border ${
              hasHelmet ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'
            }`}>
              <Ionicons
                name={hasHelmet ? 'shield-checkmark' : 'alert-circle'}
                size={22}
                color={hasHelmet ? '#059669' : '#dc2626'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-sm">Gate Helmet Detection</Text>
              <Text className="text-slate-500 text-[11px]">Real-time helmet scan at campus entrance</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View className={`px-3 py-1.5 rounded-full border flex-row items-center ${
            hasHelmet ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
          }`}>
            <View className={`w-2 h-2 rounded-full mr-1.5 ${hasHelmet ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <Text className={`text-[11px] font-black uppercase ${
              hasHelmet ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {hasHelmet ? 'Helmet On' : 'No Helmet (-2 Pts)'}
            </Text>
          </View>
        </View>

        {/* Details Grid */}
        <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
            <Text className="text-slate-500 text-xs font-semibold">Gate Location:</Text>
            <Text className="text-slate-900 font-bold text-xs">Gate 1 (Main Campus Entrance)</Text>
          </View>

          <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
            <Text className="text-slate-500 text-xs font-semibold">Detected Plate:</Text>
            <Text className="text-blue-600 font-black text-xs">{plateText}</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-slate-500 text-xs font-semibold">Helmet Check:</Text>
            <Text className={`font-bold text-xs ${hasHelmet ? 'text-emerald-600' : 'text-red-600'}`}>
              {hasHelmet ? '✓ Helmet On (Pass)' : '⚠️ No Helmet (-2 Points Deducted)'}
            </Text>
          </View>
        </View>

        {/* Safety Banner */}
        <View className={`rounded-2xl p-3 flex-row items-center border ${
          hasHelmet ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
        }`}>
          <Ionicons
            name={hasHelmet ? 'checkmark-circle' : 'warning'}
            size={18}
            color={hasHelmet ? '#059669' : '#dc2626'}
            style={{ marginRight: 8 }}
          />
          <Text className={`text-xs font-medium flex-1 ${hasHelmet ? 'text-emerald-800' : 'text-red-800'}`}>
            {hasHelmet
              ? 'Safety standards passed'
              : 'Warning: No helmet detected. 2 points have been deducted from your Driving Safety Score.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
