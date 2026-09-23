import React from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getNavMapImage } from '../data/mockData';

export default function ParkingDetailsModal({
  visible,
  onClose,
  parkedSpot,
  onExitBuilding,
  onOpenQRScanner
}) {
  const hasSpot = !!parkedSpot;
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = React.useState(false);

  // Extract list of images (only active when spot is saved)
  const imageList = React.useMemo(() => {
    if (!parkedSpot) return [];
    if (Array.isArray(parkedSpot.images) && parkedSpot.images.length > 0) {
      return parkedSpot.images;
    }
    if (Array.isArray(parkedSpot.imageUrls) && parkedSpot.imageUrls.length > 0) {
      return parkedSpot.imageUrls;
    }
    if (typeof parkedSpot.imageUrl === 'string' && parkedSpot.imageUrl.trim()) {
      const splitUrls = parkedSpot.imageUrl.split(',').map(url => url.trim()).filter(Boolean);
      if (splitUrls.length > 0) return splitUrls;
    }
    const p = parkedSpot.pillar || '';
    const z = parkedSpot.zone || '';
    const navImg = getNavMapImage(p);
    if (p.includes('C-08') || p.includes('C-8')) {
      return [
        require('../../assets/zone_c_c08_building.jpg'),
        require('../../assets/zone_c_c08_spot.jpg'),
        navImg
      ];
    }
    if (z === 'Zone C' || z.includes('Zone C') || p.includes('C-')) {
      return [
        require('../../assets/zone_c_building.jpg'),
        require('../../assets/zone_c_spot.jpg'),
        navImg
      ];
    }
    if (z === 'Zone B' || z.includes('Zone B') || p.includes('B-')) {
      return [
        require('../../assets/zone_b_building.jpg'),
        require('../../assets/zone_b_spot.jpg'),
        navImg
      ];
    }
    if (z === 'Zone D' || p.includes('D-01')) {
      return [
        require('../../assets/zone_d_building.jpg'),
        require('../../assets/zone_d_spot.jpg'),
        navImg
      ];
    }
    return [
      require('../../assets/zone_a_building.jpg'),
      require('../../assets/zone_a_spot.jpg'),
      navImg
    ];
  }, [parkedSpot]);

  React.useEffect(() => {
    setActiveImageIndex(0);
  }, [parkedSpot]);

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  };

  // Safe property fallbacks
  const rawPillar = hasSpot ? (parkedSpot.pillar || 'A-01') : '-';
  const cleanSpot = rawPillar.replace(/^Spot\s+/i, '').replace(/^Pillar\s+/i, '').trim();
  const floorRaw = hasSpot ? (parkedSpot.floor || 'Floor G') : '-';
  const displayFloor = hasSpot ? (floorRaw.replace(/Floor/gi, '').trim() || 'G') : '-';
  const building = hasSpot ? ((!parkedSpot.building || parkedSpot.building.startsWith('Zone')) ? 'VMES Building' : parkedSpot.building) : '-';
  const zone = hasSpot ? (parkedSpot.zone || (parkedSpot.building && parkedSpot.building.startsWith('Zone') ? parkedSpot.building : 'Zone A')) : 'Not Saved';
  const savedDate = hasSpot ? (parkedSpot.savedDate || parkedSpot.date || '-') : 'No Date Saved';
  const savedTime = hasSpot ? (parkedSpot.savedTime || '') : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Find My Parking</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* If no spot saved, show alert warning card at top */}
          {!hasSpot && (
            <View style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={24} color="#d97706" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#92400e', fontWeight: '800', fontSize: 13 }}>No Saved Parking Location</Text>
                <Text style={{ color: '#b45309', fontSize: 11, marginTop: 2 }}>You haven't scanned a QR code to save your parking spot yet.</Text>
              </View>
            </View>
          )}

          {/* Top Cards: Spot & Floor */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Left Card: Spot */}
            <View style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>Spot</Text>
              <Text style={{ color: hasSpot ? '#1e3a8a' : '#94a3b8', fontWeight: '900', fontSize: 24, letterSpacing: -0.5 }}>
                {cleanSpot}
              </Text>
            </View>

            {/* Right Card: Floor */}
            <View style={{ width: '35%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>Floor</Text>
              <Text style={{ color: hasSpot ? '#1e3a8a' : '#94a3b8', fontWeight: '900', fontSize: 24 }}>
                {displayFloor}
              </Text>
            </View>
          </View>

          {/* Building & Date Details Card */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ color: '#64748b', fontWeight: '500', fontSize: 13 }}>Building</Text>
              <Text style={{ color: '#1e3a8a', fontWeight: '800', fontSize: 14 }}>{building}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ color: '#64748b', fontWeight: '500', fontSize: 13 }}>Zone</Text>
              <Text style={{ color: hasSpot ? '#2563eb' : '#94a3b8', fontWeight: '700', fontSize: 14 }}>{zone}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
              <Text style={{ color: '#64748b', fontWeight: '500', fontSize: 13 }}>Date</Text>
              <Text style={{ color: hasSpot ? '#1e3a8a' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>
                {savedDate}{savedTime ? ` (${savedTime})` : ''}
              </Text>
            </View>
          </View>

          {/* Multi-Image Gallery Box (With Left/Right arrows & count badge) */}
          <View style={{ marginBottom: 20 }}>
            {imageList.length > 0 ? (() => {
              const isNavMap = activeImageIndex === 2 || (typeof imageList[activeImageIndex] === 'string' && imageList[activeImageIndex].includes('nav_maps'));
              return (
                <View style={{ height: isNavMap ? 260 : 210, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#cbd5e1', position: 'relative' }}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setIsZoomModalOpen(true)} style={{ width: '100%', height: '100%' }}>
                    <Image
                      source={typeof imageList[activeImageIndex] === 'number' ? imageList[activeImageIndex] : { uri: imageList[activeImageIndex] }}
                      style={{ width: '100%', height: '100%', resizeMode: isNavMap ? 'contain' : 'cover' }}
                    />
                  </TouchableOpacity>

                {/* Left & Right Arrow Navigation Buttons */}
                {imageList.length > 1 && (
                  <>
                    <TouchableOpacity
                      onPress={handlePrevImage}
                      activeOpacity={0.75}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: [{ translateY: -20 }],
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.88)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(226, 232, 240, 0.9)',
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 4
                      }}
                    >
                      <Ionicons name="chevron-back" size={22} color="#0f172a" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleNextImage}
                      activeOpacity={0.75}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: [{ translateY: -20 }],
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.88)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(226, 232, 240, 0.9)',
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 4
                      }}
                    >
                      <Ionicons name="chevron-forward" size={22} color="#0f172a" />
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
                      {imageList.map((_, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setActiveImageIndex(idx)}
                          activeOpacity={0.8}
                          style={{
                            width: idx === activeImageIndex ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: idx === activeImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'
                          }}
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>
            ); })() : (
              <View style={{ height: 160, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <Ionicons name="image-outline" size={36} color="#94a3b8" style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b' }}>Parking Location Image</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginBottom: 40 }}>
            {onOpenQRScanner && !hasSpot && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenQRScanner();
                }}
                activeOpacity={0.85}
                style={{ backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.25, shadowRadius: 8, elevation: 2 }}
              >
                <Ionicons name="scan-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  Scan QR Code to Save Spot
                </Text>
              </TouchableOpacity>
            )}

            {hasSpot && onExitBuilding && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onExitBuilding();
                }}
                activeOpacity={0.85}
                style={{ backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#ef4444', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>Exit Building</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Full Screen Image Zoom Modal */}
        <Modal
          visible={isZoomModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsZoomModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.96)' }}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Top Bar - Only X button on top right */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 10, zIndex: 10 }}>
                <TouchableOpacity onPress={() => setIsZoomModalOpen(false)} style={{ padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.18)', borderRadius: 24 }}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Pinch-to-Zoom ScrollView Container */}
              <ScrollView
                maximumZoomScale={4}
                minimumZoomScale={1}
                zoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 10 }}
                centerContent={true}
              >
                {imageList.length > 0 && (
                  <Image
                    source={typeof imageList[activeImageIndex] === 'number' ? imageList[activeImageIndex] : { uri: imageList[activeImageIndex] }}
                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                  />
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
