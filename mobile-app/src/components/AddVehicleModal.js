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
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toThaiProvince } from '../utils/provinceHelper';
import LicensePlateScannerModal from './LicensePlateScannerModal';
import ProvincePickerModal from './ProvincePickerModal';

export default function AddVehicleModal({ visible, onClose, onAdd, insets }) {
  const [vehicleType, setVehicleType] = useState(null); // null | 'motorcycle' | 'car'
  const [newPlate, setNewPlate] = useState('');
  const [newProvince, setNewProvince] = useState('Bangkok (กรุงเทพมหานคร)');
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);

  const handleSubmit = () => {
    if (!newPlate.trim() || !newProvince.trim() || !newBrand.trim() || !newModel.trim() || !newColor.trim()) {
      alert('Please fill in all required vehicle information fields.');
      return;
    }

    // License Plate Format Regex (Supports standard formats e.g. 1AB 1234, 3CD 5678, 99-9999)
    const plateRegex = /^([0-9]{1,2}[\u0E00-\u0E7Fa-zA-Z]{1,2}\s?[0-9]{1,4}|[\u0E00-\u0E7Fa-zA-Z]{1,3}\s?[0-9]{1,4}|[0-9]{2}-[0-9]{4}|[\u0E00-\u0E7Fa-zA-Z0-9\s-]+)$/;
    if (!plateRegex.test(newPlate.trim())) {
      alert('Invalid License Plate Format.\nPlease enter a valid license plate (e.g. 1AB 1234, 3CD 5678).');
      return;
    }
    const icon = vehicleType === 'car' ? '🚗' : '🛵';
    const thaiProvince = toThaiProvince(newProvince.trim());
    const fullPlate = `${newPlate.trim().toUpperCase()} ${thaiProvince}`;
    const fullModel = `${icon} ${newBrand.trim()} ${newModel.trim()} (${newColor.trim()})`;

    const success = onAdd(fullPlate, fullModel);
    if (success !== false) {
      setNewPlate('');
      setNewProvince('');
      setNewBrand('');
      setNewModel('');
      setNewColor('');
      onClose();
    }
  };

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
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
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Register Vehicle</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' }}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          >
            <View style={{ gap: 16, maxWidth: 540, width: '100%', alignSelf: 'center' }}>

              {/* 1. Vehicle Type (Motorcycle / Car) - First */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
                  Vehicle Type <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setVehicleType('motorcycle')}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: vehicleType === 'motorcycle' ? '#2563eb' : '#e2e8f0',
                      backgroundColor: vehicleType === 'motorcycle' ? '#eff6ff' : '#ffffff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 8 }}>🛵</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: vehicleType === 'motorcycle' ? '#1d4ed8' : '#64748b' }}>
                      Motorcycle
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setVehicleType('car')}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: vehicleType === 'car' ? '#2563eb' : '#e2e8f0',
                      backgroundColor: vehicleType === 'car' ? '#eff6ff' : '#ffffff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 8 }}>🚗</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: vehicleType === 'car' ? '#1d4ed8' : '#64748b' }}>
                      Car
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. License Plate */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                    License Plate <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!vehicleType) {
                        alert('Please select vehicle type first.');
                        return;
                      }
                      setShowScannerModal(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderContent: '#bfdbfe', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                  >
                    <Ionicons name="camera-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>Scan with Camera</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={newPlate}
                  onChangeText={setNewPlate}
                  placeholder="e.g. 1AB 1234, 3CD 5678"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14,
                    fontWeight: '700'
                  }}
                />
              </View>

              {/* 3. Province */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  Province / City <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowProvinceModal(true)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Text style={{ color: newProvince ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={1}>
                    {newProvince || 'Select Province / City'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* 4. Brand */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  Brand <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={newBrand}
                  onChangeText={setNewBrand}
                  placeholder={vehicleType === 'car' ? "e.g. Toyota, Honda, Mazda" : "e.g. Honda, Yamaha, Vespa"}
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14
                  }}
                />
              </View>

              {/* 5. Model */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  Model <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={newModel}
                  onChangeText={setNewModel}
                  placeholder={vehicleType === 'car' ? "e.g. Camry, Civic" : "e.g. Click 160, Wave 125i"}
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14
                  }}
                />
              </View>

              {/* 6. Color */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  Color <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={newColor}
                  onChangeText={setNewColor}
                  placeholder="e.g. White, Black, Matte Gray"
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14
                  }}
                />
              </View>

              {/* Rule Policy note */}
              <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="information-circle" size={18} color="#2563eb" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 11, color: '#1d4ed8', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                  Policy: 1 license plate can only be registered to 1 university account.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, paddingTop: 12 }}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  style={{ flex: 1, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 16, alignItems: 'center', shadowColor: '#2563eb', shadowOpacity: 0.25, shadowRadius: 8, elevation: 2 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>Register Vehicle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LicensePlateScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        vehicleType={vehicleType}
        onScanSuccess={(scannedPlate, scannedProvince) => {
          setNewPlate(scannedPlate);
          setNewProvince(scannedProvince);
        }}
      />

      <ProvincePickerModal
        visible={showProvinceModal}
        onClose={() => setShowProvinceModal(false)}
        onSelect={(prov) => setNewProvince(prov)}
        selectedProvince={newProvince}
      />
    </Modal>
  );
}

