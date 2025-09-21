import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DashboardConfigContext = createContext();

export const useDashboardConfig = () => {
  const context = useContext(DashboardConfigContext);
  if (!context) {
    throw new Error('useDashboardConfig must be used within a DashboardConfigProvider');
  }
  return context;
};

export const DashboardConfigProvider = ({ children }) => {
  const [expenseViewMode, setExpenseViewMode] = useState('separated');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load configuration from Firebase on mount
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadUserConfig = async () => {
      try {
        const userConfigRef = doc(db, 'users', currentUser.uid, 'config', 'dashboard');
        const userConfigSnap = await getDoc(userConfigRef);
        
        if (userConfigSnap.exists()) {
          const config = userConfigSnap.data();
          setExpenseViewMode(config.expenseViewMode || 'separated');
        } else {
          // Si no existe configuración, crear una por defecto
          await setDoc(userConfigRef, {
            expenseViewMode: 'separated',
            lastUpdated: new Date()
          });
        }
      } catch (error) {
        console.error('Error loading dashboard configuration:', error);
        setExpenseViewMode('separated');
      } finally {
        setLoading(false);
      }
    };

    loadUserConfig();
  }, [currentUser]);

  // Save configuration to Firebase whenever it changes
  const updateExpenseViewMode = async (mode) => {
    if (!currentUser) return;
    
    setExpenseViewMode(mode);
    
    try {
      const userConfigRef = doc(db, 'users', currentUser.uid, 'config', 'dashboard');
      await setDoc(userConfigRef, {
        expenseViewMode: mode,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error saving dashboard configuration:', error);
    }
  };

  const value = {
    expenseViewMode,
    updateExpenseViewMode,
    loading
  };

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
};
