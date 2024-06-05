import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import CreditCard from '../components/CreditCard';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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

  const fetchCards = async () => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const cardsData = [];
      if (userData.creditCards) {
        const cardMap = new Map();

        userData.creditCards.forEach((card) => {
          const key = `${card.bank}-${card.cardBank}-${card.cardType}`;
          if (cardMap.has(key)) {
            const existingCard = cardMap.get(key);
            existingCard.amount += card.amount;
          } else {
            cardMap.set(key, {
              bank: card.bank,
              cardBank: card.cardBank,
              cardType: card.cardType,
              amount: card.amount,
              color: cardColors[card.cardBank] || cardColors.Cash,
              closingDate: card.closingDate ? new Date(card.closingDate.seconds * 1000) : moment().endOf('month').toDate(),
            });
          }
        });

        cardMap.forEach((value) => cardsData.push(value));
      }
      setCards(cardsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    
    // Set up a listener for real-time updates
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const cardsData = [];
        if (userData.creditCards) {
          const cardMap = new Map();

          userData.creditCards.forEach((card) => {
            const key = `${card.bank}-${card.cardBank}-${card.cardType}`;
            if (cardMap.has(key)) {
              const existingCard = cardMap.get(key);
              existingCard.amount += card.amount;
            } else {
              cardMap.set(key, {
                bank: card.bank,
                cardBank: card.cardBank,
                cardType: card.cardType,
                amount: card.amount,
                color: cardColors[card.cardBank] || cardColors.Cash,
                closingDate: card.closingDate ? new Date(card.closingDate.seconds * 1000) : moment().endOf('month').toDate(),
              });
            }
          });

          cardMap.forEach((value) => cardsData.push(value));
        }
        setCards(cardsData);
        setLoading(false);
      }
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  const updateCardClosingDate = (bank, cardBank, cardType, newClosingDate) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.bank === bank && card.cardBank === cardBank && card.cardType === cardType
          ? { ...card, closingDate: newClosingDate }
          : card
      )
    );
  };

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
        {cards.map((card, index) => (
          <div key={index} className="card-column">
            <div className="credit-cards-container">
              <CreditCard card={card} currentUser={currentUser} updateCardClosingDate={updateCardClosingDate} />
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