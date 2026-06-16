
import { db } from './firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function listStock() {
  const q = query(collection(db, 'stock'), limit(50));
  const snap = await getDocs(q);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`${d.id}: ${data.tipo} - Stock: ${data.stockActual}`);
  });
}
listStock();
