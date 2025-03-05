import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQ7U-k9shTtwdSK7u5bQ52GYGpbjqLJNo",
  authDomain: "asistencia-vacacional.firebaseapp.com",
  projectId: "asistencia-vacacional",
  storageBucket: "asistencia-vacacional.firebasestorage.app",
  messagingSenderId: "675931566823",
  appId: "1:675931566823:web:576daf0b4abf0cc2346842",
  measurementId: "G-LQ2XJZPL58",
  databaseURL: "https://default.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db};