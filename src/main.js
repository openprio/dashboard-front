import './app.css'
import App from './App.svelte'
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import Dashboard from "./views/Dashboard.svelte";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrHWZUMm56-BiXYE9-AkK55Y5Uk_6f5Zs",
  authDomain: "openprio-80e7e.firebaseapp.com",
  projectId: "openprio-80e7e",
  storageBucket: "openprio-80e7e.appspot.com",
  messagingSenderId: "953925241260",
  appId: "1:953925241260:web:c28b17abc4e8e311e39209"
};

// Initialize Firebase
/** @global */
window.firebaseApp = initializeApp(firebaseConfig);

window.component = Dashboard;

const app = new App({
  target: document.getElementById('app'),
})

export default app
