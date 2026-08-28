import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_ACCOUNTS } from '../data/mockData';

export default function MicrosoftModal({ visible, onClose, onLogin, insets }) {
  const [customEmail, setCustomEmail] = useState('');

  const handleCustomSubmit = () => {
    if (customEmail.trim()) {
      onLogin(customEmail);
      setCustomEmail('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <View
              style={{ paddingBottom: Math.max(insets.bottom + 12, 24) }}
              className="bg-white rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto w-full"
            >
              <View className="flex-row justify-between items-center mb-5">
                <View className="flex-1 pr-2">
                  <Text className="text-lg font-bold text-slate-900">Select Demo Account</Text>
                  <Text className="text-slate-500 text-xs mt-0.5">Choose a preset account to test role features</Text>
                </View>
                <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-slate-100">
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
                {Object.entries(DEMO_ACCOUNTS).map(([email, user]) => (
                  <TouchableOpacity
                    key={email}
                    onPress={() => onLogin(email)}
                    className="flex-row items-center p-3.5 bg-slate-50 rounded-2xl mb-2.5 border border-slate-200 active:bg-blue-50"
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${user.role === 'admin' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                      <Text className="text-white font-bold text-sm">{user.name.charAt(0)}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>{user.name}</Text>
                      <Text className="text-slate-500 text-[11px]" numberOfLines={1}>{email}</Text>
                    </View>
                    <Text className={`text-[10px] px-2 py-1 rounded-lg font-bold ml-1 ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'admin' ? 'Staff' : 'Student'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="border-t border-slate-100 pt-3.5 mt-1">
                <Text className="text-slate-600 text-xs font-semibold mb-2">Or enter custom student email:</Text>
                <View className="flex-row space-x-2">
                  <TextInput
                    value={customEmail}
                    onChangeText={setCustomEmail}
                    placeholder="your.name@student.university.ac.th"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      flex: 1,
                      backgroundColor: '#f8fafc',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#0f172a',
                      fontSize: 12
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleCustomSubmit}
                    className="bg-blue-600 px-4 rounded-xl justify-center shadow-sm"
                  >
                    <Text className="text-white font-bold text-xs">Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
