import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';           // ajustá la ruta si tu init está en otra carpeta

export async function getDailyLimit(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return 0;

  const limits = snap.data().expenseLimits || [];
  const chosen =
    limits.find(l => (l.label || '').toLowerCase().includes('daily')) ||
    limits[0];

  return Number(chosen?.amount || 0);
}