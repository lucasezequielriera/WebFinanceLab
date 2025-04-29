import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase"; // Importa db y storage
import { doc, getDoc } from "firebase/firestore"; // Importa Firestore
import { Spin } from 'antd';
import { Button } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import "../index.css"
import "../styles/UserProfile.css"; // Importa el archivo CSS

export default function UserProfile() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState()
    const [loading, setLoading] = useState(true); // Estado de carga

    const { t } = useTranslation();

    useEffect(() => {
        async function fetchUserData() {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                }
                setLoading(false); // Terminar la carga después de obtener los datos
            }
        }
        fetchUserData();
    }, [currentUser]);

    const WhatsAppButton = () => {
        const whatsappURL = `https://wa.me/+34627043397?text=${t('userProfile.aboutUs.whatsappMessage')}`;
      
        return (
          <Button
            color="green" variant="solid"
            icon={<WhatsAppOutlined />}
            onClick={() => window.open(whatsappURL, '_blank')}
          >
            {t('userProfile.aboutUs.whatsappButton')}
          </Button>
        );
    };

    return (
        <div className="container-page">
            <Spin spinning={loading}>
                <div className="user-profile">
                    <p style={{ whiteSpace: 'pre-line', marginTop: 10 }}>{t('userProfile.aboutUs.text')}</p>
                    <WhatsAppButton />
                </div>
            </Spin>
        </div>
    );
}
