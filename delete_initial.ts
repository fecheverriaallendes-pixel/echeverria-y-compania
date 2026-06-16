
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

async function deleteInitialImports() {
  const stockCol = collection(db, 'stock');
  const snapshot = await getDocs(stockCol);
  const batch = writeBatch(db);
  let count = 0;
  snapshot.forEach((docSnapshot) => {
    if (docSnapshot.data().proveedor === 'Importación Inicial') {
      batch.delete(docSnapshot.ref);
      count++;
    }
  });
  await batch.commit();
  console.log(`Deleted ${count} items.`);
}

deleteInitialImports();
