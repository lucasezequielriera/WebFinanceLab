// src/pages/GeneralIncomes.js
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin, Row, Col, Select, Empty } from 'antd';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ExpensesPage.css'; // reuse same styles

const { Option } = Select;

const GeneralIncomes = () => {
  const { currentUser } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // subscribe incomes
  useEffect(() => {
    if (!currentUser) return;
    const ref = collection(db, `users/${currentUser.uid}/incomes`);
    const unsub = onSnapshot(query(ref), snap => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setIncomes(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // default to current month if any
  useEffect(() => {
    const thisMonth = format(new Date(), 'MMMM yyyy', { locale: es });
    if (incomes.some(i => {
      const m = format(new Date(i.timestamp.seconds * 1000), 'MMMM yyyy', { locale: es });
      return m === thisMonth;
    })) {
      setSelectedMonth(thisMonth);
    }
  }, [incomes]);

  const handleMonthChange = v => setSelectedMonth(v);

  // filter by month
  const filtered = useMemo(() => {
    if (!selectedMonth) return [];
    const [monthName, year] = selectedMonth.split(' ');
    return incomes.filter(i =>
      format(new Date(i.timestamp.seconds * 1000), 'MMMM', { locale: es }) === monthName &&
      String(new Date(i.timestamp.seconds * 1000).getFullYear()) === year
    );
  }, [selectedMonth, incomes]);

  // group by category (or 'Other')
  const monthlyTotals = useMemo(() => {
    const groups = {};
    filtered.forEach(i => {
      const cat = i.category || 'Other';
      groups[cat] = (groups[cat] || 0) + parseFloat(i.amount);
    });
    return groups;
  }, [filtered]);

  // build dropdown months
  const monthOptions = useMemo(() => {
    const setMonths = new Set(incomes.map(i =>
      format(new Date(i.timestamp.seconds * 1000), 'MMMM yyyy', { locale: es })
    ));
    return Array.from(setMonths).sort((a, b) =>
      new Date(b) - new Date(a)
    );
  }, [incomes]);

  // table data
  const dataSource = Object.entries(monthlyTotals).map(([category, total]) => ({
    key: category,
    category,
    total,
  }));
  const columns = [
    { title: 'Category', dataIndex: 'category', key: 'category', width: '70%' },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: '30%',
      render: val => `$${val.toFixed(2)}`
    }
  ];

  if (loading) {
    return <Spin tip="Loading..." size="large" className="centered-spinner" />;
  }

  return (
    <div className="container-page">
      <Select
        style={{ width: 200, marginBottom: 16 }}
        placeholder="Select Month"
        value={selectedMonth}
        onChange={handleMonthChange}
      >
        {monthOptions.map(m => <Option key={m} value={m}>{m}</Option>)}
      </Select>

      {!selectedMonth || dataSource.length === 0 ? (
        <Empty description="No incomes for this month" style={{ marginTop: 40 }} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <h2>{selectedMonth}</h2>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              rowKey="category"
              summary={pageData => {
                const total = pageData.reduce((sum, r) => sum + r.total, 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell>Total</Table.Summary.Cell>
                    <Table.Summary.Cell>${total.toFixed(2)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default GeneralIncomes;