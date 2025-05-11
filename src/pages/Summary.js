import React, { useState, useEffect }                                   from 'react';
import { Spin, Empty, DatePicker, message } from 'antd';
import { doc, onSnapshot, updateDoc, collection, getDoc, query, where } from 'firebase/firestore';
import { db }                                                           from '../firebase';
import { useAuth }                                                      from '../contexts/AuthContext';
import { useTranslation }                                               from 'react-i18next';
import moment                                                           from 'moment';
import dayjs                                                            from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import enUS from 'antd/es/date-picker/locale/en_US';
import esES from 'antd/es/date-picker/locale/es_ES';
import useMonthlyMovements                                              from '../hooks/useMonthlyMovements';
// Styles
import '../styles/Expenses.css';
import { EditOutlined, FilterOutlined } from '@ant-design/icons';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const Summary = () => {
  const [loading, setLoading]             = useState(true);
  const [cards, setCards]                 = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasExpenses } = useMonthlyMovements();
  
  const cardColors = {
    Visa: 'linear-gradient(135deg,rgb(106, 114, 255),rgb(112, 186, 255))',
    MasterCard: 'linear-gradient(135deg,rgb(250, 127, 39),rgb(255, 187, 92))',
    'American Express': 'linear-gradient(135deg,rgb(61, 158, 255),rgb(158, 239, 255))',
    Cash: 'linear-gradient(135deg,rgb(0, 201, 104),rgb(105, 255, 175))',
  };

  useEffect(() => {
    if (!currentUser) return;

    const safeMonth = selectedMonth || dayjs();
    const startOfMonth = safeMonth.startOf('month').toDate();
    const endOfMonth = safeMonth.endOf('month').toDate();

    const userExpensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const expensesQuery = query(userExpensesRef, where('timestamp', '>=', startOfMonth), where('timestamp', '<=', endOfMonth));

    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => doc.data());

      updateCreditCards(expensesData);
    });

    setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => unsubscribe();
  }, [currentUser, selectedMonth ]);

  // Al cargar las tarjetas, asegura que cada tarjeta de crédito tenga closingDate
  useEffect(() => {
    const ensureCreditCardClosingDates = async () => {
      if (!currentUser) return;
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) return;
      const cards = userDoc.data().creditCards || [];
      let changed = false;
      const updated = cards.map(card => {
        if (card.cardType === 'Credit Card') {
          if (!card.closingDate || isNaN(new Date(card.closingDate))) {
            changed = true;
            return { ...card, closingDate: moment().endOf('month').toDate().toISOString() };
          }
        }
        // Elimina closingDate de débito/cash si existe
        if (card.cardType !== 'Credit Card' && card.closingDate !== undefined) {
          const { closingDate, ...rest } = card;
          return rest;
        }
        return card;
      });
      if (changed) {
        await updateDoc(userDocRef, { creditCards: cleanUndefined(updated) });
      }
    };
    ensureCreditCardClosingDates();
  }, [currentUser]);

  // Obtiene el array global de tarjetas del usuario
  async function getUserCreditCards() {
    if (!currentUser) return [];
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      // Solo deja closingDate en tarjetas de crédito
      return (userDoc.data().creditCards || []).map(card => {
        if (card.cardType === 'Credit Card') return card;
        // Elimina closingDate si existe en débito/cash
        const { closingDate, ...rest } = card;
        return rest;
      });
    }
    return [];
  }

  // Reconstruye las tarjetas del mes, usando el closingDate global solo para crédito
  const updateCreditCards = async (expenses) => {
    const cardMap = new Map();
    const globalCards = await getUserCreditCards();
    let updatedGlobalCards = [...globalCards];

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
          let closingDate = undefined;
          if (expense.paymentMethod === 'Credit Card') {
            // Busca el closingDate solo para tarjetas de crédito
            const prev = globalCards.find(c => c.bank === expense.bank && c.cardBank === expense.cardType && c.cardType === expense.paymentMethod);
            closingDate = prev && prev.closingDate ? prev.closingDate : moment().endOf('month').toDate().toISOString();
            // Si la tarjeta no existe en el array global, agregarla
            if (!prev) {
              updatedGlobalCards.push({
                bank: expense.bank,
                cardBank: expense.cardType,
                cardType: 'Credit Card',
                closingDate: closingDate
              });
            }
          }
          cardMap.set(key, {
            bank: expense.bank,
            cardBank: expense.cardType,
            cardType: expense.paymentMethod,
            amounts: {
              [expense.currency]: parseFloat(expense.amount),
            },
            color: cardColors[expense.cardType] || cardColors.Cash,
            ...(expense.paymentMethod === 'Credit Card' ? { closingDate } : {}),
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

    // Actualiza el array global creditCards SOLO para tarjetas de crédito
    const userDocRef = doc(db, "users", currentUser.uid);
    // Solo actualiza closingDate de las tarjetas de crédito que aparecen este mes
    updatedGlobalCards = updatedGlobalCards.map(gc => {
      if (gc.cardType === 'Credit Card') {
        const match = cardsData.find(cd => cd.bank === gc.bank && cd.cardBank === gc.cardBank && cd.cardType === 'Credit Card');
        if (match) {
          return { ...gc, closingDate: match.closingDate };
        }
        return gc;
      } else {
        // Elimina closingDate si existe en débito/cash
        const { closingDate, ...rest } = gc;
        return rest;
      }
    });
    await updateDoc(userDocRef, { creditCards: cleanUndefined(updatedGlobalCards) });
  };

  // Edita solo el closingDate de la tarjeta de crédito correspondiente
  const updateCardClosingDate = async (bank, cardBank, cardType, newClosingDate) => {
    if (cardType !== 'Credit Card') return;
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const updatedCards = (userData.creditCards || []).map((c) => {
      if (c.bank === bank && c.cardBank === cardBank && c.cardType === 'Credit Card') {
        let dateVal = newClosingDate;
        if (!dateVal || (typeof dateVal === 'string' && isNaN(new Date(dateVal)))) {
          dateVal = moment().endOf('month').toDate();
        } else if (typeof dateVal === 'string') {
          const parsed = new Date(dateVal);
          dateVal = isNaN(parsed) ? moment().endOf('month').toDate() : parsed;
        } else if (typeof dateVal === 'object' && dateVal !== null && typeof dateVal.toDate === 'function') {
          dateVal = dateVal.toDate();
        } else if (!(dateVal instanceof Date)) {
          dateVal = new Date(dateVal);
        }
        // Convertir a string ISO antes de guardar
        return { ...c, closingDate: dateVal.toISOString() };
      }
      // Elimina closingDate si no es crédito
      if (c.cardType !== 'Credit Card' && c.closingDate !== undefined) {
        const { closingDate, ...rest } = c;
        return rest;
      }
      return c;
    });
    await updateDoc(userDocRef, { creditCards: cleanUndefined(updatedCards) });
    // Actualiza el estado local para reflejar el cambio inmediato
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.bank === bank && card.cardBank === cardBank && card.cardType === 'Credit Card'
          ? { ...card, closingDate: newClosingDate }
          : card
      )
    );
  };

  // Nuevo componente para chips de métodos de pago
  const PaymentMethodChip = ({ card, isSelected, onClick }) => {
    const getLogo = (type) => {
      switch (type) {
        case 'Visa':
          return <img src="https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Fvisa.png?alt=media&token=0af963f5-4b62-4d71-aee0-c1c25dde7290" alt="Visa" style={{ height: 22, marginBottom: 2 }} />;
        case 'MasterCard':
          return <img src="https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Fmastercard.png?alt=media&token=1d150640-6fe9-4466-a6c8-9fb2e0a3d92e" alt="MasterCard" style={{ height: 22, marginBottom: 2 }} />;
        case 'American Express':
          return <img src="https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Famericanexpress.png?alt=media&token=ec68eff4-dbde-4c81-93e8-5d1b0a851e05" alt="Amex" style={{ height: 22, marginBottom: 2 }} />;
        default:
          return null;
      }
    };
    const getCardTypeText = (type) => {
      switch (type) {
        case 'Credit Card':
          return 'Crédito';
        case 'Debit Card':
          return 'Débito';
        case 'Cash':
          return 'Cash';
        default:
          return type;
      }
    };
    // Si es efectivo, no hay botón
    if (card.cardBank === 'Cash') {
      return null;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 0 }}>
        <button
          onClick={() => onClick(card)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: isSelected ? '#1890ff' : '#232733',
            color: '#fff',
            borderRadius: 16,
            padding: '8px 16px 6px 16px',
            fontWeight: 600,
            fontSize: 16,
            boxShadow: '0 2px 8px #0002',
            minWidth: 60,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: 2
          }}
        >
          {getLogo(card.cardBank)}
          <span style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{getCardTypeText(card.cardType)}</span>
        </button>
      </div>
    );
  };

  const PaymentMethodsBar = ({ cards, selectedCard, onCardSelect, i18n, updateCardClosingDate, setSelectedCard }) => {
    if (cards.length === 1 && cards[0].bank === 'N/A') return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, margin: '18px 0 18px 0' }}>
        {cards.map((card, idx) => (
          <PaymentMethodChip
            key={idx}
            card={card}
            isSelected={
              selectedCard &&
              selectedCard.bank === card.bank &&
              selectedCard.cardBank === card.cardBank &&
              selectedCard.cardType === card.cardType
            }
            onClick={onCardSelect}
            i18n={i18n}
            updateCardClosingDate={updateCardClosingDate}
            setSelectedCard={setSelectedCard}
          />
        ))}
      </div>
    );
  };

  const PaymentSummaryCard = ({ title, cards, showClosing, t, i18n }) => {
    const [selectedCard, setSelectedCard] = useState(cards[0] || null);
    const [editingDate, setEditingDate] = useState(false);
    const [tempDate, setTempDate] = useState(null);

    // Calcula totales para la tarjeta seleccionada o para todas si no hay selección
    const calculateTotals = (cards) => {
      let totalARS = 0, totalUSD = 0;
      const cardsToSum = selectedCard 
        ? cards.filter(c => c.cardBank === selectedCard.cardBank)
        : cards;

      cardsToSum.forEach(card => {
        card.amounts.forEach(a => {
          if (a.currency === 'ARS') totalARS += Number(a.amount);
          if (a.currency === 'USD') totalUSD += Number(a.amount);
        });
      });
      return { totalARS, totalUSD };
    };

    const { totalARS, totalUSD } = calculateTotals(cards);

    // Determina si hay botones
    const hasButtons = !(cards.length === 1 && cards[0].bank === 'N/A');

    return (
      <div
        className="payment-summary-card"
        style={{
          background: 'rgb(10 20 47)',
          borderRadius: 18,
          padding: 32,
          boxShadow: '0 2px 16px #0003',
          minWidth: 280,
          maxWidth: 420,
          flex: '1 1 340px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 8 }}>
          {title === 'N/A' ? 'Efectivo' : title}
        </div>
        {/* Área de botones, siempre ocupa el mismo espacio */}
        <div style={{ minHeight: 54, margin: '18px 0' }}>
          {hasButtons ? (
            <PaymentMethodsBar
              cards={cards}
              selectedCard={selectedCard}
              onCardSelect={setSelectedCard}
              i18n={i18n}
              updateCardClosingDate={updateCardClosingDate}
              setSelectedCard={setSelectedCard}
            />
          ) : (
            <div style={{ height: 36 }} />
          )}
        </div>
        {/* Fecha de cierre: si la tarjeta seleccionada es de crédito, mostrar aquí */}
        {selectedCard && selectedCard.cardType === 'Credit Card' && selectedCard.closingDate ? (
          <div style={{ color: '#bfc2ce', fontSize: 18, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
            {i18n.language === 'en' ? 'Closing on' : 'Cierra el'} {i18n.language === 'en' ? dayjs(selectedCard.closingDate).format('MMM D') : dayjs(selectedCard.closingDate).format('D [de] MMMM')}
            <EditOutlined
              style={{ cursor: 'pointer', fontSize: 22, color: '#1890ff' }}
              onClick={() => {
                setEditingDate(true);
                setTempDate(selectedCard.closingDate);
              }}
            />
            {editingDate && (
              <DatePicker
                open
                value={dayjs(tempDate)}
                onChange={async val => {
                  setTempDate(val);
                  setEditingDate(false);
                  if (val) {
                    const fechaString = val.format('YYYY-MM-DD');
                    await updateCardClosingDate(selectedCard.bank, selectedCard.cardBank, selectedCard.cardType, fechaString);
                    setSelectedCard({ ...selectedCard, closingDate: fechaString });
                    message.success('Fecha de cierre actualizada');
                  }
                }}
                onOpenChange={open => { if (!open) setEditingDate(false); }}
                format={i18n.language === 'en' ? 'MMM D' : 'D [de] MMMM'}
                style={{ marginLeft: 8 }}
                getPopupContainer={trigger => trigger.parentNode}
              />
            )}
          </div>
        ) : (
          <div style={{ minHeight: 32, margin: '8px 0 0 0' }} />
        )}
        <div style={{ display: 'flex', gap: 3, fontWeight: 700, fontSize: 28, flexDirection: 'column' }}>
          <span style={{ borderTop: '1px solid #232733', margin: '18px 0' }} />
          <span style={{ color: '#4d8cff' }}>{`ARS ${totalARS.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US')}`}</span>
          <span style={{ color: '#6be6b2' }}>{`USD ${totalUSD.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US')}`}</span>
        </div>
      </div>
    );
  };

  // Limpia undefined de objetos/arrays
  function cleanUndefined(obj) {
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefined);
    } else if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, cleanUndefined(v)])
      );
    }
    return obj;
  }

  useEffect(() => {
    // Configurar el locale de dayjs según el idioma
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  // Agrupa las tarjetas por banco
  const groupCardsByBank = (cards) => {
    const bankMap = {};
    cards.forEach(card => {
      if (!bankMap[card.bank]) bankMap[card.bank] = [];
      bankMap[card.bank].push(card);
    });
    return bankMap;
  };

  return (
    <>
      <div className='container-page'>
        <Spin spinning={loading}>

          {hasExpenses ? <>

            {/* Cards filter per month */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: 16,
              maxWidth: '250px',
              width: '100%',
              paddingBottom: 1
            }}>
              <FilterOutlined style={{ 
                fontSize: '20px', 
                color: '#1890ff',
                marginRight: '8px'
              }} />
              <DatePicker
                key={i18n.language}
                picker="month"
                value={selectedMonth}
                onChange={val => setSelectedMonth(val || dayjs())}
                format={i18n.language === 'en' ? 'MMM YYYY' : 'MMMM YYYY'}
                locale={i18n.language === 'en' ? enUS : esES}
                style={{ width: '100%' }}
                className={i18n.language === 'es' ? 'datepicker-capitalize' : ''}
              />
            </div>

            {/* Card */}
            <div
              style={{
                width: '100%',
                marginBottom: 32,
              }}
            >
              {cards.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', marginTop: 40 }}>
                  <Empty description="No hay resumen para mostrar" />
                </div>
              ) : (
                <TransitionGroup
                  className="cards-transition-group"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    width: '100%',
                  }}
                >
                  {(() => {
                    const grouped = Object.entries(groupCardsByBank(cards));
                    // Ordena alfabéticamente, pero pone 'N/A' al final
                    grouped.sort(([a], [b]) => {
                      if (a === 'N/A') return 1;
                      if (b === 'N/A') return -1;
                      return a.localeCompare(b);
                    });
                    return grouped.map(([bank, bankCards]) => (
                      <CSSTransition key={bank} timeout={400} classNames="fade-card">
                        <PaymentSummaryCard
                          title={bank}
                          cards={bankCards}
                          showClosing={bankCards.some(c => c.cardType === 'Credit Card')}
                          t={t}
                          i18n={i18n}
                        />
                      </CSSTransition>
                    ));
                  })()}
                </TransitionGroup>
              )}
            </div>

          </>:

          // EMPTY DATA MESSAGE
          <div style={{ marginTop: 40 }}>
            <Empty description={t("No hay gastos registrados en este mes")}/>
          </div>}

        </Spin>
      </div>

    </>
  );
};

export default Summary;