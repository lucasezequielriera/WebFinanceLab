const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const { collection, where, getDocs } = require('firebase-admin').firestore;
const fetch     = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

// Reemplazá esto por tu Token del Bot de Telegram
const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;
const FIREBASE_UID       = functions.config().telegram.uid;
const accountSid         = functions.config().twilio.sid;
const authToken          = functions.config().twilio.token;
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

// pasos para “nuevo gasto”
const STEPS = [
    { key: "description",   question: "❓ Descripción del gasto" },
    { key: "amount",        question: "2️⃣ ❓ ¿Cuál fué el monto? (Ej: $123.45)" },
    { key: "currency",      question: "3️⃣ ❓ ¿Cuál fué la moneda? (Ej: Pesos, Dólares)" },
    { key: "category",      question: "4️⃣ ❓ ¿Cuál es la categoría del gasto?" },
    {
        key: "paymentMethod",
        question:
            `5️⃣ ❓ Cuál fué el método de pago (responde con el número):
            1️⃣ Efectivo
            2️⃣ Tarjeta de Crédito
            3️⃣ Tarjeta de Débito`
                },
                {
                key: "bank",
                question: "❓ ¿Cuál es el Banco?",
                dependsOn: d => ['Credit Card','Debit Card'].includes(d.paymentMethod)
                },
                {
                key: "cardType",
                question:
            `6️⃣ ❓ Tipo de tarjeta (responde con el número):
            1️⃣ Visa
            2️⃣ MasterCard
            3️⃣ American Express`,
        dependsOn: d => ['Credit Card','Debit Card'].includes(d.paymentMethod)
    },
];

// --------TELEGRAM---------- //

// Telegram function
exports.receiveTelegramMessage = functions.https.onRequest(async (req, res) => {
    try {
        const msg = req.body.message;

        if (!msg?.text) return res.sendStatus(200);
        const chatId = msg.chat.id.toString();
  
        // 1) Normalizo: quito acentos, paso a minúsculas y recorto espacios
        const raw = msg.text.trim();
        const textLc = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
  
        // -- CANCELAR --
        if (textLc === 'cancelar') {
            await db.collection(SESSIONS).doc(chatId).delete();
            await reply(chatId, "✅ Proceso cancelado.", true);
            return res.sendStatus(200);
        }
  
        // -- COMANDO PERFIL --
        if (textLc === 'perfil') {
            const now   = new Date();
            const day   = now.getDate();
            const month = now.getMonth() + 1;
            const year  = now.getFullYear();

            // 1) calculas el perfil SALARIO diario
            let incomeARS = 0, incomeUSD = 0;

            // lee documentos de la sub-colección incomes del MES ACTUAL
            const start  = new Date(now.getFullYear(), now.getMonth(), 1);
            const end    = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            const incSnap = await db
            .collection(`users/${FIREBASE_UID}/incomes`)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('timestamp', '<',  admin.firestore.Timestamp.fromDate(end))
            .get();

            incSnap.forEach(d => {
            const inc = d.data(), a = parseFloat(inc.amount || 0);
            if (inc.currency === 'ARS') incomeARS += a;
            if (inc.currency === 'USD') incomeUSD += a;
            });

            // 2) gastos HOY (ya lo tenías)
            const expSnapDay = await db
            .collection(`users/${FIREBASE_UID}/expenses`)
            .where('day','==', day)
            .where('month','==', month)
            .where('year','==', year)
            .get();
            let spentDayARS = 0, spentDayUSD = 0;
            expSnapDay.forEach(d => {
            const e = d.data(), a = parseFloat(e.amount||0);
            if (e.currency === 'ARS') spentDayARS += a;
            if (e.currency === 'USD') spentDayUSD += a;
            });

            // 3) **Total del MES** en ARS y USD
            const expSnapMonth = await db
                .collection(`users/${FIREBASE_UID}/expenses`)
                .where('month', '==', month)
                .where('year', '==', year)
                .get();
            let totalARS = 0, totalUSD = 0;
            expSnapMonth.forEach(d => {
            const e = d.data(), a = parseFloat(e.amount||0);
            if (e.currency === 'ARS') totalARS += a;
            if (e.currency === 'USD') totalUSD += a;
            });

            // 4) armo el mensaje
            const leftARS = incomeARS - totalARS;
            const leftUSD = incomeUSD - totalUSD;
            const today   = now.toISOString().slice(0,10);

            const leftBalanceARS = (incomeARS - totalARS) < 0 ? "❗️" : (incomeARS - totalARS) === 0 ? "-" : "✅"
            const leftBalanceUSD = (incomeUSD - totalUSD) < 0 ? "❗️" : (incomeUSD - totalUSD) === 0 ? "-" : "✅"

            const m = 
            `📊 Tu Perfil Financiero

            • Ingreso mensual (ARS): $${incomeARS.toFixed(2)}
            • Ingreso mensual (USD): $${incomeUSD.toFixed(2)}

            • Gastos del mes:
            – ARS: $${totalARS.toFixed(2)}
            – USD: $${totalUSD.toFixed(2)}

            • Restante:
            ${leftBalanceARS} ARS: $${leftARS.toFixed(2)}
            ${leftBalanceUSD} USD: $${leftUSD.toFixed(2)}

            • Gastos de hoy (${today}):
            – ARS: $${spentDayARS.toFixed(2)}
            – USD: $${spentDayUSD.toFixed(2)}`;

            await reply(chatId, m, true);
            return res.sendStatus(200);
        }
  
        // -- NUEVO GASTO --
        if ( textLc.startsWith('nuevo gasto') || textLc.startsWith('gasto') ) {
            await reply(chatId,
              `📥 *Registro de Nuevo Gasto*\n\n` +
              `Responde cada pregunta. Escribe "cancelar" para abortar.\n\n` +
              `1️⃣ ${STEPS[0].question}`, // ahora pregunta DESCRIPCIÓN
              true
            );
            await db.collection(SESSIONS).doc(chatId).set({ idx: 0, data: {} });
            return res.sendStatus(200);
        }
  
        // -- SESIÓN ACTIVA? --
        const sessRef = db.collection(SESSIONS).doc(chatId);
        const sessSnap = await sessRef.get();
        if (!sessSnap.exists) return res.sendStatus(200);
        const { idx, data } = sessSnap.data();
    
        // si el índice no es válido, limpio sesión
        if (typeof idx !== "number" || idx < 0 || idx >= STEPS.length) {
            await sessRef.delete();
            return res.sendStatus(200);
        }
  
        // -- PROCESAR RESPUESTA PASO idx --
        const step = STEPS[idx];
        const ans  = raw;
  
        if (step.key === "description") {
            data.description = ans;
        } else if (step.key === "amount") {
            const num = parseFloat(ans.replace(/[^0-9,.]/g, "").replace(",", "."));
            if (isNaN(num)) {
            await reply(chatId, "❌ Monto inválido, intenta de nuevo.", true);
            return res.sendStatus(200);
            }
            data.amount = num.toFixed(2);
        } else if (step.key === "currency") {
            const cur = normalizeCurrency(ans);
            if (!cur) {
            await reply(chatId, '❌ Moneda inválida, escribe "pesos" o "dólar".', true);
            return res.sendStatus(200);
            }
            data.currency = cur;
        } else if (step.key === "paymentMethod") {
            let pm;
            switch (ans.trim()) {
                case "1": pm = "Cash"; break;
                case "2": pm = "Credit Card"; break;
                case "3": pm = "Debit Card"; break;
                default:
                // como fallback, intentamos normalizar también por texto libre
                pm = normalizePaymentMethod(ans);
            }
            if (!pm) {
                await reply(chatId,
                '❌ Opción inválida. Responde 1, 2 o 3.',
                true
                );
                return res.sendStatus(200);
            }
            data.paymentMethod = pm;
        } else if (step.key === "cardType") {
            let ct;
            switch (ans.trim()) {
              case "1": ct = "Visa"; break;
              case "2": ct = "MasterCard"; break;
              case "3": ct = "American Express"; break;
              default:
                // fallback libre
                ct = ans;
            }
            if (!ct) {
              await reply(chatId,
                '❌ Opción inválida. Responde 1, 2 o 3.',
                true
              );
              return res.sendStatus(200);
            }
            data.cardType = ct;
        } else {
            data[step.key] = ans;
        }
  
        // -- AVANZAR AL SIGUIENTE PASO --
        let next = idx + 1;
        while (next < STEPS.length) {
            const st = STEPS[next];
            if (st.dependsOn && !st.dependsOn(data)) next++;
            else break;
        }
  
        if (next < STEPS.length) {
            await sessRef.set({ idx: next, data });
            await reply(chatId, STEPS[next].question, true);
            return res.sendStatus(200);
        }
    
        // -- TODOS LOS DATOS LISTOS: GUARDO EN FIRESTORE --
        const now = new Date();
        await db.collection(`users/${FIREBASE_UID}/expenses`).add({
            description:   data.description,
            amount:        data.amount,
            currency:      data.currency,
            category:      data.category,
            paymentMethod: data.paymentMethod,
            bank:          data.bank      || "N/A",
            cardType:      data.cardType  || "N/A",
            timestamp:     admin.firestore.Timestamp.fromDate(now),
            day:           now.getDate(),
            month:         now.getMonth() + 1,
            year:          now.getFullYear(),
        });
  
        // -- CONFIRMACIÓN FINAL --
        let ack =
            `✅ Gasto registrado:\n\n` +
            `• Monto: $${data.amount} ${data.currency}\n` +
            `• Descripción: ${data.description}\n` +
            `• Categoría: ${data.category}\n` +
            `• Método: ${data.paymentMethod}`;
        if (["Credit Card","Debit Card"].includes(data.paymentMethod)) {
            ack += `\n• Banco: ${data.bank}\n• Tipo tarjeta: ${data.cardType}`;
        }
        await reply(chatId, ack, true);
    
        // -- LIMPIAR SESIÓN --
        await sessRef.delete();
        return res.sendStatus(200);
    
    } catch (err) {
        console.error("❌ receiveTelegramMessage error", err);
        return res.sendStatus(500);
    }
});

// -------------------------- //

// ---------WHATSAPP--------- //

function normalizePhone(phone) {
    return phone.replace(/\D/g, ''); // Elimina todo excepto números
}

// Whatsapp function
exports.receiveWhatsAppMessage = functions.https.onRequest(async (req, res) => {
    try {
        const msg = req.body.Body?.trim();
        // extraemos sólo el número, sin prefijo "whatsapp:"
        const chatId = req.body.From?.replace(/^whatsapp:/, '') || null;
        console.log('chatId recibido:', chatId);

        if (!msg || !chatId) {
            res.status(200).end();
            return;
        }

        const normalizedChatId = normalizePhone(chatId);

        // 1) buscamos al usuario cuyo campo "phone" coincida con chatId
        const userQuery = await db.collection('users')
        .where('phone', '==', normalizedChatId)
        .limit(1)
        .get();

        if (userQuery.empty) {
        await replyWhatsApp(chatId, `❌ Tu número no está registrado en la plataforma. -----> RESPONSE: ${chatId}`);
        await replyWhatsApp(chatId, `❌ Tu número no está registrado en la plataforma. -----> RESPONSE: ${userQuery.empty}`);
        res.status(200).end();
            return;
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        const uid = userDoc.id;

        // 2) comprobamos su nivel de acceso
        if (userData.user_access_level === 1) {
        await replyWhatsApp(chatId, "❌ No tienes permiso para registrar gastos.");
        res.status(200).end();
            return;
        }

        // 3) normalizamos el texto entrante
        const textLc = msg
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

        const sessRef = db.collection(SESSIONS).doc(chatId);
        const sessSnap = await sessRef.get();
        const session = sessSnap.exists ? sessSnap.data() : { idx: null, data: {} };
    
        // CANCELAR
        if (textLc === "cancelar") {
            await sessRef.delete();
            await replyWhatsApp(chatId, "✅ Proceso cancelado.");
            res.status(200).end();
            return;
        }
  
        // PERFIL
        if (textLc === 'perfil') {
            const now   = new Date();
            const day   = now.getDate();
            const month = now.getMonth() + 1;
            const year  = now.getFullYear();

            // 1) calcular ingresos mensuales
            let incomeARS = 0, incomeUSD = 0;
            const start  = new Date(year, month - 1, 1);
            const end    = new Date(year, month,     1);

            const incSnap = await db
            .collection(`users/${uid}/incomes`)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('timestamp', '<',  admin.firestore.Timestamp.fromDate(end))
            .get();

            incSnap.forEach(d => {
            const inc = d.data(), a = parseFloat(inc.amount || 0);
            if (inc.currency === 'ARS') incomeARS += a;
            if (inc.currency === 'USD') incomeUSD += a;
            });

            // 2) gastos del día
            const expSnapDay = await db
                .collection(`users/${uid}/expenses`)
                .where('day', '==', day)
                .where('month', '==', month)
                .where('year', '==', year)
                .get();
            let spentDayARS = 0, spentDayUSD = 0;
            expSnapDay.forEach(d => {
                const e = d.data(), a = parseFloat(e.amount || 0);
                if (e.currency === 'ARS') spentDayARS += a;
                if (e.currency === 'USD') spentDayUSD += a;
            });

            // 3) gastos del mes
            const expSnapMonth = await db
                .collection(`users/${uid}/expenses`)
                .where('month', '==', month)
                .where('year', '==', year)
                .get();
            let totalARS = 0, totalUSD = 0;
            expSnapMonth.forEach(d => {
                const e = d.data(), a = parseFloat(e.amount || 0);
                if (e.currency === 'ARS') totalARS += a;
                if (e.currency === 'USD') totalUSD += a;
            });

            // 4) cálculo de saldo restante
            const leftARS = incomeARS - totalARS;
            const leftUSD = incomeUSD - totalUSD;
            const today = now.toISOString().slice(0, 10);

            const leftBalanceARS = leftARS < 0 ? "❗️" : leftARS === 0 ? "-" : "✅";
            const leftBalanceUSD = leftUSD < 0 ? "❗️" : leftUSD === 0 ? "-" : "✅";

            const m =
            `📊 *Tu Perfil Financiero*

            • Ingreso mensual (ARS): $${incomeARS.toFixed(2)}
            • Ingreso mensual (USD): $${incomeUSD.toFixed(2)}

            • Gastos del mes:
            – ARS: $${totalARS.toFixed(2)}
            – USD: $${totalUSD.toFixed(2)}

            • Restante:
            ${leftBalanceARS} ARS: $${leftARS.toFixed(2)}
            ${leftBalanceUSD} USD: $${leftUSD.toFixed(2)}

            • Gastos de hoy (${today}):
            – ARS: $${spentDayARS.toFixed(2)}
            – USD: $${spentDayUSD.toFixed(2)}`;

            // envia por WhatsApp en vez de reply()
            await replyWhatsApp(chatId, m);

            // responde 200 OK SIN CUERPO para que Twilio no reenvíe "OK"
            res.status(200).end();
            return;
        }
  
        // NUEVO GASTO
        if (
            session.idx === null &&
            (textLc.startsWith("nuevo gasto") || textLc.startsWith("gasto"))
        ) {
            await sessRef.set({ idx: 0, data: {} });
            await replyWhatsApp(chatId, `📥 Registro de nuevo gasto:\n\n${STEPS[0].question}`);
            res.status(200).end();
            return;
        }
    
        // SESIÓN ACTIVA
        if (session.idx !== null) {
            const idx = session.idx;
            const step = STEPS[idx];
            const ans = msg;
    
            if (step.key === "description") {
            session.data.description = ans;
            } else if (step.key === "amount") {
            const num = parseFloat(ans.replace(/[^0-9,.]/g, "").replace(",", "."));
            if (isNaN(num)) {
                await replyWhatsApp(chatId, "❌ Monto inválido, intenta de nuevo.");
                res.status(200).end();
                return;
            }
            session.data.amount = num.toFixed(2);
            } else if (step.key === "currency") {
            const cur = normalizeCurrency(ans);
            if (!cur) {
                await replyWhatsApp(chatId, '❌ Moneda inválida. Escribe "pesos" o "dólar".');
                res.status(200).end();
                return;
            }
            session.data.currency = cur;
            } else if (step.key === "paymentMethod") {
            let pm;
            switch (ans.trim()) {
                case "1":
                pm = "Cash";
                break;
                case "2":
                pm = "Credit Card";
                break;
                case "3":
                pm = "Debit Card";
                break;
                default:
                pm = normalizePaymentMethod(ans);
            }
            if (!pm) {
                await replyWhatsApp(chatId, '❌ Opción inválida. Escribe 1, 2 o 3.');
                res.status(200).end();
                return;
            }
            session.data.paymentMethod = pm;
            } else if (step.key === "cardType") {
            let ct;
            switch (ans.trim()) {
                case "1":
                ct = "Visa";
                break;
                case "2":
                ct = "MasterCard";
                break;
                case "3":
                ct = "American Express";
                break;
                default:
                ct = ans;
            }
            session.data.cardType = ct;
            } else {
            session.data[step.key] = ans;
            }
    
            // siguiente paso
            let next = idx + 1;
            while (next < STEPS.length) {
            const s = STEPS[next];
            if (s.dependsOn && !s.dependsOn(session.data)) next++;
            else break;
            }
    
            if (next < STEPS.length) {
            await sessRef.set({ idx: next, data: session.data });
            await replyWhatsApp(chatId, STEPS[next].question);
            res.status(200).end();
            return;
            }
    
            // guardar gasto
            const now = new Date();
            await db.collection(`users/${uid}/expenses`).add({
            ...session.data,
            bank: session.data.bank || "N/A",
            cardType: session.data.cardType || "N/A",
            timestamp: admin.firestore.Timestamp.fromDate(now),
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            });
    
            let ack =
            `✅ Gasto registrado:\n\n` +
            `• Monto: $${session.data.amount} ${session.data.currency}\n` +
            `• Descripción: ${session.data.description}\n` +
            `• Categoría: ${session.data.category}\n` +
            `• Método: ${session.data.paymentMethod}`;
            if (["Credit Card", "Debit Card"].includes(session.data.paymentMethod)) {
            ack += `\n• Banco: ${session.data.bank}\n• Tipo tarjeta: ${session.data.cardType}`;
            }
    
            await replyWhatsApp(chatId, ack);
            await sessRef.delete();
            res.status(200).end();
            return;
        }
  
            await replyWhatsApp(chatId, "🤖 No entendí tu mensaje. Escribí 'perfil' para ver tus finanzas o 'nuevo gasto' para registrar un gasto.");
            res.status(200).end();
            return;
        } catch (err) {
        
        console.error("❌ receiveWhatsAppMessage error", err);
        res.status(500).end();
        return;
    }
});

// ---------------------------//

// Function para reportes diarios (necesito hacerlo mensual)
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

// helper para reenviar por Whatsapp
async function replyWhatsApp(to, text) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: "whatsapp:+19787344994", // número oficial de Twilio
        To:   `whatsapp:${to}`,
        Body: text,
      }),
    });
}