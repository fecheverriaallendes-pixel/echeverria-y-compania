
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

async function deepCleanup() {
  console.log('Starting deep stock cleanup...');
  const stockCol = collection(db, 'stock');
  const snap = await getDocs(stockCol);
  
  const nameMap = new Map();
  
  for (const d of snap.docs) {
    const data = d.data();
    const name = (data.tipo || '').trim().toUpperCase();
    const id = d.id;
    
    if (name.includes('PROVISORIO')) {
        console.log(`Found PROVISORIO: ${id}`);
        await deleteDoc(doc(db, 'stock', id));
        continue;
    }

    if (!nameMap.has(name)) nameMap.set(name, []);
    nameMap.get(name).push({ id: d.id, ...data });
  }
  
  let batch = writeBatch(db);
  let count = 0;
  let merged = 0;
  
  for (const [name, items] of nameMap.entries()) {
    if (items.length > 1) {
      console.log(`Unifying ${items.length} items for: ${name}`);
      // Sort by stock descending, then by code length (prefer shorter codes like MDF-001 over MDF-0001 if they exist)
      items.sort((a, b) => (b.stockActual || 0) - (a.stockActual || 0) || a.codigo.length - b.codigo.length);
      
      const [keep, ...remove] = items;
      const totalStock = items.reduce((acc, i) => acc + (i.stockActual || 0), 0);
      
      // Update the one we keep
      batch.update(doc(db, 'stock', keep.id), {
          stockActual: totalStock,
          disponible: totalStock > 0
      });
      count++;
      
      for (const item of remove) {
        batch.delete(doc(db, 'stock', item.id));
        merged++;
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
    }
  }
  
  if (count > 0) await batch.commit();
  console.log(`Merged ${merged} duplicated items by name.`);
  
  // Also delete items with 0 stock that are not in sales
  // (Optional: but maybe good to clean up)
  
  console.log('Cleanup finished.');
}

deepCleanup().catch(console.error);
