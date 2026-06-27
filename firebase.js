import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3JzRln0nm4GHdCR5xbPhkbRRnzM6YE9Q",
  authDomain: "xenodochial-guide-1dzmz.firebaseapp.com",
  projectId: "xenodochial-guide-1dzmz",
  storageBucket: "xenodochial-guide-1dzmz.firebasestorage.app",
  messagingSenderId: "451641277004",
  appId: "1:451641277004:web:69b51c5c009ef3fe8352e9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-ac704ca8-ac3d-4200-8be6-943690a84d0c");
export const storage = getStorage(app);

// Re-export common functions so other files don't need to specify raw URLs
export {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  ref,
  uploadBytesResumable,
  getDownloadURL
};
