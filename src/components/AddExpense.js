import React, { useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore"; 
import { useAuth } from '../contexts/AuthContext';

export default function AddExpense() {
  const descriptionRef = useRef();
  const amountRef = useRef();
  const { currentUser } = useAuth();
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setError('');
      await addDoc(collection(db, 'expenses'), {
        description: descriptionRef.current.value,
        amount: parseFloat(amountRef.current.value),
        uid: currentUser.uid, // Asociar el expense con el uid del usuario
        createdAt: new Date()
      });
      // Limpiar campos después de agregar el expense
      descriptionRef.current.value = '';
      amountRef.current.value = '';
    } catch (error) {
      setError('Failed to add expense');
      console.error("Error adding expense: ", error);
    }
  }

  return (
    <div>
      <h2>Add Expense</h2>
      {error && <div>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Description</label>
        <input type="text" ref={descriptionRef} required />
        <label>Amount</label>
        <input type="number" ref={amountRef} required />
        <button type="submit">Add Expense</button>
      </form>
    </div>
  );
}