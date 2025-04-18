const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

// Reemplazá esto por tu Token del Bot de Telegram
const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;
const FIREBASE_UID       = functions.config().telegram.uid;
const SESSIONS           = "telegramSessions";

// normalize a método de pago Cash/Credit Card/Debit Card
function normalizePaymentMethod(raw) {
    const s = raw.trim().toLowerCase();
    if (s.includes('crédito') || s.includes('credito') || s.includes('credit')) return 'Credit Card';
    if (s.includes('débito')  || s.includes('debito')  || s.includes('debit'))  return 'Debit Card';
    if (s.includes('efectivo')|| s.includes('cash'))    return 'Cash';
    return null;
}

// normalize a moneda ARS/USD
function normalizeCurrency(raw) {
    const s = raw.trim().toLowerCase();
    if (s.includes('peso'))               return 'ARS';
    if (s.includes('dólar') || s.includes('dolar') || s.includes('usd') || s.includes('$')) return 'USD';
    return null;
}

// 1) Cuando el usuario escribe “gasto” (exacto), enviamos las instrucciones
//    y activamos una sesión de “awaitingData”.
// 2) Al siguiente mensaje, si hay sesión activa, lo parseamos
//    esperando 5 campos (o 7 si es tarjeta).
// 3) Guardamos en Firestore y confirmamos, borrando la sesión.

// Telegram con OpenIA
exports.receiveTelegramMessage = functions.https.onRequest(async (req, res) => {
    try {
      const msg = req.body.message;
      if (!msg?.text) return res.sendStatus(200);
      const chatId = msg.chat.id.toString();
      const textLc = msg.text.trim().toLowerCase();
  
      // ---- COMANDO PERFIL ----
      if (textLc === 'perfil') {
        const now = new Date();
        const year = now.getFullYear(), month = now.getMonth();
        const endOfMonth = new Date(year, month+1, 0);
        const daysRemaining = Math.ceil((endOfMonth - now)/86400000);
  
        const userSnap = await db.collection('users').doc(FIREBASE_UID).get();
        const jobs = (userSnap.data()||{}).jobs||[];
        let incomeARS = 0, incomeUSD = 0;
        jobs.forEach(j=>{
          const s = parseFloat(j.salary||0);
          if (j.currency==='ARS') incomeARS+=s;
          if (j.currency==='USD') incomeUSD+=s;
        });
  
        const dailyARS = incomeARS/daysRemaining;
        const dailyUSD = incomeUSD/daysRemaining;
        const day = now.getDate(), mth = month+1, yr = year;
        const expSnap = await db
          .collection(`users/${FIREBASE_UID}/expenses`)
          .where('day','==',day)
          .where('month','==',mth)
          .where('year','==',yr)
          .get();
        let spentARS=0, spentUSD=0;
        expSnap.forEach(d=>{
          const e=d.data(), a=parseFloat(e.amount||0);
          if (e.currency==='ARS') spentARS+=a;
          if (e.currency==='USD') spentUSD+=a;
        });
  
        const leftARS = (dailyARS-spentARS).toFixed(2);
        const leftUSD = (dailyUSD-spentUSD).toFixed(2);
        const today   = now.toISOString().slice(0,10);
        const m = 
  `📊 Tu Perfil Financiero
  
  • Restante en ARS: $${leftARS}
  • Restante en U\$D: $${leftUSD}
  • Gastos de hoy (${today}):
  - ARS: $${spentARS.toFixed(2)}
  - USD: $${spentUSD.toFixed(2)}`;
        await reply(chatId, m);
        return res.sendStatus(200);
      }
  
      // ---- COMANDO GASTO ----
      const sessRef  = db.collection(SESSIONS).doc(chatId);
      const sessSnap = await sessRef.get();
      const session  = sessSnap.exists ? sessSnap.data() : { awaitingData: false };
  
      if (textLc === 'nuevo gasto') {
        await reply(chatId,
  `📥 Registrar Nuevo Gasto

   Envía un único mensaje con los campos *separados por coma*:
  
   1. Descripción
   2. Cantidad (ej: 123.45)
   3. Moneda (ej: pesos, dólar, USD, ARS)
   4. Categoría
   5. Método (efectivo, débito, crédito)

   ⚠️ Si elegís débito o crédito, añade también:

   6. Banco
   7. Tipo de tarjeta (Visa, MasterCard, American Express)
  
   Ejemplo:
   Taxi, $345, pesos, Transporte, débito, Santander, Visa
  `);
        await sessRef.set({ awaitingData: true });
        return res.sendStatus(200);
      }
  
      // ---- PROCESAR GASTO ----
      if (session.awaitingData) {
        const parts = msg.text.split(',').map(p=>p.trim());
        // primero, normaliza amount y currency y paymentMethod
        const [desc, rawAmt, rawCur, cat, rawPay, bank='N/A', cardType='N/A'] = parts;
  
        // validar longitud
        const methodNorm = normalizePaymentMethod(rawPay||'');
        const needExtras = ['Credit Card','Debit Card'].includes(methodNorm);
        if (parts.length < (needExtras?7:5)) {
          await reply(chatId, `❌ Faltan datos. Necesito ${needExtras?7:5} campos.`);
          return res.sendStatus(200);
        }
  
        // monto
        const cleanAmt = (rawAmt||'').replace(/[^0-9,.\-]/g,'').replace(',', '.');
        const amount   = parseFloat(cleanAmt).toFixed(2);
        if (isNaN(amount)) {
          await reply(chatId,'❌ Monto inválido. Usa solo números.');
          return res.sendStatus(200);
        }
  
        // moneda
        const currency = normalizeCurrency(rawCur||'');
        if (!currency) {
          await reply(chatId,'❌ Moneda inválida. Usa pesos o dólar.');
          return res.sendStatus(200);
        }
  
        // método
        if (!methodNorm) {
          await reply(chatId,'❌ Método inválido. Usa efectivo, crédito o débito.');
          return res.sendStatus(200);
        }
  
        // guardar
        const now = new Date();
        await db.collection(`users/${FIREBASE_UID}/expenses`).add({
          description:   desc,
          amount,
          currency,
          category:      cat,
          paymentMethod: methodNorm,
          bank,
          cardType,
          timestamp:     admin.firestore.Timestamp.fromDate(now),
          day:           now.getDate(),
          month:         now.getMonth()+1,
          year:          now.getFullYear()
        });
  
        await reply(chatId,'✅ Gasto registrado correctamente.');
        await sessRef.delete();
        return res.sendStatus(200);
      }
  
      // nada que hacer
      return res.sendStatus(200);
  
    } catch (err) {
      console.error('❌ receiveTelegramMessage error', err);
      return res.sendStatus(500);
    }
});

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

// HELPERS

// helper para reenviar por Telegram
async function reply(chatId, text, markdown = false) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: markdown ? "Markdown" : "HTML" }),
    });
}