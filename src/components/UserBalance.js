import React, { useEffect, useState } from 'react';
import moment from 'moment';

const UserBalance = ({ userInfo, monthlyExpenses }) => {
    const [dollarBlue, setDollarBlue] = useState(1100); // valor default

    useEffect(() => {
        fetch('https://dolarapi.com/v1/dolares/blue')
        .then(res => res.json())
        .then(data => {
            setDollarBlue(data.venta); // usamos el precio de venta
            console.log(data)
        })
        .catch(() => {
            console.error("No se pudo obtener el dólar blue. Usando valor por defecto.");
        });
    }, []);

    console.log(dollarBlue)

  const parseNumber = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateTotal = () => {
    if (!userInfo) return { pesos: 0, dollars: 0 };

    let totalARS = 0;
    let totalUSD = 0;

    // Sumá ingresos
    userInfo.jobs?.forEach((job) => {
      const salary = parseNumber(job.salary);
      if (job.currency === "ARS") totalARS += salary;
      if (job.currency === "USD") totalUSD += salary;
    });

    // Filtrá solo los gastos del mes actual
    const currentMonth = moment().month();
    const currentYear = moment().year();

    monthlyExpenses
      ?.filter((expense) => {
        const date = moment.unix(expense.timestamp?.seconds || 0);
        return date.month() === currentMonth && date.year() === currentYear;
      })
      .forEach((expense) => {
        const amount = parseNumber(expense.amount);
        if (expense.currency === "ARS") totalARS -= amount;
        if (expense.currency === "USD") totalUSD -= amount;
      });

    return {
      pesos: totalARS + totalUSD * dollarBlue,
      dollars: totalUSD + totalARS / dollarBlue,
    };
  };

  const totals = calculateTotal();

  return (
    <div className="total" style={{ fontSize: 25, fontWeight: 600 }}>
      {userInfo?.displayBalance === "ARS" && (
        <span style={{ color: '#504f4f' }}>
          ${totals.pesos.toFixed(2)}
        </span>
      )}
      {userInfo?.displayBalance === "USD" && (
        <span style={{ color: '#504f4f' }}>
          ${totals.dollars.toFixed(2)}
        </span>
      )}
      {userInfo?.displayBalance === "Both" && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#504f4f', marginRight: 12 }}>
            ${totals.pesos.toFixed(2)} <span style={{ fontSize: 10 }}>ARS</span>
          </span>
          <span style={{ color: '#504f4f' }}>
            ${totals.dollars.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserBalance;