import { FirebaseOptions, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

const firebaseConfig: FirebaseOptions | undefined = import.meta.env
  .VITE_FIREBASE_PROJECT_ID
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    }
  : undefined;

const app = firebaseConfig ? initializeApp(firebaseConfig) : undefined;

isSupported().then((supported) => {
  if (supported && app) {
    getAnalytics(app);
  }
});

export const logAnalyticsEvent = async (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (window.location.hostname === "localhost") return;

  const supported = await isSupported();
  if (!supported || !app) return;

  const analytics = getAnalytics(app);
  logEvent(analytics, eventName, eventParams);
};
