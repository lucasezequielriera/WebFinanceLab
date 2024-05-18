import React from 'react';
import AddExpense from '../components/AddExpense';
import ExpenseList from '../components/ExpenseList';
import MonthlyChart from '../components/MonthlyChart';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { Row, Col } from 'antd';

export default function Dashboard() {

  return (
    <div>
      <h1>Dashboard</h1>
      <Row gutter={16}>
        <Col span={8}>
          <ExpenseList />
          <AddExpense />
        </Col>
        <Col span={8}>
          <PesoExpenseCounter />
        </Col>
        <Col span={8}>
          <DollarExpenseCounter />
        </Col>
      </Row>
      <MonthlyChart />
    </div>
  );
}