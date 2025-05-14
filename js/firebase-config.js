// Firebase configuration file
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAPKCAhWh0-qf_mMYv2TbRZT7v9hKyXJA",
  authDomain: "m-house-d8a6e.firebaseapp.com",
  projectId: "m-house-d8a6e",
  storageBucket: "m-house-d8a6e.firebasestorage.app",
  messagingSenderId: "61730899773",
  appId: "1:61730899773:web:1141a38e6356151ba32754",
  measurementId: "G-G5VF653QNR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
