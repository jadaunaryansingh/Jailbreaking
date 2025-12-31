import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyADh92Vx3NHHXO0yOmBxh-dBdciRGVHvVk",
  authDomain: "jailbreaking-5d53a.firebaseapp.com",
  databaseURL: "https://jailbreaking-5d53a-default-rtdb.firebaseio.com",
  projectId: "jailbreaking-5d53a",
  storageBucket: "jailbreaking-5d53a.firebasestorage.app",
  messagingSenderId: "318192799618",
  appId: "1:318192799618:web:085e241ed729eff7fb099b",
  measurementId: "G-JK8X7BMETE",
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app);

export default app;
