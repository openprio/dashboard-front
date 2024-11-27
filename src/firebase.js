import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrHWZUMm56-BiXYE9-AkK55Y5Uk_6f5Zs",
  authDomain: "openprio-80e7e.firebaseapp.com",
  projectId: "openprio-80e7e",
  storageBucket: "openprio-80e7e.appspot.com",
  messagingSenderId: "953925241260",
  appId: "1:953925241260:web:c28b17abc4e8e311e39209",
};

// Initialize Firebase
/** @global */
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

export { firebaseAuth, onAuthStateChanged };
