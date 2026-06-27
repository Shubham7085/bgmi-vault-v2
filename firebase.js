import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoWlbIxQ7wN7slOzGMgX1rIetK2APzWRo",
  authDomain: "bgmi-vault-v2.firebaseapp.com",
  projectId: "bgmi-vault-v2",
  storageBucket: "bgmi-vault-v2.firebasestorage.app",
  messagingSenderId: "964151842471",
  appId: "1:964151842471:web:3a137736dce46bf57d2d82"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
