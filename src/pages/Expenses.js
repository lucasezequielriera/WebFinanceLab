import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, DatePicker, Empty } from 'antd';
import CreditCard from '../components/CreditCard';
import { doc, onSnapshot, updateDoc, collection, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import dayjs from 'dayjs';
import styled from 'styled-components';
import '../styles/Expenses.css';

const cardColors = {
  Visa: 'linear-gradient(135deg, #1A1F71, #2E77BB)',
  MasterCard: 'linear-gradient(135deg, #ff2500, #ff9300)',
  'American Express': 'linear-gradient(135deg, #0080ff, #00d6ff)',
  Cash: 'linear-gradient(135deg, #00771A, #00BF5A)',
};

const Expenses = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const startOfMonth = selectedMonth.startOf('month').toDate();
    const endOfMonth = selectedMonth.endOf('month').toDate();

    const userExpensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const expensesQuery = query(userExpensesRef, where('timestamp', '>=', startOfMonth), where('timestamp', '<=', endOfMonth));

    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => doc.data());

      updateCreditCards(expensesData);
    });

    setTimeout(() => {
      setLoading(false);
    }, 1000)

    return () => unsubscribe();
  }, [currentUser, selectedMonth]);

  const updateCreditCards = (expenses) => {
    const cardMap = new Map();

    expenses.forEach((expense) => {
      if (expense.bank && expense.cardType && expense.paymentMethod && expense.currency && !isNaN(expense.amount)) {
        const key = `${expense.bank}-${expense.cardType}-${expense.paymentMethod}`;
        if (cardMap.has(key)) {
          const existingCard = cardMap.get(key);
          if (!existingCard.amounts[expense.currency]) {
            existingCard.amounts[expense.currency] = 0;
          }
          existingCard.amounts[expense.currency] += parseFloat(expense.amount);
        } else {
          cardMap.set(key, {
            bank: expense.bank,
            cardBank: expense.cardType,
            cardType: expense.paymentMethod,
            amounts: {
              [expense.currency]: parseFloat(expense.amount),
            },
            color: cardColors[expense.cardType] || cardColors.Cash,
            closingDate: moment().endOf('month').toDate(),
          });
        }
      }
    });

    const cardsData = Array.from(cardMap.values()).map(card => {
      card.amounts = Object.entries(card.amounts).map(([currency, amount]) => ({
        currency,
        amount: amount.toFixed(2),
      }));
      return card;
    });

    // Ordenar las tarjetas alfabéticamente por el nombre del banco
    cardsData.sort((a, b) => a.bank.localeCompare(b.bank));

    setCards(cardsData);

    // Ensure no undefined values before updating document
    const validCardsData = cardsData.map(card => {
      const validAmounts = card.amounts.filter(amount => amount.currency && amount.amount !== undefined);
      return {
        ...card,
        amounts: validAmounts,
      };
    });

    const userDocRef = doc(db, "users", currentUser.uid);
    updateDoc(userDocRef, { creditCards: validCardsData }).catch(error => {
      console.error("Error updating document:", error);
    });
  };

  const updateCardClosingDate = async (bank, cardBank, cardType, newClosingDate) => {
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const updatedCards = userData.creditCards.map((c) => {
      if (c.bank === bank && c.cardBank === cardBank && c.cardType === cardType) {
        return { ...c, closingDate: newClosingDate };
      }
      return c;
    });
    await updateDoc(userDocRef, {
      creditCards: updatedCards,
    });
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.bank === bank && card.cardBank === cardBank && card.cardType === cardType
          ? { ...card, closingDate: newClosingDate }
          : card
      )
    );
  };

  const groupCardsByType = (cards) => {
    const creditCards = cards.filter(card => card.cardType === 'Credit Card');
    const debitCards = cards.filter(card => card.cardType === 'Debit Card');
    const cashCards = cards.filter(card => card.cardType === 'Cash');

    return { creditCards, debitCards, cashCards };
  };

  const { creditCards, debitCards, cashCards } = groupCardsByType(cards);

  const renderSection = (title, cards) => {
    if (cards.length === 0) return null;
    return (
      <div className="card-section">
        <h2>{title}</h2>
        <div className="cards-container">
          {cards.map((card, index) => (
            <div key={index} className="card-column">
              <div className="credit-cards-container">
                <CreditCard card={card} currentUser={currentUser} updateCardClosingDate={updateCardClosingDate} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTitle = (type, count) => {
    return count > 1 ? `${type} Cards` : `${type} Card`;
  };

  const noCards = creditCards.length === 0 && debitCards.length === 0 && cashCards.length === 0;

  const StyledDatePicker = styled(DatePicker)`
  input {
    margin: 0;
  }
`;

  return (
    <Spin spinning={loading}>
      <div className='title-and-buttons' style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 className='title'>Expenses</h1>
        <div className="buttons">
          <Button onClick={() => navigate('/general-expenses')}>
            General Expenses
          </Button>
          <Button onClick={() => navigate('/detailed-expenses')}>
            Detailed Expenses
          </Button>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <span style={{marginRight: 5 }}>Filter:</span> 
        <StyledDatePicker
          picker="month"
          allowClear={false} // ✅ con esto ya no te tira error
          value={selectedMonth}
          onChange={(value) => setSelectedMonth(value)}
          style={{ margin: 0 }}
        />
      </div>
      { noCards ? (
        <div style={{ marginTop: 40 }}>
          <Empty description="No hay gastos registrados en este mes" />
        </div>
        ) : (
          <>
            <div className='cards margin-top-large margin-bottom-large'>
              {renderSection(getTitle('Credit', creditCards.length), creditCards)}
            </div>
            <div className='cards margin-top-large margin-bottom-large'>
              {renderSection(getTitle('Debit', debitCards.length), debitCards)}
            </div>
            <div className='cards margin-top-large margin-bottom-large'>
              {renderSection(getTitle('Cash', cashCards.length), cashCards)}
            </div>
          </>
        )
      }
    </Spin>
  );
};

export default Expenses;