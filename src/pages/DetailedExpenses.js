// src/pages/DetailedExpenses.js
import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Table, Select, DatePicker, Tag, Popconfirm, notification, Input, InputNumber, Card, Space, Divider } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, CalendarOutlined, TagOutlined, DollarOutlined, CreditCardOutlined, FilterOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import dayjs from 'dayjs';
// Styles
import '../styles/ExpensesPage.css';

const { Option } = Select;

const DetailedExpenses = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [rowEdits, setRowEdits] = useState({});
  const [selectedDay, setSelectedDay] = useState(dayjs().date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const { currentUser } = useAuth();

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
    const uniqueCategories = new Set(expenses.map(e => e.category));
    return Array.from(uniqueCategories).sort();
  }, [expenses]);

  // Obtener días únicos del mes actual para el filtro
  const days = useMemo(() => {
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();
    const daysInMonth = dayjs().daysInMonth();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const date = dayjs().year(currentYear).month(currentMonth).date(dayNumber);
      const dayName = date.format('dddd');
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return {
        value: dayNumber,
        label: `${capitalizedDayName} ${dayNumber}`
      };
    });
  }, []);

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
      const matchesDay = !selectedDay || expenseDate.getDate() === selectedDay;
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      const matchesCurrency = !selectedCurrency || expense.currency === selectedCurrency;
      const matchesPaymentMethod = !selectedPaymentMethod || expense.paymentMethod === selectedPaymentMethod;
      const isCurrentMonth = expenseDate.getMonth() === dayjs().month() && 
                            expenseDate.getFullYear() === dayjs().year();
      
      return matchesDay && matchesCategory && matchesCurrency && matchesPaymentMethod && isCurrentMonth;
    });
  }, [expenses, selectedDay, selectedCategory, selectedCurrency, selectedPaymentMethod]);

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
      notification.success({ message: 'Gasto eliminado' });
    } catch {
      notification.error({ message: 'Error al eliminar' });
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
        notification.error({ message: 'La fecha/hora es inválida.' });
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
      notification.success({ message: 'Gasto actualizado' });
      cancelEdit();
    } catch {
      notification.error({ message: 'Error al actualizar' });
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
      title: 'Descripción',
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
      title: 'Monto',
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
      title: 'Categoría',
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
                    placeholder="Nueva categoría"
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
      title: 'Moneda',
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
      title: 'Hora',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '10%',
      sorter: (a, b) => b.timestamp.seconds - a.timestamp.seconds,
      sortDirections: ['descend', 'ascend'],
      render: (ts, rec) => {
        const d = new Date(ts.seconds * 1000);
        const value = (rowEdits.timestamp && dayjs.isDayjs(rowEdits.timestamp)) ? rowEdits.timestamp : dayjs(rowEdits.timestamp || d);
        return isEditing(rec)
          ? <DatePicker
              value={value}
              onChange={value => onChangeCell('timestamp', value)}
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              getPopupContainer={trigger => document.body}
            />
          : format(d, 'HH:mm');
      }
    },
    {
      title: 'Acciones',
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
            <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(rec)}>
              <Tag icon={<DeleteOutlined />} color="red" style={{ cursor: 'pointer' }} />
            </Popconfirm>
          </>
        )
    }
  ];

  return (
    <div className="container-page">
      <Spin spinning={loading}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: 16,
          maxWidth: '800px',
          width: '100%'
        }}>
          <FilterOutlined style={{ 
            fontSize: '20px', 
            color: '#1890ff',
            marginRight: '8px'
          }} />
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            flex: 1
          }}>
            <Select
              placeholder="Día"
              value={selectedDay}
              onChange={setSelectedDay}
              allowClear
              suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
            >
              {days.map(day => (
                <Option key={day.value} value={day.value}>{day.label}</Option>
              ))}
            </Select>

            <Select
              placeholder="Categoría"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
              suffixIcon={<TagOutlined style={{ color: '#1890ff' }} />}
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>

            <Select
              placeholder="Moneda"
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              allowClear
              suffixIcon={<DollarOutlined style={{ color: '#1890ff' }} />}
            >
              {currencies.map(curr => (
                <Option key={curr} value={curr}>{curr}</Option>
              ))}
            </Select>

            <Select
              placeholder="Método"
              value={selectedPaymentMethod}
              onChange={setSelectedPaymentMethod}
              allowClear
              suffixIcon={<CreditCardOutlined style={{ color: '#1890ff' }} />}
            >
              {paymentMethods.map(method => (
                <Option key={method} value={method}>{method}</Option>
              ))}
            </Select>
          </div>
        </div>

        <Table
          bordered
          dataSource={filteredExpenses.slice().sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: true }}
        />
        {filteredExpenses.length > 0 && (
          <div className="totals-container">
            <span style={{ color: '#0071de' }}>Total ARS: ${totalPesos.toFixed(2)}</span>
            <span style={{ color: '#0071de', opacity: 0.5 }}>|</span>
            <span style={{ color: '#0071de' }}>Total USD: ${totalDollars.toFixed(2)}</span>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default DetailedExpenses;
