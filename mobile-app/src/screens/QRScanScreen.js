import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Vibration,
  Platform,
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getEnglishFormattedDate, getEnglishFormattedTime, PRESET_ZONES } from '../data/mockData';

// Force exact device dimensions to guarantee layout
const { width, height } = Dimensions.get('window');

export default function QRScanScreen({
  onClose,
  onSaveSpot,
  currentSpot,
  insets
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedLock, setScannedLock] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedSpotData, setScannedSpotData] = useState(null);
  const [selectedMockZone, setSelectedMockZone] = useState(0);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        setScannedLock(false);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const handleBarcodeScanned = async (result) => {
    if (scannedLock) return;
    setScannedLock(true);

    const data = typeof result === 'object' ? result.data : result;

    try {
      if (Platform.OS !== 'web') Vibration.vibrate(50);
    } catch (e) {}

    try {
      let spotData = null;
      const now = new Date();
      if (typeof data === 'string' && data.startsWith('{') && data.endsWith('}')) {
        try {
          spotData = JSON.parse(data);
        } catch (e) {}
      }

      if (!spotData) {
        const strData = String(data).toUpperCase();
        const foundPreset = PRESET_ZONES.find(p => 
          p.id.toUpperCase() === strData || 
          p.pillar.toUpperCase() === strData || 
          strData.includes(p.pillar.toUpperCase().replace('SPOT ', ''))
        );
        const defaultPreset = foundPreset || PRESET_ZONES[selectedMockZone] || PRESET_ZONES[0];
        spotData = {
          zone: defaultPreset.zone,
          building: defaultPreset.building,
          floor: defaultPreset.floor,
          pillar: defaultPreset.pillar,
          spot_id: defaultPreset.id,
          imageUrl: defaultPreset.imageUrl,
          imageUrls: defaultPreset.imageUrls,
          images: defaultPreset.images
        };
      }

      setScannedSpotData({
        zone: spotData.zone || "Zone A",
        building: spotData.building || "VMES Building",
        floor: spotData.floor || "Floor G",
        pillar: spotData.pillar || "Spot A-01",
        spot_id: spotData.spot_id || "VMES-G-ZONEA-A01",
        imageUrl: spotData.imageUrl,
        imageUrls: spotData.imageUrls,
        images: spotData.images,
        savedDate: getEnglishFormattedDate(now),
        savedTime: getEnglishFormattedTime(now),
        timestamp: now.getTime()
      });
    } catch (error) {
      Alert.alert(
        "Scan Error",
        "Could not read QR Code data",
        [{ text: "Try Again", onPress: () => setScannedLock(false) }]
      );
    }
  };

  const confirmSaveSpot = () => {
    if (onSaveSpot && scannedSpotData) {
      onSaveSpot(scannedSpotData);
    }
    onClose();
  };

  const cancelSaveSpot = () => {
    setScannedSpotData(null);
    setScannedLock(false);
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (!res.granted && !res.canAskAgain) {
       Alert.alert(
        "Camera Permission",
        "Please go to Settings to grant camera permission",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" />
        <View style={{ paddingTop: Math.max(insets?.top || 0, 48) }} className="px-5 flex-row justify-between items-center">
          <TouchableOpacity onPress={onClose} className="p-2 bg-white/10 rounded-full">
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View className="w-24 h-24 bg-blue-600/20 rounded-full items-center justify-center mb-8">
            <Ionicons name="camera" size={48} color="#3b82f6" />
          </View>
          <Text className="text-white font-bold text-2xl mb-4 text-center">Camera Access</Text>
          <Text className="text-slate-400 text-base text-center mb-10 leading-relaxed">
            Please allow camera access to scan QR codes for saving your parking spot.
          </Text>
          <TouchableOpacity onPress={handleRequestPermission} className="bg-blue-600 w-full py-4 rounded-xl items-center mb-4 shadow-lg shadow-blue-500/30">
            <Text className="text-white font-bold text-base">Allow Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <StatusBar barStyle="light-content" />

      {/* FULL SCREEN CAMERA VIEW */}
      <View style={{ width, height, position: 'absolute', top: 0, left: 0 }}>
        <CameraView
          style={{ width: '100%', height: '100%' }}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      </View>

      {/* SCANNER OVERLAY & L-CORNER MARKS */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: Math.min(width * 0.75, 290), height: Math.min(width * 0.75, 290), position: 'relative' }}>
          {/* Top-Left Corner L */}
          <View style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 36, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderColor: '#ffffff' }} />
          {/* Top-Right Corner L */}
          <View style={{ position: 'absolute', top: 0, right: 0, width: 36, height: 36, borderTopWidth: 3.5, borderRightWidth: 3.5, borderColor: '#ffffff' }} />
          {/* Bottom-Left Corner L */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 36, height: 36, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderColor: '#ffffff' }} />
          {/* Bottom-Right Corner L */}
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderColor: '#ffffff' }} />
        </View>
      </View>

      {/* TOP CONTROLS */}
      <View
        style={{ paddingTop: Math.max(insets?.top || 0, 48), zIndex: 20, position: 'absolute', top: 0, left: 0, right: 0 }}
        className="px-5 flex-row justify-between items-center"
      >
        <TouchableOpacity onPress={onClose} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full items-center justify-center border border-white/20">
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View className="bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20">
          <Text className="text-white font-bold text-sm tracking-wide">Scan Parking QR Code</Text>
        </View>
        <TouchableOpacity onPress={() => setFlashOn(!flashOn)} className={`w-12 h-12 rounded-full items-center justify-center border ${flashOn ? 'bg-amber-500/90 border-amber-400' : 'bg-black/40 backdrop-blur-md border-white/20'}`}>
          <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM INSTRUCTION */}
      <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, zIndex: 30 }} className="items-center px-6">
        <View className="bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex-row items-center">
          <Ionicons name="information-circle-outline" size={18} color="#38bdf8" style={{ marginRight: 8 }} />
          <Text className="text-white text-xs font-semibold">Align parking spot QR code inside the frame to scan</Text>
        </View>
      </View>

      {/* CONFIRMATION MODAL */}
      {scannedSpotData && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.85)' }} className="items-center justify-center p-6">
          <View className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <View className="items-center mb-4">
              <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-3">
                <Ionicons name="location" size={30} color="#2563eb" />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">
                {currentSpot ? 'Update Parking Spot' : 'Save Parking Spot'}
              </Text>
              {currentSpot && (
                <View className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2 w-full flex-row items-center">
                  <Ionicons name="refresh-circle" size={20} color="#d97706" style={{ marginRight: 6 }} />
                  <Text className="text-amber-800 text-xs font-semibold flex-1">
                    Existing spot detected. Saving will update to this new location.
                  </Text>
                </View>
              )}
            </View>

            <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200 space-y-2.5">
              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 font-medium text-xs">Zone</Text>
                <Text className="text-blue-600 font-bold text-sm">{scannedSpotData.zone}</Text>
              </View>
              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 font-medium text-xs">Floor</Text>
                <Text className="text-slate-900 font-bold text-sm">{scannedSpotData.floor}</Text>
              </View>
              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 font-medium text-xs">Spot</Text>
                <Text className="text-emerald-600 font-extrabold text-sm">
                  {(scannedSpotData.pillar || '').replace(/^Spot\s+/i, '').replace(/^Pillar\s+/i, '').trim()}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pb-2 border-b border-slate-200">
                <Text className="text-slate-500 font-medium text-xs">Building</Text>
                <Text className="text-slate-900 font-bold text-xs">{scannedSpotData.building}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 font-medium text-xs">Saved Date</Text>
                <Text className="text-slate-700 font-bold text-xs">{scannedSpotData.savedDate} ({scannedSpotData.savedTime})</Text>
              </View>
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity onPress={cancelSaveSpot} className="flex-1 bg-white py-3.5 rounded-xl items-center border border-slate-300">
                <Text className="text-slate-700 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSaveSpot} className="flex-1 bg-blue-600 py-3.5 rounded-xl items-center shadow-lg shadow-blue-500/30">
                <Text className="text-white font-bold text-sm">
                  {currentSpot ? 'Update Location' : 'Save Spot'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

