import { initializeApp } from "firebase/app";
import { initializeAuth, browserSessionPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCx4V5S-NeaykbQEogW6Uj3W7PkS3rO714",
  authDomain: "finance-manager-d4589.firebaseapp.com",
  projectId: "finance-manager-d4589",
  storageBucket: "finance-manager-d4589.appspot.com",
  messagingSenderId: "767053171688",
  appId: "1:767053171688:web:43b332dee828fa36f0725d",
  measurementId: "G-SF43KHZV70"
};

const app = initializeApp(firebaseConfig);

let auth;

// 🛠️ Solución al error "Access to storage is not allowed from this context"
try {
  auth = initializeAuth(app, {
    persistence: browserSessionPersistence,
  });
} catch (error) {
  console.warn('Fallo persistencia, usando inMemory:', error);
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
  });
}

const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, db, storage, analytics };
