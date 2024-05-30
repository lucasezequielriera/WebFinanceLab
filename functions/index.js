const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.updateDailyResults = functions.pubsub.schedule('59 23 * * *').timeZone('America/Argentina/Buenos_Aires').onRun(async (context) => {
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users').get();

  const now = new Date();
  const currentMonthEnglish = now.toLocaleString('default', { month: 'long', locale: 'en-US' });
  const currentMonthSpanish = now.toLocaleString('default', { month: 'long', locale: 'es-ES' });
  const currentYear = now.getFullYear();
  const day = now.getDate();
  const dayString = day < 10 ? `0${day}` : `${day}`;
  const monthYearEnglish = `${currentMonthEnglish} ${currentYear}`;
  const monthYearSpanish = `${currentMonthSpanish} ${currentYear}`;

  usersSnapshot.forEach(async (userDoc) => {
    const userId = userDoc.id;
    const expensesRef = db.collection('users').doc(userId).collection('expenses');
    const expensesSnapshot = await expensesRef.get();

    let totalIncome = 0;
    let totalExpenses = 0;
    let earningsInPesos = 0;
    let earningsInDollars = 0;
    let earningsInStocks = 0; // Assuming you have a way to calculate this

    expensesSnapshot.forEach((expenseDoc) => {
      const expense = expenseDoc.data();
      if (expense.currency === 'ARS') {
        totalExpenses += expense.amount;
        earningsInPesos -= expense.amount; // Assuming expenses reduce earnings
      } else if (expense.currency === 'USD') {
        totalExpenses += expense.amount;
        earningsInDollars -= expense.amount; // Assuming expenses reduce earnings
      }
    });

    // Add your logic to calculate totalIncome and earningsInStocks here

    const dayResults = {
      totalIncome,
      totalExpenses,
      earningsInPesos,
      earningsInDollars,
      earningsInStocks,
      date: now.toISOString() // Include the date for reference
    };

    const resultsRefEnglish = db.collection('users').doc(userId).collection('results').doc(monthYearEnglish).collection('days').doc(dayString);
    const resultsRefSpanish = db.collection('users').doc(userId).collection('results').doc(monthYearSpanish).collection('days').doc(dayString);
    
    await resultsRefEnglish.set(dayResults, { merge: true });
    await resultsRefSpanish.set(dayResults, { merge: true });
  });

  return null;
});
