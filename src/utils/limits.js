import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

export async function getDailyLimit(userId) {
  // usa la misma clave de mes que tu subcolección
  const monthKey = dayjs().format('YYYY-MM');
  const limitsDocRef = doc(db, 'users', userId, 'expenseLimitsByMonth', monthKey);
  const snap = await getDoc(limitsDocRef);
  if (!snap.exists()) return null;

  const { limits } = snap.data();
  if (!Array.isArray(limits) || limits.length === 0) return null;

  // suma todos los límites definidos para el mes
  return limits.reduce((sum, lim) => sum + (Number(lim.amount) || 0), 0);
}
