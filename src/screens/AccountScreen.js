import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParkingDetailsModal from '../components/ParkingDetailsModal';
import NotificationsModal from '../components/NotificationsModal';
import SettingsModal from '../components/SettingsModal';
import GateHistoryModal from '../components/GateHistoryModal';
import MyVehiclesModal from '../components/MyVehiclesModal';
import DrivingScoreModal from '../components/DrivingScoreModal';

export default function AccountScreen({
  currentUser,
  parkedSpot,
  onOpenQRScanner,
  onLogout,
  websocketUrl = 'ws://168.120.248.53:8000/ws/detections',
  setWebsocketUrl = () => { },
  wsConnected = false,
  onTestWebSocket = () => { },
  confidenceHelmet = 50,
  setConfidenceHelmet = () => { },
  confidencePlate = 40,
  setConfidencePlate = () => { },
  audioAlertEnabled = true,
  setAudioAlertEnabled = () => { },
  onOpenNotifications,
  onOpenAddVehicleModal,
  onNavigateToMyVehicle
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGateHistoryModal, setShowGateHistoryModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMyVehiclesModal, setShowMyVehiclesModal] = useState(false);
  const [showDrivingScoreModal, setShowDrivingScoreModal] = useState(false);

  const isGuest = !currentUser || currentUser?.role === 'guest';
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const roleLabel = isAdmin ? 'Officer' : isStudent ? 'Student' : 'Guest';
  const avatarInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const rawId = currentUser?.studentId || (currentUser?.email ? currentUser.email.split('@')[0] : '');
  const digitsOnlyId = rawId ? rawId.replace(/\D/g, '') : null;
  const displayId = isAdmin ? (currentUser?.staffId || 'SEC-01') : (digitsOnlyId || (isStudent ? '65070042' : null));

  return (
    <View className="flex-col gap-4">
      {/* User Profile Card */}
      {isGuest ? (
        /* 1. Guest User: Show only "Guest User" without email/ID */
        <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4 border-2 bg-slate-100 border-slate-300">
              <Ionicons name="person" size={26} color="#64748b" />
            </View>

            <View className="flex-1 justify-center">
              <Text className="text-slate-900 font-bold text-base">Guest User</Text>
            </View>
          </View>
        </View>
      ) : (
        /* 2. Student or Officer/Admin: Show Name, Role Badge, Email, and ID */
        <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <View className="flex-row items-center">
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 border-2 ${isAdmin
                ? 'bg-amber-100 border-amber-500'
                : 'bg-blue-100 border-blue-600'
                }`}
            >
              <Text
                className={`font-black text-2xl ${isAdmin ? 'text-amber-700' : 'text-blue-700'
                  }`}
              >
                {avatarInitial}
              </Text>
            </View>

            <View className="flex-1 justify-center">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>
                  {currentUser?.name || 'User'}
                </Text>
                <View
                  className={`px-2.5 py-0.5 rounded-full ${isAdmin ? 'bg-amber-100' : 'bg-blue-100'
                    }`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase ${isAdmin ? 'text-amber-700' : 'text-blue-700'
                      }`}
                  >
                    {roleLabel}
                  </Text>
                </View>
              </View>

              {currentUser?.email ? (
                <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                  {currentUser.email}
                </Text>
              ) : null}

              {displayId ? (
                <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                  {isAdmin ? 'Staff ID' : 'Student ID'}: {displayId}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Overview Section */}
      {!isGuest && (
        <View className="mt-2 space-y-3">
          <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider px-2">Overview</Text>
          <View className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            
            <TouchableOpacity 
              onPress={() => setShowDrivingScoreModal(true)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                  <Ionicons name="speedometer-outline" size={20} color="#059669" />
                </View>
                <Text className="text-slate-700 font-semibold text-sm">Driving Score</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-emerald-600 font-bold mr-2">{currentUser?.safetyScore ?? currentUser?.driving_score ?? 100}/100</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowMyVehiclesModal(true)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="car-sport-outline" size={20} color="#2563eb" />
                </View>
                <Text className="text-slate-700 font-semibold text-sm">My Vehicles</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-slate-400 text-xs mr-2">{currentUser?.vehicles?.length || 0} Registered</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
            
          </View>
        </View>
      )}

      {/* My Activity Section */}
      {!isGuest && (
        <View className="mt-2 space-y-3">
          <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider px-2">My Activity</Text>
          <View className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            
            <TouchableOpacity
              onPress={() => setShowGateHistoryModal(true)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <Ionicons name="time-outline" size={20} color="#4f46e5" />
                </View>
                <Text className="text-slate-700 font-semibold text-sm">Gate History & Violations</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDetailsModal(true)}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between border-b border-slate-100 active:bg-slate-50"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                  <Ionicons name="location-outline" size={20} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-700 font-semibold text-sm">Saved Parking Spot</Text>
                  <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                    {parkedSpot ? `${parkedSpot.building} (${parkedSpot.pillar})` : 'Not saved yet • Click to view'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            {/* Notifications Row */}
            <TouchableOpacity
              onPress={onOpenNotifications}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="notifications-outline" size={20} color="#2563eb" />
                </View>
                <Text className="text-slate-700 font-semibold text-sm">Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            {/* Driving Score Detail Modal */}
            <DrivingScoreModal
              visible={showDrivingScoreModal}
              onClose={() => setShowDrivingScoreModal(false)}
              currentUser={currentUser}
            />

            {/* My Vehicles List Modal */}
            <MyVehiclesModal
              visible={showMyVehiclesModal}
              onClose={() => setShowMyVehiclesModal(false)}
              currentUser={currentUser}
              onOpenAddVehicle={() => {
                setShowMyVehiclesModal(false);
                if (onOpenAddVehicleModal) onOpenAddVehicleModal();
              }}
            />

            {/* Gate History & Violations Modal */}
            <GateHistoryModal
              visible={showGateHistoryModal}
              onClose={() => setShowGateHistoryModal(false)}
              currentUser={currentUser}
            />

            {/* Modal Detail Window */}
            <ParkingDetailsModal
              visible={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              parkedSpot={parkedSpot}
              onOpenQRScanner={onOpenQRScanner}
            />
            
          </View>
        </View>
      )}

      {/* App Settings Section */}
      <View className="mt-2 space-y-3">
        <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider px-2">App Settings</Text>
        <View className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          
          <TouchableOpacity
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4 active:bg-slate-50"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                <Ionicons name="settings-outline" size={20} color="#475569" />
              </View>
              <Text className="text-slate-700 font-semibold text-sm">Setting</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>

          {/* App Settings Modal */}
          <SettingsModal
            visible={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            audioAlertEnabled={audioAlertEnabled}
            setAudioAlertEnabled={setAudioAlertEnabled}
            confidenceHelmet={confidenceHelmet}
            setConfidenceHelmet={setConfidenceHelmet}
            confidencePlate={confidencePlate}
            setConfidencePlate={setConfidencePlate}
          />
          
        </View>
      </View>
      <View className="pt-2 pb-6">
        <TouchableOpacity
          onPress={() => setShowLogoutConfirm(true)}
          activeOpacity={0.8}
          className="bg-white border border-red-500 py-3.5 px-4 rounded-2xl flex-row items-center justify-center shadow-sm active:bg-red-50"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text className="text-red-600 font-bold text-sm">Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center px-4">
          <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 items-center">
            <View className="w-14 h-14 rounded-full bg-red-100 items-center justify-center mb-4">
              <Ionicons name="log-out-outline" size={28} color="#ef4444" />
            </View>

            <Text className="text-slate-900 font-bold text-lg text-center mb-2">
              Log Out of Account?
            </Text>
            <Text className="text-slate-500 text-xs text-center leading-relaxed mb-6">
              Are you sure you want to log out? You will need to sign in again to access your account.
            </Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowLogoutConfirm(false)}
                activeOpacity={0.8}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-slate-700 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                activeOpacity={0.8}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 items-center justify-center shadow-sm active:bg-red-700"
              >
                <Text className="text-white font-bold text-xs">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
