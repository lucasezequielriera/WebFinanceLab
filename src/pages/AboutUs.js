import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase"; // Importa db y storage
import { doc, getDoc } from "firebase/firestore"; // Importa Firestore
import { Spin } from 'antd';
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

    return (
        <Spin spinning={loading}>
            <div className="user-profile">
                <h2 className="title">About Us</h2>
                <p>Esta es una sección de la aplicacion donde vamos a mostrar cada detalle de la app, funcionalidades a implementar y un chat de ayuda para futuras implementaciones.</p>
            </div>
        </Spin>
    );
}
