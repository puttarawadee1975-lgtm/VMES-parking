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
      <View className="items-center mb-6 max-w-sm mx-auto w-full">
        {/* Centered Large Emblem Logo without white background box */}
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 130, height: 145 }}
          resizeMode="contain"
          className="mb-3"
        />
        <Text className="text-4xl font-black text-slate-900 tracking-tight text-center">VMES Parking</Text>
        <Text className="text-blue-600 font-bold text-xs mt-1 uppercase tracking-wider text-center">
          VMES Building Campus Parking
        </Text>
      </View>

      <View className="space-y-2.5 max-w-sm mx-auto w-full">
        {/* Microsoft Sign In */}
        <TouchableOpacity
          onPress={onOpenMicrosoftModal}
          className="flex-row bg-white border border-slate-200 p-3.5 rounded-2xl items-center justify-center shadow-sm active:opacity-80"
        >
          {/* Authentic Microsoft 4-Color Logo (Red, Green, Blue, Yellow) */}
          <View style={{ width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }}>
            <View style={{ width: 8.2, height: 8.2, backgroundColor: '#F25022' }} />
            <View style={{ width: 8.2, height: 8.2, backgroundColor: '#7FBA00' }} />
            <View style={{ width: 8.2, height: 8.2, backgroundColor: '#00A4EF' }} />
            <View style={{ width: 8.2, height: 8.2, backgroundColor: '#FFB900' }} />
          </View>
          <Text className="text-slate-800 font-bold text-sm ml-3 text-center">Sign in with Microsoft</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-1.5">
          <View className="flex-1 h-[1px] bg-slate-200" />
          <Text className="text-slate-300 mx-3 text-[10px] font-semibold uppercase">or</Text>
          <View className="flex-1 h-[1px] bg-slate-200" />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity
          onPress={onGuestLogin}
          className="bg-blue-600 p-3.5 rounded-2xl items-center justify-center shadow-md shadow-blue-500/25 active:opacity-90"
        >
          <Text className="text-white font-bold text-sm">Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
