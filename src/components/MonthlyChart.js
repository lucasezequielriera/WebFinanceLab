import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const generateRandomData = () => {
      const data = [];
      for (let i = 1; i <= 12; i++) {
        data.push({
          name: `Month ${i}`,
          Incomes: Math.floor(Math.random() * 1000),
          Expenses: Math.floor(Math.random() * 1000) // Nueva línea verde
        });
      }
      return data;
    };

    setData(generateRandomData());
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Incomes" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="Expenses" stroke="#82ca9d" /> {/* Nueva línea verde */}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;
