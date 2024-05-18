import React from 'react';

const ExpenseList = ({ expenses }) => {
  return (
    <div>
      <h2>Expense List</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.description}: {expense.amount} {expense.currency}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExpenseList;
