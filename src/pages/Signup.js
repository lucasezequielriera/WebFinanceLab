import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from "firebase/auth"; 
import { db } from '../firebase'; // Importa db
import { setDoc, doc } from "firebase/firestore"; // Importa Firestore

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado de carga
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      // Leer los valores de las referencias antes de cambiar el estado de loading
      const firstName = firstNameRef.current.value;
      const lastName = lastNameRef.current.value;
      const email = emailRef.current.value;
      const password = passwordRef.current.value;

      setLoading(true); // Iniciar la carga
      const userCredential = await signup(email, password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        age: '',
        city: '',
        gender: '',
        jobs: []
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error during signup:', err);
      setError('Failed to create an account');
      setLoading(false); // Terminar la carga en caso de error
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <div>{error}</div>}
      {loading ? (
        <div>Loading...</div> // Mostrar "Loading..." mientras se realiza el signup
      ) : (
        <form onSubmit={handleSubmit}>
          <label>First Name</label>
          <input type="text" ref={firstNameRef} required />
          <label>Last Name</label>
          <input type="text" ref={lastNameRef} required />
          <label>Email</label>
          <input type="email" ref={emailRef} required />
          <label>Password</label>
          <input type="password" ref={passwordRef} required />
          <button disabled={loading} type="submit">Sign Up</button>
        </form>
      )}
      <div>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
}