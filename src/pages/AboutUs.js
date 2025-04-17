import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase"; // Importa db y storage
import { doc, getDoc } from "firebase/firestore"; // Importa Firestore
import { Spin } from 'antd';
import { Button } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import "../index.css"
import "../styles/UserProfile.css"; // Importa el archivo CSS

export default function UserProfile() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState()
    const [loading, setLoading] = useState(true); // Estado de carga

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
        const whatsappURL = 'https://wa.me/+34627043397?text=¡Hola! Quiero dejar una sugerencia para Web Finance.';
      
        return (
          <Button
            color="green" variant="solid"
            icon={<WhatsAppOutlined />}
            onClick={() => window.open(whatsappURL, '_blank')}
          >
            Send by Whatsapp
          </Button>
        );
    };

    return (
        <Spin spinning={loading}>
            <div className="user-profile">
                <h2 className="title">About Us</h2>
                <p>At WebFinanceLab, we believe that personal finance should not be a mystery or a burden. We were born with a clear mission: to help you take control of your money simply, visually and from anywhere in the world.</p>
                <p>We are a team passionate about technology, design and finance. We created an intuitive, modern and accessible platform, designed for real people who want to organize their income, control their expenses and achieve their financial goals without complications.</p>
                <p>Every feature of Web Finance was designed to make your life easier: from recording your daily expenses with a single click, to visualizing your financial health in clear and motivating graphs. We want to make making decisions about your money as easy as using your favorite app.</p>
                <p>This is just the beginning. We keep growing, learning and improving every day, driven by the community that trusts us.</p>
                <p>WebFinanceLab: Your money, under control.</p>
                <WhatsAppButton />
            </div>
        </Spin>
    );
}
