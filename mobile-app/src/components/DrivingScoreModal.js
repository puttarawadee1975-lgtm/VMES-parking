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
        const transformed = data
          .filter(item => item.violation)
          .map((item, idx) => {
            const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            
            return {
              id: item.id || idx,
              date: `${dateStr}, ${timeStr}`,
              type: 'violation',
              title: 'No Helmet Detected',
              points: '-10 pts',
              gate: item.gate_type === 'EXIT' ? 'VMES Exit Gate' : (item.gate_type || 'VMES Entry Gate')
            };
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

  const userHasDeduction = score < 100;

  const defaultHistory = userHasDeduction ? [
    { id: 'default-violation', date: 'Today, 10:10 AM', type: 'violation', title: 'No Helmet Detected', points: '-10 pts', gate: 'VMES Entry Gate' }
  ] : [];

  const history = liveHistory.length > 0 ? liveHistory : defaultHistory;

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="overFullScreen"
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

            {/* Short & Clean Safety Notice Banner */}
            <View style={{
              backgroundColor: '#eff6ff',
              borderWidth: 1,
              borderColor: '#bfdbfe',
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="shield-checkmark" size={22} color="#2563eb" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1d4ed8', marginBottom: 2 }}>
                  Helmet Safety Policy
                </Text>
                <Text style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 17 }}>
                  Please wear a helmet on campus. Riding without a helmet deducts <Text style={{ fontWeight: '700', color: '#dc2626' }}>10 points</Text>.
                </Text>
              </View>
            </View>

            {/* Penalty History List (Only Deductions) */}
            <View style={{ marginTop: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                  Penalty History
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>
                  {history.length} {history.length === 1 ? 'Violation' : 'Violations'}
                </Text>
              </View>

              {history.length === 0 ? (
                <View style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 18,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}>
                  <Ionicons name="checkmark-circle-outline" size={36} color="#10b981" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 8 }}>
                    Clean Driving Record
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    No safety score deductions recorded
                  </Text>
                </View>
              ) : (
                history.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      backgroundColor: '#ffffff',
                      padding: 14,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: '#fecaca',
                      marginBottom: 10,
                      alignItems: 'center'
                    }}
                  >
                    <View style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: '#fef2f2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name="warning-outline" size={20} color="#ef4444" />
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {item.date} • {item.gate}
                      </Text>
                    </View>

                    <View style={{
                      backgroundColor: '#fef2f2',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#fecaca'
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#dc2626' }}>
                        {item.points}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
