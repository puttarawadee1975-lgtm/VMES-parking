import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ProvincePickerModal from '../components/ProvincePickerModal';
import LicensePlateScannerModal from '../components/LicensePlateScannerModal';
import { formatDisplayPlate } from '../utils/provinceHelper';

export default function VehicleRegistrationOnboardingScreen({
  currentUser,
  onRegisterVehicle,
  onLogout,
  onSkipToGuest
}) {
  const [plateNumber, setPlateNumber] = useState('');
  const [province, setProvince] = useState('');
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [vehicleType, setVehicleType] = useState(null); // null | 'motorcycle' | 'car'
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickPhoto = async (target = 'front', useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera Permission Required', 'Camera permission is required to take a vehicle photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.6,
          base64: true
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Gallery Permission Required', 'Photo library permission is required to choose a vehicle photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.6,
          base64: true
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Photo = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (target === 'front') {
          setFrontPhoto(base64Photo);
        } else {
          setSidePhoto(base64Photo);
        }
      }
    } catch (err) {
      console.error('Failed to pick vehicle photo:', err);
    }
  };

  const handleFormSubmit = () => {
    if (!vehicleType) {
      Alert.alert('Required Field', 'Please select your vehicle type (Motorcycle or Car).');
      return;
    }

    if (!plateNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your license plate number.');
      return;
    }

    if (/[a-zA-Z]/.test(plateNumber.trim())) {
      Alert.alert(
        'หมวดอักษรป้ายทะเบียนต้องเป็นภาษาไทย',
        'ตัวอักษรบนป้ายทะเบียนต้องเป็นภาษาไทยเท่านั้น (เช่น 1กข 1234 หรือ 3กฮ 5678) กรุณาเปลี่ยนภาษาป้อนข้อมูลเป็นภาษาไทย'
      );
      return;
    }

    if (!province.trim()) {
      Alert.alert('Required Field', 'Please select your province / city.');
      return;
    }

    if (!brand.trim()) {
      Alert.alert('Required Field', 'Please enter your vehicle brand (e.g. Honda, Toyota).');
      return;
    }

    if (!model.trim()) {
      Alert.alert('Required Field', 'Please enter your vehicle model (e.g. Civic, PCX 160).');
      return;
    }

    if (!color.trim()) {
      Alert.alert('Required Field', 'Please enter your vehicle color (e.g. Black, White, Red).');
      return;
    }

    if (!frontPhoto) {
      Alert.alert(
        '📷 Front License Plate Required',
        vehicleType === 'car'
          ? 'สำหรับการลงทะเบียนรถยนต์ รูปด้านหน้าต้องถ่ายให้เห็นแผ่นป้ายทะเบียนหน้าอย่างชัดเจน'
          : 'Please take or choose a FRONT photo of your vehicle for Admin verification.'
      );
      return;
    }

    if (!sidePhoto) {
      Alert.alert('📷 Side Photo Required', 'Please take or choose a SIDE photo of your vehicle for Admin verification.');
      return;
    }

    setIsSubmitting(true);
    const fullPlate = formatDisplayPlate(`${plateNumber.trim()} ${province}`);
    const icon = vehicleType === 'car' ? '🚗' : '🛵';
    const fullModel = `${icon} ${brand.trim()} ${model.trim()} (${color.trim()})`.trim();

    const success = onRegisterVehicle(fullPlate, fullModel, {
      vehicle_front_photo: frontPhoto,
      vehicle_side_photo: sidePhoto,
      vehicle_photo: frontPhoto
    });
    setIsSubmitting(false);
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            maxWidth: 520,
            width: '100%',
            alignSelf: 'center'
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Bar with Logout */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="shield-checkmark" size={20} color="#2563eb" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>VMES Parking</Text>

            </View>

            <TouchableOpacity
              onPress={onLogout}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' }}
            >
              <Ionicons name="log-out-outline" size={16} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Banner */}
          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              shadowColor: '#0f172a',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 6 }}>
              Vehicle Registration Required
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 20 }}>
              Please register your vehicle to access campus parking services, gate recognition, and live spot availability.
            </Text>

            <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={16} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: '700' }}>
                Policy: 1 Registered Plate per Student Account
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              shadowColor: '#64748b',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              gap: 18
            }}
          >
            {/* Vehicle Type Segmented Control */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 }}>
                Vehicle Type <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setVehicleType('motorcycle')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: vehicleType === 'motorcycle' ? '#eff6ff' : '#f8fafc',
                    borderWidth: 2,
                    borderColor: vehicleType === 'motorcycle' ? '#2563eb' : '#e2e8f0'
                  }}
                >
                  <FontAwesome5 name="motorcycle" size={16} color={vehicleType === 'motorcycle' ? '#1d4ed8' : '#64748b'} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: vehicleType === 'motorcycle' ? '#1d4ed8' : '#64748b' }}>
                    Motorcycle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setVehicleType('car')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: vehicleType === 'car' ? '#eff6ff' : '#f8fafc',
                    borderWidth: 2,
                    borderColor: vehicleType === 'car' ? '#2563eb' : '#e2e8f0'
                  }}
                >
                  <Ionicons name="car-outline" size={18} color={vehicleType === 'car' ? '#1d4ed8' : '#64748b'} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: vehicleType === 'car' ? '#1d4ed8' : '#64748b' }}>
                    Car / Automobile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* License Plate Input */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                  License Plate Number <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!vehicleType) {
                      Alert.alert('Selection Required', 'Please select your vehicle type (Motorcycle or Car) first.');
                      return;
                    }
                    setShowScannerModal(true);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                >
                  <Ionicons name="camera-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>Scan Plate with Camera</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={plateNumber}
                onChangeText={setPlateNumber}
                placeholder="e.g. 1กข 1234 or 3กฮ 5678"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                style={{
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: /[a-zA-Z]/.test(plateNumber) ? '#ef4444' : '#cbd5e1',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#0f172a'
                }}
              />
              {/[a-zA-Z]/.test(plateNumber) && (
                <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '700', marginTop: 4 }}>
                  ⚠️ หมวดตัวอักษรป้ายทะเบียนต้องเป็นภาษาไทยเท่านั้น (เช่น 1กข 1234)
                </Text>
              )}
            </View>

            {/* Province Selection */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Province / City <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowProvinceModal(true)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: province ? '#0f172a' : '#94a3b8' }} numberOfLines={1}>
                    {province || 'Select Province / City'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Brand */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Brand <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder={
                  vehicleType === 'car'
                    ? "e.g. Toyota, Honda, Mazda"
                    : vehicleType === 'motorcycle'
                    ? "e.g. Honda, Yamaha, Vespa"
                    : "e.g. Toyota, Honda"
                }
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#0f172a'
                }}
              />
            </View>

            {/* Model */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Model <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder={
                  vehicleType === 'car'
                    ? "e.g. Camry, Civic, Mazda 3"
                    : vehicleType === 'motorcycle'
                    ? "e.g. PCX 160, Click 160, Grand Filano"
                    : "e.g. Civic, PCX 160"
                }
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#0f172a'
                }}
              />
            </View>

            {/* Color */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Color <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                value={color}
                onChangeText={setColor}
                placeholder="e.g. Black, White, Red, Blue, Silver"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#0f172a'
                }}
              />
            </View>

            {/* Mandatory Vehicle Photos (Front & Side) */}
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>
                Vehicle Photos (2 Photos Required) <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: -8, lineHeight: 16 }}>
                Please provide Front and Side photos of your vehicle for Admin identity verification
              </Text>

              {/* Photo 1: Front Photo */}
              <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="camera" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>
                      1. Front Photo (Vehicle Front & License Plate) <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                  </View>
                  {frontPhoto && (
                    <TouchableOpacity onPress={() => setFrontPhoto(null)}>
                      <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {vehicleType === 'car' && (
                  <View style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="alert-circle" size={15} color="#2563eb" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, color: '#1e40af', fontWeight: '700', flex: 1 }}>
                      รูปด้านหน้ารถยนต์ ต้องถ่ายให้เห็นแผ่นป้ายทะเบียนหน้าอย่างชัดเจน (Required)
                    </Text>
                  </View>
                )}

                {frontPhoto ? (
                  <View style={{ height: 130, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative' }}>
                    <Image source={{ uri: frontPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
              <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="car-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>
                      2. Side Photo (Vehicle Side View) <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                  </View>
                  {sidePhoto && (
                    <TouchableOpacity onPress={() => setSidePhoto(null)}>
                      <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {sidePhoto ? (
                  <View style={{ height: 130, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative' }}>
                    <Image source={{ uri: sidePhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleFormSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
              style={{
                backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>
                {isSubmitting ? 'Registering Vehicle...' : 'Save & Continue to App'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Province Picker Modal */}
      <ProvincePickerModal
        visible={showProvinceModal}
        onClose={() => setShowProvinceModal(false)}
        onSelect={(p) => setProvince(p.label || p.en || p)}
        selectedProvince={province}
      />

      <LicensePlateScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        vehicleType={vehicleType}
        onScanSuccess={(scannedPlate, scannedProvince) => {
          setPlateNumber(scannedPlate);
          if (scannedProvince) {
            setProvince(scannedProvince);
          }
        }}
      />
    </SafeAreaView>
  );
}
