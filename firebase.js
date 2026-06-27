// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoWlbIxQ7wN7slOzGMgX1rIetK2APzWRo",
  authDomain: "bgmi-vault-v2.firebaseapp.com",
  projectId: "bgmi-vault-v2",
  storageBucket: "bgmi-vault-v2.firebasestorage.app",
  messagingSenderId: "964151842471",
  appId: "1:964151842471:web:3a137736dce46bf57d2d82"
};

const app = initializeApp(firebaseConfig);

console.log("Firebase Connected Successfully!");
