import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAiheydvwaMfz4MqGvYNIH6BmpE7G6xi84",
  authDomain: "connect-40e5f.firebaseapp.com",
  databaseURL: "https://connect-40e5f-default-rtdb.firebaseio.com/",
  projectId: "connect-40e5f",
  storageBucket: "connect-40e5f.firebasestorage.app",
  messagingSenderId: "1057950764972",
  appId: "1:1057950764972:web:b1611e9ddca5102cb8b409",
  measurementId: "G-37S68MYZDC",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
auth.useDeviceLanguage();