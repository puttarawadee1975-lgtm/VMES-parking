import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnnouncementDetailModal({
  visible,
  onClose,
  announcement
}) {
  if (!announcement) return null;

  const getExplicitDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const str = String(dateStr).trim();

    if (str.toLowerCase().startsWith('today')) {
      return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (str.toLowerCase().startsWith('yesterday')) {
      const yesterday = new Date(Date.now() - 86400000);
      return yesterday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const datePart = str.split(',')[0].trim();
    const parsedDate = new Date(datePart);
    if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
      return parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return datePart || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const explicitDate = getExplicitDate(announcement.date);

  return (
    <Modal
      visible={Boolean(visible)}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              width: '100%',
              maxWidth: 480,
              maxHeight: '80%',
              padding: 24,
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
              overflow: 'hidden'
            }}
          >
            {/* Pop-Up Header Bar (Announcement Badge + Close Button) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#eff6ff',
                  borderWidth: 1,
                  borderColor: '#bfdbfe',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12
                }}
              >
                <Ionicons name="megaphone" size={13} color="#2563eb" style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Announcement
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="close" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Announcement Title */}
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 24, marginBottom: 8 }}>
              {announcement.title}
            </Text>

            {/* Date Tag */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                Posted: <Text style={{ fontWeight: '700', color: '#334155' }}>{explicitDate}</Text>
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 14 }} />

            {/* Content Scroll View */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingRight: 4, paddingBottom: 8 }}
            >
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' }}>
                {announcement.content}
              </Text>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

