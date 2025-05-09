import React, { useState, useEffect }                                   from 'react';
import { Spin, Empty, DatePicker, Table, Button, Input, InputNumber, Checkbox, Popconfirm, Form, Space, message, Select, Divider, Tag, AutoComplete, Modal, Tooltip } from 'antd';
import { doc, onSnapshot, updateDoc, collection, getDoc, query, where, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db }                                                           from '../firebase';
import { storage }                                                      from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth }                                                      from '../contexts/AuthContext';
import { useTranslation }                                               from 'react-i18next';
import moment                                                           from 'moment';
import dayjs                                                            from 'dayjs';
import useMonthlyMovements                                              from '../hooks/useMonthlyMovements';
// Components
import CreditCard                                                       from '../components/CreditCard';
// Styles
import '../styles/Expenses.css';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, TagOutlined, DollarOutlined, FileTextOutlined, InfoCircleOutlined, CheckCircleTwoTone, SettingOutlined, FilePdfOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';
import { useForm, useWatch } from 'antd/es/form/Form';

const Expenses = () => {
  const [loading, setLoading]             = useState(true);
  const [cards, setCards]                 = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const currentMonthKey = dayjs().format('YYYY-MM');
  const [noteModal, setNoteModal] = useState({ visible: false, id: null, note: '' });
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [confirmPdfModal, setConfirmPdfModal] = useState({ visible: false, id: null, row: null, oldPdfUrl: null });

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasExpenses } = useMonthlyMovements();
  
  const decimalSeparator = i18n.language === 'es' ? ',' : '.';

  const cardColors = {
    Visa: 'linear-gradient(135deg,rgb(106, 114, 255),rgb(112, 186, 255))',
    MasterCard: 'linear-gradient(135deg,rgb(250, 127, 39),rgb(255, 187, 92))',
    'American Express': 'linear-gradient(135deg,rgb(61, 158, 255),rgb(158, 239, 255))',
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
  }, [currentUser, selectedMonth ]);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
    const unsub = onSnapshot(ref, snap => {
      const data = snap.exists() ? snap.data().payments || [] : [];
      setMonthlyPayments(data);
      setMpLoading(false);
    });
    return () => unsub();
  }, [currentUser, currentMonthKey]);

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

  const groupCardsByType = (cards) => {
    const creditCards = cards.filter(card => card.cardType === 'Credit Card');
    const debitCards  = cards.filter(card => card.cardType === 'Debit Card');
    const cashCards   = cards.filter(card => card.cardType === 'Cash');

    return { creditCards, debitCards, cashCards };
  };

  const { creditCards, debitCards, cashCards } = groupCardsByType(cards);

  // Renderiza las tarjetas mostrando DatePicker solo para crédito
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
    if (type.toLowerCase() === 'cash') {
      
      return t('userProfile.expenses.cashTitle');
    }
  
    const keyBase = `userProfile.expenses.${type.toLowerCase()}Card${count === 1 ? 'Title' : 'sTitle'}`;

    return t(keyBase);
  };

  // Componente auxiliar para mostrar pagos por mes
  function MonthlyPaymentsSection({ cards, creditCards, debitCards, cashCards }) {
    return (
      <div className="monthly-payments-section" style={{ marginTop: 48, color: '#fff', fontFamily: 'monospace' }}>
        <h2 style={{ borderTop: '1px solid #888', paddingTop: 24, marginBottom: 32, fontWeight: 700, letterSpacing: 1 }}>Pagos por mes</h2>
        {
          cards.length > 0 && (() => {
            const allExpenses = [];
            [creditCards, debitCards, cashCards].forEach(arr => {
              arr.forEach(card => {
                if (card.expenses) {
                  allExpenses.push(...card.expenses);
                }
              });
            });
            if (!allExpenses.length) return null;
            const expensesByMonth = {};
            allExpenses.forEach(exp => {
              if (!exp.timestamp) return;
              const date = exp.timestamp.seconds ? new Date(exp.timestamp.seconds * 1000) : new Date(exp.timestamp);
              const monthKey = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
              if (!expensesByMonth[monthKey]) expensesByMonth[monthKey] = [];
              expensesByMonth[monthKey].push(exp);
            });
            const sortedMonths = Object.keys(expensesByMonth).sort((a, b) => b.localeCompare(a));
            return sortedMonths.map(monthKey => {
              const monthExpenses = expensesByMonth[monthKey];
              const monthDate = new Date(monthKey + '-01');
              const monthLabel = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
              let totalARS = 0, totalUSD = 0;
              monthExpenses.forEach(e => {
                if (e.currency === 'ARS') totalARS += Number(e.amount);
                if (e.currency === 'USD') totalUSD += Number(e.amount);
              });
              return (
                <div key={monthKey} style={{ marginBottom: 48 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #888', padding: '16px 0 8px 0', fontWeight: 700 }}>
                    <span>{`MES DE ${monthLabel.toUpperCase()}`}</span>
                    <span style={{ fontSize: 14, fontWeight: 400 }}>Pagos realizados: {monthExpenses.length}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 8, fontSize: 15 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #888' }}>
                        <th style={{ textAlign: 'left', padding: 4 }}>Banco</th>
                        <th style={{ textAlign: 'left', padding: 4 }}>Tipo</th>
                        <th style={{ textAlign: 'right', padding: 4 }}>$</th>
                        <th style={{ textAlign: 'right', padding: 4 }}>USD</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthExpenses.map((e, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: 4 }}>{e.bank || '-'}</td>
                          <td style={{ padding: 4 }}>{e.cardType || '-'}</td>
                          <td style={{ textAlign: 'right', padding: 4 }}>{e.currency === 'ARS' ? `$${Number(e.amount).toLocaleString()}` : '-'}</td>
                          <td style={{ textAlign: 'right', padding: 4 }}>{e.currency === 'USD' ? `U$D${Number(e.amount).toLocaleString()}` : '-'}</td>
                          <td style={{ textAlign: 'center', padding: 4 }}>{e.status || 'OK'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 8, fontWeight: 600 }}>
                    TOTAL $: {totalARS.toLocaleString()}<br/>
                    TOTAL U$D: {totalUSD.toLocaleString()}<br/>
                  </div>
                </div>
              );
            });
          })()
        }
      </div>
    );
  }

  const saveMonthlyPayments = async (data) => {
    if (!currentUser) return;
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
    await setDoc(ref, { payments: data }, { merge: true });
  };

  const handleAdd = () => {
    const newPayment = {
      id: Date.now().toString(),
      title: '',
      category: '',
      amountARS: 0,
      amountUSD: 0,
      paid: false,
      notes: '',
      createdAt: new Date(),
      isNew: true,
    };

    console.log(newPayment)
    setMonthlyPayments([...monthlyPayments, newPayment]);
    setEditingKey(newPayment.id);
    form.setFieldsValue({ title: undefined, category: undefined, ...newPayment });
  };

  const edit = (record) => {
    setEditingKey(record.id);
    form.setFieldsValue(record);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      message.error('Solo se permiten archivos PDF');
      setPdfFile(null);
    }
  };

  const save = async (id, overrideRow = null) => {
    try {
      const row = overrideRow || await form.validateFields();
      const oldPayment = monthlyPayments.find(p => p.id === id);
      // Si el pago tenía pdfUrl y no hay pdfFile nuevo, preguntar qué hacer
      if (!overrideRow) {
        if (oldPayment && oldPayment.pdfUrl && !pdfFile && !row.pdfUrl) {
          setConfirmPdfModal({ visible: true, id, row, oldPdfUrl: oldPayment.pdfUrl });
          return;
        }
      }
      // Subir PDF si corresponde
      let pdfUrl = row.pdfUrl || '';
      if (pdfFile) {
        setUploading(true);
        const fileRef = storageRef(storage, `monthlyPayments/${currentUser.uid}/${id}.pdf`);
        await uploadBytes(fileRef, pdfFile);
        pdfUrl = await getDownloadURL(fileRef);
        setUploading(false);
        setPdfFile(null);
      } else if (oldPayment && oldPayment.pdfUrl && !row.pdfUrl) {
        // Si el usuario eligió eliminar el documento
        pdfUrl = '';
      }
      console.log('DEBUG: Valores antes de guardar:', { amountARS: row.amountARS, amountUSD: row.amountUSD, typeofARS: typeof row.amountARS, typeofUSD: typeof row.amountUSD });
      const newData = [...monthlyPayments];
      const idx = newData.findIndex(item => item.id === id);
      if (idx > -1) {
        // Elimina 'type' si existe y asegura 'category', y elimina isNew
        const { type, isNew, ...rest } = { 
          ...newData[idx], 
          ...row,
          pdfUrl,
          amountARS: (() => {
            if (row.amountARS === '' || row.amountARS === undefined || row.amountARS === null) return 0;
            if (typeof row.amountARS === 'string') {
              let clean = row.amountARS.replace(/\$/g, '');
              if (i18n.language === 'es') {
                clean = clean.replace(/\./g, '').replace(',', '.'); // quitar puntos de miles y cambiar coma por punto
              } else {
                clean = clean.replace(/,/g, ''); // quitar comas de miles
              }
              return Number(clean) || 0;
            }
            return isNaN(row.amountARS) ? 0 : row.amountARS;
          })(),
          amountUSD: (() => {
            if (row.amountUSD === '' || row.amountUSD === undefined || row.amountUSD === null) return 0;
            if (typeof row.amountUSD === 'string') {
              let clean = row.amountUSD.replace(/\$/g, '');
              if (i18n.language === 'es') {
                clean = clean.replace(/\./g, '').replace(',', '.');
              } else {
                clean = clean.replace(/,/g, '');
              }
              return Number(clean) || 0;
            }
            return isNaN(row.amountUSD) ? 0 : row.amountUSD;
          })(),
        };
        newData[idx] = { ...rest };
        setMonthlyPayments(newData);
        setEditingKey('');
        await saveMonthlyPayments(newData);
        message.success('Pago actualizado');
      }
    } catch (err) {
      // Solo mostrar notificación de error si no es un error de validación
      if (err.errorFields && err.errorFields.length > 0) {
        // Hay errores de validación, no mostramos notificación
        return;
      }
      message.error('Error al guardar');
    }
  };

  // Handler para el modal de confirmación de PDF
  const handleConfirmPdf = async (keep) => {
    setConfirmPdfModal({ visible: false, id: null, row: null, oldPdfUrl: null });
    if (keep) {
      // Guardar manteniendo el documento
      await save(confirmPdfModal.id, { ...confirmPdfModal.row, pdfUrl: confirmPdfModal.oldPdfUrl });
    } else {
      // Guardar eliminando el documento
      await save(confirmPdfModal.id, { ...confirmPdfModal.row, pdfUrl: '' });
    }
  };

  const cancel = () => {
    const newData = [...monthlyPayments];
    const idx = newData.findIndex(item => item.id === editingKey);
    if (idx > -1 && newData[idx].isNew) {
      newData.splice(idx, 1);
      setMonthlyPayments(newData);
    }
    setEditingKey('');
    setPdfFile(null);
  };

  const handleDelete = async (id) => {
    const newData = monthlyPayments.filter(item => item.id !== id);
    setMonthlyPayments(newData);
    await saveMonthlyPayments(newData);
    message.success('Pago eliminado');
  };

  const handlePaidChange = async (checked, record) => {
    const newData = monthlyPayments.map(item => item.id === record.id ? { ...item, paid: checked } : item);
    setMonthlyPayments(newData);
    await saveMonthlyPayments(newData);
  };

  const isEditing = (record) => record.id === editingKey;

  // Obtener categorías únicas para autocompletar
  const categoriesList = Array.from(new Set(monthlyPayments.map(p => p.category).filter(Boolean))).sort();
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Obtener títulos únicos para autocompletar
  const titlesList = Array.from(new Set(monthlyPayments.map(p => p.title).filter(Boolean))).sort();
  const [newTitleInput, setNewTitleInput] = useState('');

  const allowedKeys = [
    'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End',
  ];

  function handleAmountKeyDown(e, value, decimalSeparator) {
    const key = e.key;
    // Permitir teclas de control
    if (allowedKeys.includes(key)) return;
    // Permitir números
    if (/\d/.test(key)) return;
    // Permitir el separador decimal solo si no está presente y no es el primer carácter
    if (
      key === decimalSeparator &&
      value && !value.toString().includes(decimalSeparator) && value.toString().length > 0
    ) {
      return;
    }
    // Bloquear todo lo demás
    e.preventDefault();
  }

  function handleAmountPaste(e, decimalSeparator) {
    const pasted = e.clipboardData.getData('Text');
    // Solo permitir números y un solo separador decimal, y máximo dos decimales
    const regex = decimalSeparator === ','
      ? /^\d{1,}(,\d{0,2})?$/
      : /^\d{1,}(\.\d{0,2})?$/;
    if (!regex.test(pasted)) {
      e.preventDefault();
    }
  }

  function handleAmountBlur(fieldName, form, i18n) {
    const value = form.getFieldValue(fieldName);
    if (typeof value === 'string') {
      let normalized = value;
      if (i18n.language === 'es') {
        normalized = value.replace(',', '.');
      }
      const num = Number(normalized);
      if (!isNaN(num)) {
        form.setFieldsValue({ [fieldName]: num });
      } else {
        form.setFieldsValue({ [fieldName]: 0 });
      }
    }
  }

  const columns = [
    {
      title: 'Título',
      dataIndex: 'title',
      editable: true,
      render: (text, record) => isEditing(record)
        ? <Form.Item 
            name="title" 
            style={{ margin: 0 }} 
            rules={[
              { required: true, message: 'Ingrese un nombre' },
              { 
                validator: (_, value) => {
                  if (!value || value.replace(/\s+/g, '').length === 0) {
                    return Promise.reject('');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          > 
            <AutoComplete
              style={{ width: 180 }}
              value={form.getFieldValue('title')}
              onChange={v => {
                if (!v || v.replace(/\s+/g, '').length === 0) {
                  form.setFieldsValue({ title: '' });
                } else {
                  form.setFieldsValue({ title: v });
                }
              }}
              placeholder="Título del pago"
              options={titlesList.filter(Boolean).map(tit => ({
                value: tit,
                label: tit
              }))}
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
        : text
    },
    {
      title: 'Monto ARS',
      dataIndex: 'amountARS',
      editable: true,
      render: (text, record) => isEditing(record) 
        ? <Form.Item 
            name="amountARS" 
            style={{ margin: 0 }}
            initialValue={0}
            rules={[{ required: true, message: 'Ingrese un monto' }]}
          >
            <NumericFormat
              customInput={Input}
              allowNegative={false}
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator={i18n.language === 'es' ? '.' : ','}
              decimalSeparator={i18n.language === 'es' ? ',' : '.'}
              prefix={"$"}
              style={{ width: 100 }}
              placeholder={i18n.language === 'es' ? '0,00' : '0.00'}
              onValueChange={vals => form.setFieldsValue({ amountARS: vals.floatValue ?? '' })}
              value={form.getFieldValue('amountARS')}
            />
          </Form.Item> 
        : (text ? `$${Number(text).toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}` : '$0,00')
    },
    {
      title: 'Monto USD',
      dataIndex: 'amountUSD',
      editable: true,
      render: (text, record) => isEditing(record) 
        ? <Form.Item 
            name="amountUSD" 
            style={{ margin: 0 }}
            initialValue={0}
            rules={[{ required: true, message: 'Ingrese un monto' }]}
          >
            <NumericFormat
              customInput={Input}
              allowNegative={false}
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator={i18n.language === 'es' ? '.' : ','}
              decimalSeparator={i18n.language === 'es' ? ',' : '.'}
              prefix={"$"}
              style={{ width: 100 }}
              placeholder={i18n.language === 'es' ? '0,00' : '0.00'}
              onValueChange={vals => form.setFieldsValue({ amountUSD: vals.floatValue ?? '' })}
              value={form.getFieldValue('amountUSD')}
            />
          </Form.Item> 
        : (text ? `$${Number(text).toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}` : '$0,00')
    },
    {
      title: 'Pago',
      dataIndex: 'paid',
      align: 'center',
      width: 48,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item name="paid" valuePropName="checked" style={{ margin: 0 }}>
            <Checkbox />
          </Form.Item>
        ) : (
          record.paid ? (
            <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          ) : (
            <CloseOutlined style={{ color: 'red', fontSize: 16 }} />
          )
        );
      }
    },
    {
      title: 'Info',
      dataIndex: 'noteInfo',
      align: 'center',
      width: 48,
      render: (text, record) => {
        const editing = isEditing(record);
        const hasNote = record.notes && record.notes.trim() !== '';
        if (editing) {
          return (
            <>
              <Form.Item name="notes" style={{ display: 'none' }} />
              <span onClick={() => openNoteModal(record)} style={{ cursor: 'pointer' }}>
                <InfoCircleOutlined style={{ color: hasNote ? '#1890ff' : '#d9d9d9', fontSize: 16 }} />
              </span>
            </>
          );
        } else {
          return hasNote ? (
            <Tooltip title={record.notes} placement="top">
              <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            </Tooltip>
          ) : null;
        }
      }
    },
    {
      title: 'PDF',
      dataIndex: 'pdf',
      align: 'center',
      width: 40,
      render: (_, record) => {
        const editing = isEditing(record);
        const hasPdf = !!(pdfFile || record.pdfUrl);
        if (editing) {
          return (
            <label style={{ cursor: 'pointer' }}>
              <FilePdfOutlined style={{ color: hasPdf ? '#d4380d' : '#d9d9d9', fontSize: 18, verticalAlign: 'middle' }} />
              <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={uploading} style={{ display: 'none' }} />
            </label>
          );
        } else {
          return record.pdfUrl
            ? <a href={record.pdfUrl} target="_blank" rel="noopener noreferrer"><FilePdfOutlined style={{ color: '#d4380d', fontSize: 18, cursor: 'pointer' }} /></a>
            : null;
        }
      }
    },
    {
      title: <SettingOutlined style={{ fontSize: 16 }} />,
      dataIndex: 'actions',
      align: 'center',
      width: 48,
      render: (_, record) => {
        const editable = isEditing(record);
        return (
          <div style={{ minWidth: '50px', display: 'flex', gap: 8, alignItems: 'center' }}>
            {editable ? (
              <>
                <Tag icon={<CheckOutlined />} onClick={() => save(record.id)} style={{ cursor: 'pointer', margin: 0 }} />
                <Tag icon={<CloseOutlined />} onClick={cancel} style={{ cursor: 'pointer', margin: 0 }} />
                <Tag icon={<FileTextOutlined />} onClick={() => openNoteModal(record)} style={{ cursor: 'pointer', margin: 0 }} />
              </>
            ) : (
              <>
                <Tag icon={<EditOutlined />} onClick={() => edit(record)} style={{ cursor: 'pointer', margin: 0 }} />
                <Popconfirm title="¿Seguro que deseas eliminar?" onConfirm={() => handleDelete(record.id)}>
                  <Tag icon={<DeleteOutlined />} color="red" style={{ cursor: 'pointer', margin: 0 }} />
                </Popconfirm>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Calcular totales
  const totalARS = monthlyPayments.reduce((sum, p) => sum + (Number(p.amountARS) || 0), 0);
  const totalUSD = monthlyPayments.reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0);

  // Solo pagos guardados en la DB
  const savedPayments = monthlyPayments.filter(p => !p.isNew);

  const EditableTable = () => (
    <Form form={form} component={false}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
        <Button
          icon={<PlusOutlined />}
          onClick={e => {
            if (!editingKey) handleAdd();
          }}
          type="primary"
          loading={editingKey}
          style={{
            transition: 'all 0.3s ease',
            opacity: editingKey ? 0.5 : 1
          }}
        >
          Agregar pago
        </Button>
      </div>
      <Table
        bordered
        dataSource={monthlyPayments}
        columns={columns}
        rowKey="id"
        loading={mpLoading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: true }}
        size="medium"
        locale={{
          emptyText: <Empty description={"No hay pagos registrados en este mes"} />
        }}
      />
      {/* Totales debajo de la tabla */}
      {savedPayments.length > 0 && (
        <div
          style={{
            textAlign: 'left',
            marginTop: 0,
            marginLeft: 2,
            borderRadius: 10,
            background: '#fff',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
            padding: '14px 20px',
            maxWidth: 240,
            border: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, color: '#222' }}>
            Total ARS:
            <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 16, color: '#0071de' }}>
              ${totalARS.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0 8px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, color: '#222' }}>
            Total USD:
            <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 16, color: '#0071de' }}>
              ${totalUSD.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </Form>
  );

  const openNoteModal = (record) => {
    setNoteModal({ visible: true, id: record.id, note: record.notes || '' });
  };

  const handleNoteChange = (e) => {
    setNoteModal((prev) => ({ ...prev, note: e.target.value }));
  };

  const handleNoteSave = async () => {
    // Buscar si el registro está en edición
    const editing = monthlyPayments.find(item => item.id === noteModal.id && isEditing(item));
    if (editing) {
      // Actualizar el valor en monthlyPayments (sin guardar en la DB)
      const newData = monthlyPayments.map(item =>
        item.id === noteModal.id ? { ...item, notes: noteModal.note } : item
      );
      setMonthlyPayments(newData);
      form.setFieldsValue({ notes: noteModal.note });
      setNoteModal({ visible: false, id: null, note: '' });
      message.success('Nota actualizada (se guardará al confirmar los cambios)');
    } else {
      // Guardar en la db inmediatamente
      const newData = monthlyPayments.map(item =>
        item.id === noteModal.id ? { ...item, notes: noteModal.note } : item
      );
      setMonthlyPayments(newData);
      await saveMonthlyPayments(newData);
      setNoteModal({ visible: false, id: null, note: '' });
      message.success('Nota guardada');
    }
  };

  const handleNoteCancel = () => {
    setNoteModal({ visible: false, id: null, note: '' });
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

  return (
    <>
      <div className='container-page'>
        <Spin spinning={loading}>

          {hasExpenses ? <>

            {/* Cards filter per month */}
            <div className="filter" style={{ marginBottom: 24 }}>
              <span style={{marginRight: 5 }}>{t('userProfile.expenses.filter')}</span> 
              <DatePicker
                picker="month"
                allowClear={false}
                value={dayjs(selectedMonth).isValid() ? dayjs(selectedMonth) : dayjs()}
                onChange={(value) => {
                  if (!value || !dayjs(value).isValid()) {
                    setSelectedMonth(dayjs());
                  } else {
                    setSelectedMonth(dayjs(value));
                  }
                }}
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
            {/* --- PAGOS POR MES --- */}
          {/* <MonthlyPaymentsSection cards={cards} creditCards={creditCards} debitCards={debitCards} cashCards={cashCards} /> */}

            {/* <h2 style={{ color: 'black', fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>Control de pagos del mes</h2> */}
            {/* <EditableTable /> */}
          </>:

          // EMPTY DATA MESSAGE
          <div style={{ marginTop: 40 }}>
            <Empty description={t("No hay gastos registrados en este mes")}/>
          </div>}

        </Spin>
      </div>
      <Modal
        title="Agregar información"
        open={noteModal.visible}
        onOk={handleNoteSave}
        onCancel={handleNoteCancel}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Input.TextArea
          value={noteModal.note}
          onChange={handleNoteChange}
          rows={4}
          placeholder="Agrega una nota para este pago"
        />
      </Modal>
      <Modal
        open={confirmPdfModal.visible}
        title="¿Qué hacer con el documento adjunto?"
        onCancel={() => setConfirmPdfModal({ visible: false, id: null, row: null, oldPdfUrl: null })}
        footer={[
          <Button key="keep" type="primary" onClick={() => handleConfirmPdf(true)}>
            Mantener documento
          </Button>,
          <Button key="remove" danger onClick={() => handleConfirmPdf(false)}>
            Eliminar documento
          </Button>
        ]}
      >
        Este pago tiene un documento adjunto. ¿Quieres mantenerlo o eliminarlo?
      </Modal>
    </>
  );
};

export default Expenses;