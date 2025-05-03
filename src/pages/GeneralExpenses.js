import React, { useState, useEffect, useMemo }  from 'react';
import { Table, Spin, Row, Col, Select, Empty }        from 'antd';
import { db }                                   from '../firebase';
import { collection, query, onSnapshot }        from 'firebase/firestore';
import { useAuth }                              from '../contexts/AuthContext';
import { useTranslation }                       from 'react-i18next';
import { format }                               from 'date-fns';
import { es, enUS }                             from 'date-fns/locale';
import { FilterOutlined, CalendarOutlined }     from '@ant-design/icons';
// Styles
import '../styles/ExpensesPage.css'

const GeneralExpenses = () => {
  const [expenses, setExpenses]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [months, setMonths]               = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { Option } = Select;

  const currentLocale = i18n.language === 'en' ? enUS : es;

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

      // Generar meses únicos con label en idioma
      const ms = new Map();
      expensesData.forEach(item => {
        const dt = new Date(item.timestamp.seconds * 1000);
        const monthNum = dt.getMonth() + 1;
        const year = dt.getFullYear();
        const value = `${year}-${monthNum.toString().padStart(2, '0')}`;
        const label = `${format(dt, 'MMMM', { locale: currentLocale }).charAt(0).toUpperCase() + format(dt, 'MMMM', { locale: currentLocale }).slice(1)} ${year}`;
        ms.set(value, label);
      });
      const monthsArr = Array.from(ms, ([value, label]) => ({ value, label }));
      // Ordenar de más actual a más viejo
      monthsArr.sort((a, b) => {
        // a.value y b.value son 'YYYY-MM'
        return b.value.localeCompare(a.value);
      });
      setMonths(monthsArr);

      if (!selectedMonth && monthsArr.length) {
        setSelectedMonth(monthsArr[0].value);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, i18n.language]);

  const handleMonthChange = m => setSelectedMonth(m);

  // Filtrado por mes y año usando string 'YYYY-MM'
  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return [];
    const [year, month] = selectedMonth.split('-');
    return expenses.filter(item => {
      const dt = new Date(item.timestamp.seconds * 1000);
      return dt.getFullYear() === parseInt(year, 10) && (dt.getMonth() + 1) === parseInt(month, 10);
    });
  }, [selectedMonth, expenses]);

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

  const monthlyData = useMemo(() => calculateMonthlyTotals(filteredExpenses), [filteredExpenses]);

  const generateColumns = () => [
    {
      title: t('userProfile.expenses.general.table.category'),
      dataIndex: 'category',
      key: 'category',
      width: '60%',
      ellipsis: true,
    },
    {
      title: t('userProfile.expenses.general.table.totalPesos'),
      dataIndex: 'totalPesos',
      key: 'totalPesos',
      width: '20%',
      render: (text) => text ? `$ ${parseFloat(text).toFixed(2)}` : '-',
    },
    {
      title: t('userProfile.expenses.general.table.totalDollars'),
      dataIndex: 'totalDollars',
      key: 'totalDollars',
      width: '20%',
      render: (text) => text ? `$ ${parseFloat(text).toFixed(2)}` : '-',
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
            placeholder={t("userProfile.incomes.filter.placeholder")}
            value={selectedMonth}
            onChange={handleMonthChange}
            suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
          >
            {months.map(m => (
              <Option key={m.value} value={m.value}>
                {m.label}
              </Option>
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
                locale={{
                  emptyText: <Empty description={t('userProfile.expenses.detailed.noExpenses')} />
                }}
              />
              {dataSource.length > 0 && (
                <div className="totals-container">
                  <span style={{ color: '#0071de' }}>{t('userProfile.expenses.general.totalARS')} ${dataSource.reduce((sum, record) => sum + (parseFloat(record.totalPesos) || 0), 0).toFixed(2)}</span>
                  <span style={{ color: '#0071de', opacity: 0.5 }}>|</span>
                  <span style={{ color: '#0071de' }}>{t('userProfile.expenses.general.totalUSD')} ${dataSource.reduce((sum, record) => sum + (parseFloat(record.totalDollars) || 0), 0).toFixed(2)}</span>
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
