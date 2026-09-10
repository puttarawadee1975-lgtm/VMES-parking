import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getEnglishFormattedDate, getEnglishFormattedTime, PRESET_ZONES } from '../data/mockData';

// Predefined Zone QR presets (VMES Building, Floor G)
const PRESET_PILLARS = [
  {
    id: 'QR-VEMS-GA',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'G05-G09',
    zone: 'Zone A',
    nearestExit: 'Main Entrance Gate 1',
  },
  {
    id: 'QR-VEMS-GB',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'G06-G10',
    zone: 'Zone B',
    nearestExit: 'East Exit Walkway',
  },
  {
    id: 'QR-VEMS-GC',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'G11-G15',
    zone: 'Zone C',
    nearestExit: 'West Exit Ramp',
  }
];

export default function ParkingQRModal({
  visible,
  onClose,
  onSaveSpot,
  insets
}) {
  const [scannedSpot, setScannedSpot] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [activeQRImageIndex, setActiveQRImageIndex] = useState(0);

  const qrImageList = React.useMemo(() => {
    if (scannedSpot) {
      if (Array.isArray(scannedSpot.images) && scannedSpot.images.length > 0) {
        return scannedSpot.images;
      }
      if (Array.isArray(scannedSpot.imageUrls) && scannedSpot.imageUrls.length > 0) {
        return scannedSpot.imageUrls;
      }
      if (typeof scannedSpot.imageUrl === 'string' && scannedSpot.imageUrl.trim()) {
        const splitUrls = scannedSpot.imageUrl.split(',').map(url => url.trim()).filter(Boolean);
        if (splitUrls.length > 1) return splitUrls;
        if (splitUrls.length === 1) {
          return [
            splitUrls[0],
            'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'
          ];
        }
      }
      return [
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'
      ];
    }
    return [];
  }, [scannedSpot]);

  useEffect(() => {
    setActiveQRImageIndex(0);
  }, [scannedSpot]);

  const handlePrevQRImage = () => {
    setActiveQRImageIndex((prev) => (prev > 0 ? prev - 1 : qrImageList.length - 1));
  };

  const handleNextQRImage = () => {
    setActiveQRImageIndex((prev) => (prev < qrImageList.length - 1 ? prev + 1 : 0));
  };

  // Scan line laser animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;
    if (visible && !scannedSpot) {
      scanLineAnim.setValue(0);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true
          })
        ])
      );
      animation.start();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [visible, scannedSpot]);

  const handleTriggerScan = (overrideIndex) => {
    const idx = typeof overrideIndex === 'number' ? overrideIndex : selectedPresetIndex;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const preset = PRESET_PILLARS[idx] || PRESET_PILLARS[0];
      const now = new Date();
      setScannedSpot({
        ...preset,
        savedDate: getThaiFormattedDate(now),
        savedTime: getThaiFormattedTime(now),
        timestamp: now.getTime()
      });
    }, 600);
  };

  const handleConfirmSave = () => {
    if (!scannedSpot) return;
    const now = new Date();
    onSaveSpot({
      ...scannedSpot,
      savedDate: scannedSpot.savedDate || getThaiFormattedDate(now),
      savedTime: scannedSpot.savedTime || getThaiFormattedTime(now),
      timestamp: Date.now()
    });

    setScannedSpot(null);
    onClose();
  };

  const handleClose = () => {
    setScannedSpot(null);
    setIsScanning(false);
    onClose();
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200]
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={{ flex: 1 }} className="bg-slate-950">
        {/* Top Header Bar */}
        <View
          style={{ paddingTop: Math.max(insets?.top || 0, 16) + 8 }}
          className="px-5 pb-4 flex-row justify-between items-center bg-slate-950/90 z-20 border-b border-slate-800/80"
        >
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            className="flex-row items-center bg-slate-800/80 py-2 px-3.5 rounded-full border border-slate-700 active:bg-slate-700"
          >
            <Ionicons name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text className="text-white font-bold text-xs">Back</Text>
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-white font-bold text-sm">
              {scannedSpot ? 'Save Parking Location' : 'Scan Pillar QR Code'}
            </Text>
            <Text className="text-slate-400 text-[10px]">
              {scannedSpot ? 'Review and confirm spot' : 'Scan parking pillar QR code'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setFlashOn(!flashOn)}
            activeOpacity={0.7}
            className={`w-9 h-9 rounded-full items-center justify-center border ${
              flashOn ? 'bg-amber-500 border-amber-400' : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <Ionicons
              name={flashOn ? 'flash' : 'flash-outline'}
              size={18}
              color={flashOn ? '#ffffff' : '#94a3b8'}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        {scannedSpot ? (
          /* 1. SCANNED RESULT: Spot details + Surrounding Map Preview + User must click Save */
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
            {/* Scanned Badge */}
            <View className="bg-emerald-500/15 border border-emerald-500/40 rounded-3xl p-4 flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center mr-3">
                <Ionicons name="checkmark" size={22} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-emerald-400 font-bold text-sm">Pillar QR Code Scanned!</Text>
                <Text className="text-emerald-300/80 text-xs mt-0.5">
                  Pillar detected successfully. Tap below to save your spot.
                </Text>
              </View>
            </View>

            {/* Parking Spot Details Card */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 space-y-3">
              <Text className="text-white font-bold text-sm mb-1">Detected Parking Spot</Text>

              <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-800">
                <Text className="text-slate-400 text-xs font-semibold">Building:</Text>
                <Text className="text-white font-bold text-xs">VMES Building</Text>
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
                <Text className="text-slate-400 text-xs font-semibold">Zone & Area:</Text>
                <Text className="text-slate-200 font-bold text-xs">{scannedSpot.zone}</Text>
              </View>
            </View>

            {/* Parking Location Image Box (Only Image or Placeholder "Parking Location Image") */}
            <View style={{ marginBottom: 16 }}>
              {qrImageList.length > 0 ? (
                <View style={{ height: 180, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', position: 'relative' }}>
                  <Image
                    source={{ uri: qrImageList[activeQRImageIndex] }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />

                  {/* Left & Right Arrow Navigation Buttons (When multiple images exist) */}
                  {qrImageList.length > 1 && (
                    <>
                      <TouchableOpacity
                        onPress={handlePrevQRImage}
                        activeOpacity={0.75}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: [{ translateY: -18 }],
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: 'rgba(255, 255, 255, 0.88)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(226, 232, 240, 0.9)',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 4,
                          elevation: 3
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color="#0f172a" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleNextQRImage}
                        activeOpacity={0.75}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: [{ translateY: -18 }],
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: 'rgba(255, 255, 255, 0.88)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(226, 232, 240, 0.9)',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 4,
                          elevation: 3
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#0f172a" />
                      </TouchableOpacity>

                    {/* Pagination Dots Indicator */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        alignSelf: 'center',
                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {qrImageList.map((_, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setActiveQRImageIndex(idx)}
                          activeOpacity={0.8}
                          style={{
                            width: idx === activeQRImageIndex ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: idx === activeQRImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'
                          }}
                        />
                      ))}
                    </View>
                    </>
                  )}
                </View>
              ) : (
                <View style={{ height: 140, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#334155', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  <Ionicons name="image-outline" size={32} color="#64748b" style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8' }}>Parking Location Image</Text>
                </View>
              )}
            </View>

            {/* Surrounding Map Layout Graphic */}
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

              {/* Map Canvas */}
              <View className="bg-slate-800/90 rounded-2xl h-44 border border-slate-700 relative items-center justify-center overflow-hidden">
                {/* Pillar Grid */}
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

                {/* Car Location Pin */}
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
                Surrounding floor map around parking pillar
              </Text>
            </View>

            {/* Action Buttons: Cancel or Save */}
            <View className="flex-row gap-3 pt-1">
              <TouchableOpacity
                onPress={() => setScannedSpot(null)}
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
        ) : (
          /* 2. FULL CAMERA SCANNER VIEW */
          <View className="flex-1 justify-between items-center px-6 py-8">
            {/* Top Instruction */}
            <View className="items-center mt-2">
              <Text className="text-slate-200 text-sm font-semibold text-center">
                Point camera at the QR code on the parking pillar
              </Text>
              <Text className="text-slate-400 text-xs text-center mt-1">
                Scan pillar sticker to record parking coordinates
              </Text>
            </View>

            {/* Center Viewfinder with Laser Scanner */}
            <View className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-blue-500/60 rounded-3xl items-center justify-center relative bg-slate-900/60 overflow-hidden shadow-2xl">
              {/* Glowing Corner Accents */}
              <View className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <View className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <View className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <View className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

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

              {/* Center QR Icon */}
              <View className="items-center opacity-80">
                <Ionicons name="qr-code-outline" size={80} color="#60a5fa" />
                <Text className="text-blue-300 text-[11px] font-bold mt-2 text-center">
                  Align QR Code within frame
                </Text>
              </View>
            </View>

            {/* Bottom Controls */}
            <View className="w-full items-center space-y-4">
              <TouchableOpacity
                onPress={handleTriggerScan}
                activeOpacity={0.85}
                disabled={isScanning}
                className="w-full max-w-xs py-4 px-6 rounded-2xl bg-blue-600 flex-row items-center justify-center shadow-lg shadow-blue-500/40 active:bg-blue-700"
              >
                <Ionicons
                  name={isScanning ? 'sync' : 'scan-circle'}
                  size={22}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-sm">
                  {isScanning ? 'Scanning QR Code...' : 'Tap to Scan Pillar QR'}
                </Text>
              </TouchableOpacity>

              <Text className="text-slate-500 text-[11px] text-center">
                AU Smart Campus • Parking Spot Locator System
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
