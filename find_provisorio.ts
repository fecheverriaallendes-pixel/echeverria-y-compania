
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function listAllNames() {
  const stockCol = collection(db, 'stock');
  const snap = await getDocs(stockCol);
  const items = snap.docs.map(d => ({id: d.id, tipo: d.data().tipo}));
  
  items.forEach(i => {
      if (i.tipo && i.tipo.toUpperCase().includes('PROVISORIO')) {
          console.log(`FOUND: ${i.id}: ${i.tipo}`);
      }
      if (i.id.toUpperCase().includes('PROVISORIO')) {
          console.log(`FOUND ID: ${i.id}: ${i.tipo}`);
      }
  });
  console.log('Done.');
}
listAllNames();
