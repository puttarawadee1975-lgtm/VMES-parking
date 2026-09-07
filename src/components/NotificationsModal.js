import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsModal({
  visible,
  onClose,
  currentUser
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL', 'SAFETY', 'ADMIN'
  const [expandedId, setExpandedId] = useState(null);

  const notifications = [
    {
      id: 'NOTI-101',
      title: 'No Helmet Violation Detected',
      type: 'warning',
      category: 'Safety Alert',
      message: 'AI CCTV Gate 1 detected driving without a helmet on campus. -10 points deducted from safety score.',
      date: '08:22 AM',
      location: 'Gate 1 (Main Entrance)',
      plate: '1กข-9999',
      scoreDeducted: 10,
      unread: true
    },
    {
      id: 'NOTI-102',
      title: 'Campus Parking Maintenance Notice',
      type: 'announcement',
      category: 'Admin Announcement',
      message: 'Zone B Floor 2 will be temporarily closed for sensor maintenance tomorrow from 09:00 AM to 02:00 PM. Please park at Zone A or Zone C.',
      date: 'Yesterday',
      location: 'VEMS Building Zone B',
      plate: 'System Announcement',
      scoreDeducted: 0,
      unread: false
    }
  ];

  const filteredNotis = notifications.filter(n => {
    if (selectedFilter === 'SAFETY') return n.type === 'warning';
    if (selectedFilter === 'ADMIN') return n.type === 'announcement';
    return true;
  });

  const getIcon = (type) => {
    if (type === 'warning') return { name: 'warning-outline', color: '#ef4444', bg: '#fef2f2' };
    if (type === 'announcement') return { name: 'megaphone-outline', color: '#8b5cf6', bg: '#f3e8ff' };
    return { name: 'notifications-outline', color: '#3b82f6', bg: '#eff6ff' };
  };

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginRight: 8 }}>Notifications</Text>
            <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ color: '#dc2626', fontSize: 10, fontWeight: '800' }}>1 NEW</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs Bar */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'SAFETY', label: 'Safety Alerts' },
            { key: 'ADMIN', label: 'Announcements' },
          ].map(tab => {
            const isActive = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setSelectedFilter(tab.key)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isActive ? '#0f172a' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isActive ? '#0f172a' : '#e2e8f0'
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#ffffff' : '#64748b' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notification List Scroll Area */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
            {filteredNotis.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Ionicons name="notifications-off-outline" size={42} color="#cbd5e1" />
                <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 10, fontWeight: '600' }}>No notifications in this filter</Text>
              </View>
            ) : (
              filteredNotis.map(item => {
                const iconConfig = getIcon(item.type);
                const isExpanded = expandedId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: item.type === 'warning' ? '#fecaca' : '#e2e8f0',
                      borderRadius: 20,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOpacity: 0.03,
                      shadowRadius: 8,
                      elevation: 1
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      {/* Icon circle */}
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: iconConfig.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 14
                        }}
                      >
                        <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 6 }} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{item.date}</Text>
                        </View>

                        <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19 }} numberOfLines={isExpanded ? undefined : 2}>
                          {item.message}
                        </Text>

                        {/* Expanded Details Panel */}
                        {isExpanded && (
                          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>Location:</Text>
                              <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: '700' }}>{item.location}</Text>
                            </View>
                            {item.scoreDeducted > 0 && (
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, backgroundColor: '#fef2f2', padding: 8, borderRadius: 10 }}>
                                <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '700' }}>Safety Score Deducted:</Text>
                                <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '900' }}>-{item.scoreDeducted} pts</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
