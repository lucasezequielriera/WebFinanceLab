import React, { useState, useEffect }                                   from 'react';
import { useNavigate }                                                  from 'react-router-dom';
import { Button, Spin, DatePicker, Empty }                              from 'antd';
import { doc, onSnapshot, updateDoc, collection, getDoc, query, where } from 'firebase/firestore';
import { db }                                                           from '../firebase';
import { useAuth }                                                      from '../contexts/AuthContext';
import { useTranslation }                                               from 'react-i18next';
import moment                                                           from 'moment';
import dayjs                                                            from 'dayjs';
import styled                                                           from 'styled-components';
import useMonthlyMovements                                              from '../hooks/useMonthlyMovements';
// Components
import CreditCard                                                       from '../components/CreditCard';
// Styles
import '../styles/Expenses.css';

const Expenses = () => {
  const [loading, setLoading]             = useState(true);
  const [cards, setCards]                 = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { hasExpenses } = useMonthlyMovements();
  
  const navigate = useNavigate();

  const cardColors = {
    Visa: 'linear-gradient(135deg, #1A1F71, #2E77BB)',
    MasterCard: 'linear-gradient(135deg, #ff2500, #ff9300)',
    'American Express': 'linear-gradient(135deg, #0080ff, #00d6ff)',
    Cash: 'linear-gradient(135deg, #00771A, #00BF5A)',
  };

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

    setLoading(false);

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

    await updateDoc(userDocRef, { creditCards: updatedCards });

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
    const debitCards  = cards.filter(card => card.cardType === 'Debit Card');
    const cashCards   = cards.filter(card => card.cardType === 'Cash');

    return { creditCards, debitCards, cashCards };
  };

  const { creditCards, debitCards, cashCards } = groupCardsByType(cards);

  const renderSection = (title, cards) => {
    if (cards.length === 0) return null;

    // Cards with title
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
    if (type.toLowerCase() === 'cash') {
      
      return t('userProfile.expenses.cashTitle');
    }
  
    const keyBase = `userProfile.expenses.${type.toLowerCase()}Card${count === 1 ? 'Title' : 'sTitle'}`;

    return t(keyBase);
  };

  const StyledDatePicker = styled(DatePicker)`
  input {
    margin: 0;
  }
`;

  return (
    <div className='container-page'>
      <Spin spinning={loading}>

        {hasExpenses ? <>

          {/* General & Detailed Expenses Buttons */}
          <div className='title-and-buttons' style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div className="buttons">
              <Button onClick={() => navigate('/general-expenses')}>
                {t('userProfile.expenses.generalExpensesButton')}
              </Button>
              <Button onClick={() => navigate('/detailed-expenses')}>
              {t('userProfile.expenses.detailedExpensesButton')}
              </Button>
            </div>
          </div>

          {/* Cards filter per month */}
          <div className="filter" style={{ marginBottom: 24 }}>
            <span style={{marginRight: 5 }}>{t('userProfile.expenses.filter')}</span> 
            <StyledDatePicker
              picker="month"
              allowClear={false}
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              style={{ margin: 0 }}
            />
          </div>

          {/* Card */}
          <div>
            <div className='cards margin-top-large margin-bottom-large'>
              {renderSection(getTitle('credit', creditCards.length), creditCards)}
            </div>
            <div className='cards margin-top-large margin-bottom-large'>
              {renderSection(getTitle('debit', debitCards.length), debitCards)}
            </div>
            <div className='cards margin-top-large margin-bottom-large'>
              {renderSection(getTitle('cash', cashCards.length), cashCards)}
            </div>
          </div>
        </> :

        // EMPTY DATA MESSAGE
        <div style={{ marginTop: 40 }}>
          <Empty description={t("No hay gastos registrados en este mes")} />
        </div>}

      </Spin>
    </div>
  );
};

export default Expenses;