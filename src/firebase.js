import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; 
const firebaseConfig = {
  apiKey: "AIzaSyBYhyVrUfIiX-uRKMnAbjFqqCFr-9AsvLs",
  authDomain: "musicgen-karaoke.firebaseapp.com",
  projectId: "musicgen-karaoke",
  storageBucket: "musicgen-karaoke.firebasestorage.app",
  messagingSenderId: "786135645430",
  appId: "1:786135645430:web:e4fc89020a83dcc02180d7"
};

const app = initializeApp(firebaseConfig);

// Inicializamos Realtime Database en lugar de Firestore
export const db = getDatabase(app); 

export default app;