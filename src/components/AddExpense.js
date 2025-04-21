import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Select, notification, Spin,
  Typography, Row, Col, Card, DatePicker
} from 'antd';
import { DollarOutlined, FileTextOutlined, BankOutlined, PlusOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import {
  collection, addDoc, Timestamp,
  query, onSnapshot, orderBy
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import CategoryTagPicker from './CategoryTagPicker';
import CurrencyTagPicker from './CurrencyTagPicker';
import '../styles/AddExpense.css';

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

      form.resetFields();
      setPaymentMethod(null);

      notification.success({
        message: 'Gasto añadido',
        description: 'Tu gasto fue registrado exitosamente.',
      });
      onExpenseAdded(newExpense);
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Error',
        description: 'No se pudo registrar el gasto. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
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