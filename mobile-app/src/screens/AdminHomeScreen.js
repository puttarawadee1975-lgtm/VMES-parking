import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle, Line, Text as SvgText, Ellipse } from 'react-native-svg';

export default function AdminHomeScreen({
  currentUser,
  kpiScans,
  kpiViolations,
  simStep,
  activeSimVeh,
  triggerScan,
  detectionLogs,
  setDetectionLogs,
  screenWidth
}) {
  const movementVal = (simStep / 100);
  const bikeX = (screenWidth - 80) / 2 + Math.sin(simStep * 0.1) * 20;
  const bikeY = 60 + movementVal * 110;
  const scale = 0.5 + movementVal * 0.5;

  return (
    <View className="space-y-4">
      {/* KPI Panel */}
      <View className="flex-row flex-wrap justify-between mb-2">
        <View className="w-[48%] bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl mb-3 shadow-sm">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Scans (Today)</Text>
          <Text className="text-xl sm:text-2xl font-black text-slate-900">{kpiScans}</Text>
          <Text className="text-emerald-600 text-[10px] font-semibold mt-0.5">↑ +12% this week</Text>
        </View>
        <View className="w-[48%] bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl mb-3 shadow-sm">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Helmet Rate</Text>
          <Text className="text-xl sm:text-2xl font-black text-emerald-600">88.6%</Text>
          <View className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <View className="h-full bg-emerald-500" style={{ width: '88.6%' }} />
          </View>
        </View>
        <View className="w-[48%] bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Violations</Text>
          <Text className="text-xl sm:text-2xl font-black text-red-600">{kpiViolations}</Text>
          <Text className="text-red-500 text-[10px] font-semibold mt-0.5">No Helmet Detected</Text>
        </View>
        <View className="w-[48%] bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">AI Inference</Text>
          <Text className="text-xl sm:text-2xl font-black text-blue-600">28 ms</Text>
          <Text className="text-slate-500 text-[10px] font-medium mt-0.5">YOLOv8 + OCR</Text>
        </View>
      </View>

      {/* Video CCTV Feed Display Card */}
      <View className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-3 shadow-sm">
        <View className="flex-row justify-between items-center p-3 bg-slate-900">
          <View className="flex-row items-center flex-1 pr-2">
            <View className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2" />
            <Text className="text-white font-bold text-xs" numberOfLines={1}>CCTV 1 (VMES Entry Gate)</Text>
          </View>
          <Text className="text-blue-200 text-[10px] bg-blue-900/60 py-0.5 px-2 rounded-md font-bold">AI Active</Text>
        </View>

        {/* Dynamic Mock Feed Viewport */}
        <View className="h-52 sm:h-60 bg-slate-950 relative overflow-hidden justify-center items-center">
          <Svg width="100%" height="100%" viewBox="0 0 400 220" style={{ position: 'absolute' }}>
            <Rect width="100%" height="100%" fill="#0f172a" />
            <Path d="M 120 220 L 180 90 L 220 90 L 280 220 Z" fill="#1e293b" />
            <Line x1="200" y1="90" x2="200" y2="220" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 8" />
            <Rect x="130" y="50" width="140" height="70" fill="transparent" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2.5" />
            <Rect x="130" y="50" width="140" height="20" fill="rgba(56, 189, 248, 0.2)" />
            <SvgText x="200" y="64" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">GATE 1 • MAIN CAMPUS ENTRANCE</SvgText>
          </Svg>

          {/* Simulated Motorcycle Rider */}
          <View
            style={{
              position: 'absolute',
              left: bikeX - (40 * scale),
              top: bikeY,
              transform: [{ scale }]
            }}
          >
            <Svg width="80" height="120" viewBox="0 0 80 120">
              <Ellipse cx="40" cy="70" rx="20" ry="25" fill={activeSimVeh.driverColor} />
              {activeSimVeh.helmet === 'HELMET' ? (
                <Circle cx="40" cy="35" r="14" fill="#10b981" />
              ) : (
                <Circle cx="40" cy="35" r="12" fill="#ffcc80" />
              )}
              {activeSimVeh.helmet !== 'HELMET' && (
                <Rect x="32" y="27" width="16" height="8" fill="#3e2723" rx="2" />
              )}
              <Rect x="20" y="100" width="40" height="16" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <SvgText x="40" y="111" fill="#000000" fontSize="6.5" fontWeight="bold" textAnchor="middle">{activeSimVeh.plateShort}</SvgText>
            </Svg>
          </View>

          {/* HUD Bounding Box Visuals */}
          <View className="absolute inset-0 p-3 justify-between" pointerEvents="box-none">
            <View className="flex-row justify-between items-start">
              <View className="bg-black/70 p-1.5 rounded-lg border border-slate-700">
                <Text className="text-white text-[8px] font-bold">FPS: 30.0</Text>
                <Text className="text-white text-[8px] font-bold">CONF: {(activeSimVeh.confHelmet * 100).toFixed(0)}%</Text>
              </View>
              <View className={`py-1 px-2 rounded-lg ${activeSimVeh.isViolation ? 'bg-red-600' : 'bg-emerald-600'}`}>
                <Text className="text-[8px] sm:text-[9px] font-bold text-white">
                  {activeSimVeh.isViolation ? '⚠️ NO HELMET' : '✓ HELMET DETECTED'}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-end">
              <View className="bg-slate-900/90 border border-slate-700 p-2 rounded-xl flex-row items-center flex-1 mr-2">
                <Text className="text-slate-400 text-[9px] font-bold">DETECTED: </Text>
                <Text className="text-white text-[10px] font-extrabold" numberOfLines={1}>
                  {currentUser?.role === 'guest' ? 'xxxxxxx xxxxxxxx' : activeSimVeh.plateShort}
                </Text>
              </View>

              <TouchableOpacity onPress={triggerScan} className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center shadow active:opacity-80">
                <Ionicons name="refresh" size={12} color="#fff" />
                <Text className="text-white text-[10px] font-bold ml-1">Scan Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Live log feed */}
      <View className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="pulse" size={18} color="#2563eb" />
            <Text className="text-slate-900 font-bold text-sm ml-2">Live Detection Feed</Text>
          </View>
          <TouchableOpacity onPress={() => setDetectionLogs([])}>
            <Text className="text-red-500 text-xs font-semibold">Clear Feed</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-2">
          {detectionLogs.map((item) => (
            <View
              key={item.id}
              className={`flex-row p-3 rounded-xl mb-2 border ${
                item.isViolation ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50/50 border-emerald-100'
              }`}
            >
              <View className={`w-9 h-9 rounded-full items-center justify-center ${item.isViolation ? 'bg-red-100' : 'bg-emerald-100'}`}>
                <Text className="text-base">{item.isViolation ? '⚠️' : '🛵'}</Text>
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row justify-between">
                  <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>
                    {currentUser?.role === 'guest' ? 'Plate Hidden (Privacy)' : item.plateShort}
                  </Text>
                  <Text className="text-slate-400 text-[10px]">{item.time}</Text>
                </View>
                <View className="flex-row items-center mt-1 flex-wrap">
                  <Text className={`text-[9px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${item.isViolation ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {item.isViolation ? 'No Helmet' : 'Helmet On'}
                  </Text>
                  <Text className="text-slate-500 text-[9px]" numberOfLines={1}>• {item.gate}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
