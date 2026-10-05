import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { formatDisplayPlate } from '../utils/provinceHelper';
import EditVehicleModal from './EditVehicleModal';

export default function MyVehiclesModal({
  visible,
  onClose,
  currentUser,
  onOpenAddVehicle,
  onEditVehicle
}) {
  const [editingVehicle, setEditingVehicle] = useState(null);

  if (!visible) return null;

  const vehicles = currentUser?.vehicles || [];
  const isGuest = currentUser?.role === 'guest';

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: '#eff6ff',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Ionicons name="car-sport" size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>My Vehicles</Text>
              <Text style={{ fontSize: 11, color: '#64748b' }}>Registered campus vehicles & plates</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 8,
              backgroundColor: '#f1f5f9',
              borderRadius: 20
            }}
          >
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Guest Warning Banner */}
          {isGuest && (
            <View style={{
              backgroundColor: '#fffbebfb',
              borderWidth: 1,
              borderColor: '#fde68a',
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="alert-circle" size={20} color="#d97706" style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 12, color: '#b45309', flex: 1 }}>
                Guest Mode: Please sign in with your University account to manage your registered vehicles.
              </Text>
            </View>
          )}

          {/* Policy Banner */}
          <View style={{
            backgroundColor: '#eff6ff',
            borderWidth: 1,
            borderColor: '#bfdbfe',
            borderRadius: 16,
            padding: 14,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="information-circle" size={20} color="#2563eb" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 12, color: '#1e40af', flex: 1, lineHeight: 18 }}>
              Policy: Students can register 1 vehicle per account only. Click on any vehicle to edit details.
            </Text>
          </View>

          {/* Vehicle List */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
            Registered Vehicle ({vehicles.length}/1)
          </Text>

          {vehicles.length === 0 ? (
            <View style={{
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>
                No Registered Vehicles
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
                You haven't added any vehicles to your account yet.
              </Text>
              {!isGuest && (
                <TouchableOpacity
                  onPress={() => {
                    if (onOpenAddVehicle) onOpenAddVehicle();
                  }}
                  style={{
                    backgroundColor: '#2563eb',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 14
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                    + Register Vehicle
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            vehicles.map((v, i) => {
              const modelStr = (v.model || '').toLowerCase();
              const typeStr = (v.vehicle_type || v.vehicleType || '').toLowerCase();
              const isCar = typeStr === 'car' || typeStr === 'automobile' || modelStr.includes('🚗') || modelStr.includes('🚘') || /car|automobile|civic|accord|camry|altis|yaris|city|jazz|benz|bmw|toyota|nissan|mazda|sedan|suv|truck|fortuner|crv|hrv|byd|mg|tesla/i.test(modelStr);
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => setEditingVehicle(v)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 1
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: '#f1f5f9',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      {isCar ? (
                        <Ionicons name="car-outline" size={22} color="#64748b" />
                      ) : (
                        <FontAwesome5 name="motorcycle" size={18} color="#64748b" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{formatDisplayPlate(v.plate)}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {v.model?.replace(/^[🛵🏍️🚗?❓\s]+/, '') || 'Registered Vehicle'}
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#eff6ff',
                    borderColor: '#bfdbfe',
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10
                  }}>
                    <Ionicons name="create-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb' }}>
                      Edit
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <EditVehicleModal
          visible={Boolean(editingVehicle)}
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSave={(oldPlate, newFullPlate, newFullModel) => {
            if (onEditVehicle) {
              onEditVehicle(oldPlate, newFullPlate, newFullModel);
            }
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
