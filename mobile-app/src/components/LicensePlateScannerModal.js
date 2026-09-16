import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
  Vibration,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { toThaiProvince } from '../utils/provinceHelper';
import { scanPlateImageAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = Math.min(SCREEN_WIDTH - 40, 340);
const FRAME_HEIGHT = 140;

export default function LicensePlateScannerModal({ visible, onClose, onScanSuccess, vehicleType }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (visible && !permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
    if (!visible) {
      setIsCapturing(false);
      setCapturedPhoto(null);
    }
  }, [visible, permission]);

  const handleTakePicture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      if (Platform.OS !== 'web') Vibration.vibrate(80);
    } catch (e) { }

    let base64Photo = null;
    let photoUri = null;

    try {
      if (cameraRef.current && Platform.OS !== 'web') {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          base64: true,
          skipProcessing: true
        });
        if (photo) {
          base64Photo = photo.base64;
          photoUri = photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri;
        }
      }
    } catch (err) {
      console.log('Camera capture exception:', err);
    }

    if (!photoUri) {
      photoUri = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="280" viewBox="0 0 600 280"><rect width="600" height="280" rx="20" fill="%230f172a"/><rect x="40" y="30" width="520" height="220" rx="16" fill="%23ffffff" stroke="%23000000" stroke-width="8"/><text x="300" y="130" font-family="sans-serif" font-weight="900" font-size="72" text-anchor="middle" fill="%230f172a">3กฮ 5678</text><text x="300" y="200" font-family="sans-serif" font-weight="700" font-size="32" text-anchor="middle" fill="%231e293b">กรุงเทพมหานคร</text></svg>';
    }

    // Freeze photo immediately on screen
    setCapturedPhoto(photoUri);

    let detectedPlate = '';
    let detectedProvince = 'Bangkok';

    if (base64Photo) {
      try {
        const res = await scanPlateImageAPI(base64Photo, vehicleType);
        if (res && res.plate) {
          detectedPlate = res.plate;
          detectedProvince = res.province || 'Bangkok';
        }
      } catch (ocrErr) {
        console.warn('Backend OCR call failed:', ocrErr);
      }
    }

    // If OCR returned a valid plate from the photo
    if (detectedPlate) {
      const thaiProv = toThaiProvince(detectedProvince);
      setTimeout(() => {
        onScanSuccess(detectedPlate, thaiProv);
        setCapturedPhoto(null);
        setIsCapturing(false);
        onClose();
      }, 400);
    } else {
      // OCR could not detect a valid plate
      setCapturedPhoto(null);
      setIsCapturing(false);
      Alert.alert(
        'Plate Scan Notice',
        'Could not clearly detect a license plate in the photo. Please align your plate inside the frame box and try again, or enter your plate details manually.',
        [{ text: 'OK' }]
      );
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: '#000000',
            zIndex: 20
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, backgroundColor: '#1e293b', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="close" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>
              License Plate Camera
            </Text>
          </View>

          {!capturedPhoto ? (
            <TouchableOpacity
              onPress={() => setFlashOn(!flashOn)}
              style={{ width: 40, height: 40, backgroundColor: flashOn ? '#f59e0b' : '#1e293b', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name={flashOn ? "flash" : "flash-outline"} size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
        </View>

        {/* Viewfinder / Frozen Photo Area */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#000000' }}>
          {capturedPhoto ? (
            <Image
              source={{ uri: capturedPhoto }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              resizeMode="cover"
            />
          ) : permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              enableTorch={flashOn}
              facing="back"
            />
          ) : (
            <View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="camera-outline" size={48} color="#64748b" />
              <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 12, fontWeight: '600' }}>
                Camera Viewfinder Ready
              </Text>
            </View>
          )}

          {/* Dynamic License Plate Frame Container */}
          <View
            style={{
              width: vehicleType === 'motorcycle' ? Math.min(SCREEN_WIDTH - 60, 230) : FRAME_WIDTH,
              height: vehicleType === 'motorcycle' ? 210 : FRAME_HEIGHT,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: isCapturing ? '#3b82f6' : '#ffffff',
              backgroundColor: 'transparent',
              position: 'relative',
              shadowColor: '#ffffff',
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8
            }}
          >
            {/* Corner Bracket Overlays */}
            <View style={{ position: 'absolute', top: -3, left: -3, width: 28, height: 28, borderTopWidth: 4, borderLeftWidth: 4, borderColor: isCapturing ? '#3b82f6' : '#ffffff', borderTopLeftRadius: 16 }} />
            <View style={{ position: 'absolute', top: -3, right: -3, width: 28, height: 28, borderTopWidth: 4, borderRightWidth: 4, borderColor: isCapturing ? '#3b82f6' : '#ffffff', borderTopRightRadius: 16 }} />
            <View style={{ position: 'absolute', bottom: -3, left: -3, width: 28, height: 28, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: isCapturing ? '#3b82f6' : '#ffffff', borderBottomLeftRadius: 16 }} />
            <View style={{ position: 'absolute', bottom: -3, right: -3, width: 28, height: 28, borderBottomWidth: 4, borderRightWidth: 4, borderColor: isCapturing ? '#3b82f6' : '#ffffff', borderBottomRightRadius: 16 }} />
          </View>

          {/* AI Scanning Status Badge on Freeze Frame */}
          {isCapturing && (
            <View style={{ position: 'absolute', bottom: 30, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3b82f6" style={{ marginRight: 8 }} />
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                Detecting License Plate with AI...
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Control Bar */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 24,
            backgroundColor: '#000000',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20
          }}
        >
          {/* Authentic iPhone Camera Shutter Button */}
          <TouchableOpacity
            onPress={handleTakePicture}
            disabled={isCapturing}
            activeOpacity={0.6}
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 4,
              borderColor: '#ffffff',
              padding: 3,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent'
            }}
          >
            {isCapturing ? (
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#ffffff', opacity: 0.8, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0f172a" />
              </View>
            ) : (
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#ffffff' }} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
