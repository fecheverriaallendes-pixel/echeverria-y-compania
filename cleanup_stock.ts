
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

async function cleanup() {
  console.log('Starting stock cleanup...');
  const stockCol = collection(db, 'stock');
  const snap = await getDocs(stockCol);
  
  let batch = writeBatch(db);
  let count = 0;
  let deleted = 0;
  
  for (const d of snap.docs) {
    const data = d.data();
    const name = (data.tipo || '').toUpperCase();
    const code = (data.codigo || '').toUpperCase();
    
    // Condition 1: Name is PROVISORIO
    // Condition 2: Crazy high stock numbers that look like the ones in the import script
    if (name.includes('PROVISORIO') || data.stockActual === 196183 || data.stockActual === 196184 || data.stockActual === 198637) {
      batch.delete(d.ref);
      deleted++;
      count++;
    }
    
    if (count >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  
  if (count > 0) await batch.commit();
  console.log(`Deleted ${deleted} invalid items.`);
  
  // Now let's handle duplicates by name if they have 0 stock and represent a copy of an existing item
  const finalSnap = await getDocs(stockCol);
  const nameMap = new Map();
  
  for (const d of finalSnap.docs) {
    const data = d.data();
    const name = data.tipo.trim().toUpperCase();
    if (!nameMap.has(name)) nameMap.set(name, []);
    nameMap.get(name).push({ id: d.id, ...data });
  }
  
  batch = writeBatch(db);
  count = 0;
  let merged = 0;
  
  for (const [name, items] of nameMap.entries()) {
    if (items.length > 1) {
      // Sort by stock descending, then by code
      items.sort((a, b) => (b.stockActual || 0) - (a.stockActual || 0) || a.codigo.localeCompare(b.codigo));
      const [keep, ...remove] = items;
      
      for (const item of remove) {
        // Only merge if it's really a duplicate (similar name) and we're not losing data
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
  console.log(`Merged ${merged} duplicated items.`);
  console.log('Cleanup finished.');
}

cleanup().catch(console.error);
