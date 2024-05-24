const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.updateDailyResults = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users').get();
  
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const monthYear = `${currentMonth} ${currentYear}`;

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

    const resultsRef = db.collection('users').doc(userId).collection('results').doc(monthYear);
    await resultsRef.set({
      totalIncome,
      totalExpenses,
      earningsInPesos,
      earningsInDollars,
      earningsInStocks
    }, { merge: true });
  });

  return null;
});
