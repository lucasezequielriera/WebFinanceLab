const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require("node-fetch");

admin.initializeApp();

const db = admin.firestore();

// Reemplazá esto por tu Token del Bot de Telegram
const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;
const FIREBASE_UID       = functions.config().telegram.uid;

exports.updateDailyResults = functions.pubsub.schedule('59 23 * * *').timeZone('America/Argentina/Buenos_Aires').onRun(async (context) => {
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users').get();

  // Obtener la fecha actual en la zona horaria correcta
  const now = new Date();
  const currentDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000); // Ajustar para el huso horario

  // Obtener el día, mes y año actuales
  const currentDay = currentDate.getDate();
  const dayString = currentDay < 10 ? `0${currentDay}` : `${currentDay}`;
  const currentMonthEnglish = currentDate.toLocaleString('en-US', { month: 'long' });
  const currentMonthSpanish = currentDate.toLocaleString('es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
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
      date: currentDate.toISOString() // Include the date for reference
    };

    const resultsRefEnglish = db.collection('users').doc(userId).collection('results').doc(monthYearEnglish).collection('days').doc(dayString);
    const resultsRefSpanish = db.collection('users').doc(userId).collection('results').doc(monthYearSpanish).collection('days').doc(dayString);
    
    await resultsRefEnglish.set(dayResults, { merge: true });
    await resultsRefSpanish.set(dayResults, { merge: true });
  });

  return null;
});

exports.receiveTelegramMessage = functions.https.onRequest(async (req, res) => {
    console.log("🔔 Trigger receiveTelegramMessage", JSON.stringify(req.body));
  
    const msg = req.body.message;
    if (!msg?.text) {
      console.log("⏩ Sin texto, saliendo");
      return res.sendStatus(200);
    }
  
    const chatId = msg.chat.id.toString();
    const text   = msg.text.trim();
    console.log("📨 chatId:", chatId, "text:", text);
  
    // dividimos por comas
    const parts = text.split(',').map(p => p.trim());
    if (parts.length < 5) {
      await reply(chatId,
        "❌ Formato inválido.\nUsa: `cantidad, moneda, categoría, descripción, método de pago`",
        true
      );
      return res.sendStatus(200);
    }
  
    // mapeo de campos
    const [rawAmount, rawCurrency, category, description, paymentMethod] = parts;
  
    // amount: acepta . o ,
    const amount = parseFloat(rawAmount.replace(',', '.')).toFixed(2);
    const currency = rawCurrency.toUpperCase();
    if (!['ARS', 'USD'].includes(currency)) {
      await reply(chatId, "❌ Moneda inválida. Solo ARS o USD.", true);
      return res.sendStatus(200);
    }
  
    if (!FIREBASE_UID) {
      await reply(chatId,
        "❌ Usuario no configurado en Functions config.",
        true
      );
      return res.sendStatus(200);
    }
  
    try {
      const now = new Date();
      const ts  = admin.firestore.Timestamp.fromDate(now);
  
      await db
        .collection(`users/${FIREBASE_UID}/expenses`)
        .add({
          amount,
          currency,
          category,
          description,
          paymentMethod,
          bank:        "N/A",
          cardType:    "N/A",
          timestamp:   ts,
          day:         now.getDate(),
          month:       now.getMonth() + 1,
          year:        now.getFullYear(),
        });
  
      await reply(
        chatId,
        `✅ Gasto añadido:\n` +
        `• Monto: $${amount}\n` +
        `• Moneda: ${currency}\n` +
        `• Categoría: ${category}\n` +
        `• Descripción: ${description}\n` +
        `• Pago: ${paymentMethod}`
      );
  
      console.log("✅ Expense saved");
      return res.sendStatus(200);
  
    } catch (err) {
      console.error("❌ Error guardando gasto:", err);
      await reply(chatId, "❌ Error interno, intenta más tarde.");
      return res.sendStatus(500);
    }
});

async function reply(chatId, text, markdown = false) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        text,
        parse_mode: markdown ? "Markdown" : "HTML"
      })
    });
}