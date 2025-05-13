import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import i18n from '../i18n';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedLanguage } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.language) {
              setSelectedLanguage(data.language);
              i18n.changeLanguage(data.language);
            }
          }
        } catch (error) {
          console.error("Error reading user language:", error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [setSelectedLanguage]);

  const signup = async (email, password, firstName, lastName) => {
    try {
      // Crear el usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizar el perfil del usuario con nombre y apellido
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Crear el documento del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        firstName,
        lastName,
        language: i18n.language,
        createdAt: new Date().toISOString(),
        user_access_level: 1 // Nivel de acceso por defecto
      });

      return user;
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.language) {
        setSelectedLanguage(data.language);
        i18n.changeLanguage(data.language);
      }
    }

    return user;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
