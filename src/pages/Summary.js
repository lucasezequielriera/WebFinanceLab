import React, { useState, useEffect }                                   from 'react';
import { Spin, Empty, DatePicker, message, Modal, Typography, Select } from 'antd';
import { doc, onSnapshot, updateDoc, collection, getDoc, query, where } from 'firebase/firestore';
import { db }                                                           from '../firebase';
import { useAuth }                                                      from '../contexts/AuthContext';
import { useTranslation }                                               from 'react-i18next';
import moment                                                           from 'moment';
import dayjs                                                            from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import useMonthlyMovements                                              from '../hooks/useMonthlyMovements';
import ExpenseList                                                      from '../components/ExpenseList';
import TransactionsTable                                                from '../components/TransactionsTable';
// Styles
import '../styles/Expenses.css';
import { EditOutlined, FilterOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { 
  FaBus, 
  FaHome, 
  FaHeartbeat, 
  FaShoppingCart, 
  FaGift, 
  FaCreditCard, 
  FaTrophy, 
  FaCamera, 
  FaCut, 
  FaTrain, 
  FaSpotify,
  FaCoffee,
  FaCookieBite,
  FaDumbbell,
  FaWineGlass,
  FaWifi,
  FaShoppingBag,
  FaUtensils,
  FaTshirt
} from 'react-icons/fa';

// Función para generar colores aleatorios para los iconos (copiada de ExpenseList)
const getRandomColor = (category) => {
  const colors = [
    'linear-gradient(135deg, #ff4757, #ff3742)', // Rojo vibrante
    'linear-gradient(135deg, #3742fa, #2f3542)', // Azul oscuro
    'linear-gradient(135deg, #ff9ff3, #f368e0)', // Rosa magenta
    'linear-gradient(135deg, #ffa502, #ff6348)', // Naranja brillante
    'linear-gradient(135deg, #5f27cd, #341f97)', // Púrpura profundo
    'linear-gradient(135deg, #00d2d3, #54a0ff)', // Cian azul
    'linear-gradient(135deg, #ff9f43, #ff6b6b)', // Naranja rojo
    'linear-gradient(135deg, #a55eea, #26de81)', // Púrpura verde
    'linear-gradient(135deg, #fd79a8, #fdcb6e)', // Rosa amarillo
    'linear-gradient(135deg, #6c5ce7, #a29bfe)', // Púrpura claro
    'linear-gradient(135deg, #00b894, #00cec9)', // Verde turquesa
    'linear-gradient(135deg, #e17055, #d63031)', // Rojo coral
    'linear-gradient(135deg, #74b9ff, #0984e3)', // Azul cielo
    'linear-gradient(135deg, #fdcb6e, #e17055)', // Amarillo naranja
    'linear-gradient(135deg, #fd79a8, #e84393)', // Rosa fucsia
    'linear-gradient(135deg, #00b894, #00cec9)', // Verde esmeralda
    'linear-gradient(135deg, #6c5ce7, #a29bfe)', // Púrpura índigo
    'linear-gradient(135deg, #fdcb6e, #e17055)', // Dorado
    'linear-gradient(135deg, #fd79a8, #fdcb6e)', // Rosa dorado
    'linear-gradient(135deg, #00d2d3, #54a0ff)', // Turquesa azul
  ];
  
  // Usar el nombre de la categoría para generar un índice consistente
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Función para detectar el tipo de categoría y asignar ícono (versión completa de ExpenseList)
const getCategoryIcon = (category) => {
  const categoryLower = category.toLowerCase();
  
  // Transporte - Bus
  if (categoryLower.includes('auto') || categoryLower.includes('carro') || categoryLower.includes('vehiculo') || 
      categoryLower.includes('gasolina') || categoryLower.includes('nafta') || categoryLower.includes('taxi') || 
      categoryLower.includes('uber') || categoryLower.includes('transporte') || categoryLower.includes('bus') ||
      categoryLower.includes('transport')) {
    return <FaBus style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Tren
  if (categoryLower.includes('tren') || categoryLower.includes('train') || categoryLower.includes('metro') ||
      categoryLower.includes('subte') || categoryLower.includes('ferrocarril')) {
    return <FaTrain style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Hogar
  if (categoryLower.includes('casa') || categoryLower.includes('hogar') || categoryLower.includes('alquiler') || 
      categoryLower.includes('renta') || categoryLower.includes('hipoteca') || categoryLower.includes('luz') || 
      categoryLower.includes('agua') || categoryLower.includes('gas') || categoryLower.includes('electricidad') ||
      categoryLower.includes('apartment')) {
    return <FaHome style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Salud
  if (categoryLower.includes('salud') || categoryLower.includes('medico') || categoryLower.includes('farmacia') || 
      categoryLower.includes('hospital') || categoryLower.includes('clinica') || categoryLower.includes('medicina') || 
      categoryLower.includes('doctor') || categoryLower.includes('dentista')) {
    return <FaHeartbeat style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Supermercado
  if (categoryLower.includes('supermercado') || categoryLower.includes('supermarket') || 
      categoryLower.includes('mercado') || categoryLower.includes('grocery')) {
    return <FaShoppingCart style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Café
  if (categoryLower.includes('cafe') || categoryLower.includes('coffee') || categoryLower.includes('cafeteria') ||
      categoryLower.includes('cappuccino') || categoryLower.includes('latte') || categoryLower.includes('espresso') ||
      categoryLower.includes('café') || categoryLower.includes('cafetería') || categoryLower.includes('barista') ||
      categoryLower.includes('americano') || categoryLower.includes('mocha') || categoryLower.includes('macchiato')) {
    return <FaCoffee style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Restaurante
  if (categoryLower.includes('restaurant') || categoryLower.includes('restaurante') || 
      categoryLower.includes('comida afuera') || categoryLower.includes('lunch') || 
      categoryLower.includes('dinner') || categoryLower.includes('breakfast') || categoryLower.includes('comida afuera') ||
      categoryLower.includes('fuera') || categoryLower.includes('out') || categoryLower.includes('takeaway') ||
      categoryLower.includes('delivery') || categoryLower.includes('pedido')) {
    return <FaUtensils style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Comida general
  if (categoryLower.includes('comida') || categoryLower.includes('food') || 
      categoryLower.includes('almuerzo') || categoryLower.includes('cena') || categoryLower.includes('desayuno')) {
    return <FaShoppingCart style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Cosas dulces
  if (categoryLower.includes('dulce') || categoryLower.includes('sweet') || categoryLower.includes('postre') ||
      categoryLower.includes('helado') || categoryLower.includes('torta') || categoryLower.includes('cake') ||
      categoryLower.includes('sweet') || categoryLower.includes('candy') || categoryLower.includes('galleta') ||
      categoryLower.includes('cookie')) {
    return <FaCookieBite style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Bebidas
  if (categoryLower.includes('bebida') || categoryLower.includes('drink') || categoryLower.includes('agua') ||
      categoryLower.includes('jugo') || categoryLower.includes('zumo') || categoryLower.includes('cerveza') ||
      categoryLower.includes('beer') || categoryLower.includes('vino') || categoryLower.includes('wine') ||
      categoryLower.includes('cocktail') || categoryLower.includes('coctel')) {
    return <FaWineGlass style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Ropa y accesorios
  if (categoryLower.includes('ropa') || categoryLower.includes('clothes') || categoryLower.includes('vestimenta') ||
      categoryLower.includes('zapatos') || categoryLower.includes('shoes') || categoryLower.includes('calzado') ||
      categoryLower.includes('bolso') || categoryLower.includes('bag') || categoryLower.includes('zapatos de lujo') ||
      categoryLower.includes('designer') || categoryLower.includes('marca') || categoryLower.includes('brand') ||
      categoryLower.includes('exclusivo') || categoryLower.includes('exclusive') || categoryLower.includes('premium')) {
    return <FaTshirt style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Internet/Conectividad
  if (categoryLower.includes('internet') || categoryLower.includes('wifi') || categoryLower.includes('conectividad') ||
      categoryLower.includes('red') || categoryLower.includes('network') || categoryLower.includes('conexion')) {
    return <FaWifi style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Streaming & Apps
  if (categoryLower.includes('streaming') || categoryLower.includes('app') || categoryLower.includes('aplicacion') ||
      categoryLower.includes('spotify') || categoryLower.includes('music') || categoryLower.includes('musica') || 
      categoryLower.includes('entretenimiento') || categoryLower.includes('plataforma') || categoryLower.includes('servicio') || 
      categoryLower.includes('subscription') || categoryLower.includes('netflix') || categoryLower.includes('youtube')) {
    return <FaSpotify style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Finanzas
  if (categoryLower.includes('banco') || categoryLower.includes('tarjeta') || categoryLower.includes('credito') || 
      categoryLower.includes('debito') || categoryLower.includes('pago') || categoryLower.includes('cuota') || 
      categoryLower.includes('prestamo') || categoryLower.includes('inversion')) {
    return <FaCreditCard style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Gym
  if (categoryLower.includes('gym') || categoryLower.includes('fitness') || categoryLower.includes('ejercicio') ||
      categoryLower.includes('musculacion') || categoryLower.includes('pesas') || categoryLower.includes('entrenamiento') ||
      categoryLower.includes('crossfit') || categoryLower.includes('spinning') || categoryLower.includes('yoga')) {
    return <FaDumbbell style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Deportes
  if (categoryLower.includes('deporte') || categoryLower.includes('correr') || categoryLower.includes('futbol') || 
      categoryLower.includes('tenis') || categoryLower.includes('natacion') || categoryLower.includes('basquet') ||
      categoryLower.includes('volley') || categoryLower.includes('handball')) {
    return <FaTrophy style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Belleza
  if (categoryLower.includes('corte') || categoryLower.includes('pelo') || categoryLower.includes('peluqueria') ||
      categoryLower.includes('belleza') || categoryLower.includes('estetica') || categoryLower.includes('barberia') ||
      categoryLower.includes('salon')) {
    return <FaCut style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Viajes
  if (categoryLower.includes('viaje') || categoryLower.includes('travel') || categoryLower.includes('vacaciones') || 
      categoryLower.includes('hotel') || categoryLower.includes('avion') || categoryLower.includes('vuelo') ||
      categoryLower.includes('turismo') || categoryLower.includes('trip')) {
    return <FaCamera style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Otros
  if (categoryLower.includes('other') || categoryLower.includes('otros') || categoryLower.includes('otro') ||
      categoryLower.includes('misc') || categoryLower.includes('miscelaneo') || categoryLower.includes('varios') ||
      categoryLower.includes('diversos') || categoryLower.includes('general')) {
    return <FaGift style={{ color: 'white', fontSize: '16px' }} />;
  }
  
  // Por defecto, ícono de compras
  return <FaShoppingBag style={{ color: 'white', fontSize: '16px' }} />;
};

// Generate months for selector
const generateMonths = (i18n) => {
  const monthsList = [];
  const currentDate = dayjs();
  
  // Generate 12 months (current + 11 previous)
  for (let i = 0; i < 12; i++) {
    const month = currentDate.subtract(i, 'month');
    monthsList.push({
      value: month.format('YYYY-MM'),
      label: month.locale(i18n.language).format('MMMM YYYY'),
      date: month
    });
  }
  
  return monthsList;
};

const Summary = () => {
  const [loading, setLoading]             = useState(true);
  const [cards, setCards]                 = useState([]);
  const [expenses, setExpenses]           = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [months, setMonths] = useState([]);
  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedCard, setSelectedCard]   = useState(null);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedCardsByBank, setSelectedCardsByBank] = useState({});
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState([]);

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasExpenses } = useMonthlyMovements();

  const cardColors = {
    Visa: 'linear-gradient(135deg,rgb(106, 114, 255),rgb(112, 186, 255))',
    MasterCard: 'linear-gradient(135deg,rgb(250, 127, 39),rgb(255, 187, 92))',
    'American Express': 'linear-gradient(135deg,rgb(61, 158, 255),rgb(158, 239, 255))',
    Cash: 'linear-gradient(135deg,rgb(0, 201, 104),rgb(105, 255, 175))',
  };

  // Initialize months
  useEffect(() => {
    setMonths(generateMonths(i18n));
  }, [i18n]);

  useEffect(() => {
    if (!currentUser) return;

    const safeMonth = selectedMonth || dayjs();
    const startOfMonth = safeMonth.startOf('month').toDate();
    const endOfMonth = safeMonth.endOf('month').toDate();

    const userExpensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const expensesQuery = query(userExpensesRef, where('timestamp', '>=', startOfMonth), where('timestamp', '<=', endOfMonth));

    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      updateCreditCards(expensesData);
      setExpenses(expensesData);
    });

    setTimeout(() => {
    setLoading(false);
    }, 2000);

    return () => unsubscribe();
  }, [currentUser, selectedMonth ]);

  // Función para obtener las transacciones de una tarjeta específica
  const getCardTransactions = async (card) => {
    if (!currentUser || !card) return;

    setTransactionsLoading(true);
    setSelectedCard(card);

    try {
      const startOfMonth = selectedMonth.startOf('month').toDate();
      const endOfMonth = selectedMonth.endOf('month').toDate();

      const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
      const expensesQuery = query(
        expensesRef,
        where('timestamp', '>=', startOfMonth),
        where('timestamp', '<=', endOfMonth),
        where('bank', '==', card.bank),
        where('cardType', '==', card.cardBank),
        where('paymentMethod', '==', card.cardType)
      );

      const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
        }));

        // Ordenar por fecha más reciente
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        setCardTransactions(transactions);
        setTransactionsLoading(false);
      });

      // Guardar la función de unsubscribe para limpiar el listener
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching card transactions:', error);
      setTransactionsLoading(false);
      message.error('Error al cargar las transacciones');
    }
  };

  // Función para abrir el modal con las transacciones
  const openTransactionsModal = async (card) => {
    setModalVisible(true);
    await getCardTransactions(card);
  };

  const openCategoryModal = (category, transactions) => {
    setSelectedCategory(category);
    setCategoryTransactions(transactions);
    setCategoryModalVisible(true);
  };

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

    // Filtrar cards que tengan al menos un monto mayor a 0 y que no sean vacías
    const filteredCards = cardsData.filter(card => {
      const hasValidAmounts = card.amounts.some(amount => parseFloat(amount.amount) > 0);
      const hasValidBank = card.bank && card.bank !== 'N/A' && card.bank.trim() !== '';
      const hasValidCardType = card.cardType && card.cardType.trim() !== '';
      return hasValidAmounts && hasValidBank && hasValidCardType;
    });

    // Ordenar las tarjetas alfabéticamente por el nombre del banco
    filteredCards.sort((a, b) => a.bank.localeCompare(b.bank));
    setCards(filteredCards);

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
          return t('userProfile.expenses.summary.creditCard');
        case 'Debit Card':
          return t('userProfile.expenses.summary.debitCard');
        case 'Cash':
          return t('userProfile.expenses.summary.cash');
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
            background: isSelected 
              ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' 
              : 'linear-gradient(135deg, #2a2d3a 0%, #1a1d29 100%)',
            color: '#fff',
            borderRadius: 16,
            padding: '8px 16px 6px 16px',
            fontWeight: 600,
            fontSize: 16,
            boxShadow: isSelected 
              ? '0 4px 16px rgba(24, 144, 255, 0.4)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            minWidth: 60,
            border: isSelected 
              ? 'none' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3a3d4a 0%, #2a2d39 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isSelected 
              ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' 
              : 'linear-gradient(135deg, #2a2d3a 0%, #1a1d29 100%)';
            e.currentTarget.style.boxShadow = isSelected 
              ? '0 4px 16px rgba(24, 144, 255, 0.4)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.border = isSelected 
              ? 'none' 
              : '1px solid rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
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

    // Sort cards by cardBank in the specified order
    const sortedCards = [...cards].sort((a, b) => {
      const order = { 'Visa': 0, 'MasterCard': 1, 'American Express': 2 };
      return (order[a.cardBank] ?? 3) - (order[b.cardBank] ?? 3);
    });

    return (
      <div className='payment-summary-card-buttons' style={{ display: 'flex', flexDirection: 'row', gap: 12, margin: '18px 0 18px 0' }}>
        {sortedCards.map((card, idx) => (
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

  const PaymentSummaryCard = ({ title, cards, showClosing, t, i18n, openTransactionsModal, selectedCardsByBank, setSelectedCardsByBank }) => {
    // Sort cards by cardBank in the specified order
    const sortedCards = [...cards].sort((a, b) => {
      const order = { 'Visa': 0, 'MasterCard': 1, 'American Express': 2 };
      return (order[a.cardBank] ?? 3) - (order[b.cardBank] ?? 3);
    });

    const selectedCard = selectedCardsByBank[title] || sortedCards[0] || null;
    const setSelectedCard = (card) => {
      setSelectedCardsByBank(prev => ({
        ...prev,
        [title]: card
      }));
    };
    const [editingDate, setEditingDate] = useState(false);
    const [tempDate, setTempDate] = useState(null);

    // Calcula totales para la tarjeta seleccionada o para todas si no hay selección
    // ... existing code ...
    // Calcula totales para la tarjeta seleccionada o para todas si no hay selección
    const calculateTotals = (cards) => {
      let totalARS = 0, totalUSD = 0;
      const cardsToSum = selectedCard 
      ? cards.filter(
          c =>
            c.cardBank === selectedCard.cardBank &&   // -- mismo plástico (Visa, MC…)
            c.cardType === selectedCard.cardType       // -- mismo tipo (Crédito / Débito)
        )
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
          background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          borderRadius: 16,
          padding: 0,
          boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          minWidth: 240,
          maxWidth: 320,
          flex: '1 1 280px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateY(0)'
        }}
      >
        {/* Decorative background element with click functionality */}
        <div 
          style={{
            position: 'absolute',
            top: 10,
            right: 18,
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #1890ff30, #40a9ff30)',
            borderRadius: '50%',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation();
            openTransactionsModal(selectedCard || cards[0]);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1890ff50, #40a9ff50)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1890ff30, #40a9ff30)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <SearchOutlined style={{ 
            color: '#60a5fa', 
            fontSize: '16px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }} />
        </div>
        
        {/* Content container with padding */}
        <div style={{
          padding: '20px 18px 16px 18px',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div className='payment-summary-card-title' style={{ 
            fontWeight: '700', 
            fontSize: '18px', 
            color: '#ffffff', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
              boxShadow: '0 2px 6px rgba(24, 144, 255, 0.4)'
            }} />
            {title === 'N/A' ? t('userProfile.expenses.summary.cash') : title}
          </div>
          {/* Área de botones, siempre ocupa el mismo espacio */}
          <div className="payment-summary-card-buttons" style={{ minHeight: 40, margin: '12px 0' }}>
            {hasButtons ? (
              <PaymentMethodsBar
                cards={sortedCards}
                selectedCard={selectedCard}
                onCardSelect={setSelectedCard}
                i18n={i18n}
                updateCardClosingDate={updateCardClosingDate}
                setSelectedCard={setSelectedCard}
              />
            ) : (
              <div style={{ height: 28 }} />
              )}
            </div>
          {/* Fecha de cierre: si la tarjeta seleccionada es de crédito, mostrar aquí */}
          {selectedCard && selectedCard.cardType === 'Credit Card' ? (
            <div style={{ margin: '8px 0 0 0' }}>
              {selectedCard.closingDate ? (
                <div style={{ 
                  color: '#e2e8f0', 
                  fontSize: '12px', 
                  margin: '0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  minHeight: 24, 
                  fontWeight: '600',
                  padding: '6px 10px',
                  background: 'rgba(24, 144, 255, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(24, 144, 255, 0.2)'
                }}>
                  <div style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#1890ff',
                    boxShadow: '0 1px 3px rgba(24, 144, 255, 0.3)'
                  }} />
                  {i18n.language === 'en' ? 'Closing on' : 'Cierra el'} {i18n.language === 'en' ? dayjs(selectedCard.closingDate).format('MMM D') : dayjs(selectedCard.closingDate).format('D [de] MMMM')}
                  <EditOutlined
                    style={{ cursor: 'pointer', fontSize: '12px', color: '#1890ff', marginLeft: 'auto' }}
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
                <div style={{ 
                  minHeight: 36, 
                  margin: '0',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center'
                }} />
              )}
            </div>
          ) : null}
          {/* Totals section */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            marginTop: 'auto'
          }}>
            <div style={{ 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
              margin: '8px 0 6px 0' 
            }} />
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(77, 140, 255, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(77, 140, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4d8cff, #1890ff)',
                    boxShadow: '0 1px 3px rgba(77, 140, 255, 0.3)'
                  }} />
                  <span style={{ 
                    color: '#e2e8f0', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    ARS
                  </span>
                </div>
                <span style={{ 
                  color: '#4d8cff', 
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
                  ${totalARS.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US')}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(107, 230, 178, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(107, 230, 178, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6be6b2, #10b981)',
                    boxShadow: '0 1px 3px rgba(107, 230, 178, 0.3)'
                  }} />
                  <span style={{ 
                    color: '#e2e8f0', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    USD
                  </span>
                </div>
                <span style={{ 
                  color: '#6be6b2', 
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
                  ${totalUSD.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US')}
                </span>
              </div>
            </div>
          </div>
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

  // Inicializar la selección de tarjetas por banco
  useEffect(() => {
    if (cards.length > 0) {
      const grouped = groupCardsByBank(cards);
      const initialSelection = {};
      
      Object.entries(grouped).forEach(([bank, bankCards]) => {
        if (bankCards.length > 0) {
          // Ordenar las tarjetas del banco
          const sortedCards = [...bankCards].sort((a, b) => {
            const order = { 'Visa': 0, 'MasterCard': 1, 'American Express': 2 };
            return (order[a.cardBank] ?? 3) - (order[b.cardBank] ?? 3);
          });
          initialSelection[bank] = sortedCards[0];
        }
      });
      
      setSelectedCardsByBank(initialSelection);
    }
  }, [cards]);

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
              <Select
                className="modern-select"
                value={selectedMonth.format('YYYY-MM')}
                onChange={(value) => {
                  const selectedMonthData = months.find(m => m.value === value);
                  if (selectedMonthData) {
                    setSelectedMonth(selectedMonthData.date);
                  }
                }}
                options={months}
                style={{ width: '100%' }}
                placeholder="Seleccionar mes"
                suffixIcon={<CalendarOutlined />}
              />
            </div>

            {/* Métodos de Pago */}
            {cards.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span>💳</span>
                  <span>Métodos de Pago</span>
                </h2>
              </div>
            )}

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
                          openTransactionsModal={openTransactionsModal}
                          selectedCardsByBank={selectedCardsByBank}
                          setSelectedCardsByBank={setSelectedCardsByBank}
                        />
                      </CSSTransition>
                    ));
                  })()}
                </TransitionGroup>
              )}
            </div>

            {/* ExpenseList Component - Vista de categorías */}
            {expenses.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span>📊</span>
                  <span>Categorías</span>
                </h2>
                <ExpenseList 
                  expenses={expenses} 
                  onCategoryClick={openCategoryModal}
                />
              </div>
            )}

          </>:

          // EMPTY DATA MESSAGE
          <div style={{ marginTop: 40 }}>
            <Empty description={t("No hay gastos registrados en este mes")}/>
          </div>}

        </Spin>
      </div>

      {/* Modal para mostrar transacciones de la tarjeta */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SearchOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <Typography.Title level={4} style={{ margin: 0, color: '#ffffff' }}>
              {selectedCard ? 
                (selectedCard.cardType === 'Cash' ? 
                  'Efectivo' : 
                  `${selectedCard.bank || 'Banco'} - ${selectedCard.cardBank || selectedCard.cardType || 'Tarjeta'}`
                ) : 
                'Transacciones'
              }
            </Typography.Title>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCard(null);
          setCardTransactions([]);
        }}
        footer={null}
        width="90%"
        style={{ 
          maxWidth: '800px'
        }}
        className="dark-modal"
        bodyStyle={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          color: '#ffffff',
          borderRadius: '0 0 12px 12px'
        }}
        headerStyle={{
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          borderRadius: '12px 12px 0 0',
          padding: '16px 20px'
        }}
        destroyOnClose
      >
        <TransactionsTable 
          transactions={cardTransactions}
          loading={transactionsLoading}
          showSummary={true}
          maxHeight="400px"
        />
      </Modal>

      {/* Modal para mostrar transacciones de la categoría */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: selectedCategory ? getRandomColor(selectedCategory) : 'linear-gradient(135deg, #1890ff, #40a9ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}>
              {selectedCategory ? getCategoryIcon(selectedCategory) : <SearchOutlined style={{ color: 'white', fontSize: '16px' }} />}
            </div>
            <Typography.Title level={4} style={{ margin: 0, color: '#ffffff' }}>
              {selectedCategory || 'Categoría'}
            </Typography.Title>
          </div>
        }
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setSelectedCategory(null);
          setCategoryTransactions([]);
        }}
        footer={null}
        width="90%"
        style={{ 
          maxWidth: '800px'
        }}
        className="dark-modal"
        bodyStyle={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          color: '#ffffff',
          borderRadius: '0 0 12px 12px'
        }}
        headerStyle={{
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          borderRadius: '12px 12px 0 0',
          padding: '16px 20px'
        }}
        destroyOnClose
      >
        <TransactionsTable 
          transactions={categoryTransactions}
          loading={false}
          showSummary={true}
          maxHeight="400px"
        />
      </Modal>

    </>
  );
};

export default Summary;

// Estilos CSS para el modal oscuro
const darkModalStyles = `
  .dark-modal .ant-modal-content {
    background: rgba(26, 26, 26, 0.95) !important;
    border: none !important;
    backdrop-filter: blur(20px) !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
  }
  
  .dark-modal .ant-modal-header {
    background: transparent !important;
    border-bottom: none !important;
    backdrop-filter: none !important;
  }
  
  .dark-modal .ant-modal-title {
    color: #ffffff !important;
  }
  
  .dark-modal .ant-modal-title .anticon {
    color: #1890ff !important;
  }
  
  .dark-modal .ant-modal-close {
    color: #ffffff !important;
  }
  
  .dark-modal .ant-modal-close:hover {
    color: #60a5fa !important;
  }
  
  .dark-modal .ant-modal-body {
    background: rgba(26, 26, 26, 0.7) !important;
    color: #ffffff !important;
    backdrop-filter: blur(15px) !important;
  }
  
  .dark-modal .ant-modal-mask {
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(5px) !important;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = darkModalStyles;
  document.head.appendChild(styleSheet);
}
