import { initializeApp, getApps, getApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-for-builds",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-domain-for-builds",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-for-builds",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-bucket-for-builds",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-for-builds",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id-for-builds",
  measurementId: "G-GGWHTZZSCY"
};
console
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
