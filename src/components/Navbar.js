import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Navbar.css'; // Importa el archivo CSS

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error('Failed to log out');
    }
  };

  console.log(currentUser)

  return (
    <nav>
      <h1>Finance Manager</h1>
      <div>
        {currentUser && (
          <>
            <span>Welcome, {currentUser.displayName}</span>
            <Link to="/profile">Profile</Link> {/* Enlace al perfil */}
            <Link to="/dashboard">Ir a dashboard</Link> {/* Enlace al dashboard */}
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </>
        )}
      </div>
    </nav>
  );
}