// src/components/DemoPie.js
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FFF', '#FF6699'];

export default function DemoPie() {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const q = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<',  Timestamp.fromDate(end))
    );

    const unsub = onSnapshot(q, snap => {
      const byCat = {};
      snap.docs.forEach(doc => {
        const { category = 'Sin categoría', amount } = doc.data();
        byCat[category] = (byCat[category] || 0) + Number(amount);
      });
      const chartData = Object.entries(byCat).map(([name, value]) => ({ name, value }));
      setData(chartData);
    });
    return () => unsub();
  }, [currentUser]);

  if (data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={val => `$${val.toFixed(2)}`} />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}