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

// Force exact device dimensions to guarantee layout
const { width, height } = Dimensions.get('window');

export default function QRScanScreen({
  onClose,
  onSaveSpot,
  insets
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedLock, setScannedLock] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedSpotData, setScannedSpotData] = useState(null);

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
      let spotData;
      try {
        spotData = JSON.parse(data);
        if (!spotData.building) throw new Error("Invalid format");
      } catch (e) {
        spotData = { building: "VMES Parking", pillar: String(data).substring(0, 15) };
      }
      setScannedSpotData(spotData);
    } catch (error) {
      Alert.alert(
        "❌ สแกนล้มเหลว",
        "ไม่สามารถอ่านข้อมูล QR Code ได้",
        [{ text: "ลองใหม่", onPress: () => setScannedLock(false) }]
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
        "กรุณาไปที่ตั้งค่า (Settings) เพื่อเปิดสิทธิ์ใช้งานกล้อง",
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "เปิดตั้งค่า", onPress: () => Linking.openSettings() }
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

      {/* FULL SCREEN CAMERA VIEW (FORCED DIMENSIONS) */}
      <View style={{ width, height, position: 'absolute', top: 0, left: 0 }}>
        <CameraView
          style={{ width: '100%', height: '100%' }}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
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
          <Text className="text-white font-bold text-sm tracking-wide">Scan QR Code</Text>
        </View>
        <TouchableOpacity onPress={() => setFlashOn(!flashOn)} className={`w-12 h-12 rounded-full items-center justify-center border ${flashOn ? 'bg-amber-500/90 border-amber-400' : 'bg-black/40 backdrop-blur-md border-white/20'}`}>
          <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM MOCK BUTTON */}
      <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, zIndex: 30 }} className="items-center px-6 pointer-events-auto">
        <TouchableOpacity onPress={() => handleBarcodeScanned('{"building":"VMES Parking","pillar":"A-01","floor":"1st Floor","zone":"Zone A"}')} className="bg-blue-600/90 backdrop-blur-md px-8 py-3.5 rounded-2xl border border-blue-400/30 shadow-lg shadow-blue-500/30 flex-row items-center">
          <Ionicons name="flask" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-sm">Mock Scan (Simulator)</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIRMATION MODAL */}
      {scannedSpotData && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.8)' }} className="items-center justify-center p-6">
          <View className="bg-white rounded-3xl w-full p-8 shadow-2xl">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="location" size={32} color="#3b82f6" />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">บันทึกที่จอดรถ</Text>
              <Text className="text-slate-500 text-center mt-2 text-sm leading-relaxed">
                คุณต้องการบันทึกข้อมูลการจอดรถที่จุดนี้ใช่หรือไม่?
              </Text>
            </View>

            <View className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
              <View className="flex-row justify-between items-start mb-3">
                <Text className="text-slate-500 font-medium text-sm mr-4 mt-0.5">โซน/อาคาร</Text>
                <Text className="text-slate-900 font-bold text-sm flex-shrink-1 text-right leading-relaxed">{scannedSpotData.building}</Text>
              </View>
              <View className="flex-row justify-between items-start">
                <Text className="text-slate-500 font-medium text-sm mr-4 mt-0.5">เสา/ช่องจอด</Text>
                <Text className="text-blue-600 font-bold text-lg flex-shrink-1 text-right">{scannedSpotData.pillar}</Text>
              </View>
            </View>

            <View className="flex-row space-x-4">
              <TouchableOpacity onPress={cancelSaveSpot} className="flex-1 bg-white py-4 rounded-xl items-center border border-slate-200">
                <Text className="text-slate-700 font-bold text-base">ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSaveSpot} className="flex-1 bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/30">
                <Text className="text-white font-bold text-base">บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
