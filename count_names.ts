
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function countNames() {
  const stockCol = collection(db, 'stock');
  const snap = await getDocs(stockCol);
  const counts = new Map();
  snap.docs.forEach(d => {
    const name = (d.data().tipo || '').trim().toUpperCase();
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  
  const duplicates = Array.from(counts.entries()).filter(([name, count]) => count > 1);
  console.log('Duplicates found:', duplicates.length);
  duplicates.forEach(([name, count]) => {
    console.log(`${name}: ${count}`);
  });
  
  console.log('Total items in stock:', snap.size);
}
countNames();
