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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      const userCredential = await signup(emailRef.current.value, passwordRef.current.value);
      await updateProfile(userCredential.user, {
        displayName: `${firstNameRef.current.value} ${lastNameRef.current.value}`
      });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        email: emailRef.current.value,
        age: '',
        city: '',
        gender: '',
        jobs: []
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error during signup:', err);
      setError('Failed to create an account');
    }

    setLoading(false);
  }

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <div>{error}</div>}
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
      <div>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
}