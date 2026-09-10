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

import { getAnnouncements } from '../services/api';
import AnnouncementDetailModal from './AnnouncementDetailModal';
import DrivingScoreModal from './DrivingScoreModal';

export default function NotificationsModal({
  visible,
  onClose,
  currentUser
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL', 'SAFETY', 'ADMIN'
  const [expandedId, setExpandedId] = useState(null);
  const [dynamicNotis, setDynamicNotis] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDrivingScoreModal, setShowDrivingScoreModal] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    const loadNotis = async () => {
      try {
        const anns = await getAnnouncements();
        let notiList = [];
        
        // Add safety warning if student has penalty
        if (currentUser?.safetyScore !== undefined && currentUser?.safetyScore < 100) {
          notiList.push({
            id: 'NOTI-SAFETY-01',
            title: 'No Helmet Violation Detected',
            type: 'warning',
            category: 'Safety Alert',
            message: `AI CCTV detected driving without a helmet at ${currentUser?.gateName || 'VMES Entry Gate'}. 10-point safety deduction applied.`,
            date: currentUser.violationDate || 'Today',
            location: 'VMES Entry Gate',
            plate: currentUser.plate || 'Campus Pass',
            scoreDeducted: 10,
            unread: true
          });
        }

        if (Array.isArray(anns) && anns.length > 0) {
          anns.forEach(ann => {
            // Target audience filtering
            let isTarget = true;
            if (ann.target_audience === 'all_students' && currentUser?.role === 'staff') {
              isTarget = false;
            } else if (ann.target_audience === 'individual_student' || ann.target_audience === 'individual_staff') {
              const targetStr = (ann.target_user || '').toLowerCase().trim();
              const userEmail = (currentUser?.email || '').toLowerCase();
              const userName = (currentUser?.name || '').toLowerCase();
              const studentId = (currentUser?.studentId || '').toLowerCase();
              
              if (targetStr && !userEmail.includes(targetStr) && !userName.includes(targetStr) && !studentId.includes(targetStr)) {
                isTarget = false;
              }
            }

            if (isTarget) {
              notiList.push({
                id: `NOTI-${ann.id}`,
                title: ann.title,
                type: 'announcement',
                category: 'Campus Notice',
                message: ann.content,
                date: ann.date || 'Today',
                location: 'Campus Announcement',
                plate: 'Official Notice',
                scoreDeducted: 0,
                unread: true
              });
            }
          });
        }

        setDynamicNotis(notiList);
      } catch (e) {
        console.warn('Error loading notification announcements:', e);
      }
    };

    loadNotis();
  }, [visible, currentUser]);

  const notifications = dynamicNotis.length > 0 ? dynamicNotis : [
    {
      id: 'NOTI-101',
      title: 'No Helmet Violation Detected',
      type: 'warning',
      category: 'Safety Alert',
      message: 'AI CCTV detected driving without a helmet at VMES Entry Gate. 10-point safety deduction applied.',
      date: '08:22 AM',
      location: 'VMES Entry Gate',
      plate: '1AB-9999',
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
    if (type === 'warning') return { name: 'warning-outline', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    if (type === 'announcement') return { name: 'megaphone-outline', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    return { name: 'notifications-outline', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' };
  };

  const handleOpenDetail = (item) => {
    if (item.type === 'warning' || item.category === 'Safety Alert') {
      setShowDrivingScoreModal(true);
    } else {
      setSelectedAnnouncement({
        title: item.title,
        content: item.message,
        date: item.date,
        location: item.location || 'VMES Campus (General)',
        priority: 'normal',
        categoryLabel: item.category || 'Announcement'
      });
      setShowDetailModal(true);
    }
  };

  return (
    <>
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
                <Text style={{ color: '#dc2626', fontSize: 10, fontWeight: '800' }}>{notifications.length} NEW</Text>
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
                    backgroundColor: isActive ? '#2563eb' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: isActive ? '#2563eb' : '#e2e8f0'
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

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleOpenDetail(item)}
                      activeOpacity={0.7}
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
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: iconConfig.bg,
                            borderWidth: 1,
                            borderColor: iconConfig.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            marginTop: 2,
                            flexShrink: 0
                          }}
                        >
                          <Ionicons name={iconConfig.name} size={19} color={iconConfig.color} />
                        </View>

                        {/* Content */}
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8, lineHeight: 21 }} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 }}>{item.date}</Text>
                          </View>

                          <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }} numberOfLines={2}>
                            {item.message}
                          </Text>
                        </View>

                        {/* Arrow Indicator */}
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginTop: 3 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Announcement Detail Modal rendered inside parent Modal for iOS compatibility */}
        <AnnouncementDetailModal
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          announcement={selectedAnnouncement}
        />

        {/* Driving Safety Score Modal rendered when tapping Safety Alert */}
        <DrivingScoreModal
          visible={showDrivingScoreModal}
          onClose={() => setShowDrivingScoreModal(false)}
          currentUser={currentUser}
        />
      </Modal>
    </>
  );
}
