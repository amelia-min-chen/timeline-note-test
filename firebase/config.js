// Firebase 配置
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPP3YifC13137gJRBmKZ-BDhQUPZiElp0",
  authDomain: "lifetimeline-250421.firebaseapp.com",
  projectId: "lifetimeline-250421",
  storageBucket: "lifetimeline-250421.firebasestorage.app",
  messagingSenderId: "1051928994645",
  appId: "1:1051928994645:web:67f6a00d0a0ed7954b05dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 獲取 Firestore 實例
const db = getFirestore(app);

export { db }; 