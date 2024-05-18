import React from 'react';
import AddExpense from '../components/AddExpense';
import ExpenseList from '../components/ExpenseList';
import MonthlyChart from '../components/MonthlyChart';

export default function Dashboard() {

  return (
    <div>
      <h1>Dashboard</h1>
      <AddExpense />
      <ExpenseList />
      <MonthlyChart />
    </div>
  );
}