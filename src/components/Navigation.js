import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { Title } = Typography;

const Navigation = () => {
  const { currentUser } = useAuth();
  const [accessLevel, setAccessLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setAccessLevel(null);
      setLoading(false);
      return;
    }
    const fetchAccessLevel = async () => {
      try {
        const userDoc = await getDoc(doc(db, `users/${currentUser.uid}`));
        setAccessLevel(userDoc.exists() ? userDoc.data().user_access_level : null);
      } catch {
        setAccessLevel(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAccessLevel();
  }, [currentUser]);

  return (
    <div className="navigation">
      {loading ? (
        <Spin size="small" />
      ) : accessLevel === 0 ? (
        <Link to="/web-finance-lab" className="logo">
          <Title level={4} style={{ margin: 0, color: '#fff' }}>WebFinanceLab</Title>
        </Link>
      ) : (
        <span className="logo">
          <Title level={4} style={{ margin: 0, color: '#fff' }}>WebFinanceLab</Title>
        </span>
      )}
    </div>
  );
};

export default Navigation; 