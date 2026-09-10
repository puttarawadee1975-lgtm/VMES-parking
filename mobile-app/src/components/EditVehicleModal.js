import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { formatDisplayPlate } from '../utils/provinceHelper';
import ProvincePickerModal from './ProvincePickerModal';

export default function EditVehicleModal({ visible, onClose, vehicle, onSave }) {
  const [vehicleType, setVehicleType] = useState('motorcycle'); // 'motorcycle' | 'car'
  const [plateNumber, setPlateNumber] = useState('');
  const [province, setProvince] = useState('');
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (vehicle) {
      // 1. Determine vehicle type
      const modelStr = vehicle.model || '';
      const isCarEmoji = modelStr.includes('🚗');
      const isMotorcycleEmoji = modelStr.includes('🛵') || modelStr.includes('🏍️');
      
      let isCar = false;
      if (isCarEmoji) {
        isCar = true;
      } else if (isMotorcycleEmoji) {
        isCar = false;
      } else {
        const lower = modelStr.toLowerCase();
        isCar = lower.includes('car') || lower.includes('civic') || lower.includes('camry') || lower.includes('mazda') || lower.includes('toyota') || lower.includes('benz') || lower.includes('bmw') || lower.includes('yaris') || lower.includes('accord');
      }
      setVehicleType(isCar ? 'car' : 'motorcycle');

      // 2. Parse plate number and province
      const rawPlate = (vehicle.plate || '').trim();
      const parts = rawPlate.split(' ');
      if (parts.length >= 2) {
        setPlateNumber(parts[0]);
        setProvince(parts.slice(1).join(' '));
      } else {
        setPlateNumber(rawPlate);
        setProvince('');
      }

      // 3. Parse brand, model, and color from vehicle.model e.g. "🛵 Honda PCX 160 (Black)"
      const cleanModelStr = (vehicle.model || '').replace(/^[🛵🏍️🚗?❓\s]+/, '').trim();
      
      // Extract color inside parentheses e.g. "(Black)"
      const colorMatch = cleanModelStr.match(/\(([^)]+)\)$/);
      let extractedColor = '';
      let modelWithoutColor = cleanModelStr;
      if (colorMatch) {
        extractedColor = colorMatch[1];
        modelWithoutColor = cleanModelStr.replace(/\s*\([^)]+\)$/, '').trim();
      }
      setColor(extractedColor);

      // Split brand and model
      const modelParts = modelWithoutColor.split(' ');
      if (modelParts.length >= 2) {
        setBrand(modelParts[0]);
        setModelName(modelParts.slice(1).join(' '));
      } else {
        setBrand(modelWithoutColor);
        setModelName('');
      }
    }
  }, [vehicle, visible]);

  const handleSave = () => {
    if (!plateNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your license plate number.');
      return;
    }

    if (!province.trim()) {
      Alert.alert('Required Field', 'Please select your province / city.');
      return;
    }

    if (!brand.trim()) {
      Alert.alert('Required Field', 'Please enter vehicle brand.');
      return;
    }

    if (!modelName.trim()) {
      Alert.alert('Required Field', 'Please enter vehicle model.');
      return;
    }

    if (!color.trim()) {
      Alert.alert('Required Field', 'Please enter vehicle color.');
      return;
    }

    const icon = vehicleType === 'car' ? '🚗' : '🛵';
    const newFullPlate = formatDisplayPlate(`${plateNumber.trim()} ${province}`);
    const newFullModel = `${icon} ${brand.trim()} ${modelName.trim()} (${color.trim()})`.trim();

    onSave(vehicle?.plate, newFullPlate, newFullModel);
    onClose();
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
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Edit Vehicle Information</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Update your vehicle details for smart gate access</Text>
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

              {/* 1. Vehicle Type (Motorcycle / Car) */}
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
                    <FontAwesome5 name="motorcycle" size={18} color={vehicleType === 'motorcycle' ? '#1d4ed8' : '#64748b'} style={{ marginRight: 8 }} />
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
                    <Ionicons name="car-outline" size={20} color={vehicleType === 'car' ? '#1d4ed8' : '#64748b'} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: vehicleType === 'car' ? '#1d4ed8' : '#64748b' }}>
                      Car
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. License Plate Number */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  License Plate Number <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  placeholder="e.g. 1กข 1234 or 3กฮ 5678"
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

              {/* 3. Province Selection */}
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
                  <Text style={{ color: province ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={1}>
                    {province || 'Select Province / City'}
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
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="e.g. Honda, Yamaha, Vespa, Toyota"
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14,
                    fontWeight: '600'
                  }}
                />
              </View>

              {/* 5. Model */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  Model <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={modelName}
                  onChangeText={setModelName}
                  placeholder="e.g. PCX 160, Click 160, Civic, Yaris"
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14,
                    fontWeight: '600'
                  }}
                />
              </View>

              {/* 6. Color */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                  Color <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={color}
                  onChangeText={setColor}
                  placeholder="e.g. Black, White, Red, Blue, Matte Gray"
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#0f172a',
                    fontSize: 14,
                    fontWeight: '600'
                  }}
                />
              </View>

              {/* Submit Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.85}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: '#2563eb',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#2563eb',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>Save Changes</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Province Picker Modal */}
        <ProvincePickerModal
          visible={showProvinceModal}
          onClose={() => setShowProvinceModal(false)}
          onSelect={(selected) => setProvince(selected)}
          selectedProvince={province}
        />
      </SafeAreaView>
    </Modal>
  );
}
