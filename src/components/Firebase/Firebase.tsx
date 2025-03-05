// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { analytics, auth, db};