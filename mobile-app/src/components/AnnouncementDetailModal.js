import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnnouncementDetailModal({
  visible,
  onClose,
  announcement
}) {
  if (!announcement) return null;

  const isHighPriority = announcement.priority === 'high';
  const categoryLabel = announcement.categoryLabel || (isHighPriority ? 'HIGH PRIORITY' : 'NOTICE');
  const badgeBg = isHighPriority ? '#fef2f2' : '#eff6ff';
  const badgeBorder = isHighPriority ? '#fecaca' : '#bfdbfe';
  const badgeColor = isHighPriority ? '#dc2626' : '#2563eb';
  const iconName = isHighPriority ? 'warning' : 'megaphone';
  const iconColor = isHighPriority ? '#dc2626' : '#2563eb';

  const handleShare = async () => {
    try {
      await Share.share({
        title: announcement.title,
        message: `📌 [AU Smart Parking Announcement]\n\n${announcement.title}\n\n${announcement.content}\n\nDate: ${announcement.date || 'Today'}`
      });
    } catch (error) {
      console.warn('Error sharing announcement:', error);
    }
  };

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
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Top Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f1f5f9',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8
              }}
            >
              <Ionicons name="chevron-back" size={18} color="#0f172a" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Announcement</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: 680, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#64748b', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            {/* Announcement Title */}
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', lineHeight: 28, marginBottom: 12 }}>
              {announcement.title}
            </Text>

            {/* Posted Date Footer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                Date: <Text style={{ fontWeight: '700', color: '#334155' }}>{explicitDate}</Text>
              </Text>
            </View>
          </View>

          {/* Full Body Content Card */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#64748b', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Content
            </Text>

            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 24, fontWeight: '500' }}>
              {announcement.content}
            </Text>
          </View>


        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
