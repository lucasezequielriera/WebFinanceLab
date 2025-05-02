import React, { useState, useEffect, useMemo }  from 'react';
import { Table, Spin, Row, Col, Select }        from 'antd';
import { db }                                   from '../firebase';
import { collection, query, onSnapshot }        from 'firebase/firestore';
import { useAuth }                              from '../contexts/AuthContext';
import { format }                               from 'date-fns';
import { es }                                   from 'date-fns/locale';
import { FilterOutlined, CalendarOutlined }       from '@ant-design/icons';
// Styles
import '../styles/ExpensesPage.css'

const GeneralExpenses = () => {
  const [expenses, setExpenses]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const { currentUser } = useAuth();
  const { Option } = Select;

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const q = query(expensesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesData);
      setLoading(false);

      // Establecer el mes actual como seleccionado
      const currentMonthYear = getCurrentMonthYear();
      setSelectedMonth(currentMonthYear);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleMonthChange = (value) => setSelectedMonth(value);

  const getCurrentMonthYear = () => {
    const date = new Date();
    const month = format(date, 'MMMM', { locale: es });
    const year = date.getFullYear();

    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  const calculateMonthlyTotals = (expenses) => {
    const monthlyData = {};

    expenses.forEach((expense) => {
      const category = expense.category || 'Uncategorized';
      const amount = parseFloat(expense.amount);
      const currency = expense.currency || 'USD';

      if (!monthlyData[category]) {
        monthlyData[category] = { amountPesos: 0, amountDollars: 0 };
      }

      if (currency === 'ARS') {
        monthlyData[category].amountPesos += amount;
      } else if (currency === 'USD') {
        monthlyData[category].amountDollars += amount;
      }
    });

    return monthlyData;
  };

  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return [];

    const [month, year] = selectedMonth.split(' ');
    const monthLower = month.toLowerCase();

    return expenses.filter(expense => {
      const expenseMonth = format(new Date(expense.timestamp.seconds * 1000), 'MMMM', { locale: es });
      return expenseMonth === monthLower && expense.year === parseInt(year, 10);
    });
  }, [selectedMonth, expenses]);

  const monthlyData = useMemo(() => calculateMonthlyTotals(filteredExpenses), [filteredExpenses]);

  const generateColumns = () => [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '60%',
      ellipsis: true, // Truncate text in mobile view
    },
    {
      title: 'Total (Pesos)',
      dataIndex: 'totalPesos',
      key: 'totalPesos',
      width: '20%',
      render: (text) => text ? `$${parseFloat(text).toFixed(2)}` : '$0.00',
    },
    {
      title: 'Total (Dollars)',
      dataIndex: 'totalDollars',
      key: 'totalDollars',
      width: '20%',
      render: (text) => text ? `$${parseFloat(text).toFixed(2)}` : 'USD0.00',
    },
  ];

  const columns = generateColumns();

  const dataSource = Object.entries(monthlyData)
    .map(([category, totals]) => ({
      category,
      totalPesos: totals.amountPesos,
      totalDollars: totals.amountDollars
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const getSortedMonths = () => {
    const spanishMonthMap = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    const sortedMonths = Array.from(new Set(expenses.map(expense => {
      const month = format(new Date(expense.timestamp.seconds * 1000), 'MMMM', { locale: es });
      return `${month.charAt(0).toUpperCase() + month.slice(1)} ${expense.year}`;
    })))
    .sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(parseInt(yearA), spanishMonthMap[monthA.toLowerCase()]);
      const dateB = new Date(parseInt(yearB), spanishMonthMap[monthB.toLowerCase()]);

      return dateB - dateA;
    });

    return sortedMonths;
  };

  return (
    <div className='container-page'>
      <Spin spinning={loading}>
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
            style={{ flex: 1 }}
            placeholder="Seleccionar mes"
            value={selectedMonth}
            onChange={handleMonthChange}
            suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
          >
            {getSortedMonths().map(month => (
              <Option key={month} value={month}>{month}</Option>
            ))}
          </Select>
        </div>

        {/* Table */}
        {selectedMonth && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Table
                dataSource={dataSource}
                columns={columns}
                pagination={{ pageSize: 8 }}
                rowKey="category"
                scroll={{ x: true }}
              />
              {dataSource.length > 0 && (
                <div className="totals-container">
                  <span style={{ color: '#0071de' }}>Total ARS: ${dataSource.reduce((sum, record) => sum + (parseFloat(record.totalPesos) || 0), 0).toFixed(2)}</span>
                  <span style={{ color: '#0071de', opacity: 0.5 }}>|</span>
                  <span style={{ color: '#0071de' }}>Total USD: ${dataSource.reduce((sum, record) => sum + (parseFloat(record.totalDollars) || 0), 0).toFixed(2)}</span>
                </div>
              )}
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default GeneralExpenses;
