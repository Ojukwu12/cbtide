type FirebaseAppModule = typeof import('@firebase/app');
type FirebaseMessagingModule = typeof import('@firebase/messaging');

const FIREBASE_REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_VAPID_KEY',
] as const;

const FIREBASE_PLACEHOLDER_PATTERNS = [
  /^your_/i,
  /^your-/i,
  /your_project/i,
  /your_firebase/i,
  /your_messaging/i,
  /your_web_push/i,
  /placeholder/i,
  /changeme/i,
];

export type PushTokenFetchResult =
  | { status: 'unsupported' | 'missing-config' | 'permission-denied' | 'permission-default' | 'no-token'; token: null }
  | { status: 'ok'; token: string };

const hasFirebaseConfig = (): boolean =>
  FIREBASE_REQUIRED_KEYS.every((key) => {
    const value = import.meta.env[key];
    if (typeof value !== 'string') return false;

    const trimmed = value.trim();
    if (!trimmed) return false;

    return !FIREBASE_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
  });

export const isFirebaseMessagingConfigured = (): boolean => hasFirebaseConfig();

const isWebPushSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator
  );
};

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const loadMessagingModules = async (): Promise<{
  app: FirebaseAppModule;
  messaging: FirebaseMessagingModule;
}> => {
  const [app, messaging] = await Promise.all([
    import('@firebase/app'),
    import('@firebase/messaging'),
  ]);

  return { app, messaging };
};

const getMessagingInstance = async () => {
  const { app, messaging } = await loadMessagingModules();

  if (!(await messaging.isSupported())) {
    return null;
  }

  const firebaseApp = app.getApps().length ? app.getApp() : app.initializeApp(getFirebaseConfig());
  return messaging.getMessaging(firebaseApp);
};

const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
  if (existing) {
    return existing;
  }

  return navigator.serviceWorker.register('/firebase-messaging-sw.js');
};

export const getWebPushToken = async (): Promise<PushTokenFetchResult> => {
  if (!isWebPushSupported()) {
    return { status: 'unsupported', token: null };
  }

  if (!hasFirebaseConfig()) {
    return { status: 'missing-config', token: null };
  }

  if (Notification.permission === 'denied') {
    return { status: 'permission-denied', token: null };
  }

  if (Notification.permission !== 'granted') {
    return { status: 'permission-default', token: null };
  }

  const messagingInstance = await getMessagingInstance();
  if (!messagingInstance) {
    return { status: 'unsupported', token: null };
  }

  const registration = await getServiceWorkerRegistration();
  const token = await (await loadMessagingModules()).messaging.getToken(messagingInstance, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration ?? undefined,
  });

  if (!token) {
    return { status: 'no-token', token: null };
  }

  return { status: 'ok', token };
};
