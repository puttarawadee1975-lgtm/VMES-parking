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

      {/* Account Selector / Custom Email Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-slate-900">⚡ เลือกทางลัดบัญชีเข้าใช้งาน</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-3 font-medium">
              เลือกบัญชี Demo หรือพิมพ์ Email มหาวิทยาลัยเพื่อทดสอบเข้าใช้งาน:
            </Text>

            {/* Account Option 1 */}
            <TouchableOpacity
              onPress={() => {
                if (onSelectAccount) onSelectAccount('65070042@student.university.ac.th');
                setShowAccountModal(false);
              }}
              className="bg-slate-50 border border-slate-200 p-3 rounded-2xl mb-2 flex-row items-center"
            >
              <View className="w-9 h-9 rounded-full bg-amber-100 justify-center items-center mr-3">
                <Ionicons name="person" size={18} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-slate-800">Student (Cherie A.)</Text>
                <Text className="text-xs text-slate-500">65070042@student.university.ac.th</Text>
              </View>
            </TouchableOpacity>

            {/* Account Option 2 */}
            <TouchableOpacity
              onPress={() => {
                if (onSelectAccount) onSelectAccount('u6814509@au.edu');
                setShowAccountModal(false);
              }}
              className="bg-slate-50 border border-slate-200 p-3 rounded-2xl mb-2 flex-row items-center"
            >
              <View className="w-9 h-9 rounded-full bg-blue-100 justify-center items-center mr-3">
                <Ionicons name="school" size={18} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-slate-800">Student (U6814509)</Text>
                <Text className="text-xs text-slate-500">u6814509@au.edu</Text>
              </View>
            </TouchableOpacity>

            {/* Account Option 3 */}
            <TouchableOpacity
              onPress={() => {
                if (onSelectAccount) onSelectAccount('faculty.staff@au.edu');
                setShowAccountModal(false);
              }}
              className="bg-slate-50 border border-slate-200 p-3 rounded-2xl mb-3 flex-row items-center"
            >
              <View className="w-9 h-9 rounded-full bg-indigo-100 justify-center items-center mr-3">
                <Ionicons name="briefcase" size={18} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-slate-800">Staff (Dr. Somchai)</Text>
                <Text className="text-xs text-slate-500">faculty.staff@au.edu</Text>
              </View>
            </TouchableOpacity>

            {/* Custom Email Input */}
            <View className="border-t border-slate-100 pt-3">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">กรอก Email อื่นๆ:</Text>
              <View className="flex-row space-x-2">
                <TextInput
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  placeholder="e.g. user@au.edu"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
                <TouchableOpacity
                  onPress={handleCustomEmailSubmit}
                  className="bg-blue-600 px-4 py-2.5 rounded-xl justify-center items-center"
                >
                  <Text className="text-white font-bold text-xs">เข้าสู่ระบบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
