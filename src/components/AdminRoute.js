import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Spin } from 'antd';

const AdminRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setAllowed(false);
      return;
    }
    const checkAccess = async () => {
      try {
        const userDoc = await getDoc(doc(db, `users/${currentUser.uid}`));
        setAllowed(userDoc.exists() && userDoc.data().user_access_level === 0);
      } catch {
        setAllowed(false);
      }
    };
    checkAccess();
  }, [currentUser]);

  if (allowed === null) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default AdminRoute; 