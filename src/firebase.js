// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCx4V5S-NeaykbQEogW6Uj3W7PkS3rO714",
  authDomain: "finance-manager-d4589.firebaseapp.com",
  projectId: "finance-manager-d4589",
  storageBucket: "finance-manager-d4589.appspot.com",
  messagingSenderId: "767053171688",
  appId: "1:767053171688:web:43b332dee828fa36f0725d",
  measurementId: "G-SF43KHZV70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };