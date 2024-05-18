import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from '../contexts/AuthContext';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const userExpensesCollection = collection(db, `users/${currentUser.uid}/expenses`);
    const q = query(userExpensesCollection);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesData);
      setLoading(false); // Terminar la carga después de obtener los datos
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteExpense = async (expenseId) => {
    try {
      const userExpensesCollection = collection(db, `users/${currentUser.uid}/expenses`);
      await deleteDoc(doc(userExpensesCollection, expenseId));
    } catch (error) {
      console.error("Error deleting expense: ", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Mostrar "Loading..." mientras se cargan los datos
  }

  return (
    <div>
      <h2>Your Expenses</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.description}: ${expense.amount}
            <button onClick={() => handleDeleteExpense(expense.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}