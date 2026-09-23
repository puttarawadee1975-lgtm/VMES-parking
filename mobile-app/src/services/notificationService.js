import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure Expo Notifications presentation handler so push banners show up on device
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Request Push Notification permissions on device
 */
export async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PUSH NOTIFICATION] Permission not granted for push notifications.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563eb',
      });
    }

    return true;
  } catch (err) {
    console.warn('[PUSH NOTIFICATION] Registration error:', err);
    return false;
  }
}

/**
 * Trigger a real local Push Notification alert on the user's phone
 */
export async function sendLocalPhonePushNotification({ title, body, data = {} }) {
  // Local push popup banners disabled by user request
  return;
}
