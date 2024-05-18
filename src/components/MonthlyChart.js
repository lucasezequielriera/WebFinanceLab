import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Datos de ejemplo
const data = [
  { name: 'Jan 24', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb 24', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar 24', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr 24', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May 24', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun 24', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul 24', uv: 3490, pv: 4300, amt: 2100 },
  { name: 'Aug 24', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Sep 24', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Oct 24', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Nov 24', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Dec 24', uv: 2390, pv: 3800, amt: 2500 },
];

const MonthlyChart = () => {
    return (<div className='margin-top-large'>
        <h1 style={{ textAlign: 'center'}}>Anual Chart 2024</h1>
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
            <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
            <Line type="monotone" dataKey="amt" stroke="#009999" />

        </LineChart>
        </ResponsiveContainer>
    </div>);
};

export default MonthlyChart;
