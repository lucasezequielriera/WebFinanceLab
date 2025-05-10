// src/pages/DetailedExpenses.js
import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Table, Select, Tag, Popconfirm, notification, Input, InputNumber, Divider, Empty, DatePicker, Tooltip } from 'antd';
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
import LocalizedDatePicker from '../components/LocalizedDatePicker';
// Styles
import '../styles/ExpensesPage.css';

const { Option } = Select;

const DetailedExpenses = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [rowEdits, setRowEdits] = useState({});
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs()
  ]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLocale = useMemo(() => i18n.language === 'en' ? enUSFns : esFns, [i18n.language]);

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

  const isEditing = record => record.id === editingId;

  const startEdit = record => {
    setEditingId(record.id);
    setRowEdits({
      description: record.description,
      amount: record.amount,
      currency: record.currency,
      category: record.category,
      timestamp: dayjs(
        record.timestamp && record.timestamp.seconds
          ? new Date(record.timestamp.seconds * 1000)
          : record.timestamp
      )
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRowEdits({});
  };

  const saveEdit = async id => {
    try {
      const { description, amount, currency, category, timestamp } = rowEdits;
      if (!timestamp || !dayjs.isDayjs(timestamp)) {
        notification.error({ message: t('userProfile.expenses.detailed.invalidDate') });
        return;
      }
      await updateDoc(
        doc(db, `users/${currentUser.uid}/expenses`, id),
        {
          description,
          amount: Number(amount),
          currency,
          category,
          timestamp: Timestamp.fromDate(timestamp.toDate())
        }
      );
      notification.success({ message: t('userProfile.expenses.detailed.updated') });
      cancelEdit();
    } catch {
      notification.error({ message: t('userProfile.expenses.detailed.updateError') });
    }
  };

  const onChangeCell = (field, value) => setRowEdits(prev => ({
    ...prev,
    [field]: field === 'timestamp'
      ? (value && dayjs.isDayjs(value) ? value : value ? dayjs(value) : prev.timestamp)
      : value
  }));

  const handleNewCategory = (value) => {
    if (value.trim()) {
      onChangeCell('category', value.trim());
      setNewCategoryInput('');
    }
  };

            const columns = [
              {
      title: t('userProfile.expenses.detailed.colDescription'),
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      onCell: () => ({
        style: { minWidth: '343px' }
      }),
      sorter: (a, b) => a.description.localeCompare(b.description),
      sortDirections: ['ascend', 'descend'],
                render: (_, rec) => isEditing(rec)
                  ? <Input
                      value={rowEdits.description}
                      onChange={e => onChangeCell('description', e.target.value)}
                    />
                  : rec.description
              },
              {
      title: t('userProfile.expenses.detailed.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      onCell: () => ({
        style: { minWidth: '147px' }
      }),
      sorter: (a, b) => a.amount - b.amount,
      sortDirections: ['descend', 'ascend'],
      render: (t, rec) => isEditing(rec)
                  ? <InputNumber
                      value={rowEdits.amount}
                      onChange={v => onChangeCell('amount', v)}
                      prefix="$"
            style={{ width: '100%' }}
          />
        : `$ ${Number(t).toFixed(2)}`
              },
              {
      title: t('userProfile.expenses.detailed.colCurrency'),
      dataIndex: 'currency',
      key: 'currency',
      width: '10%',
      sorter: (a, b) => (a.currency || '').localeCompare(b.currency || ''),
      sortDirections: ['ascend', 'descend'],
      render: (_, rec) => isEditing(rec)
        ? <Select
                      value={rowEdits.currency}
                      onChange={v => onChangeCell('currency', v)}
            style={{ width: '100%' }}
                    >
                      <Option value="ARS">ARS</Option>
                      <Option value="USD">USD</Option>
                    </Select>
                  : rec.currency
              },
              {
      title: t('userProfile.expenses.detailed.colCategory'),
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
      sortDirections: ['ascend', 'descend'],
      render: (_, rec) => isEditing(rec)
        ? <Select
            value={rowEdits.category}
            onChange={v => onChangeCell('category', v)}
            style={{ width: '100%' }}
            showSearch
            allowClear
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
            dropdownRender={menu => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ padding: '8px' }}>
                  <Input
                    placeholder={t('userProfile.expenses.detailed.newCategory')}
                    value={newCategoryInput}
                    onChange={e => setNewCategoryInput(e.target.value)}
                    onPressEnter={() => handleNewCategory(newCategoryInput)}
                  />
                </div>
              </>
            )}
          >
            {categories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
        : rec.category
    },
    {
      title: t('userProfile.expenses.detailed.colDate'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '10%',
      sorter: (a, b) => b.timestamp.seconds - a.timestamp.seconds,
      sortDirections: ['descend', 'ascend'],
      render: (ts, rec) => {
        const d = new Date(ts.seconds * 1000);
        const value = (rowEdits.timestamp && dayjs.isDayjs(rowEdits.timestamp)) ? rowEdits.timestamp : dayjs(rowEdits.timestamp || d);
        return isEditing(rec)
          ? <LocalizedDatePicker
              value={value}
              onChange={value => onChangeCell('timestamp', value)}
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }}
              format="dd/MM/yyyy HH:mm"
                      />
          : <Tooltip title={format(d, 'HH:mm:ss')}>
              {format(d, i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')}
                      </Tooltip>;
                }
              },
              {
      title: t('userProfile.expenses.detailed.colActions'),
      key: 'actions',
      width: '10%',
      onCell: () => ({
        style: { minWidth: '106px' }
      }),
      render: (_, rec) => isEditing(rec)
                  ? (
          <div style={{ minWidth: '106px' }}>
                      <Tag
                        icon={<CheckOutlined />}
              onClick={() => saveEdit(rec.id)}
              style={{ cursor: 'pointer', marginRight: 8 }}
                      />
                      <Tag
                        icon={<CloseOutlined />}
                        onClick={cancelEdit}
              style={{ cursor: 'pointer' }}
                      />
          </div>
                  )
                  : (
                    <>
                      <Tag
                        icon={<EditOutlined />}
              onClick={() => startEdit(rec)}
              style={{ cursor: 'pointer', marginRight: 8 }}
                      />
            <Popconfirm title={t('userProfile.expenses.detailed.deleteConfirm')} onConfirm={() => handleDelete(rec)}>
              <Tag icon={<DeleteOutlined />} color="red" style={{ cursor: 'pointer' }} />
                      </Popconfirm>
                    </>
                  )
              }
            ];

            return (
    <div className="container-page">
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={setDateRange}
            allowClear
            placeholder={['Fecha inicial', 'Fecha final']}
            style={{ minWidth: 280 }}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
            format={i18n.language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
          />
          <Select
            style={{ minWidth: 180 }}
            placeholder="Filtrar por categoría"
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
            options={categories.map(c => ({ value: c, label: c }))}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
          />
          <Select
            style={{ minWidth: 140 }}
            placeholder="Filtrar por moneda"
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            allowClear
            options={currencies.map(c => ({ value: c, label: c }))}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
          />
          <Select
            style={{ minWidth: 180 }}
            placeholder="Filtrar por método de pago"
            value={selectedPaymentMethod}
            onChange={setSelectedPaymentMethod}
            allowClear
            options={paymentMethods.map(m => ({ value: m, label: m }))}
            clearIcon={<span style={{ fontSize: '16px', padding: '4px' }}>✕</span>}
          />
        </div>

                <Table
                  bordered
          dataSource={filteredExpenses.slice().sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)}
                  columns={columns}
                  rowKey="id"
          pagination={{ 
            pageSize: 8,
            showSizeChanger: false
          }}
          scroll={{ x: true }}
          locale={{
            emptyText: <Empty description={t('userProfile.expenses.detailed.noExpenses')} />
          }}
        />
        {filteredExpenses.length > 0 && (
          <div className="totals-container">
            <span style={{ color: '#0071de' }}>Total ARS: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>${totalPesos.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            <span style={{ color: '#0071de', opacity: 0.5 }}>|</span>
            <span style={{ color: '#0071de' }}>Total USD: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>${totalDollars.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                </div>
        )}
      </Spin>
    </div>
  );
};

export default DetailedExpenses;
