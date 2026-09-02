import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen({
  currentUser,
  onLogout,
  websocketUrl = 'ws://192.168.1.100:8000/ws/detections',
  setWebsocketUrl = () => { },
  wsConnected = false,
  onTestWebSocket = () => { },
  confidenceHelmet = 50,
  setConfidenceHelmet = () => { },
  confidencePlate = 40,
  setConfidencePlate = () => { },
  audioAlertEnabled = true,
  setAudioAlertEnabled = () => { }
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isGuest = !currentUser || currentUser?.role === 'guest';
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const roleLabel = isAdmin ? 'Officer' : isStudent ? 'Student' : 'Guest';
  const avatarInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

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

              {currentUser?.studentId ? (
                <Text className="text-slate-400 text-[11px] mt-0.5">
                  {isAdmin ? 'Staff ID' : 'Student ID'}: {currentUser.studentId}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Outline Red Log Out Button at the very end */}
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
