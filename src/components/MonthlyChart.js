import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyChart = ({ incomes }) => {
  const [data, setData] = useState([]);
  const monthsOrder = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const incomesData = {};
    incomes.forEach((income) => {
      const month = income.month;
      if (!incomesData[month]) {
        incomesData[month] = 0;
      }
      incomesData[month] += income.amount;
    });

    const chartData = Object.keys(incomesData).map((month) => ({
      name: month,
      income: incomesData[month],
    }));

    chartData.sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));

    setData(chartData);
  }, [incomes]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 5, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;
