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

  const baseScore = currentUser?.safetyScore || 95;
  const effectiveScore = hasHelmet ? baseScore : Math.max(0, baseScore - 2);

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

      {/* 4. Safety Score Highlight (for non-guest students) */}
      {!isGuest && (
        <View className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl mb-2 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center flex-1 pr-2">
              <Ionicons name="shield-checkmark" size={18} color={hasHelmet ? '#059669' : '#dc2626'} />
              <Text className="text-slate-800 font-bold text-sm ml-2" numberOfLines={1}>Driving Safety Score</Text>
            </View>
            <View className="flex-row items-center">
              {!hasHelmet && (
                <Text className="text-xs font-bold text-red-600 mr-2 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  -2 pts
                </Text>
              )}
              <Text className={`text-lg font-black ${effectiveScore >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {effectiveScore}/100
              </Text>
            </View>
          </View>
          <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <View
              className={`h-full rounded-full ${effectiveScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${effectiveScore}%` }}
            />
          </View>
          <Text className="text-slate-500 text-xs leading-relaxed">
            {hasHelmet
              ? 'You consistently wear a helmet during campus rides. Green Zone priority parking access granted.'
              : 'Penalty applied: 2 points deducted today due to riding without a helmet.'}
          </Text>
        </View>
      )}

      {/* 5. Campus Guidelines & Rules */}
      <View className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <View className="flex-row items-center">
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <Text className="text-slate-900 font-bold text-sm ml-2">Campus Parking Guidelines</Text>
        </View>
        <View className="space-y-2.5 pt-1">
          <View className="flex-row items-start">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2.5" />
            <Text className="text-slate-600 text-xs flex-1 leading-relaxed">
              <Text className="font-bold text-slate-800">Green Zone:</Text> Priority parking reserved for riders maintaining a Safety Score of 90+.
            </Text>
          </View>
          <View className="flex-row items-start">
            <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2.5" />
            <Text className="text-slate-600 text-xs flex-1 leading-relaxed">
              <Text className="font-bold text-slate-800">Smart Gate Scan:</Text> AI automatically detects license plate and helmet upon campus entry.
            </Text>
          </View>
          <View className="flex-row items-start">
            <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2.5" />
            <Text className="text-slate-600 text-xs flex-1 leading-relaxed">
              <Text className="font-bold text-slate-800">Safety Rule:</Text> Helmets are strictly required at all times inside university premises. 2 points will be deducted per violation.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
