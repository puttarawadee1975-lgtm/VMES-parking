import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getGateDetectionsHistory } from '../services/api';
import { formatDisplayPlate } from '../utils/provinceHelper';

export default function GateHistoryModal({
  visible,
  onClose,
  tripHistory = [],
  currentUser
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL', 'TRIPS', 'VIOLATIONS'
  const [liveHistory, setLiveHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedFilter('ALL');
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getGateDetectionsHistory();
      if (Array.isArray(data) && data.length > 0) {
        const transformed = data.map(item => {
          const isV = item.violation || false;
          const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
          const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const gateStr = String(item.gate_type || item.gate || '').toUpperCase();
          const isExit = item.camera_id === 2 || gateStr.includes('EXIT');
          const gateName = isExit ? 'Exit gate' : 'Entry gate';

          if (isV) {
            return {
              id: item.id,
              type: 'violation',
              title: 'No Helmet Detected',
              penalty: -10,
              details: `${item.matched_user || 'Unregistered'} entered campus without wearing a safety helmet.`,
              plate: item.license_plate,
              gate: gateName,
              time: `${dateStr}, ${timeStr}`,
              rawDate: dateObj
            };
          } else {
            const isParked = !item.exit_time || item.exit_time === 'N/A' || item.status === 'parked';
            return {
              id: item.id,
              type: 'trip',
              plate: item.license_plate,
              vehicleType: item.vehicle_type,
              date: dateStr,
              entryTime: timeStr,
              entryGate: 'Entry gate',
              exitTime: isParked ? 'Still On Campus' : (item.exit_time || 'Verified Pass'),
              exitGate: isParked ? 'Pending Exit' : 'Exit gate',
              status: isParked ? 'Parked' : 'Completed',
              helmet: item.vehicle_type === 'car' ? 'N/A' : (item.helmet_detected ? 'Pass (Worn)' : 'NO HELMET'),
              rawDate: dateObj
            };
          }
        });
        setLiveHistory(transformed);
      }
    } catch (err) {
      console.warn('[GateHistoryModal] Error fetching live history:', err);
    } finally {
      setLoading(false);
    }
  };

  const userPlates = (currentUser?.vehicles || []).map(v => v.plate);
  const isAdmin = currentUser?.role === 'admin';
  const primaryPlate = userPlates[0] || 'กข 3363 อำนาจเจริญ';

  const getFullDisplayPlate = (plateInput) => {
    if (!plateInput) return formatDisplayPlate(primaryPlate);
    
    // 1. Try matching with registered vehicles of current user
    if (currentUser?.vehicles && currentUser.vehicles.length > 0) {
      const match = currentUser.vehicles.find(v => {
        const registeredP = (v.plate || '').trim().toLowerCase();
        const inputP = plateInput.trim().toLowerCase();
        return registeredP.includes(inputP) || inputP.includes(registeredP.split(' ')[0]);
      });
      if (match && match.plate) {
        return formatDisplayPlate(match.plate);
      }
    }

    let formatted = formatDisplayPlate(plateInput);
    // 2. If plate has no province attached (no Thai characters in province part), append default Thai province
    const hasThaiChar = /[\u0E00-\u0E7F]/.test(formatted);
    if (!hasThaiChar) {
      formatted = `${formatted} กรุงเทพมหานคร`;
    }
    return formatted;
  };

  const defaultHistory = [
    {
      id: 'default-1',
      type: 'trip',
      plate: primaryPlate,
      vehicleType: 'car',
      date: 'Today',
      entryTime: '08:30 AM',
      entryGate: 'VMES Entry Gate',
      exitTime: 'Still On Campus',
      exitGate: 'Pending Exit',
      status: 'Parked',
      spot: 'Building MSM (Pillar B-04)',
      helmet: 'N/A',
      isToday: true
    },
    {
      id: 'default-motor-no-helmet',
      type: 'trip',
      plate: primaryPlate,
      vehicleType: 'motorcycle',
      date: 'Today',
      entryTime: '10:10 AM',
      entryGate: 'VMES Entry Gate',
      exitTime: 'Still On Campus',
      exitGate: 'Pending Exit',
      status: 'Parked',
      spot: 'Zone A (Motorcycle Lot)',
      helmet: 'NO HELMET',
      isToday: true
    },
    {
      id: 'default-2',
      type: 'trip',
      plate: primaryPlate,
      vehicleType: 'motorcycle',
      date: 'Yesterday',
      entryTime: '09:15 AM',
      entryGate: 'VMES Entry Gate',
      exitTime: '05:20 PM',
      exitGate: 'VMES Exit Gate',
      status: 'Completed',
      spot: 'Zone A (Motorcycle Lot)',
      helmet: 'Pass (Worn)',
      isToday: false
    },
    {
      id: 'default-3',
      type: 'violation',
      title: 'No Helmet Detected',
      penalty: -10,
      details: 'Vehicle entered campus without wearing a safety helmet.',
      plate: primaryPlate,
      gate: 'VMES Entry Gate',
      time: 'Today, 10:10 AM',
      isToday: true
    }
  ];

  const displayHistory = [...defaultHistory, ...liveHistory];

  const filteredItems = displayHistory.filter(item => {
    // 1. Filter by owner for violations: non-admin users only see violations for their registered vehicles
    if (item.type === 'violation' && !isAdmin) {
      if (userPlates.length > 0 && item.plate && !userPlates.includes(item.plate) && item.plate !== primaryPlate) {
        return false;
      }
    }

    // 2. Filter by category tab selection
    if (selectedFilter === 'TRIPS') return item.type === 'trip';
    if (selectedFilter === 'VIOLATIONS') return item.type === 'violation';
    return true;
  });

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Minimalist Top Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Gate History & Violations</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Original Category Filter Pills Bar */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'TRIPS', label: 'Entry & Exit' },
            { key: 'VIOLATIONS', label: 'Violations' },
          ].map(tab => {
            const isActive = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setSelectedFilter(tab.key)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isActive ? '#2563eb' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isActive ? '#2563eb' : '#e2e8f0'
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#ffffff' : '#64748b' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Clean Activity History List */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
            {filteredItems.length === 0 ? (
              <View style={{ paddingVertical: 50, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b', marginTop: 10 }}>No activity logs recorded yet</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Gate entries and violations will appear here</Text>
              </View>
            ) : (
              filteredItems.map((item, index) => {
                const isViolation = item.type === 'violation';

                if (isViolation) {
                  return (
                    <View
                      key={item.id || index}
                      style={{
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#fecaca',
                        borderRadius: 18,
                        padding: 16
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                            <Ionicons name="warning-outline" size={16} color="#ef4444" />
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#991b1b' }}>{item.title}</Text>
                        </View>
                        <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626' }}>{item.penalty} pts</Text>
                        </View>
                      </View>

                      <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 4 }}>
                        {item.details}
                      </Text>

                      {item.gate ? (
                        <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                          Entry Gate: <Text style={{ fontWeight: '600', color: '#334155' }}>{item.gate}</Text>
                        </Text>
                      ) : null}

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>
                          Plate: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{getFullDisplayPlate(item.plate)}</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>
                          {item.time}
                        </Text>
                      </View>
                    </View>
                  );
                }

                const isCar = item.vehicleType === 'car' || item.model?.includes('🚗') || item.plate?.includes('9AB');
                const isMotorcycle = !isCar;

                return (
                  <View
                    key={item.id || index}
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      borderRadius: 18,
                      padding: 16
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                          {isCar ? (
                            <Ionicons name="car-outline" size={18} color="#64748b" />
                          ) : (
                            <FontAwesome5 name="motorcycle" size={15} color="#64748b" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>{getFullDisplayPlate(item.plate)}</Text>
                            <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569' }}>
                                {isCar ? 'Automobile' : 'Motorcycle'}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.date || 'Today'}</Text>
                        </View>
                      </View>

                      {(() => {
                        const isParked = item.status === 'Parked' || item.exitTime === 'Still On Campus';
                        return (
                          <View style={{ backgroundColor: isParked ? '#fffbeb' : '#ecfdf5', borderWidth: 1, borderColor: isParked ? '#fde68a' : '#a7f3d0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: isParked ? '#d97706' : '#059669', textTransform: 'uppercase' }}>
                              {isParked ? 'PARKED' : (item.status || 'Completed')}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>

                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 8 }} />
                          <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: '700' }}>
                            Entry: <Text style={{ color: '#0f172a' }}>{item.entryTime}</Text>
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>{item.entryGate}</Text>
                      </View>

                      {isMotorcycle && item.helmet && (
                        <View style={{ marginLeft: 14 }}>
                          {item.helmet.toUpperCase().includes('NO HELMET') || item.helmet.includes('UNWORN') || item.helmet.includes('NO_HELMET') ? (
                            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                              Helmet Check: <Text style={{ color: '#dc2626', fontWeight: '800' }}>NO HELMET DETECTED</Text>
                            </Text>
                          ) : (
                            <Text style={{ fontSize: 11, color: '#0f172a', fontWeight: '700' }}>
                              Helmet Check: {item.helmet}
                            </Text>
                          )}
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginRight: 8 }} />
                          <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: '700' }}>
                            Exit: <Text style={{ color: '#0f172a' }}>{item.exitTime}</Text>
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>{item.exitGate}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
