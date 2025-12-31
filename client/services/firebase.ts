import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (import.meta.env.DEV) {
  const mask = (v: unknown) =>
    typeof v === "string" && v.length > 0 ? `loaded (${v.length} chars)` : "missing";
  console.log("🔎 Firebase env check:", {
    apiKey: mask(firebaseConfig.apiKey),
    authDomain: mask(firebaseConfig.authDomain),
    databaseURL: mask(firebaseConfig.databaseURL),
    projectId: mask(firebaseConfig.projectId),
    storageBucket: mask(firebaseConfig.storageBucket),
    messagingSenderId: mask(firebaseConfig.messagingSenderId),
    appId: mask(firebaseConfig.appId),
    measurementId: mask(firebaseConfig.measurementId),
  });
}

// Check if Firebase config is complete
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("⚠️ Firebase configuration is incomplete. Please add Firebase credentials to your .env file.");
  console.error("Required variables:");
  console.error("  - VITE_FIREBASE_API_KEY");
  console.error("  - VITE_FIREBASE_AUTH_DOMAIN");
  console.error("  - VITE_FIREBASE_DATABASE_URL");
  console.error("  - VITE_FIREBASE_PROJECT_ID");
  console.error("  - VITE_FIREBASE_STORAGE_BUCKET");
  console.error("  - VITE_FIREBASE_MESSAGING_SENDER_ID");
  console.error("  - VITE_FIREBASE_APP_ID");
}

let app;
let auth: Auth;
let database: Database;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
} catch (error: any) {
  console.error("❌ Firebase initialization error:", error.message || error);
  if (error.code === 'auth/invalid-api-key') {
    console.error("⚠️ Your Firebase API key is invalid. Please check your .env file.");
    console.error("   Get your Firebase config from: https://console.firebase.google.com/");
  }
  throw error;
}

export { auth, database };

export default app;
