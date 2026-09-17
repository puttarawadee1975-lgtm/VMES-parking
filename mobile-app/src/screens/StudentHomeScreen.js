import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParkingLocationCard from '../components/ParkingLocationCard';
import ParkingDetailsModal from '../components/ParkingDetailsModal';
import DrivingScoreModal from '../components/DrivingScoreModal';
import AnnouncementDetailModal from '../components/AnnouncementDetailModal';
import AllAnnouncementsModal from '../components/AllAnnouncementsModal';
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllAnnouncementsModal, setShowAllAnnouncementsModal] = useState(false);

  const isGuest = currentUser?.role === 'guest';
  const [parkingZones, setParkingZones] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParkingData = async () => {
    setLoading(true);
    const data = await getParkingStatus();

    if (data) {
      setParkingZones(data);
    }

    setLoading(false);
  };

  const fetchAnnouncements = async () => {
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

      // Sort announcements: High priority first, then date descending (newest first)
      filteredAnns.sort((a, b) => {
        const prioA = a.priority === 'high' ? 0 : 1;
        const prioB = b.priority === 'high' ? 0 : 1;
        if (prioA !== prioB) return prioA - prioB;

        const getTime = (item) => {
          if (item.created_at) {
            const t = new Date(item.created_at).getTime();
            if (!isNaN(t)) return t;
          }
          if (item.date) {
            const t = new Date(item.date).getTime();
            if (!isNaN(t)) return t;
            const match = String(item.date).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
            if (match) {
              const t2 = new Date(`${match[1]}-${match[2]}-${match[3]}`).getTime();
              if (!isNaN(t2)) return t2;
            }
          }
          const idMatch = String(item.id || '').match(/\d+/);
          return idMatch ? parseInt(idMatch[0], 10) : 0;
        };
        return getTime(b) - getTime(a);
      });

      setAnnouncements(filteredAnns);
    }
  };

  useEffect(() => {
    fetchParkingData();
    fetchAnnouncements();
    // Refresh every 30 seconds automatically
    const interval = setInterval(fetchParkingData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="space-y-4">
      {/* Title */}
      <View className="mb-4">
        <View className="mb-3 flex-row justify-between items-center">
          <View className="flex-1 mr-2">
            <Text className="text-xl font-bold text-slate-900">Parking Availability</Text>
            <Text className="text-slate-500 text-xs mt-0.5">
              Real-time space availability
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
            const carZones = parkingZones.filter(zone => zone.tag === 'Cars Only' || (zone.zone && (zone.zone.includes('Zone A') || zone.zone.includes('Zone C'))));
            const totalAvailable = carZones.reduce((sum, zone) => sum + (zone.available_slots || 0), 0);
            const totalSlots = carZones.reduce((sum, zone) => sum + (zone.total_slots || 0), 0);

            return (
              <View style={{ minHeight: 196 }} className="bg-white border border-slate-200 py-6 px-4 rounded-3xl relative shadow-sm items-center justify-center">
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
                  VMES Building
                </Text>

                {/* Huge Centered Number / Status */}
                <Text
                  style={{ fontSize: 72, lineHeight: 76 }}
                  className={`font-black tracking-tighter ${totalAvailable > 0 ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {totalAvailable > 0 ? totalAvailable : 'FULL'}
                </Text>

                {/* Subtext */}
                <Text className={`text-xs font-bold uppercase tracking-widest mt-2 ${totalAvailable > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalAvailable > 0 ? 'Available Spots' : 'No Spots Available'}
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

      {/* 3. Find My Parking (Parking Location QR Card) */}
      <View className="mt-2">
        <ParkingLocationCard
          parkedSpot={parkedSpot}
          onOpenQRScanner={onOpenQRScanner}
          onOpenDetails={() => setDetailsModalVisible(true)}
        />
      </View>

      {/* 4. Announcements Section */}
      <View className="mt-4 space-y-2">
        <View className="flex-row justify-between items-center px-1 mb-1">
          <Text className="text-xl font-bold text-slate-900">Announcement</Text>
          {announcements.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSelectedAnnouncement(null);
                setShowAllAnnouncementsModal(true);
              }}
              activeOpacity={0.6}
              className="flex-row items-center py-1 px-1"
            >
              <Text className="text-slate-500 text-xs font-semibold mr-0.5">See All</Text>
              <Ionicons name="chevron-forward" size={14} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">

          {announcements.length === 0 ? (
            <Text className="text-slate-400 text-xs py-4 text-center font-medium">No announcements available at this time</Text>
          ) : (
            <>
              {announcements.slice(0, 2).map((ann) => (
                <TouchableOpacity
                  key={ann.id}
                  onPress={() => {
                    setSelectedAnnouncement(ann);
                    setShowDetailModal(true);
                  }}
                  activeOpacity={0.75}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mt-2 active:bg-blue-50/50 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-slate-900 font-extrabold text-sm flex-1 mr-2" numberOfLines={1}>
                      {ann.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                  </View>

                  <Text className="text-slate-600 text-xs leading-relaxed" numberOfLines={2}>
                    {ann.content}
                  </Text>

                  <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-slate-200/50">
                    <Text className="text-slate-400 text-[10px] font-medium">{ann.date || 'Today'}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {announcements.length > 2 && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedAnnouncement(null);
                    setShowAllAnnouncementsModal(true);
                  }}
                  activeOpacity={0.7}
                  className="pt-2.5 items-center justify-center border-t border-slate-100/80 mt-1"
                >
                  <Text className="text-slate-500 font-semibold text-xs">
                    View All Announcements
                  </Text>
                </TouchableOpacity>
              )}
            </>
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

      {/* Direct Pop-up Announcement Detail Modal */}
      <AnnouncementDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        announcement={selectedAnnouncement}
      />

      {/* All Announcements Modal (Handles List view & Detail view) */}
      <AllAnnouncementsModal
        visible={showAllAnnouncementsModal}
        onClose={() => {
          setShowAllAnnouncementsModal(false);
          setSelectedAnnouncement(null);
        }}
        announcements={announcements}
        initialAnnouncement={selectedAnnouncement}
      />
    </View>
  );
}
