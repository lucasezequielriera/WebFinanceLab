import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyChart = ({ incomes = [] }) => {
  const [data, setData] = useState([]);

  const monthsOrder = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  useEffect(() => {
    console.log("Incomes received in MonthlyChart:", incomes);

    const incomesData = monthsOrder.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    incomes.forEach((income) => {
      monthsOrder.forEach(month => {
        const monthKey = month.toLowerCase();
        if (income[monthKey] !== undefined) {
          incomesData[month] += Number(income[monthKey]) || 0;
        }
      });
    });

    const chartData = monthsOrder.map((month) => ({
      name: month,
      income: incomesData[month],
    })).filter(data => data.income !== 0);

    console.log("ChartData prepared for LineChart:", chartData);
    setData(chartData);
  }, [incomes, monthsOrder]);

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
