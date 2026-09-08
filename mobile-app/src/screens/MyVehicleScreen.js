import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import ParkingLocationCard from '../components/ParkingLocationCard';
import { toThaiProvince, formatDisplayPlate } from '../utils/provinceHelper';
import LicensePlateScannerModal from '../components/LicensePlateScannerModal';
import DrivingScoreModal from '../components/DrivingScoreModal';
import EditVehicleModal from '../components/EditVehicleModal';

export default function MyVehicleScreen({
  currentUser,
  onOpenMicrosoftModal,
  onOpenAddVehicleModal,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  tripHistory = [],
  parkedSpot,
  onOpenQRScanner,
  onExitBuilding
}) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [vehicleType, setVehicleType] = useState(null); // null | 'motorcycle' | 'car'
  const [newPlate, setNewPlate] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showDrivingScoreModal, setShowDrivingScoreModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const isGuest = currentUser?.role === 'guest';
  const isStudent = currentUser?.role === 'student';
  const isAdmin = currentUser?.role === 'admin';

  // Filter access logs: ONLY display trips for this account's registered vehicles!
  const userPlates = (currentUser?.vehicles || []).map((v) => (v.plate || '').trim().toUpperCase());
  const myTripHistory = isGuest
    ? []
    : tripHistory.filter((trip) => {
      const tripPlate = (trip.plate || '').trim().toUpperCase();
      const tripPlatePrefix = tripPlate.split(' ')[0];
      return userPlates.some((up) => {
        const upPrefix = up.split(' ')[0];
        return up === tripPlate || upPrefix === tripPlatePrefix || tripPlate.includes(upPrefix);
      });
    });

  const handleRegisterSubmit = () => {
    if (!newPlate.trim() || !newProvince.trim() || !newModel.trim() || !newColor.trim()) {
      alert('Please fill in all vehicle information fields');
      return;
    }

    const thaiProvince = toThaiProvince(newProvince.trim());
    const fullPlate = `${newPlate.trim().toUpperCase()} ${thaiProvince}`;
    const icon = vehicleType === 'motorcycle' ? '🛵' : '🚗';
    const fullModel = `${icon} ${newModel.trim()} (${newColor.trim()})`;

    if (onAddVehicle) {
      const success = onAddVehicle(fullPlate, fullModel);
      if (success === false) return;
    } else if (onOpenAddVehicleModal) {
      onOpenAddVehicleModal();
    }

    setNewPlate('');
    setNewProvince('');
    setNewModel('');
    setNewColor('');
    setIsRegistering(false);
  };

  // If user is opening the inline registration form
  if (isRegistering) {
    return (
      <View className="space-y-4">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => setIsRegistering(false)}
          className="flex-row items-center bg-white border border-slate-200 py-2.5 px-4 rounded-2xl self-start active:bg-slate-50 shadow-sm"
        >
          <Ionicons name="arrow-back" size={18} color="#2563eb" style={{ marginRight: 6 }} />
          <Text className="text-blue-600 font-bold text-xs">Back to Vehicle List</Text>
        </TouchableOpacity>

        {/* Title Header Card */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center mr-3.5">
              <Ionicons name="car-sport" size={24} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-base sm:text-lg">Register New Vehicle</Text>
              <Text className="text-slate-500 text-xs mt-0.5">Register vehicle for campus gate access</Text>
            </View>
          </View>
          <Text className="text-slate-600 text-xs leading-relaxed">
            Fill in your vehicle credentials to enable automated OCR license plate scanning and smart gate access.
          </Text>

          {/* 1 Plate per Account Policy Banner */}
          <View className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex-row items-center mt-3">
            <Ionicons name="information-circle" size={18} color="#2563eb" style={{ marginRight: 8 }} />
            <Text className="text-blue-800 text-[11px] font-semibold flex-1 leading-snug">
              Policy Rule: 1 License plate can only be registered to 1 university account.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <Text className="text-slate-900 font-bold text-sm">Vehicle Details</Text>

          {/* Vehicle Type Switcher */}
          <View>
            <Text className="text-slate-600 text-xs font-semibold mb-2">Vehicle Type:</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setVehicleType('motorcycle')}
                activeOpacity={0.8}
                className={`flex-1 py-3 px-4 rounded-2xl border flex-row items-center justify-center ${vehicleType === 'motorcycle'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <Text className="text-lg mr-2">🛵</Text>
                <Text className={`text-xs font-bold ${vehicleType === 'motorcycle' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Motorcycle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setVehicleType('car')}
                activeOpacity={0.8}
                className={`flex-1 py-3 px-4 rounded-2xl border flex-row items-center justify-center ${vehicleType === 'car'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <Text className="text-lg mr-2">🚗</Text>
                <Text className={`text-xs font-bold ${vehicleType === 'car' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Automobile
                </Text>
              </TouchableOpacity>
            </View>
          </View>



          {/* License Plate Input */}
          <View>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-slate-600 text-xs font-semibold">
                License Plate Number:
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!vehicleType) {
                    alert('Please select vehicle type first.');
                    return;
                  }
                  setShowScannerModal(true);
                }}
                className="flex-row items-center bg-blue-50 border border-blue-200 py-1 px-2.5 rounded-lg active:bg-blue-100"
              >
                <Ionicons name="camera-outline" size={13} color="#2563eb" style={{ marginRight: 4 }} />
                <Text className="text-blue-600 font-bold text-[11px]">Scan with Camera</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={newPlate}
              onChangeText={setNewPlate}
              placeholder="e.g. 1AB 8924"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#0f172a',
                fontSize: 13,
                fontWeight: '600'
              }}
            />
          </View>

          {/* Province Input */}
          <View>
            <Text className="text-slate-600 text-xs font-semibold mb-1">
              Province / City:
            </Text>
            <TextInput
              value={newProvince}
              onChangeText={setNewProvince}
              onBlur={() => {
                if (newProvince.trim()) {
                  setNewProvince(toThaiProvince(newProvince));
                }
              }}
              placeholder="e.g. Bangkok"
              placeholderTextColor="#94a3b8"
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#0f172a',
                fontSize: 13
              }}
            />
          </View>

          {/* Make & Model */}
          <View>
            <Text className="text-slate-600 text-xs font-semibold mb-1">
              Vehicle Make & Model:
            </Text>
            <TextInput
              value={newModel}
              onChangeText={setNewModel}
              placeholder="e.g. Honda PCX 160, Yamaha Grand Filano"
              placeholderTextColor="#94a3b8"
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#0f172a',
                fontSize: 13
              }}
            />
          </View>

          {/* Vehicle Color */}
          <View>
            <Text className="text-slate-600 text-xs font-semibold mb-1">
              Vehicle Color:
            </Text>
            <TextInput
              value={newColor}
              onChangeText={setNewColor}
              placeholder="e.g. White, Black, Matte Gray"
              placeholderTextColor="#94a3b8"
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#0f172a',
                fontSize: 13
              }}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              onPress={() => setIsRegistering(false)}
              activeOpacity={0.8}
              className="flex-1 py-3.5 px-4 rounded-2xl border border-slate-200 bg-slate-100 items-center justify-center active:bg-slate-200"
            >
              <Text className="text-slate-700 font-bold text-xs">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRegisterSubmit}
              activeOpacity={0.85}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 items-center justify-center shadow-md shadow-blue-500/30 active:bg-blue-700"
            >
              <Text className="text-white font-bold text-xs">Register Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Normal Screen View
  return (
    <View className="space-y-4">
      {/* Title */}
      <View className="mb-1">
        <Text className="text-xl font-bold text-slate-900">
          {isAdmin ? 'Staff Access & Vehicles' : 'My Vehicles & Campus Pass'}
        </Text>
        <Text className="text-slate-500 text-xs mt-0.5">
          {isAdmin
            ? 'Manage university staff parking credentials & logs'
            : 'Manage your registered vehicles and parking spot status'}
        </Text>
      </View>

      {/* Guest Mode Banner */}
      {isGuest && (
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-amber-800 font-bold text-xs">Guest Mode Active</Text>
            <Text className="text-amber-700/80 text-[11px] mt-0.5 leading-relaxed">
              Sign in with your University Microsoft Account to register vehicles and view personalized history.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenMicrosoftModal}
            className="bg-amber-600 py-2 px-3.5 rounded-xl active:bg-amber-700 shadow-sm"
          >
            <Text className="text-white font-bold text-xs">Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Digital Campus Pass Card */}
      <View className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <View className="bg-slate-900 p-5 sm:p-6">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">AU Smart Campus Pass</Text>
              <Text className="text-white text-lg sm:text-xl font-black mt-1">
                {currentUser?.name}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {isAdmin ? `Staff ID: ${currentUser?.staffId || 'SEC-01'}` : isStudent ? `Student ID: ${(currentUser?.studentId || (currentUser?.email ? currentUser.email.split('@')[0] : '65070042')).replace(/\D/g, '')}` : 'Temporary Visitor Pass'}
              </Text>
            </View>
            <View className={`px-2.5 py-1 rounded-full border ${isAdmin
                ? 'bg-purple-900/60 border-purple-500/50'
                : isStudent
                  ? 'bg-blue-900/60 border-blue-500/50'
                  : 'bg-amber-900/60 border-amber-500/50'
              }`}>
              <Text className={`text-[10px] font-black uppercase ${isAdmin ? 'text-purple-300' : isStudent ? 'text-blue-300' : 'text-amber-300'
                }`}>
                {currentUser?.role}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4 sm:p-5 flex-row justify-between items-center bg-white border-t border-slate-100">
          <View className="flex-1 pr-2">
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Account Email & ID</Text>
            <Text className="text-slate-700 text-xs font-semibold mt-0.5" numberOfLines={1}>{currentUser?.email}</Text>
            {currentUser?.role !== 'guest' && (
              <Text className="text-slate-700 text-xs font-semibold mt-0.5" numberOfLines={1}>
                {isAdmin ? 'Staff ID' : 'Student ID'}: {isAdmin ? (currentUser?.staffId || 'SEC-01') : (currentUser?.studentId || (currentUser?.email ? currentUser.email.split('@')[0] : '65070042')).replace(/\D/g, '')}
              </Text>
            )}
          </View>
          <View className="items-end">
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Status</Text>
            <Text className="text-emerald-600 text-xs font-bold mt-0.5">Active</Text>
          </View>
        </View>

        {isStudent && (
          <TouchableOpacity 
            onPress={() => setShowDrivingScoreModal(true)}
            activeOpacity={0.8}
            className="border-t border-slate-100 p-4 bg-slate-50 flex-row items-center"
          >
            <View className="flex-1 mr-4">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-slate-600 text-xs font-semibold">Safety Drive Score:</Text>
                <Text className="text-emerald-600 font-black text-sm">{currentUser?.safetyScore}/100</Text>
              </View>
              <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <View className="h-full bg-emerald-500" style={{ width: `${currentUser?.safetyScore}%` }} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Parking Location Spot & Map Tracker */}
      <ParkingLocationCard
        parkedSpot={parkedSpot}
        onOpenQRScanner={onOpenQRScanner}
        onExitBuilding={onExitBuilding}
      />

      {/* Registered Vehicles List */}
      <View className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-slate-900 font-bold text-sm">Registered Vehicle</Text>
            <Text className="text-slate-400 text-[10px]">1 account per license plate</Text>
          </View>
        </View>

        <View className="space-y-3">
          {!currentUser?.vehicles || currentUser.vehicles.length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-slate-400 text-xs text-center mb-3">No registered vehicles yet</Text>
              <TouchableOpacity
                onPress={() => {
                  if (onOpenAddVehicleModal) {
                    onOpenAddVehicleModal();
                  } else {
                    setIsRegistering(true);
                  }
                }}
                className="bg-blue-600 py-2 px-4 rounded-xl active:opacity-90"
              >
                <Text className="text-white font-bold text-xs">+ Register First Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            currentUser.vehicles.map((v, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => setEditingVehicle(v)}
                className="flex-row items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-2 justify-between active:bg-blue-50/50"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 items-center justify-center mr-3">
                    {v.model?.includes('🚗') ? (
                      <Ionicons name="car-outline" size={20} color="#64748b" />
                    ) : (
                      <FontAwesome5 name="motorcycle" size={16} color="#64748b" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-xs">{formatDisplayPlate(v.plate)}</Text>
                    <Text className="text-slate-500 text-[10px] mt-0.5">{v.model?.replace(/^[🛵🚗?❓\s]+/, '')}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                    <Ionicons name="create-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text className="text-blue-700 font-bold text-[11px]">Edit</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* TODAY'S CAMPUS ACCESS & EXIT HISTORY (USER-REGISTERED VEHICLES ONLY, RESETS DAILY) */}
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-2">
            <Text className="text-slate-900 font-bold text-sm">Today's Campus Access Log</Text>
            <Text className="text-slate-500 text-[11px]">
              Daily records for your registered vehicles • Resets at 00:00
            </Text>
          </View>
          <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Text className="text-emerald-700 text-[10px] font-bold">
              {myTripHistory.length} {myTripHistory.length === 1 ? 'Trip Today' : 'Trips Today'}
            </Text>
          </View>
        </View>

        <View className="space-y-3.5">
          {myTripHistory.length === 0 ? (
            <View className="items-center py-6 bg-slate-50 rounded-2xl border border-slate-200/60 p-4">
              <Ionicons name="shield-outline" size={30} color="#94a3b8" />
              <Text className="text-slate-700 font-bold text-xs mt-2 text-center">
                No Campus Access Logs Today
              </Text>
              <Text className="text-slate-400 text-[11px] text-center mt-1">
                Only records matching your registered vehicles are displayed. History resets automatically at midnight (00:00).
              </Text>
            </View>
          ) : (
            myTripHistory.map((trip, i) => {
              const isMotorcycle = trip.vehicleType === 'motorcycle' || !trip.model?.includes('🚗');
              const hasHelmetStatus = isMotorcycle && trip.helmet;

              return (
                <View
                  key={trip.id || i}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                >
                  {/* Trip Header: Date, Vehicle, and Plate */}
                  <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-200/80">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center mr-2.5">
                        {isMotorcycle ? (
                          <FontAwesome5 name="motorcycle" size={14} color="#64748b" />
                        ) : (
                          <Ionicons name="car-outline" size={16} color="#64748b" />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-slate-900 font-bold text-xs mr-2">{formatDisplayPlate(trip.plate)}</Text>
                          <View className="bg-slate-200/80 px-2 py-0.5 rounded">
                            <Text className="text-slate-600 text-[9px] font-bold">
                              {isMotorcycle ? 'Motorcycle' : 'Automobile'}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-slate-500 text-[10px] mt-0.5">{trip.date}</Text>
                      </View>
                    </View>

                    <View className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <Text className="text-emerald-700 text-[9px] font-bold uppercase">
                        {trip.status || 'Completed'}
                      </Text>
                    </View>
                  </View>

                  {/* Connected Visual Timeline: Entry -> Exit */}
                  <View className="space-y-3 pl-1">
                    {/* 1. Entry Step */}
                    <View className="flex-row items-start">
                      <View className="items-center mr-3">
                        <View className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-400 items-center justify-center">
                          <Ionicons name="arrow-down" size={12} color="#059669" />
                        </View>
                        <View className="w-0.5 h-7 bg-slate-300 my-0.5" />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-slate-900 font-bold text-xs">
                            Entered Campus: <Text className="text-emerald-600 font-black">{trip.entryTime}</Text>
                          </Text>
                          <Text className="text-slate-400 text-[10px]">{trip.entryGate}</Text>
                        </View>

                        {/* Helmet check condition: Only displayed for motorcycles, NEVER for cars! */}
                        {hasHelmetStatus && (
                          <View className="flex-row items-center mt-1">
                            <Text className={`text-[10px] font-semibold ${trip.helmet.includes('Worn') || trip.helmet.includes('Pass')
                                ? 'text-emerald-600'
                                : 'text-red-600'
                              }`}>
                              Helmet Check: {trip.helmet}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* 2. Exit Step */}
                    <View className="flex-row items-start">
                      <View className="items-center mr-3">
                        <View className="w-6 h-6 rounded-full bg-blue-100 border border-blue-400 items-center justify-center">
                          <Ionicons name="arrow-up" size={12} color="#2563eb" />
                        </View>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-slate-900 font-bold text-xs">
                            Exited Campus: <Text className="text-blue-600 font-black">{trip.exitTime}</Text>
                          </Text>
                          <Text className="text-slate-400 text-[10px]">{trip.exitGate}</Text>
                        </View>

                        {trip.spot && (
                          <Text className="text-slate-500 text-[10px] font-medium mt-1">
                            📍 Parked at: {trip.spot}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      <LicensePlateScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        vehicleType={vehicleType}
        onScanSuccess={(scannedPlate, scannedProvince) => {
          setNewPlate(scannedPlate);
          setNewProvince(scannedProvince);
        }}
      />

      <DrivingScoreModal 
        visible={showDrivingScoreModal}
        onClose={() => setShowDrivingScoreModal(false)}
        currentUser={currentUser}
      />

      <EditVehicleModal
        visible={Boolean(editingVehicle)}
        vehicle={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onSave={(oldPlate, newFullPlate, newFullModel) => {
          if (onEditVehicle) {
            onEditVehicle(oldPlate, newFullPlate, newFullModel);
          }
        }}
      />
    </View>
  );
}
