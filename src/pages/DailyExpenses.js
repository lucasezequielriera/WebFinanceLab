// src/pages/DetailedExpenses.js
import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Select, notification, Input, Empty, DatePicker, Tooltip, Modal, Form, Button, Typography, Row, Col } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, CalendarOutlined, TagOutlined, DollarOutlined, CreditCardOutlined, FilterOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { es as esFns, enUS as enUSFns } from 'date-fns/locale';
import esES from 'antd/es/locale/es_ES';
import enUS from 'antd/es/locale/en_US';
import CustomDatePicker from '../components/CustomDatePicker';
import CurrencyTagPicker from '../components/CurrencyTagPicker';
import ModernDeleteConfirm from '../components/ModernDeleteConfirm';
import useIsMobile from '../hooks/useIsMobile';
// Styles
import '../styles/ExpensesPage.css';

const { Option } = Select;

const DailyExpenses = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs()
  ]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLocale = useMemo(() => i18n.language === 'en' ? enUSFns : esFns, [i18n.language]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, `users/${currentUser.uid}/expenses`));

    const unsub = onSnapshot(q, snap => {
      const all = [];
      snap.forEach(d => {
        const ex = { id: d.id, ...d.data() };
        all.push(ex);
      });
      setExpenses(all);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

    // Obtener categorías únicas para el filtro
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      expenses
        .filter(e => {
          // Si hay un rango de fechas seleccionado, filtrar por ese rango
          if (dateRange) {
            const expenseDate = new Date(e.timestamp.seconds * 1000);
            return (
              (!dateRange[0] || dayjs(expenseDate).isAfter(dateRange[0], 'day') || dayjs(expenseDate).isSame(dateRange[0], 'day')) &&
              (!dateRange[1] || dayjs(expenseDate).isBefore(dateRange[1], 'day') || dayjs(expenseDate).isSame(dateRange[1], 'day'))
            );
          }
          // Si no hay rango de fechas, incluir todas las categorías
          return true;
        })
        .map(e => e.category)
    );
    return Array.from(uniqueCategories).sort();
  }, [expenses, dateRange]);

  // Obtener monedas únicas para el filtro
  const currencies = useMemo(() => {
    const uniqueCurrencies = new Set(expenses.map(e => e.currency));
    return Array.from(uniqueCurrencies).sort();
  }, [expenses]);

  // Obtener métodos de pago únicos para el filtro
  const paymentMethods = useMemo(() => {
    const uniqueMethods = new Set(expenses
      .map(e => e.paymentMethod)
      .filter(method => method && method.trim() !== '')
    );
    return Array.from(uniqueMethods).sort();
  }, [expenses]);

    // Filtrar gastos según los filtros seleccionados
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.timestamp.seconds * 1000);
      const matchesDate = !dateRange || (
        (!dateRange[0] || dayjs(expenseDate).isAfter(dateRange[0], 'day') || dayjs(expenseDate).isSame(dateRange[0], 'day')) &&
        (!dateRange[1] || dayjs(expenseDate).isBefore(dateRange[1], 'day') || dayjs(expenseDate).isSame(dateRange[1], 'day'))
      );
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      const matchesCurrency = !selectedCurrency || expense.currency === selectedCurrency;
      const matchesPaymentMethod = !selectedPaymentMethod || expense.paymentMethod === selectedPaymentMethod;
      
      return matchesDate && matchesCategory && matchesCurrency && matchesPaymentMethod;
    });
  }, [expenses, dateRange, selectedCategory, selectedCurrency, selectedPaymentMethod]);

  // Calcular totales
  const totalPesos = useMemo(() => {
    return filteredExpenses
      .filter(expense => expense.currency === 'ARS')
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  }, [filteredExpenses]);

  const totalDollars = useMemo(() => {
    return filteredExpenses
      .filter(expense => expense.currency === 'USD')
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  }, [filteredExpenses]);

  const handleDelete = async exp => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/expenses`, exp.id));
      notification.success({ message: t('userProfile.expenses.detailed.deleted') });
    } catch {
      notification.error({ message: t('userProfile.expenses.detailed.deleteError') });
    }
  };

  const openEditModal = (rec) => {
    setEditingExpense(rec);
    form.setFieldsValue({
      description: rec.description,
      amount: Number(rec.amount),
      currency: rec.currency,
      category: rec.category,
      timestamp: dayjs(rec.timestamp.seconds ? new Date(rec.timestamp.seconds * 1000) : rec.timestamp)
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      setUpdating(true);
      await updateDoc(
        doc(db, `users/${currentUser.uid}/expenses`, editingExpense.id),
        {
          description: values.description,
          amount: Number(values.amount),
          currency: values.currency,
          category: values.category,
          timestamp: Timestamp.fromDate(values.timestamp.toDate())
        }
      );
      notification.success({ message: t('userProfile.expenses.detailed.updated') });
      setEditModalVisible(false);
      setEditingExpense(null);
      form.resetFields();
    } catch {
      notification.error({ message: t('userProfile.expenses.detailed.updateError') });
    } finally {
      setUpdating(false);
    }
  };

  

            return (
    <div className="container-page">
      <Spin spinning={loading}>
        <div className="filters-bar">
          <div className="filters-left">
            <div className="modern-icon blue"><FilterOutlined /></div>
          <DatePicker.RangePicker
              className="modern-range-picker"
            value={dateRange}
            onChange={setDateRange}
            allowClear
              placeholder={[i18n.language === 'en' ? 'Start date' : 'Fecha inicial', i18n.language === 'en' ? 'End date' : 'Fecha final']}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
            format={i18n.language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
          />
          </div>
          <div className="filters-right">
          <Select
              className="modern-select"
              placeholder={t('userProfile.expenses.detailed.filterCategory')}
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
            options={categories.map(c => ({ value: c, label: c }))}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
              style={{ minWidth: 180 }}
          />
          <Select
              className="modern-select"
              placeholder={t('userProfile.expenses.detailed.filterCurrency')}
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            allowClear
            options={currencies.map(c => ({ value: c, label: c }))}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
              style={{ minWidth: 140 }}
          />
          <Select
              className="modern-select"
              placeholder={t('userProfile.expenses.detailed.filterMethod')}
            value={selectedPaymentMethod}
            onChange={setSelectedPaymentMethod}
            allowClear
            options={paymentMethods.map(m => ({ value: m, label: m }))}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
              style={{ minWidth: 200 }}
          />
          </div>
        </div>

        {/* Modern grid table (matching Incomes style) */}
        {filteredExpenses.length > 0 ? (
          <>
            {!isMobile && (
            <div className="modern-grid-table daily-grid-table">
              <div className="modern-grid-header">
                <div className="col col-desc">{t('userProfile.expenses.detailed.colDescription')}</div>
                <div className="col col-amt">{t('userProfile.expenses.detailed.colAmount')}</div>
                <div className="col col-cur">{t('userProfile.expenses.detailed.colCurrency')}</div>
                <div className="col col-cat">{t('userProfile.expenses.detailed.colCategory')}</div>
                <div className="col col-date">{t('userProfile.expenses.detailed.colDate')}</div>
                <div className="col col-act">{t('userProfile.expenses.detailed.colActions')}</div>
              </div>
              <div className="modern-grid-body">
                {filteredExpenses
                  .slice()
                  .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
                  .map((rec) => {
                    const d = new Date(rec.timestamp.seconds * 1000);
                    const dateStr = format(d, i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy');
                    return (
                      <div className="modern-grid-row" key={rec.id}>
                        <div className="col col-desc" title={rec.description}>{rec.description}</div>
                        <div className="col col-amt">{`$ ${Number(rec.amount).toFixed(2)}`}</div>
                        <div className="col col-cur">{rec.currency}</div>
                        <div className="col col-cat">{rec.category}</div>
                        <div className="col col-date"><Tooltip title={format(d, 'HH:mm:ss')}>{dateStr}</Tooltip></div>
                        <div className="col col-act">
                          <span className="action-chip edit" onClick={() => openEditModal(rec)}><EditOutlined /></span>
                          <ModernDeleteConfirm
                            title={t('userProfile.incomes.table.deleteIncome.ask')}
                            description="Esta acción no se puede deshacer."
                            okText="Eliminar"
                            cancelText="Cancelar"
                            onConfirm={() => handleDelete(rec)}
                          >
                            <span className="action-chip delete"><DeleteOutlined /></span>
                          </ModernDeleteConfirm>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            )}

            {isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredExpenses
                  .slice()
                  .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
                  .map((rec) => {
                    const d = new Date(rec.timestamp.seconds * 1000);
                    const dateStr = format(d, i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy');
                    const pillBg = rec.currency === 'USD' ? 'rgba(107, 230, 178, 0.12)' : 'rgba(105, 192, 255, 0.12)';
                    const pillColor = rec.currency === 'USD' ? '#6be6b2' : '#69c0ff';
                    return (
                      <div
                        key={rec.id}
                        style={{
                          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          padding: 12,
                          boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: '#e2e8f0', fontSize: 12 }}>{dateStr}</div>
                          <span style={{
                            background: pillBg,
                            color: pillColor,
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 999,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 700
                          }}>{rec.currency}</span>
                        </div>
                        <div style={{ marginTop: 6, color: '#fff', fontWeight: 700, fontSize: 14 }} title={rec.description}>{rec.description}</div>
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: pillColor, fontSize: 16, fontWeight: 800 }}>
                            ${Number(rec.amount).toFixed(2)}
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span className="action-chip edit" onClick={() => openEditModal(rec)}><EditOutlined /></span>
                            <ModernDeleteConfirm
                              title={t('userProfile.incomes.table.deleteIncome.ask')}
                              description="Esta acción no se puede deshacer."
                              okText="Eliminar"
                              cancelText="Cancelar"
                              onConfirm={() => handleDelete(rec)}
                            >
                              <span className="action-chip delete" style={{ cursor: 'pointer' }}><DeleteOutlined /></span>
                            </ModernDeleteConfirm>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="modern-card-footer">
              <div className="totals">
                <span className="total-label" style={{ textTransform: 'uppercase' }}>{t('userProfile.incomes.table.totalARS')}</span>
                <span className="total-value">${totalPesos.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="divider">|</span>
                <span className="total-label" style={{ textTransform: 'uppercase' }}>{t('userProfile.incomes.table.totalUSD')}</span>
                <span className="total-value">${totalDollars.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 24 }}>
            <Empty description={t('userProfile.expenses.detailed.noExpenses')} />
                </div>
        )}

        {/* Edit Expense Modal (modern style) */}
        <Modal
          className="edit-income-modal"
          open={editModalVisible}
          footer={null}
          onCancel={() => { setEditModalVisible(false); setEditingExpense(null); form.resetFields(); }}
          centered
          width={520}
        >
          <div className="edit-income-modal-content">
            <div className="modal-header">
              <div className="modal-icon-container income-icon">
                <EditOutlined />
              </div>
              <div className="modal-title-section">
                <Typography.Title level={3} className="modal-title">
                  {t('userProfile.expenses.detailed.editTitle') || 'Editar gasto'}
                </Typography.Title>
                <Typography.Paragraph className="modal-subtitle">
                  {t('userProfile.expenses.detailed.editSubtitle') || 'Modifica los datos del gasto'}
                </Typography.Paragraph>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleEditSubmit} className="edit-income-form">
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item name="timestamp" label={t('userProfile.incomes.table.editIncome.date')} rules={[{ required: true }]} className="form-item-modern">
                    <CustomDatePicker
                      value={form.getFieldValue('timestamp')}
                      onChange={(date) => form.setFieldsValue({ timestamp: date })}
                      placeholder={t('userProfile.incomes.table.editIncome.date') || 'Seleccionar fecha'}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="description" label={t('userProfile.expenses.detailed.colDescription')} rules={[{ required: true }]} className="form-item-modern">
                    <Input className="modern-input" />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item name="amount" label={t('userProfile.expenses.detailed.colAmount')} rules={[{ required: true }]} className="form-item-modern">
                    <Input className="modern-input" type="number" prefix={<DollarOutlined className="input-icon" />} />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item name="currency" label={t('userProfile.expenses.detailed.colCurrency')} rules={[{ required: true }]} className="form-item-modern">
                    <CurrencyTagPicker />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="category" label={t('userProfile.expenses.detailed.colCategory')} rules={[{ required: true }]} className="form-item-modern">
                    <Select
                      className="modern-select"
                      showSearch
                      allowClear
                      style={{ width: '100%' }}
                      options={categories.map(c => ({ value: c, label: c }))}
                      placeholder={t('userProfile.expenses.detailed.colCategory')}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Button className="modern-submit-btn income-submit" type="primary" htmlType="submit" size="large" block loading={updating}>
                <EditOutlined />
                {t('userProfile.incomes.table.editIncome.saveButton')}
              </Button>
            </Form>
          </div>
        </Modal>
      </Spin>
    </div>
  );
};

export default DailyExpenses;
