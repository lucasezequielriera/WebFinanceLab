import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import CreditCard from '../components/CreditCard';
import { collection, query, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import '../styles/Expenses.css'; // Asegúrate de crear este archivo para los estilos adicionales si es necesario

const cardColors = {
  Visa: 'linear-gradient(135deg, #1A1F71, #2E77BB)',
  MasterCard: 'linear-gradient(135deg, #ff2500, #ff9300)',
  'American Express': 'linear-gradient(135deg, #0080ff, #00d6ff)',
  Cash: '#4CAF50',
};

const Expenses = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchExpensesAndCards = async () => {
      const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
      const q = query(expensesRef, where('paymentMethod', 'in', ['Credit Card', 'Debit Card', 'Cash']));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const expensesData = [];
        const cardsData = [];

        // Fetch expenses
        snapshot.forEach((doc) => {
          const expense = doc.data();
          expensesData.push({
            id: doc.id,
            name: expense.category,
            type: expense.paymentMethod,
            bank: expense.bank,
            cardType: expense.cardType,
            amount: expense.amount,
            color: cardColors[expense.cardType] || cardColors.Cash,
          });
        });

        // Fetch cards
        const cardsSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (cardsSnapshot.exists()) {
          const userData = cardsSnapshot.data();
          if (userData.creditCards) {
            userData.creditCards.forEach((card) => {
              cardsData.push({
                bank: card.bank,
                cardType: card.cardType,
                closingDate: card.closingDate ? moment(card.closingDate.toDate()) : moment().endOf('month')
              });
            });
          }
        }

        // Combine expenses of the same bank and card type
        const combinedCards = expensesData.reduce((acc, expense) => {
          const key = `${expense.bank}-${expense.cardType}-${expense.type}`;
          if (!acc[key]) {
            // Find closing date for the card
            const card = cardsData.find(card => card.bank === expense.bank && card.cardType === expense.cardType);
            const closingDate = card ? card.closingDate : moment().endOf('month');

            acc[key] = { ...expense, closingDate };
          } else {
            acc[key].amount += expense.amount;
          }
          return acc;
        }, {});

        setCards(Object.values(combinedCards));
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchExpensesAndCards();
  }, [currentUser]);

  if (loading) {
    return (
      <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
      </Spin>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Credit Cards</h1>
      <div className="cards-container" style={{ marginTop: 24 }}>
        {cards.map((card) => (
          <div key={card.id} className="card-column">
            <div className="credit-cards-container">
              <CreditCard card={card} currentUser={currentUser} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <Button onClick={() => navigate('/detailed-expenses')} style={{ marginRight: 16 }}>
          Detailed Expenses
        </Button>
        <Button onClick={() => navigate('/general-expenses')}>
          General Expenses
        </Button>
      </div>
    </div>
  );
};

export default Expenses;
