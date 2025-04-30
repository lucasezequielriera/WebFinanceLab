// src/components/DemoRadialChart.jsx
import React, { useState, useEffect } from 'react';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';

const DemoRadialChart = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Rango mes actual
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const q = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<',  Timestamp.fromDate(end))
    );

    const unsub = onSnapshot(q, snap => {
      // agrupar por categoría
      const acc = {};
      snap.docs.forEach(doc => {
        const { category = 'Uncategorized', amount } = doc.data();
        acc[category] = (acc[category] || 0) + Number(amount);
      });
      // transformar a array para Recharts y asignar color
      const palette = ['#8884d8','#83a6ed','#8dd1e1','#82ca9d','#a4de6c','#d0ed57','#ffc658'];
      let i = 0;
      const chartData = Object.entries(acc).map(([name, value]) => ({
        name,
        value,
        fill: palette[i++ % palette.length]
      }));
      setData(chartData);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <h3 style={{ marginTop: 10, marginLeft: 15, textAlign: 'left', fontWeight: 700, fontSize: 18 }}>
            Grafico Diario
        </h3>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="10%"
          outerRadius="80%"
          barSize={15}
          data={data}
        >
          <RadialBar 
            minAngle={15} 
            background 
            clockWise 
            dataKey="value" 
          />
          <Tooltip formatter={val => `$${val.toFixed(2)}`} />
          <Legend 
            iconSize={10} 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            payload={data.map(item => ({
              value: `${item.name} ($${item.value.toFixed(2)})`,
              type: 'square',
              color: item.fill
            }))}
          />

        </RadialBarChart>
        <RadialBarChart 
  width={730} 
  height={250} 
  innerRadius="10%" 
  outerRadius="80%" 
  data={data} 
  startAngle={180} 
  endAngle={0}
>
  <RadialBar minAngle={15} label={{ fill: '#666', position: 'insideStart' }} background clockWise={true} dataKey='uv' />
  <Legend iconSize={10} width={120} height={140} layout='vertical' verticalAlign='middle' align="right" />
  <Tooltip />
</RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DemoRadialChart;