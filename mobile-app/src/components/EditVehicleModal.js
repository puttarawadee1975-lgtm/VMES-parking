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
  Alert,
  Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { formatDisplayPlate } from '../utils/provinceHelper';
import ProvincePickerModal from './ProvincePickerModal';
import LicensePlateScannerModal from './LicensePlateScannerModal';

export default function EditVehicleModal({ visible, onClose, vehicle, onSave }) {
  const [vehicleType, setVehicleType] = useState('motorcycle'); // 'motorcycle' | 'car'
  const [plateNumber, setPlateNumber] = useState('');
  const [province, setProvince] = useState('');
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [color, setColor] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);

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

      // 2. Parse plate number and province e.g. "3KH 5678 Bangkok"
      const rawPlate = (vehicle.plate || '').trim();
      const parts = rawPlate.split(' ');
      if (parts.length >= 3) {
        setPlateNumber(parts.slice(0, parts.length - 1).join(' '));
        setProvince(parts[parts.length - 1]);
      } else if (parts.length === 2) {
        setPlateNumber(parts[0]);
        setProvince(parts[1]);
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

      // 4. Initial photos
      setFrontPhoto(vehicle.front_photo_url || vehicle.vehicle_photo_url || null);
      setSidePhoto(vehicle.side_photo_url || null);
    }
  }, [vehicle, visible]);

  const handlePickPhoto = async (type, useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.5,
          base64: true
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Media library permission is required to choose photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.5,
          base64: true
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Photo = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (type === 'front') {
          setFrontPhoto(base64Photo);
        } else {
          setSidePhoto(base64Photo);
        }
      }
    } catch (err) {
      console.error('Failed to pick photo:', err);
    }
  };

  const handleSave = () => {
    if (!plateNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your license plate number.');
      return;
    }

    if (/[a-zA-Z]/.test(plateNumber.trim())) {
      Alert.alert(
        'Thai Characters Required',
        'License plate prefix letters must be in Thai characters (e.g. 1กข 1234 or 3กฮ 5678).'
      );
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

    if (!frontPhoto) {
      Alert.alert(
        '📷 Front License Plate Required',
        vehicleType === 'car'
          ? 'For car registration, the front photo must clearly show the front license plate.'
          : 'Please provide Front photo of your vehicle.'
      );
      return;
    }

    if (!sidePhoto) {
      Alert.alert('📷 Side Photo Required', 'Please provide Side photo of your vehicle.');
      return;
    }

    const icon = vehicleType === 'car' ? '🚗' : '🛵';
    const newFullPlate = formatDisplayPlate(`${plateNumber.trim()} ${province}`);
    const newFullModel = `${icon} ${brand.trim()} ${modelName.trim()} (${color.trim()})`.trim();

    onSave(vehicle?.plate, newFullPlate, newFullModel, {
      vehicle_front_photo: frontPhoto,
      vehicle_side_photo: sidePhoto,
      vehicle_photo: frontPhoto
    });
    onClose();
  };

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
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
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Update your vehicle details</Text>
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
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                    placeholder="e.g. 1กข 1234 or 3กฮ 5678"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    style={{
                      flex: 1,
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: /[a-zA-Z]/.test(plateNumber) ? '#ef4444' : '#cbd5e1',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      color: '#0f172a',
                      fontSize: 14,
                      fontWeight: '700'
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (!vehicleType) setVehicleType('car');
                      setShowScannerModal(true);
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#2563eb',
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#2563eb',
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2
                    }}
                  >
                    <Ionicons name="camera" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>Scan license plate</Text>
                  </TouchableOpacity>
                </View>
                {/[a-zA-Z]/.test(plateNumber) && (
                  <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '700', marginTop: 4 }}>
                    ⚠️ License plate letters must be in Thai characters (e.g. 1กข 1234)
                  </Text>
                )}
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

              {/* Mandatory Vehicle Photos (Front & Side) */}
              <View style={{ gap: 14, marginTop: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>
                  Vehicle Photos (2 Photos Required) <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: -8, lineHeight: 16 }}>
                  Please provide Front and Side photos of your vehicle for Admin identity verification
                </Text>

                {/* Photo 1: Front Photo */}
                <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <Ionicons name="camera" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', flex: 1 }} numberOfLines={1}>
                        1. Front Photo (Front & Plate) <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                    </View>
                    {frontPhoto && (
                      <TouchableOpacity onPress={() => setFrontPhoto(null)} style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#fef2f2', borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' }}>
                        <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {vehicleType === 'car' && (
                    <View style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="alert-circle" size={15} color="#2563eb" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 11, color: '#1e40af', fontWeight: '700', flex: 1 }}>
                        Front car photo must clearly show the front license plate.
                      </Text>
                    </View>
                  )}

                  {frontPhoto ? (
                    <View style={{ height: 130, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative' }}>
                      <Image source={{ uri: frontPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <TouchableOpacity 
                        onPress={() => setFrontPhoto(null)}
                        style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(239, 68, 68, 0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>Remove</Text>
                      </TouchableOpacity>
                      <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>Front Photo Set</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handlePickPhoto('front', true)}
                        activeOpacity={0.8}
                        style={{ flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="camera-outline" size={16} color="#2563eb" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>Take Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handlePickPhoto('front', false)}
                        activeOpacity={0.8}
                        style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="image-outline" size={16} color="#475569" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Choose Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Photo 2: Side Photo */}
                <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <Ionicons name="car-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', flex: 1 }} numberOfLines={1}>
                        2. Side Photo (Side View) <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                    </View>
                    {sidePhoto && (
                      <TouchableOpacity onPress={() => setSidePhoto(null)} style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#fef2f2', borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' }}>
                        <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {sidePhoto ? (
                    <View style={{ height: 130, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative' }}>
                      <Image source={{ uri: sidePhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <TouchableOpacity 
                        onPress={() => setSidePhoto(null)}
                        style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(239, 68, 68, 0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>Remove</Text>
                      </TouchableOpacity>
                      <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>Side Photo Set</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handlePickPhoto('side', true)}
                        activeOpacity={0.8}
                        style={{ flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="camera-outline" size={16} color="#2563eb" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>Take Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handlePickPhoto('side', false)}
                        activeOpacity={0.8}
                        style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="image-outline" size={16} color="#475569" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Choose Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
                    justify: 'center',
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

        {/* License Plate Scanner Modal */}
        <LicensePlateScannerModal
          visible={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          vehicleType={vehicleType}
          onScanSuccess={(scannedPlate, scannedProvince) => {
            setPlateNumber(scannedPlate);
            setProvince(scannedProvince);
          }}
        />

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
