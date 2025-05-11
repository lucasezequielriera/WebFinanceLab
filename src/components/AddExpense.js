import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Select, notification, Spin,
  Typography, Row, Col, Card, DatePicker, Checkbox
} from 'antd';
import { DollarOutlined, FileTextOutlined, BankOutlined, PlusOutlined } from '@ant-design/icons';
import { db, storage } from '../firebase';
import {
  collection, addDoc, Timestamp,
  query, onSnapshot, orderBy, updateDoc, doc, getDoc, setDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import CategoryTagPicker from './CategoryTagPicker';
import CurrencyTagPicker from './CurrencyTagPicker';
import '../styles/AddExpense.css';
import { NumericFormat } from 'react-number-format';
import i18n from '../i18n';
import { getDownloadURL, uploadBytes, ref as storageRef } from 'firebase/storage';

const { Option } = Select;
const { Title, Paragraph } = Typography;

const AddExpense = ({ onExpenseAdded }) => {
  /* ---------- hooks ---------- */
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  /* ---------- state ---------- */
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [banks,     setBanks]     = useState({ credit: [], debit: [] });
  const [newBank,   setNewBank]   = useState('');          // ← input local;
  const [lastBank,  setLastBank]  = useState({ credit: null, debit: null });
  const [lastCurrency, setLastCurrency] = useState('ARS');
  const [expenseType, setExpenseType] = useState('daily');
  const [pdfFile, setPdfFile] = useState(null);

  // cardInfo: { credit|debit: { [bank]: { list:[...], last:'Visa' } } }
  const [cardInfo, setCardInfo]   = useState({ credit: {}, debit: {} });

  const ALL_CARD_TYPES = ['Visa', 'MasterCard', 'American Express'];

  /* ---------- Firestore listener ---------- */
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snap => {
      /* categorías */
      const catSet = new Set();

      /* bancos y tarjetas */
      const creditSet = new Set();
      const debitSet  = new Set();
      let   latestCredit = null;
      let   latestDebit  = null;
      let latestCurrency = null;

      const creditMap = {}; // bank -> Set cardTypes
      const debitMap  = {};
      const lastCard  = { credit: {}, debit: {} };

      snap.forEach(doc => {
        const data = doc.data();

        // primera iteración = gasto más reciente
        if (latestCurrency === null && data.currency) latestCurrency = data.currency;

        /* categorías */
        if (data.category) catSet.add(data.category);

        /* bancos y tipos de tarjeta */
        if (data.bank && data.bank !== 'N/A') {
          const pm   = data.paymentMethod;
          const bank = data.bank;
          const ctype= data.cardType;

          if (pm === 'Credit Card') {
            if (!latestCredit) latestCredit = bank;
            creditSet.add(bank);

            creditMap[bank] ||= new Set();
            if (ctype && ctype !== 'N/A') {
              creditMap[bank].add(ctype);
              if (!lastCard.credit[bank]) lastCard.credit[bank] = ctype;
            }
          } else if (pm === 'Debit Card') {
            if (!latestDebit) latestDebit = bank;
            debitSet.add(bank);

            debitMap[bank] ||= new Set();
            if (ctype && ctype !== 'N/A') {
              debitMap[bank].add(ctype);
              if (!lastCard.debit[bank]) lastCard.debit[bank] = ctype;
            }
          }
        }
      });

      if (latestCurrency === null) latestCurrency = 'ARS'; // respaldo

      /* actualizar estados */
      setCategories([...catSet].sort());

      setBanks({
        credit: [...creditSet].sort(),
        debit:  [...debitSet].sort(),
      });

      setLastBank({ credit: latestCredit, debit: latestDebit });
      setLastCurrency(latestCurrency);

      form.setFieldsValue({ currency: latestCurrency });

      setCardInfo({
        credit: Object.fromEntries(
          Object.entries(creditMap).map(([b, s]) =>
            [b, { list: [...s], last: lastCard.credit[b] }]
          )
        ),
        debit: Object.fromEntries(
          Object.entries(debitMap).map(([b, s]) =>
            [b, { list: [...s], last: lastCard.debit[b] }]
          )
        ),
      });
    });

    return () => unsub();
  }, [currentUser?.uid]);

  /* ---------- submit ---------- */
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (values.expenseType === 'daily') {
        const selectedDate = values.date ? values.date.toDate() : new Date();
        const timestamp    = Timestamp.fromDate(selectedDate);
        const date         = timestamp.toDate();

        const finalCategory = values.category?.trim() || '';
        if (!finalCategory) {
          notification.error({ message: 'Categoría requerida' });
          setLoading(false);
          return;
        }

        const newExpense = {
          amount:        parseFloat(values.amount).toFixed(2),
          currency:      values.currency,
          category:      finalCategory,
          description:   values.description,
          paymentMethod: values.paymentMethod,
          bank:          values.bank     || 'N/A',
          cardType:      values.cardType || 'N/A',
          timestamp,
          day:   date.getDate(),
          month: date.getMonth() + 1,
          year:  date.getFullYear(),
        };

        const docRef = await addDoc(
          collection(db, `users/${currentUser.uid}/expenses`),
          newExpense
        );
        newExpense.id = docRef.id;

        // Actualizar lastActivity
        await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });

        form.resetFields();
        setPaymentMethod(null);
        if (onExpenseAdded) onExpenseAdded(newExpense);
      } else {
        // Gasto fijo: quick add al array payments del mes actual
        const currentMonthKey = dayjs().format('YYYY-MM');
        const docRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
        const docSnap = await getDoc(docRef);
        let payments = [];
        if (docSnap.exists()) {
          payments = docSnap.data().payments || [];
        }
        // Subir PDF si corresponde
        let pdfUrl = '';
        if (pdfFile) {
          const fileRef = storageRef(storage, `monthlyPayments/${currentUser.uid}/${Date.now()}.pdf`);
          await uploadBytes(fileRef, pdfFile);
          pdfUrl = await getDownloadURL(fileRef);
          setPdfFile(null);
        }
        // Normalizar montos como en Expenses.js
        const normalizeAmount = (val) => {
          if (val === '' || val === undefined || val === null) return 0;
          if (typeof val === 'string') {
            let clean = val.replace(/\$/g, '');
            if (i18n.language === 'es') {
              clean = clean.replace(/\./g, '').replace(',', '.');
            } else {
              clean = clean.replace(/,/g, '');
            }
            return Number(clean) || 0;
          }
          return isNaN(val) ? 0 : val;
        };
        const selectedFixedDate = values.fixedDate ? values.fixedDate.toDate() : new Date();
        const fixedTimestamp = Timestamp.fromDate(selectedFixedDate);
        const newPayment = {
          id: Date.now().toString(),
          title: values.title,
          category: values.category || '',
          amountARS: normalizeAmount(values.amountARS),
          amountUSD: normalizeAmount(values.amountUSD),
          paid: values.paid || false,
          notes: values.notes || '',
          createdAt: selectedFixedDate.toString(),
          timestamp: fixedTimestamp,
          pdfUrl,
        };
        const updatedPayments = [...payments, newPayment];
        await setDoc(docRef, { payments: updatedPayments }, { merge: true });
        await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
        form.resetFields();
        if (onExpenseAdded) onExpenseAdded(newPayment);
      }
      setLoading(false);
    } catch (e) {
      notification.error({ message: 'Error al agregar gasto' });
      setLoading(false);
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      notification.error({ message: 'Solo se permiten archivos PDF' });
      setPdfFile(null);
    }
  };

  const addNewBank = () => {
    const name = newBank.trim();
    if (!name) return;

    let isNew = false;                 // <- para saber si lo agregamos
  
    // agrega al estado correspondiente si no existe
    if (paymentMethod === 'Credit Card') {
      if (!banks.credit.includes(name)) {
        setBanks((prev) => ({ ...prev, credit: [...prev.credit, name] }));
      }
    } else if (paymentMethod === 'Debit Card') {
      if (!banks.debit.includes(name)) {
        setBanks((prev) => ({ ...prev, debit: [...prev.debit, name] }));
      }
    }
  
    // selecciona inmediatamente el nuevo banco y limpia input
    form.setFieldsValue({ bank: name, cardType: undefined });
    setNewBank('');

    setTimeout(() => handleBankChange(name), 0);  // garante que la opción ya existe
  };

  const handleBankChange = (bk) => {
    if (paymentMethod === 'Credit Card') {
      const last = cardInfo.credit[bk]?.last;          // undefined si es nuevo
      form.setFieldsValue({
        bank: bk,
        cardType: last || 'Visa',                      // ← Visa por defecto
      });
    } else if (paymentMethod === 'Debit Card') {
      const last = cardInfo.debit[bk]?.last;
      form.setFieldsValue({
        bank: bk,
        cardType: last || 'Visa',                      // ← Visa por defecto
      });
    } else {
      form.setFieldsValue({ bank: bk });
    }
  };  

  /* ---------- render ---------- */
  return (
    <Spin spinning={loading}>
      <Card className="add-expense-modal" style={{ borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          {t('userProfile.addNewExpense.title')}
        </Title>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          {t('userProfile.addNewExpense.subtitle')}
        </Paragraph>

        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          {/* EXPENSE TYPE */}
          <Form.Item
            name="expenseType"
            label={t('userProfile.addNewExpense.expenseTypes.label')}
            initialValue="daily"
            rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.expenseTypeRequired') }]}
          >
            <Select onChange={(value) => setExpenseType(value)}>
              <Option value="daily">{t('userProfile.addNewExpense.expenseTypes.daily')}</Option>
              <Option value="fixed">{t('userProfile.addNewExpense.expenseTypes.fixed')}</Option>
            </Select>
          </Form.Item>

          {expenseType === 'daily' ? (
            <>
              {/* DATE */}
              <Form.Item
                name="date"
                label={t('userProfile.addNewExpense.date')}
                initialValue={dayjs()}
                rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.dateRequired') }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format={(val) =>
                    dayjs().isSame(val, 'day')
                      ? t('userProfile.addNewExpense.defaultDataInputDate')
                      : val.format('DD/MM/YYYY')
                  }
                />
              </Form.Item>

              {/* DESCRIPTION */}
              <Form.Item
                name="description"
                label={t('userProfile.addNewExpense.description')}
                rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.descriptionRequired') }]}
              >
                <Input prefix={<FileTextOutlined />} placeholder="Uber to work" />
              </Form.Item>

              {/* AMOUNT + CURRENCY */}
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Form.Item
                    name="amount"
                    label={t('userProfile.addNewExpense.amount')}
                    rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.amountRequired') }]}
                  >
                    <Input type="number" prefix={<DollarOutlined />} placeholder="125.50" />
                  </Form.Item>
                </Col>
                <Col xs={12} style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Item
                    name="currency"
                    initialValue={lastCurrency}
                    rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.currencyRequired') }]}
                    style={{ marginBottom: 0 }}
                  >
                    <CurrencyTagPicker />
                  </Form.Item>
                </Col>
              </Row>

              {/* PAYMENT METHOD */}
              <Form.Item
                name="paymentMethod"
                label={t('userProfile.addNewExpense.paymentMethod')}
                rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.paymentMethodRequired') }]}
              >
                <Select
                  placeholder="Seleccioná método"
                  onChange={(val) => {
                    setPaymentMethod(val);

                    if (val === 'Credit Card') {
                      form.setFieldsValue({
                        bank:     lastBank.credit || undefined,
                        cardType: lastBank.credit
                          ? cardInfo.credit[lastBank.credit]?.last
                          : undefined,
                      });
                    } else if (val === 'Debit Card') {
                      form.setFieldsValue({
                        bank:     lastBank.debit || undefined,
                        cardType: lastBank.debit
                          ? cardInfo.debit[lastBank.debit]?.last
                          : undefined,
                      });
                    } else {
                      form.setFieldsValue({ bank: undefined, cardType: undefined });
                    }
                  }}
                >
                  <Option value="Cash">Cash</Option>
                  <Option value="Credit Card">Credit Card</Option>
                  <Option value="Debit Card">Debit Card</Option>
                </Select>
              </Form.Item>

              {/* BANK & CARD TYPE (only when card selected) */}
              {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Form.Item
                      name="bank"
                      label={t('userProfile.addNewExpense.bank')}
                      rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.bankRequired') }]}
                    >
                      <Select
                        placeholder="Seleccioná banco"
                        value={form.getFieldValue('bank')}
                        onChange={handleBankChange}
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            {/* separador + input para nuevo banco */}
                            <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                              <Input
                                size="small"
                                placeholder="Agregar banco"
                                value={newBank}
                                onChange={(e) => setNewBank(e.target.value)}
                                onPressEnter={(e) => {
                                  e.preventDefault();    // evita que el Select procese el Enter
                                  e.stopPropagation();
                                  addNewBank();
                                }}
                              />
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={addNewBank}
                              />
                            </div>
                          </>
                        )}
                      >
                        {(paymentMethod === 'Credit Card' ? banks.credit : banks.debit).map((b) => (
                          <Option key={b} value={b}>
                            {b}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={12}>
                  <Form.Item
                    name="cardType"
                    label={t('userProfile.addNewExpense.cardType')}
                    rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.cardTypeRequired') }]}
                  >
                    <Select placeholder="Seleccioná tipo">
                      {(() => {
                        const bk   = form.getFieldValue('bank');
                        const info =
                          paymentMethod === 'Credit Card'
                            ? cardInfo.credit[bk]
                            : cardInfo.debit[bk];

                        /* unión: las 3 opciones fijas + las extras que existan en historial */
                        const list = Array.from(
                          new Set([ ...ALL_CARD_TYPES, ...(info?.list || []) ])
                        );

                        return list.map((ct) => (
                          <Option key={ct} value={ct}>
                            {ct}
                          </Option>
                        ));
                      })()}
                    </Select>
                  </Form.Item>
                  </Col>
                </Row>
              )}

              {/* CATEGORY */}
              <Form.Item
                name="category"
                label={t('userProfile.addNewExpense.category')}
                rules={[
                  { required: true, message: t('userProfile.addNewExpense.errorMessages.categoryRequired') },
                ]}
              >
                <CategoryTagPicker
                  categories={categories}
                  onNewCategory={(cat) => setCategories((prev) => [...prev, cat])}
                />
              </Form.Item>
            </>
          ) : (
            <>

              {/* DATE */}
              <Form.Item
                name="fixedDate"
                label={t('userProfile.addNewExpense.date')}
                initialValue={dayjs()}
                rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.dateRequired') }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format={(val) =>
                    dayjs().isSame(val, 'day')
                      ? t('userProfile.addNewExpense.defaultDataInputDate')
                      : val.format('DD/MM/YYYY')
                  }
                />
              </Form.Item>
              
              {/* TITLE */}
              <Form.Item
                name="title"
                label="Título"
                rules={[{ required: true, message: 'Ingrese un título' }]}
              >
                <Input prefix={<FileTextOutlined />} placeholder="Alquiler" />
              </Form.Item>

              {/* AMOUNT ARS + USD */}
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Form.Item
                    name="amountARS"
                    label="Monto ARS"
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
                      style={{ width: '100%' }}
                      placeholder={i18n.language === 'es' ? '0,00' : '0.00'}
                      onValueChange={vals => form.setFieldsValue({ amountARS: vals.floatValue ?? '' })}
                      value={form.getFieldValue('amountARS')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item
                    name="amountUSD"
                    label="Monto USD"
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
                      style={{ width: '100%' }}
                      placeholder={i18n.language === 'es' ? '0,00' : '0.00'}
                      onValueChange={vals => form.setFieldsValue({ amountUSD: vals.floatValue ?? '' })}
                      value={form.getFieldValue('amountUSD')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* PAID CHECKBOX */}
              <Form.Item
                name="paid"
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>Pago realizado</Checkbox>
              </Form.Item>

              {/* NOTES */}
              <Form.Item
                name="notes"
                label="Información adicional"
              >
                <Input.TextArea rows={4} placeholder="Agregar información adicional..." />
              </Form.Item>

              {/* PDF UPLOAD */}
              <Form.Item
                label="Archivo PDF"
              >
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                />
              </Form.Item>
            </>
          )}

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            style={{ marginTop: 10 }}
          >
            {t('userProfile.addNewExpense.addExpenseButton')}
          </Button>
        </Form>
      </Card>
    </Spin>
  );
};

export default AddExpense;