import "./global.css";
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  ScrollView,
  Vibration,
  useWindowDimensions,
  Animated,
  Text,
  Modal
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri, ResponseType, exchangeCodeAsync } from 'expo-auth-session';
import { loginWithMicrosoft, saveSpotToMongoDB, clearSpotInMongoDB, registerVehicleToMongoDB, deleteVehicleFromMongoDB, getUserVehiclesFromMongoDB } from './src/services/api';

WebBrowser.maybeCompleteAuthSession();

// Data & Mock Sets
import { DEMO_ACCOUNTS, SIMULATED_VEHICLES, INITIAL_DETECTION_LOGS } from './src/data/mockData';

// Reusable UI Components
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import Toast from './src/components/Toast';
import AddVehicleModal from './src/components/AddVehicleModal';
import NotificationsModal from './src/components/NotificationsModal';

// Role-based & Tab Screens
import AuthScreen from './src/screens/AuthScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import MyVehicleScreen from './src/screens/MyVehicleScreen';
import AccountScreen from './src/screens/AccountScreen';
import QRScanScreen from './src/screens/QRScanScreen';
import VehicleRegistrationOnboardingScreen from './src/screens/VehicleRegistrationOnboardingScreen';

function MainApp() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Navigation & User Role State
  const [currentUser, setCurrentUser] = useState(null); // null (Guest/Login), student, admin
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' (Home), 'analytics', 'my-vehicle', 'account'
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Azure AD Config (Manual Discovery)
  const discovery = {
    authorizationEndpoint: 'https://login.microsoftonline.com/c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f/oauth2/v2.0/token',
  };

  const [request, response, promptAsync] = useAuthRequest({
    clientId: '779a1a49-5a7f-4142-acd3-b8f72152fc5e',
    responseType: ResponseType.Code,
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    redirectUri: makeRedirectUri({
      scheme: 'myapp'
    }),
  }, discovery);

  useEffect(() => {
    if (request?.redirectUri) {
      console.log('🔗 Expo Auth Redirect URI:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (response) {
      console.log('🔑 Auth Response:', response);
    }
    if (response?.type === 'success') {
      const { code } = response.params;

      exchangeCodeAsync({
        clientId: '779a1a49-5a7f-4142-acd3-b8f72152fc5e',
        code: code,
        redirectUri: makeRedirectUri({ scheme: 'myapp' }),
        extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      }, discovery)
        .then(tokenResult => {
          loginWithMicrosoft({
            accessToken: tokenResult.accessToken,
            idToken: tokenResult.idToken,
          }).then(data => {
            if (data && data.user) {
              const emailPrefixDigits = data.user.email ? data.user.email.split('@')[0].replace(/\D/g, '') : '';
              const formattedUser = {
                ...data.user,
                studentId: emailPrefixDigits || (data.user.studentId ? String(data.user.studentId).replace(/\D/g, '') : '65070042'),
                vehicles: data.user.vehicles || []
              };
              fetchUserVehiclesAndLogin(formattedUser);
            } else {
              const fallbackStudent = {
                role: 'student',
                name: 'Cherie A.',
                studentId: '65070042',
                email: '65070042@student.university.ac.th',
                vehicles: [],
                safetyScore: 98
              };
              fetchUserVehiclesAndLogin(fallbackStudent);
            }
          }).catch(err => {
            console.warn('[Auth] Backend Verification Error:', err);
            const fallbackStudent = {
              role: 'student',
              name: 'Cherie A.',
              studentId: '65070042',
              email: '65070042@student.university.ac.th',
              vehicles: [],
              safetyScore: 98
            };
            fetchUserVehiclesAndLogin(fallbackStudent);
          });
        })
        .catch(err => {
          console.warn('[Auth] Exchange Code Error:', err);
          const fallbackStudent = {
            role: 'student',
            name: 'Cherie A.',
            studentId: '65070042',
            email: '65070042@student.university.ac.th',
            vehicles: [],
            safetyScore: 98
          };
          fetchUserVehiclesAndLogin(fallbackStudent);
        });
    }
  }, [response]);

  // Global registry of all registered license plates to enforce 1 plate per 1 account policy
  const [allRegisteredAccounts, setAllRegisteredAccounts] = useState(DEMO_ACCOUNTS);

  // Parking Location & Today's Connected Trip Access History (Resets Daily)
  const [parkedSpot, setParkedSpot] = useState(null);
  const [tripHistory, setTripHistory] = useState([]);

  // Settings State
  const [websocketUrl, setWebsocketUrl] = useState('ws://168.120.248.53:8000/ws/detections');
  const [wsConnected, setWsConnected] = useState(false);
  const [confidenceHelmet, setConfidenceHelmet] = useState(50);
  const [confidencePlate, setConfidencePlate] = useState(40);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);

  // KPI & Live Detection State
  const [kpiScans, setKpiScans] = useState(1284);
  const [kpiViolations, setKpiViolations] = useState(146);
  const [kpiAvailable, setKpiAvailable] = useState(32);
  const [kpiOccupied, setKpiOccupied] = useState(18);
  const [detectionLogs, setDetectionLogs] = useState(INITIAL_DETECTION_LOGS);
  const [toastMessage, setToastMessage] = useState(null);

  // Simulation State & Loop
  const [currentVehIndex, setCurrentVehIndex] = useState(0);
  const [simStep, setSimStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const activeSimVeh = SIMULATED_VEHICLES[currentVehIndex];

  useEffect(() => {
    if (currentUser?.email) {
      getUserVehiclesFromMongoDB(currentUser.email).then((dbVehicles) => {
        const formattedVehicles = (dbVehicles || []).map(v => ({ plate: v.plate, model: v.model }));
        if (formattedVehicles.length > 0) {
          setCurrentUser((prev) => prev ? { ...prev, vehicles: formattedVehicles } : prev);
          setAllRegisteredAccounts((prevAccs) => ({
            ...prevAccs,
            [currentUser.email]: {
              ...(prevAccs[currentUser.email] || currentUser),
              vehicles: formattedVehicles
            }
          }));
        }
      });
    }
  }, [currentUser?.email]);

  useEffect(() => {
    let interval;
    if (currentUser) {
      interval = setInterval(() => {
        setSimStep((prev) => (prev + 1) % 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (simStep === 0 && currentUser) {
      triggerScan();
    }
  }, [simStep]);

  const triggerScan = () => {
    const nextIdx = (currentVehIndex + 1) % SIMULATED_VEHICLES.length;
    setCurrentVehIndex(nextIdx);
    const veh = SIMULATED_VEHICLES[nextIdx];

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false
    }).start();

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog = {
      id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      time: timeStr,
      plate: veh.plate,
      plateShort: veh.plateShort,
      helmet: veh.helmet,
      helmetText: veh.helmetText,
      gate: veh.gate,
      isViolation: veh.isViolation,
      vehicle: veh.vehicle
    };

    setDetectionLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    setKpiScans((prev) => prev + 1);

    if (veh.isViolation) {
      setKpiViolations((prev) => prev + 1);
      if (audioAlertEnabled) {
        try { Vibration.vibrate([0, 150, 100, 150]); } catch (e) { }
        showToast(`🚨 Helmet violation detected: ${veh.plateShort}`);
      }
    } else {
      if (audioAlertEnabled) {
        try { Vibration.vibrate(50); } catch (e) { }
      }
    }

    setKpiAvailable((prev) => (prev > 0 ? prev - 1 : 32));
    setKpiOccupied((prev) => prev + 1);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth Handlers

  const fetchUserVehiclesAndLogin = async (userObj) => {
    try {
      const dbVehicles = await getUserVehiclesFromMongoDB(userObj.email);
      const formattedVehicles = (dbVehicles && dbVehicles.length > 0)
        ? dbVehicles.map(v => ({ plate: v.plate, model: v.model }))
        : (allRegisteredAccounts[userObj.email]?.vehicles || userObj.vehicles || []);

      const userWithVehicles = {
        ...userObj,
        vehicles: formattedVehicles
      };

      if (formattedVehicles.length > 0) {
        setAllRegisteredAccounts((prevAccs) => ({
          ...prevAccs,
          [userObj.email]: {
            ...(prevAccs[userObj.email] || userObj),
            vehicles: formattedVehicles
          }
        }));
      }

      setCurrentUser(userWithVehicles);
      setActiveTab('monitor');
      showToast(`🔑 Signed in as ${userObj.name}`);
    } catch (err) {
      console.warn('Error fetching vehicles on login:', err);
      setCurrentUser(userObj);
      setActiveTab('monitor');
      showToast(`🔑 Signed in as ${userObj.name}`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('🔒 Signed out successfully');
  };

  const handleMicrosoftLogin = async () => {
    const studentEmail = '65070042@student.university.ac.th';
    const student = {
      role: 'student',
      name: 'Cherie A.',
      studentId: '65070042',
      email: studentEmail,
      vehicles: [],
      safetyScore: 98
    };

    try {
      const res = await promptAsync();
      if (!res || res.type !== 'success') {
        await fetchUserVehiclesAndLogin(student);
      }
    } catch (err) {
      console.warn('Microsoft Auth Prompt Error, falling back to student session:', err);
      await fetchUserVehiclesAndLogin(student);
    }
  };

  const handleGuestLogin = async () => {
    const guestEmail = 'guest@public.demo';
    const guest = {
      role: 'guest',
      name: 'Guest User',
      studentId: 'GUEST',
      email: guestEmail,
      vehicles: [],
      safetyScore: null
    };
    await fetchUserVehiclesAndLogin(guest);
  };

  const handleSelectAccount = async (accountEmail) => {
    const preset = DEMO_ACCOUNTS[accountEmail] || {
      role: 'student',
      name: accountEmail.split('@')[0],
      studentId: accountEmail.replace(/\D/g, '') || '65070042',
      email: accountEmail,
      vehicles: [],
      safetyScore: 98
    };
    await fetchUserVehiclesAndLogin(preset);
  };

  const handleEditVehicle = (oldPlate, newFullPlate, newFullModel) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updatedVehicles = (prev.vehicles || []).map(v => {
        if (v.plate === oldPlate) {
          return { plate: newFullPlate, model: newFullModel };
        }
        return v;
      });
      if (prev.email) {
        setAllRegisteredAccounts((prevAccs) => ({
          ...prevAccs,
          [prev.email]: {
            ...(prevAccs[prev.email] || prev),
            vehicles: updatedVehicles
          }
        }));
      }
      return { ...prev, vehicles: updatedVehicles };
    });
    showToast('✏️ Vehicle information updated successfully');
  };

  const handleAddVehicle = (fullPlate, fullModel) => {
    // Check student 1-vehicle quota limit
    if (currentUser?.role === 'student' && currentUser?.vehicles && currentUser.vehicles.length >= 1) {
      alert('⚠️ Registration Limit Reached:\nStudents are allowed to register 1 vehicle per account only.');
      return false;
    }

    const normPlate = fullPlate.trim().toUpperCase();
    const platePrefix = normPlate.split(' ')[0];

    // Check if license plate is already registered to any account
    const isAlreadyRegistered = Object.entries(allRegisteredAccounts).some(([email, acc]) => {
      return (acc.vehicles || []).some((v) => {
        const p = v.plate?.trim().toUpperCase() || '';
        return p === normPlate || p.startsWith(platePrefix);
      });
    });

    if (isAlreadyRegistered) {
      alert(`⚠️ Registration Error:\nLicense plate "${fullPlate}" is already registered in the system.\n\nPolicy: 1 license plate can only be registered to 1 university account.`);
      return false;
    }

    if (!currentUser?.email) {
      alert('⚠️ Error: You must be signed in to register a vehicle.');
      return false;
    }

    // Call MongoDB API to persist vehicle registration
    registerVehicleToMongoDB(
      { plate: fullPlate, model: fullModel },
      currentUser.email,
      currentUser?.role || 'student'
    );

    setCurrentUser((prev) => {
      const updatedVehicles = [...(prev.vehicles || []), { plate: fullPlate, model: fullModel }];
      if (prev?.email) {
        setAllRegisteredAccounts((prevAccs) => ({
          ...prevAccs,
          [prev.email]: {
            ...(prevAccs[prev.email] || prev),
            vehicles: updatedVehicles
          }
        }));
      }
      return { ...prev, vehicles: updatedVehicles };
    });

    showToast('🛵 Vehicle registered successfully');
    return true;
  };

  const handleDeleteVehicle = (plateToDelete) => {
    deleteVehicleFromMongoDB(plateToDelete, currentUser?.email || '65070042@student.university.ac.th');
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updatedVehicles = (prev.vehicles || []).filter(v => v.plate !== plateToDelete);
      if (prev.email) {
        setAllRegisteredAccounts((prevAccs) => ({
          ...prevAccs,
          [prev.email]: {
            ...(prevAccs[prev.email] || prev),
            vehicles: updatedVehicles
          }
        }));
      }
      return { ...prev, vehicles: updatedVehicles };
    });
    showToast('🗑️ Vehicle deleted successfully');
  };

  const handleSaveParkedSpot = (spotData) => {
    const isUpdate = !!parkedSpot;
    setParkedSpot(spotData);
    saveSpotToMongoDB(spotData, currentUser?.email || '65070042@student.university.ac.th');
    if (isUpdate) {
      showToast(`🔄 Updated parking spot: ${spotData.zone} ${spotData.floor} (${spotData.pillar})`);
    } else {
      showToast(`📍 Saved parking spot: ${spotData.zone} ${spotData.floor} (${spotData.pillar})`);
    }
  };

  const handleExitBuilding = () => {
    if (parkedSpot) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newTrip = {
        id: 'TRIP-' + Date.now().toString().slice(-4),
        date: 'Today, ' + now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        vehicleType: 'motorcycle',
        plate: currentUser?.vehicles?.[0]?.plate || '1AB 8924 BKK',
        model: currentUser?.vehicles?.[0]?.model || 'Honda PCX 160',
        entryTime: '08:24 AM',
        entryGate: 'Gate 1 (Main Entrance)',
        helmet: 'Helmet Worn (Pass)',
        exitTime: timeStr,
        exitGate: parkedSpot.nearestExit || 'Gate 1 Ramp',
        spot: `${parkedSpot.building} (${parkedSpot.pillar})`,
        status: 'Completed'
      };
      setTripHistory((prev) => [newTrip, ...prev]);
      clearSpotInMongoDB(currentUser?.email || '65070042@student.university.ac.th');
      setParkedSpot(null);
      showToast('🚗 Exited building. Parking location cleared & trip logged.');
    }
  };

  const handleTestWebSocket = () => {
    setWsConnected(true);
    showToast('🔌 WebSocket Connected (Test Mode)');
  };

  const isAdmin = currentUser?.role === 'admin';
  const bottomNavHeight = insets.bottom > 0 ? insets.bottom + 54 : 64;

  return (
    <View style={{ flex: 1 }} className="bg-slate-50">
      <StatusBar style="dark" />

      {/* 1. Auth View (When not logged in) */}
      {!currentUser ? (
        <AuthScreen
          onOpenMicrosoftModal={handleMicrosoftLogin}
          onGuestLogin={handleGuestLogin}
          insets={insets}
          screenWidth={screenWidth}
        />
      ) : (!currentUser?.vehicles || currentUser.vehicles.length === 0) ? (
        /* 1.5 Mandatory Vehicle Registration Onboarding Screen */
        <VehicleRegistrationOnboardingScreen
          currentUser={currentUser}
          onRegisterVehicle={handleAddVehicle}
          onLogout={handleLogout}
        />
      ) : (
        /* 2. Main Dashboard Container */
        <View style={{ flex: 1 }}>
          {/* Top Header */}
          <Header
            insets={insets}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenNotifications={() => setShowNotificationsModal(true)}
          />

          {/* Guest Role Notification Banner */}
          {currentUser?.role === 'guest' && (
            <View className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex-row items-center">
              <Ionicons name="lock-closed" size={16} color="#d97706" />
              <Text className="text-amber-800 text-[11px] ml-2 flex-1">
                Guest Mode: Vehicle plates hidden for privacy.
              </Text>
            </View>
          )}

          {/* Active Tab Screen Content */}
          <ScrollView
            className="flex-1 px-4 py-4"
            contentContainerStyle={{
              paddingBottom: bottomNavHeight + 20,
              maxWidth: 680,
              width: '100%',
              alignSelf: 'center'
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Tab 1: Home (Student vs Admin/Staff view) */}
            {activeTab === 'monitor' && (
              isAdmin ? (
                <AdminHomeScreen
                  currentUser={currentUser}
                  kpiScans={kpiScans}
                  kpiViolations={kpiViolations}
                  simStep={simStep}
                  activeSimVeh={activeSimVeh}
                  triggerScan={triggerScan}
                  detectionLogs={detectionLogs}
                  setDetectionLogs={setDetectionLogs}
                  screenWidth={screenWidth}
                />
              ) : (
                <StudentHomeScreen
                  currentUser={currentUser}
                  kpiAvailable={kpiAvailable}
                  kpiOccupied={kpiOccupied}
                  parkedSpot={parkedSpot}
                  onOpenQRScanner={() => setShowQRModal(true)}
                  onExitBuilding={handleExitBuilding}
                  activeSimVeh={activeSimVeh}
                  triggerScan={triggerScan}
                  onOpenNotifications={() => setShowNotificationsModal(true)}
                />
              )
            )}

            {/* Tab 2: Analytics (Admin only) */}
            {activeTab === 'analytics' && isAdmin && <AnalyticsScreen />}

            {/* Tab 3: My Vehicle / Pass (Handles Student, Admin Staff ID, and Guest) */}
            {activeTab === 'my-vehicle' && (
              <MyVehicleScreen
                currentUser={currentUser}
                onOpenMicrosoftModal={() => promptAsync()}
                onOpenAddVehicleModal={() => setShowAddVehicleModal(true)}
                onAddVehicle={handleAddVehicle}
                onEditVehicle={handleEditVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                tripHistory={tripHistory}
                parkedSpot={parkedSpot}
                onOpenQRScanner={() => setShowQRModal(true)}
                onExitBuilding={handleExitBuilding}
              />
            )}

            {/* Tab 4: Account */}
            {activeTab === 'account' && (
              <AccountScreen
                currentUser={currentUser}
                parkedSpot={parkedSpot}
                onOpenQRScanner={() => setShowQRModal(true)}
                onLogout={handleLogout}
                websocketUrl={websocketUrl}
                setWebsocketUrl={setWebsocketUrl}
                wsConnected={wsConnected}
                onTestWebSocket={handleTestWebSocket}
                confidenceHelmet={confidenceHelmet}
                setConfidenceHelmet={setConfidenceHelmet}
                confidencePlate={confidencePlate}
                setConfidencePlate={setConfidencePlate}
                audioAlertEnabled={audioAlertEnabled}
                setAudioAlertEnabled={setAudioAlertEnabled}
                onOpenNotifications={() => setShowNotificationsModal(true)}
                onOpenAddVehicleModal={() => setShowAddVehicleModal(true)}
                onEditVehicle={handleEditVehicle}
                onNavigateToMyVehicle={() => setActiveTab('my-vehicle')}
              />
            )}
          </ScrollView>

          {/* Bottom Navigation */}
          <BottomNav
            insets={insets}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenQR={() => setShowQRModal(true)}
          />
        </View>
      )}



      {/* Add Vehicle Modal */}
      <AddVehicleModal
        visible={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onAdd={handleAddVehicle}
        insets={insets}
      />

      {/* Full-screen QR Scanner Screen */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowQRModal(false)}
      >
        <QRScanScreen
          onClose={() => setShowQRModal(false)}
          onSaveSpot={handleSaveParkedSpot}
          currentSpot={parkedSpot}
          insets={insets}
        />
      </Modal>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        currentUser={currentUser}
      />

      {/* Floating Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        insets={insets}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}
