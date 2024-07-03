// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBX-eVlaGPz5gsy9PMEpt0oEcIRKhdG-g0",
  authDomain: "others-53f5c.firebaseapp.com",
  projectId: "others-53f5c",
  storageBucket: "others-53f5c.appspot.com",
  messagingSenderId: "934561466798",
  appId: "1:934561466798:web:1bdad870dc10e3e4bfa03f",
  measurementId: "G-LXMYD6JZEL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, analytics, auth };
