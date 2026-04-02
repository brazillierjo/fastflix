import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@fastflix/push_token';
const NOTIFICATION_PERMISSION_ASKED_KEY =
  '@fastflix/notification_permission_asked';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E50914',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'd040206b-f26d-4432-a0fd-847ad637352f',
  });

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
  return token.data;
}

export async function shouldAskPermission(): Promise<boolean> {
  const asked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY);
  return asked !== 'true';
}

export async function markPermissionAsked(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger,
  });
}

// Schedule daily pick notification (every day at 6pm)
export async function scheduleDailyPickReminder(title: string, body: string) {
  // Cancel existing daily notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });
}
