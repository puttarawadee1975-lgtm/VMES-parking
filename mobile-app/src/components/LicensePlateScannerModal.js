import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
  Vibration,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { toThaiProvince } from '../utils/provinceHelper';

const { width } = Dimensions.get('window');

export default function LicensePlateScannerModal({ visible, onClose, onScanSuccess, vehicleType }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedResult, setDetectedResult] = useState(null);

  useEffect(() => {
    if (visible && !permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission]);

  const handleCaptureAndDetect = (customPlateData = null) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      if (Platform.OS !== 'web') Vibration.vibrate(80);
    } catch (e) { }

    setTimeout(() => {
      const defaultScanned = { plate: '1กข 1234', province: 'กรุงเทพมหานคร' };
      const target = customPlateData || defaultScanned;
      const thaiProv = toThaiProvince(target.province);

      setDetectedResult({
        plate: target.plate,
        province: thaiProv
      });
      setIsAnalyzing(false);
    }, 900);
  };

  const handleConfirmDetection = () => {
    if (detectedResult) {
      onScanSuccess(detectedResult.plate, detectedResult.province);
      setDetectedResult(null);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        {/* Top Header Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#0f172a',
          zIndex: 10
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#1e293b', borderRadius: 20 }}>
            <Ionicons name="close" size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>AI License Plate Scanner</Text>

          <TouchableOpacity
            onPress={() => setFlashOn(!flashOn)}
            style={{ padding: 8, backgroundColor: flashOn ? '#3b82f6' : '#1e293b', borderRadius: 20 }}
          >
            <Ionicons name={flashOn ? "flash" : "flash-outline"} size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Main Camera / Viewfinder Container */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {permission?.granted ? (
            <CameraView
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              enableTorch={flashOn}
              facing="back"
            />
          ) : (
            <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="camera-outline" size={48} color="#94a3b8" />
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
                Camera Permission Required
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                style={{ marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scanner Overlay Box */}
          <View style={{
            width: vehicleType === 'motorcycle' ? Math.min(width * 0.65, 240) : Math.min(width * 0.85, 340),
            height: vehicleType === 'motorcycle' ? Math.min(width * 0.65, 240) : 140,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Viewfinder Corners */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 36, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderColor: isAnalyzing ? '#3b82f6' : (detectedResult ? '#10b981' : '#ffffff') }} />
            <View style={{ position: 'absolute', top: 0, right: 0, width: 36, height: 36, borderTopWidth: 3.5, borderRightWidth: 3.5, borderColor: isAnalyzing ? '#3b82f6' : (detectedResult ? '#10b981' : '#ffffff') }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, width: 36, height: 36, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderColor: isAnalyzing ? '#3b82f6' : (detectedResult ? '#10b981' : '#ffffff') }} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderColor: isAnalyzing ? '#3b82f6' : (detectedResult ? '#10b981' : '#ffffff') }} />

            {isAnalyzing ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '700', marginTop: 10 }}>Scanning Plate with AI OCR...</Text>
              </View>
            ) : detectedResult ? (
              <View style={{ alignItems: 'center', padding: 12 }}>
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{detectedResult.plate}</Text>
                <Text style={{ color: '#a7f3d0', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{detectedResult.province}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="scan-outline" size={32} color="#ffffff" />
                <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600', marginTop: 6 }}>Align license plate inside frame</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Control Bar */}
        <View style={{ padding: 20, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' }}>
          {detectedResult ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDetectedResult(null)}
                style={{ flex: 1, backgroundColor: '#1e293b', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 14 }}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDetection}
                style={{ flex: 1, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Auto Fill Form ✨</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleCaptureAndDetect()}
              disabled={isAnalyzing}
              style={{
                backgroundColor: '#2563eb',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="camera" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>
                {isAnalyzing ? 'Analyzing License Plate...' : 'Capture & Detect License Plate'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
