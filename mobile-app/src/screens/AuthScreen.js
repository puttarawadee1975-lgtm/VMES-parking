import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen({
  onOpenMicrosoftModal,
  onSelectAccount,
  onGuestLogin,
  insets,
  screenWidth
}) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomEmailSubmit = () => {
    const email = customEmail.trim().toLowerCase();
    if (!email) return;
    setLoading(true);
    if (onSelectAccount) {
      onSelectAccount(email);
    }
    setShowAccountModal(false);
    setLoading(false);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: Math.min(28, screenWidth * 0.07)
      }}
      className="bg-slate-50 justify-center items-center"
    >
      <View className="items-center mb-8 max-w-sm mx-auto w-full">
        {/* Centered Large Emblem Logo without white background box */}
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 140, height: 155 }}
          resizeMode="contain"
          className="mb-4"
        />
        <Text className="text-4xl font-black text-slate-900 tracking-tight text-center">VMES Parking</Text>
        <Text className="text-blue-600 font-bold text-xs mt-1 uppercase tracking-wider text-center">
          VMES Building Campus Parking & Safety
        </Text>

        <Text className="text-slate-500 text-xs mt-2 text-center leading-relaxed px-2">
          Intelligent motorcycle parking management & automated safety monitoring system
        </Text>
      </View>

      <View className="space-y-3 max-w-sm mx-auto w-full">
        {/* Microsoft Sign In */}
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          className="flex-row bg-white border border-slate-200 p-4 rounded-2xl items-center justify-center shadow-sm active:opacity-80"
        >
          <Ionicons name="logo-microsoft" size={20} color="#f25022" />
          <Text className="text-slate-800 font-bold text-sm ml-3 text-center">Sign in with Microsoft (@au.edu)</Text>
        </TouchableOpacity>

        <View className="flex-row items-center my-3">
          <View className="flex-1 h-[1px] bg-slate-200" />
          <Text className="text-slate-400 mx-4 text-xs font-semibold uppercase">or</Text>
          <View className="flex-1 h-[1px] bg-slate-200" />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity
          onPress={onGuestLogin}
          className="bg-blue-600 p-4 rounded-2xl items-center justify-center shadow-md shadow-blue-500/25 active:opacity-90"
        >
          <Text className="text-white font-bold text-sm">Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      {/* Microsoft Account Selector Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="logo-microsoft" size={24} color="#f25022" className="mr-2" />
                <Text className="text-slate-900 font-bold text-lg ml-2">Microsoft Account Sign In</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 text-xs mb-4">
              Select a university account to sign in to VMES Parking:
            </Text>

            {/* Quick Demo Options */}
            <View className="space-y-3 mb-5">
              {/* Option 1: Faculty / Staff Account */}
              <TouchableOpacity
                onPress={() => {
                  if (onSelectAccount) onSelectAccount('faculty.staff@au.edu');
                  setShowAccountModal(false);
                }}
                className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center mr-3">
                    <Ionicons name="briefcase" size={20} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-purple-900 font-bold text-sm">Faculty / Staff Account</Text>
                    <Text className="text-purple-600 text-xs font-semibold">faculty.staff@au.edu</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9333ea" />
              </TouchableOpacity>

              {/* Option 2: Student Account */}
              <TouchableOpacity
                onPress={() => {
                  if (onSelectAccount) onSelectAccount('u6814509@au.edu');
                  setShowAccountModal(false);
                }}
                className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-3">
                    <Ionicons name="school" size={20} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-900 font-bold text-sm">Student Account (U6814509)</Text>
                    <Text className="text-blue-600 text-xs font-semibold">u6814509@au.edu</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#2563eb" />
              </TouchableOpacity>
            </View>

            {/* Manual Email Input */}
            <View className="border-t border-slate-200 pt-4">
              <Text className="text-slate-700 font-bold text-xs mb-2">Or enter custom @au.edu email:</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  placeholder="e.g. john.d@au.edu"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-semibold"
                />
                <TouchableOpacity
                  onPress={handleCustomEmailSubmit}
                  disabled={loading || !customEmail.trim()}
                  className={`px-4 py-2.5 rounded-xl justify-center items-center ${customEmail.trim() ? 'bg-slate-900' : 'bg-slate-300'}`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white font-bold text-xs">Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
