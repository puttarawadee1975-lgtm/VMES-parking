import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnnouncementDetailModal from './AnnouncementDetailModal';

export default function AllAnnouncementsModal({
  visible,
  onClose,
  announcements = [],
  initialAnnouncement = null
}) {
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  useEffect(() => {
    if (visible) {
      setSelectedDetailItem(initialAnnouncement);
    } else {
      setSelectedDetailItem(null);
    }
  }, [visible, initialAnnouncement]);

  if (!visible) return null;

  const handleCloseModal = () => {
    setSelectedDetailItem(null);
    onClose();
  };

  const sortedAnnouncements = React.useMemo(() => {
    return [...announcements].sort((a, b) => {
      const prioA = a.priority === 'high' ? 0 : 1;
      const prioB = b.priority === 'high' ? 0 : 1;
      if (prioA !== prioB) return prioA - prioB;

      const getTime = (item) => {
        if (item.created_at) {
          const t = new Date(item.created_at).getTime();
          if (!isNaN(t)) return t;
        }
        if (item.date) {
          const t = new Date(item.date).getTime();
          if (!isNaN(t)) return t;
          const match = String(item.date).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (match) {
            const t2 = new Date(`${match[1]}-${match[2]}-${match[3]}`).getTime();
            if (!isNaN(t2)) return t2;
          }
        }
        const idMatch = String(item.id || '').match(/\d+/);
        return idMatch ? parseInt(idMatch[0], 10) : 0;
      };
      return getTime(b) - getTime(a);
    });
  }, [announcements]);

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseModal}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0'
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
              Announcement
            </Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              Official campus news, updates & notices
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCloseModal}
            style={{
              padding: 8,
              backgroundColor: '#f1f5f9',
              borderRadius: 20
            }}
          >
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Clean Announcements List View */}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
            {sortedAnnouncements.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  paddingVertical: 40,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="megaphone-outline" size={36} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>
                  No Announcements Found
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>
                  There are no active campus announcements at this time.
                </Text>
              </View>
            ) : (
              sortedAnnouncements.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDetailItem(item)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 18,
                    padding: 16,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 1
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '800',
                        color: '#0f172a',
                        flex: 1,
                        marginRight: 8
                      }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                  </View>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#475569',
                      lineHeight: 18,
                      marginBottom: 12
                    }}
                    numberOfLines={2}
                  >
                    {item.content}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#f1f5f9'
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>
                      {item.date || 'Today'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Announcement Detail Modal - exact same component used by NotificationsModal */}
        <AnnouncementDetailModal
          visible={Boolean(selectedDetailItem)}
          onClose={() => setSelectedDetailItem(null)}
          announcement={selectedDetailItem}
        />
      </SafeAreaView>
    </Modal>
  );
}
