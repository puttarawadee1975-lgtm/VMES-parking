import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGateDetectionsHistory } from '../services/api';

export default function DrivingScoreModal({ visible, onClose, currentUser }) {
  const [liveHistory, setLiveHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadScoreHistory();
    }
  }, [visible]);

  const loadScoreHistory = async () => {
    setLoading(true);
    try {
      const data = await getGateDetectionsHistory();
      if (Array.isArray(data) && data.length > 0) {
        const transformed = data.map((item, idx) => {
          const isV = item.violation || false;
          const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
          const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
          
          if (isV) {
            return {
              id: item.id || idx,
              date: `${dateStr}, ${timeStr}`,
              type: 'violation',
              title: 'No Helmet Detected',
              points: '-10',
              gate: item.gate_type || 'Gate 1 (Main Entrance)'
            };
          } else {
            return {
              id: item.id || idx,
              date: `${dateStr}, ${timeStr}`,
              type: 'reward',
              title: item.vehicle_type === 'car' ? 'Car Gate Access (Approved)' : 'Safe Driving (Helmet Worn)',
              points: '+0',
              gate: item.gate_type || 'Gate 1 (Main Entrance)'
            };
          }
        });
        setLiveHistory(transformed);
      }
    } catch (e) {
      console.warn('[DrivingScoreModal] Error loading score history:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const score = currentUser?.safetyScore ?? currentUser?.driving_score ?? 100;
  const isPerfect = score === 100;
  const isGood = score >= 80 && score < 100;
  const isWarning = score < 80;

  let scoreColor = '#10b981'; // emerald-500
  let scoreBg = '#ecfdf5'; // emerald-50
  let scoreBorder = '#a7f3d0'; // emerald-200
  let statusText = 'Perfect';
  let statusDesc = 'Excellent adherence to campus safety rules.';

  if (isGood) {
    scoreColor = '#f59e0b'; // amber-500
    scoreBg = '#fffbeb'; // amber-50
    scoreBorder = '#fde68a'; // amber-200
    statusText = 'Good';
    statusDesc = 'Please pay more attention to safety regulations.';
  } else if (isWarning) {
    scoreColor = '#ef4444'; // red-500
    scoreBg = '#fef2f2'; // red-50
    scoreBorder = '#fecaca'; // red-200
    statusText = 'Warning';
    statusDesc = 'Your score is low. Further violations may result in restricted access.';
  }

  // Fallback History if offline
  const defaultHistory = [
    { id: 1, date: 'Today, 08:24 AM', type: 'violation', title: 'No Helmet Detected', points: '-10', gate: 'Gate 1 (Main Entrance)' },
    { id: 2, date: 'Yesterday, 09:15 AM', type: 'reward', title: 'Safe Driving (Helmet Worn)', points: '+0', gate: 'Gate 2 (East Gate)' }
  ];

  const history = liveHistory.length > 0 ? liveHistory : defaultHistory;

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0'
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Driving Safety Score</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' }}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          <View style={{ gap: 16, maxWidth: 540, width: '100%', alignSelf: 'center' }}>

            {/* Score Display Card */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              shadowColor: '#64748b',
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 2
            }}>
              <View style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: scoreBg,
                borderWidth: 4,
                borderColor: scoreBorder,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 48, fontWeight: '900', color: scoreColor }}>
                  {score}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: scoreColor, opacity: 0.8 }}>
                  / 100
                </Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>
                Status: {statusText}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 }}>
                {statusDesc}
              </Text>
            </View>

            {/* Policy Info */}
            <View style={{
              backgroundColor: '#eff6ff',
              borderWidth: 1,
              borderColor: '#bfdbfe',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row'
            }}>
              <Ionicons name="information-circle" size={20} color="#2563eb" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1d4ed8', marginBottom: 4 }}>
                  How is the score calculated?
                </Text>
                <Text style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 18 }}>
                  All users start with 100 points. Points are deducted for safety violations (e.g. -10 for not wearing a helmet). A consistently low score may restrict campus parking privileges.
                </Text>
              </View>
            </View>

            {/* History List */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 8, marginBottom: 12 }}>
                Recent Activity
              </Text>

              {history.map((item) => (
                <View key={item.id} style={{
                  flexDirection: 'row',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  marginBottom: 12,
                  alignItems: 'center'
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: item.type === 'violation' ? '#fef2f2' : '#ecfdf5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons 
                      name={item.type === 'violation' ? "warning" : "checkmark-circle"} 
                      size={20} 
                      color={item.type === 'violation' ? "#ef4444" : "#10b981"} 
                    />
                  </View>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{item.title}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.date} • {item.gate}</Text>
                    {item.type === 'violation' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Ionicons name="camera-outline" size={12} color="#ef4444" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '700' }}>📸 Evidence Captured & Logged</Text>
                      </View>
                    )}
                  </View>

                  <View style={{
                    backgroundColor: item.type === 'violation' ? '#fef2f2' : '#f8fafc',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: item.type === 'violation' ? '#fecaca' : '#e2e8f0'
                  }}>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '800', 
                      color: item.type === 'violation' ? '#ef4444' : '#64748b' 
                    }}>
                      {item.points}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
