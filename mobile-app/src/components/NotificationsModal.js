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

import { getAnnouncements, getUserNotifications } from '../services/api';
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
        let notiList = [];
        const dbNotis = await getUserNotifications(currentUser?.email);
        
        if (Array.isArray(dbNotis) && dbNotis.length > 0) {
          dbNotis.forEach(item => {
            const isWarning = item.scoreDeducted > 0 || 
                              item.type === 'vmes_parking_warning' || 
                              item.type === 'helmet_violation' ||
                              (item.type && (item.type.includes('warning') || item.type.includes('penalty') || item.type.includes('violation')));

            notiList.push({
              id: item.id || `NOTI-${Math.random()}`,
              title: item.title,
              type: isWarning ? 'warning' : 'announcement',
              rawType: item.type,
              category: item.category || (isWarning ? 'Safety Alert' : 'Campus Notice'),
              message: item.message,
              date: item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Today',
              location: item.zone || item.location || 'VMES Building',
              plate: item.plate || 'Campus Pass',
              scoreDeducted: item.scoreDeducted !== undefined ? item.scoreDeducted : (item.type && (item.type.includes('penalty') || item.type.includes('violation')) ? 10 : 0),
              unread: !item.read
            });
          });
        }

        const anns = await getAnnouncements();

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

  const notifications = dynamicNotis;

  const filteredNotis = notifications.filter(n => {
    if (selectedFilter === 'SAFETY') {
      return (
        n.category === 'Safety Alert' ||
        n.rawType === 'helmet_violation' ||
        (n.title && n.title.toLowerCase().includes('helmet'))
      );
    }
    if (selectedFilter === 'PARKING') {
      return (
        n.category === 'Parking Alert' ||
        (n.title && (n.title.toLowerCase().includes('vmes') || n.title.toLowerCase().includes('parking')))
      );
    }
    if (selectedFilter === 'ADMIN') {
      return (
        n.type === 'announcement' ||
        n.category === 'Campus Notice' ||
        n.category === 'Admin Announcement'
      );
    }
    return true;
  });

  const getIcon = (item) => {
    const rawType = item.rawType || '';
    const type = item.type || '';

    if (rawType === 'helmet_violation' || (type === 'warning' && item.scoreDeducted > 0 && item.category === 'Safety Alert')) {
      return { name: 'shield-outline', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    }
    if (type === 'announcement') {
      return { name: 'megaphone-outline', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    }
    return { name: 'notifications-outline', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
  };

  const handleOpenDetail = (item) => {

    if (item.type === 'warning' || item.category === 'Safety Alert' || item.scoreDeducted > 0) {
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

          {/* Horizontal Scrollable Filter Tabs Bar */}
          <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 8 }}
            >
              {[
                { key: 'ALL', label: 'All' },
                { key: 'SAFETY', label: 'Safety Alerts' },
                { key: 'PARKING', label: 'Parking Alerts' },
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
            </ScrollView>
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
                  const iconConfig = getIcon(item);
                  const isClickable = true;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleOpenDetail(item)}
                      activeOpacity={isClickable ? 0.7 : 1}
                      style={{
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: item.scoreDeducted > 0 ? '#fecaca' : '#e2e8f0',
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
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginRight: 8 }}>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', lineHeight: 21 }}>
                                {item.title}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 }}>{item.date}</Text>
                          </View>

                          <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: item.scoreDeducted > 0 ? 8 : 0 }}>
                            {item.message}
                          </Text>

                          {item.scoreDeducted > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fee2e2', marginTop: 4 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="location-outline" size={12} color="#64748b" />
                                <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>{item.location || 'VMES Building'}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="alert-circle-outline" size={12} color="#dc2626" />
                                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '800' }}>-10 Points Deducted</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        {/* Arrow Indicator (Rendered only for clickable items) */}
                        {isClickable && (
                          <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginTop: 3 }} />
                        )}
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
