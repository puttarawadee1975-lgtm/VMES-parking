import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsModal({
  visible,
  onClose,
  audioAlertEnabled = true,
  setAudioAlertEnabled = () => {},
  confidenceHelmet = 50,
  setConfidenceHelmet = () => {},
  confidencePlate = 40,
  setConfidencePlate = () => {}
}) {
  const [pushNoti, setPushNoti] = useState(true);
  const [emailNoti, setEmailNoti] = useState(false);
  const [soundAlert, setSoundAlert] = useState(audioAlertEnabled);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="settings-sharp" size={20} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Setting</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* Section 1: Notification Preferences */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Notification Preferences
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>Push Notifications</Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Receive instant gate access and safety violation alerts</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                thumbColor={'#ffffff'}
                ios_backgroundColor="#cbd5e1"
                value={pushNoti}
                onValueChange={setPushNoti}
              />
            </View>
          </View>

          {/* Section 2: Language & Region */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            App Language
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 16, marginBottom: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="globe-outline" size={20} color="#2563eb" style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>Display Language</Text>
            </View>
            <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1d4ed8' }}>English (US)</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
