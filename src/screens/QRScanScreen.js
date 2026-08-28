import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  StyleSheet,
  Vibration,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QRScanScreen({
  onClose,
  onSaveSpot,
  insets
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedSpot, setScannedSpot] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Automatically request camera permission immediately on mount
  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        try {
          await requestPermission();
        } catch (e) {
          console.log('Error requesting camera permission:', e);
        }
      }
    })();
  }, []);

  // Scan laser line animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;
    if (!scannedSpot) {
      scanLineAnim.setValue(0);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true
          })
        ])
      );
      animation.start();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [scannedSpot]);

  // Real Camera Barcode Detection Event
  const handleBarcodeScanned = (result) => {
    if (scannedLock || scannedSpot) return;
    setScannedLock(true);

    const data = typeof result === 'object' ? result.data : result;

    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(100);
      }
    } catch (e) {
      // Ignore vibration error
    }

    // Parse scanned QR code data
    let parsedSpot = null;
    try {
      if (data && typeof data === 'string' && data.startsWith('{') && data.endsWith('}')) {
        parsedSpot = JSON.parse(data);
      }
    } catch (err) {
      parsedSpot = null;
    }

    if (!parsedSpot) {
      const rawText = (typeof data === 'string' ? data : '').trim();
      parsedSpot = {
        id: `QR-${Date.now().toString().slice(-6)}`,
        building: rawText.includes('Building') ? rawText : 'Building CL (Cathedral of Learning)',
        floor: rawText.includes('Floor') ? rawText : 'Floor 2 (Zone B)',
        pillar: rawText.length <= 15 && rawText.length > 0 ? rawText : 'Pillar B-14',
        zone: 'Zone B (Smart Parking)',
        nearestExit: 'North Gate Ramp',
        rawData: rawText
      };
    }

    setScannedSpot(parsedSpot);
  };

  const handleConfirmSave = () => {
    if (!scannedSpot) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    onSaveSpot({
      ...scannedSpot,
      parkedAt: timeStr,
      timestamp: Date.now()
    });

    setScannedSpot(null);
    setScannedLock(false);
    onClose();
  };

  const handleRescan = () => {
    setScannedSpot(null);
    setScannedLock(false);
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240]
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 1. SCANNED RESULT: Confirmation details & Map */}
      {scannedSpot ? (
        <View style={{ flex: 1, backgroundColor: '#090d16' }}>
          {/* Top Bar */}
          <View
            style={{ paddingTop: Math.max(insets?.top || 0, 16) + 8 }}
            className="px-5 pb-4 flex-row justify-between items-center bg-slate-950 z-30 border-b border-slate-800"
          >
            <TouchableOpacity
              onPress={handleRescan}
              activeOpacity={0.7}
              className="flex-row items-center bg-slate-800/90 py-2 px-3.5 rounded-full border border-slate-700 active:bg-slate-700"
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-xs">Rescan</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-white font-bold text-sm">Confirm Parking Spot</Text>
              <Text className="text-slate-400 text-[10px]">Review details and save</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-full bg-slate-800/90 items-center justify-center border border-slate-700"
            >
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Details & Map */}
          <ScrollView
            className="flex-1 px-5 py-4"
            contentContainerStyle={{
              paddingBottom: Math.max(insets?.bottom || 0, 20) + 24,
              maxWidth: 600,
              width: '100%',
              alignSelf: 'center'
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Scanned Success Badge */}
            <View className="bg-emerald-500/15 border border-emerald-500/40 rounded-3xl p-4 flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center mr-3">
                <Ionicons name="checkmark" size={22} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-emerald-400 font-bold text-sm">QR Code Scanned!</Text>
                <Text className="text-emerald-300/80 text-xs mt-0.5">
                  Pillar detected successfully. Please tap save to confirm.
                </Text>
              </View>
            </View>

            {/* Parking Spot Details Card */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 space-y-3">
              <Text className="text-white font-bold text-sm mb-1">Detected Parking Location</Text>

              <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-800">
                <Text className="text-slate-400 text-xs font-semibold">Building:</Text>
                <Text className="text-white font-bold text-xs">{scannedSpot.building}</Text>
              </View>

              <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-800">
                <Text className="text-slate-400 text-xs font-semibold">Floor:</Text>
                <Text className="text-blue-400 font-bold text-xs">{scannedSpot.floor}</Text>
              </View>

              <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-800">
                <Text className="text-slate-400 text-xs font-semibold">Pillar / Slot:</Text>
                <Text className="text-emerald-400 font-black text-sm">{scannedSpot.pillar}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 text-xs font-semibold">Zone:</Text>
                <Text className="text-slate-200 font-bold text-xs">{scannedSpot.zone}</Text>
              </View>
            </View>

            {/* Surrounding Floor Map Graphic */}
            <View className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-5">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="map" size={18} color="#60a5fa" style={{ marginRight: 6 }} />
                  <Text className="text-white font-bold text-xs">Surrounding Floor Plan Map</Text>
                </View>
                <View className="bg-blue-900/60 border border-blue-500/40 px-2 py-0.5 rounded">
                  <Text className="text-blue-300 text-[10px] font-bold">{scannedSpot.floor}</Text>
                </View>
              </View>

              <View className="bg-slate-800/90 rounded-2xl h-44 border border-slate-700 relative items-center justify-center overflow-hidden">
                <View className="absolute inset-0 opacity-20 flex-row flex-wrap justify-between p-2">
                  {['A-01', 'A-02', 'B-13', 'B-14', 'B-15', 'C-01', 'C-02', 'D-10'].map((slot, i) => (
                    <View
                      key={i}
                      className={`w-[22%] h-8 rounded m-1 items-center justify-center border ${
                        slot === 'B-14' ? 'bg-blue-500/40 border-blue-400' : 'border-slate-500'
                      }`}
                    >
                      <Text className="text-slate-400 text-[8px] font-bold">{slot}</Text>
                    </View>
                  ))}
                </View>

                {/* Landmarks */}
                <View className="absolute top-2.5 left-2.5 bg-blue-950/90 border border-blue-500/50 px-2 py-1 rounded">
                  <Text className="text-blue-300 text-[8px] font-bold">🛗 Lift Lobby</Text>
                </View>
                <View className="absolute bottom-2.5 right-2.5 bg-emerald-950/90 border border-emerald-500/50 px-2 py-1 rounded">
                  <Text className="text-emerald-300 text-[8px] font-bold">🚪 Exit Ramp</Text>
                </View>

                {/* Marker */}
                <View className="items-center z-10">
                  <View className="w-12 h-12 rounded-full bg-blue-500/30 border-2 border-blue-400 items-center justify-center">
                    <Text className="text-2xl">🛵</Text>
                  </View>
                  <View className="bg-blue-600 px-2.5 py-0.5 rounded-full mt-1.5 shadow-md shadow-blue-500/40">
                    <Text className="text-white text-[10px] font-bold">You are here: {scannedSpot.pillar}</Text>
                  </View>
                </View>
              </View>

              <Text className="text-slate-400 text-[10px] text-center mt-2.5">
                Floor map layout around the parking pillar
              </Text>
            </View>

            {/* Action Buttons: User must press Save */}
            <View className="flex-row gap-3 pt-1">
              <TouchableOpacity
                onPress={handleRescan}
                activeOpacity={0.8}
                className="flex-1 py-4 px-4 rounded-2xl border border-slate-700 bg-slate-900 items-center justify-center active:bg-slate-800"
              >
                <Text className="text-slate-300 font-bold text-xs">Rescan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmSave}
                activeOpacity={0.85}
                className="flex-1 py-4 px-4 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30 active:bg-blue-700 flex-row"
              >
                <Ionicons name="bookmark" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text className="text-white font-bold text-xs">Save Parking Spot</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* 2. REAL LIVE CAMERA SCANNER VIEW (Full Screen Camera) */
        <View style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
          {/* Live Camera View Component */}
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={flashOn}
              barcodeScannerSettings={{
                barcodeTypes: ['qr']
              }}
              onBarcodeScanned={handleBarcodeScanned}
              onCameraReady={() => setCameraReady(true)}
            />
          ) : (
            <View style={StyleSheet.absoluteFillObject} className="bg-black items-center justify-center p-6 z-10">
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text className="text-white font-bold text-sm mt-4 text-center">
                Opening Camera...
              </Text>
              <Text className="text-slate-400 text-xs text-center mt-1 mb-5">
                Requesting camera access for QR code scanning
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                className="bg-blue-600 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-bold text-xs">Allow Camera Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Top Bar Floating Controls */}
          <View
            style={{ paddingTop: Math.max(insets?.top || 0, 16) + 8 }}
            className="px-5 pb-4 flex-row justify-between items-center bg-black/40 z-30"
          >
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-row items-center bg-black/60 py-2.5 px-4 rounded-full border border-white/20 active:bg-black/80"
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-xs">Back</Text>
            </TouchableOpacity>

            <View className="items-center bg-black/60 px-4 py-1.5 rounded-full border border-white/10">
              <Text className="text-white font-bold text-xs">Scan Pillar QR</Text>
            </View>

            <TouchableOpacity
              onPress={() => setFlashOn(!flashOn)}
              activeOpacity={0.7}
              className={`w-10 h-10 rounded-full items-center justify-center border ${
                flashOn ? 'bg-amber-500 border-amber-400' : 'bg-black/60 border-white/20'
              }`}
            >
              <Ionicons
                name={flashOn ? 'flash' : 'flash-outline'}
                size={18}
                color={flashOn ? '#ffffff' : '#e2e8f0'}
              />
            </TouchableOpacity>
          </View>

          {/* Center Target Box with Scanner Laser Frame */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none" className="items-center justify-center px-6">
            <View className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-blue-400/80 rounded-3xl items-center justify-center relative overflow-hidden shadow-2xl">
              {/* Corner Brackets */}
              <View className="absolute top-2 left-2 w-7 h-7 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <View className="absolute top-2 right-2 w-7 h-7 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <View className="absolute bottom-2 left-2 w-7 h-7 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <View className="absolute bottom-2 right-2 w-7 h-7 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

              {/* Animated Laser Scan Line */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  right: 10,
                  height: 3,
                  backgroundColor: '#38bdf8',
                  borderRadius: 2,
                  shadowColor: '#38bdf8',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                  transform: [{ translateY }]
                }}
              />
            </View>

            {/* Bottom Hint */}
            <View className="mt-8 bg-black/70 px-5 py-2.5 rounded-full border border-white/20">
              <Text className="text-white text-xs font-semibold text-center">
                Point camera at parking pillar QR code
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
