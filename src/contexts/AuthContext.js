import React, { useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import i18n from '../i18n'; // 👈 Asegurate de importar i18n

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const language = data.language || 'es'; // 🇪🇸 Default a español
            i18n.changeLanguage(language);
          }
        } catch (error) {
          console.error("Error reading user language:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 👇 Guarda idioma por defecto al registrarse
    await setDoc(doc(db, "users", user.uid), {
      language: 'es'
    }, { merge: true });

    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
      const user = userCredential.user;
      setCurrentUser(user);
      return userCredential;
    });
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logout = () => {
    return signOut(auth).catch(error => {
      console.error("Error during logout:", error);
      throw error;
    });
  };

  const value = {
    currentUser,
    login,
    signup,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
