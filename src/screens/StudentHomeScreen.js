import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParkingLocationCard from '../components/ParkingLocationCard';
import ParkingDetailsModal from '../components/ParkingDetailsModal';
import { getParkingStatus } from '../services/api';

export default function StudentHomeScreen({
  currentUser,
  parkedSpot,
  onOpenQRScanner,
  onExitBuilding,
}) {
  const isGuest = currentUser?.role === 'guest';
  const hasPenalty = currentUser?.safetyScore !== null && currentUser?.safetyScore < 100;
  
  const [parkingZones, setParkingZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);

  const fetchParkingData = async () => {
    setLoading(true);
    const data = await getParkingStatus();
    if (data) {
      setParkingZones(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParkingData();
    // Optional: Refresh every 30 seconds automatically
    const interval = setInterval(fetchParkingData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="space-y-4">
      {/* Title & Refresh */}
      <View className="mb-4">
        <View className="mb-3">
          <Text className="text-xl font-bold text-slate-900">Live Parking Status</Text>
          <Text className="text-slate-500 text-xs mt-0.5">
            Real-time space availability across all zones
          </Text>
        </View>

        {/* 1. Dynamic Parking Zones */}
        {loading && parkingZones.length === 0 ? (
          <View className="bg-white py-12 rounded-3xl items-center justify-center border border-slate-200">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-500 mt-3 text-sm">Fetching parking data...</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {parkingZones.map((zone, index) => (
              <View key={index} className="bg-white border border-slate-200 py-6 px-4 rounded-3xl relative shadow-sm items-center justify-center">
                {/* Refresh Icon (Top Right of Card) */}
                <TouchableOpacity 
                  onPress={fetchParkingData} 
                  disabled={loading}
                  className="absolute top-4 right-4 bg-slate-50 p-2 rounded-full border border-slate-100"
                >
                  <Ionicons name="refresh" size={20} color={loading ? "#94a3b8" : "#3b82f6"} />
                </TouchableOpacity>
                
                {/* Title */}
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">
                  {zone.zone}
                </Text>
                
                {/* Huge Centered Number */}
                <Text 
                  style={{ fontSize: 72, lineHeight: 76 }} 
                  className={`font-black tracking-tighter ${zone.available_slots > 0 ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {zone.available_slots}
                </Text>
                
                {/* Subtext */}
                <Text className={`text-sm font-bold uppercase tracking-widest mt-2 ${zone.available_slots > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {zone.available_slots > 0 ? 'Spots Available' : 'Parking Full'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 2. Penalty Notification Banner (Only shows if safetyScore < 100) */}
      {hasPenalty && !isGuest && (
        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm flex-row items-start mt-2">
          <Ionicons name="warning" size={24} color="#dc2626" style={{ marginTop: 2, marginRight: 12 }} />
          <View className="flex-1">
            <Text className="text-red-800 font-bold text-sm mb-1">
              Safety Violation Detected
            </Text>
            <Text className="text-red-700 text-xs">
              Your driving safety score is {currentUser.safetyScore}/100. Points were deducted due to a recent "No Helmet" detection. Please wear a helmet when entering the campus!
            </Text>
          </View>
        </View>
      )}

      {/* 3. Where did you park? (Parking Location QR Card) */}
      <View className="mt-2">
        <ParkingLocationCard
          parkedSpot={parkedSpot}
          onOpenQRScanner={onOpenQRScanner}
          onOpenDetails={() => setDetailsModalVisible(true)}
        />
      </View>

      {/* Parking Details Modal */}
      <ParkingDetailsModal
        visible={isDetailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        parkedSpot={parkedSpot}
        onExitBuilding={() => {
          setDetailsModalVisible(false);
          if (onExitBuilding) onExitBuilding();
        }}
      />
    </View>
  );
}
