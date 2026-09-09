import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParkingLocationCard from '../components/ParkingLocationCard';
import ParkingDetailsModal from '../components/ParkingDetailsModal';
import DrivingScoreModal from '../components/DrivingScoreModal';
import { getParkingStatus, getAnnouncements } from '../services/api';

export default function StudentHomeScreen({
  currentUser,
  parkedSpot,
  onOpenQRScanner,
  onExitBuilding,
  onOpenNotifications
}) {
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
  const [showDrivingScoreModal, setShowDrivingScoreModal] = useState(false);

  const isGuest = currentUser?.role === 'guest';
  const hasPenalty = currentUser?.safetyScore !== null && currentUser?.safetyScore < 100;
  
  // Date calculation for daily violation banner expiration
  const todayDateObj = new Date();
  const todayDateString = todayDateObj.toDateString();
  const formattedTodayDate = todayDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  // Check if violation date matches today (defaults to today if date not specified)
  const violationDateObj = currentUser?.violationDate ? new Date(currentUser.violationDate) : new Date();
  const isViolationToday = violationDateObj.toDateString() === todayDateString;
  const violationDateDisplay = isViolationToday 
    ? `Today, ${formattedTodayDate}`
    : violationDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Safety violation banner only shows if student has penalty AND violation occurred TODAY
  const showViolationBanner = hasPenalty && !isGuest && isViolationToday;

  const [parkingZones, setParkingZones] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParkingData = async () => {
    setLoading(true);
    const data = await getParkingStatus();
    if (data) {
      setParkingZones(data);
    }
    const anns = await getAnnouncements();
    if (anns && Array.isArray(anns)) {
      const filteredAnns = anns.filter(ann => {
        if (!ann.target_audience || ann.target_audience === 'all') return true;
        if (ann.target_audience === 'all_students' && currentUser?.role === 'staff') return false;
        if (ann.target_audience === 'individual_student' || ann.target_audience === 'individual_staff') {
          const targetStr = (ann.target_user || '').toLowerCase().trim();
          const userEmail = (currentUser?.email || '').toLowerCase();
          const userName = (currentUser?.name || '').toLowerCase();
          const studentId = (currentUser?.studentId || '').toLowerCase();
          
          if (targetStr && !userEmail.includes(targetStr) && !userName.includes(targetStr) && !studentId.includes(targetStr)) {
            return false;
          }
        }
        return true;
      }).map(ann => ({
        ...ann,
        categoryLabel: ann.priority === 'high' ? 'HIGH PRIORITY' : 'NOTICE',
        badgeBg: ann.priority === 'high' ? '#fef2f2' : '#eff6ff',
        badgeColor: ann.priority === 'high' ? '#dc2626' : '#2563eb'
      }));
      setAnnouncements(filteredAnns);
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
      {/* Title */}
      <View className="mb-4">
        <View className="mb-3 flex-row justify-between items-center">
          <View className="flex-1 mr-2">
            <Text className="text-xl font-bold text-slate-900">Live Parking Status</Text>
            <Text className="text-slate-500 text-xs mt-0.5">
              Real-time space availability across all zones
            </Text>
          </View>
        </View>

        {/* 1. Single Total Available Parking Spots Card */}
        {loading && parkingZones.length === 0 ? (
          <View className="bg-white py-12 rounded-3xl items-center justify-center border border-slate-200">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-500 mt-3 text-sm">Fetching parking data...</Text>
          </View>
        ) : (
          (() => {
            const totalAvailable = parkingZones.reduce((sum, zone) => sum + (zone.available_slots || 0), 0);
            const totalSlots = parkingZones.reduce((sum, zone) => sum + (zone.total_slots || 0), 0);

            return (
              <View className="bg-white border border-slate-200 py-8 px-4 rounded-3xl relative shadow-sm items-center justify-center">
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
                  VEMS Building - Total Available
                </Text>
                
                {/* Huge Centered Number */}
                <Text 
                  style={{ fontSize: 72, lineHeight: 76 }} 
                  className={`font-black tracking-tighter ${totalAvailable > 0 ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {totalAvailable}
                </Text>
                
                {/* Subtext */}
                <Text className={`text-sm font-bold uppercase tracking-widest mt-2 ${totalAvailable > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalAvailable > 0 ? 'Total Spots Available' : 'Parking Full'}
                </Text>
                {totalSlots > 0 && (
                  <Text className="text-xs text-slate-400 font-medium mt-1">
                    Out of {totalSlots} total capacity
                  </Text>
                )}
              </View>
            );
          })()
        )}
      </View>

      {/* 2. Penalty Notification Banner (Only shows if safetyScore < 100 AND violation is from TODAY) */}
      {showViolationBanner && (
        <TouchableOpacity 
          onPress={() => setShowDrivingScoreModal(true)}
          activeOpacity={0.85}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm flex-row items-start mt-2"
        >
          <Ionicons name="warning" size={24} color="#dc2626" style={{ marginTop: 2, marginRight: 12 }} />
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-red-800 font-bold text-sm">
                Safety Violation Detected
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#dc2626" />
            </View>
            
            {/* Date Badge */}
            <View className="flex-row items-center mb-1.5 bg-red-100/80 self-start px-2 py-0.5 rounded-md border border-red-200">
              <Ionicons name="calendar-outline" size={12} color="#b91c1c" style={{ marginRight: 4 }} />
              <Text className="text-red-800 text-[11px] font-bold">
                Date: {violationDateDisplay}
              </Text>
            </View>

            <Text className="text-red-700 text-xs leading-relaxed">
              Your driving safety score is {currentUser.safetyScore}/100. Points were deducted due to a recent "No Helmet" detection. Click to view score details.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 3. Where did you park? (Parking Location QR Card) */}
      <View className="mt-2">
        <ParkingLocationCard
          parkedSpot={parkedSpot}
          onOpenQRScanner={onOpenQRScanner}
          onOpenDetails={() => setDetailsModalVisible(true)}
        />
      </View>

      {/* 4. Announcements Section */}
      <View className="mt-4 space-y-2">
        <Text className="text-xl font-bold text-slate-900 px-1">Announcement</Text>
        
        <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 items-center justify-center mr-2.5">
                <Ionicons name="megaphone" size={16} color="#d97706" />
              </View>
              <View>
                <Text className="text-slate-900 font-bold text-sm">Official Notices</Text>
                <Text className="text-slate-400 text-[10px]">Campus updates configured</Text>
              </View>
            </View>
          </View>

          {announcements.length === 0 ? (
            <Text className="text-slate-400 text-xs py-2 text-center">No announcements available</Text>
          ) : (
            announcements.map((ann) => (
              <View key={ann.id} className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1.5 mt-2">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-2">
                    {ann.categoryLabel && (
                      <View style={{ backgroundColor: ann.badgeBg || '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                        <Text style={{ color: ann.badgeColor || '#2563eb', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>
                          {ann.categoryLabel}
                        </Text>
                      </View>
                    )}
                    <Text className="text-slate-900 font-bold text-xs flex-1" numberOfLines={1}>
                      {ann.title}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-[10px]">{ann.date}</Text>
                </View>

                <Text className="text-slate-600 text-xs leading-relaxed mt-1">{ann.content}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Parking Details Modal */}
      <ParkingDetailsModal
        visible={isDetailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        parkedSpot={parkedSpot}
        onOpenQRScanner={onOpenQRScanner}
        onExitBuilding={() => {
          setDetailsModalVisible(false);
          if (onExitBuilding) onExitBuilding();
        }}
      />

      <DrivingScoreModal
        visible={showDrivingScoreModal}
        onClose={() => setShowDrivingScoreModal(false)}
        currentUser={currentUser}
      />
    </View>
  );
}
