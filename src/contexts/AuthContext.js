import React, { useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
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
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
}
