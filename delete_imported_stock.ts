import { db } from './firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';

async function deleteImportedStock() {
  const stockCol = collection(db, 'stock');
  
  // Get all documents to be sure, or use a query if Firestore allows prefix search
  const stockDocs = await getDocs(stockCol);
  console.log("Total stock items:", stockDocs.size);
  
  const toDelete = stockDocs.docs.filter(docSnap => {
      const data = docSnap.data();
      return data.codigo && data.codigo.startsWith('MDF-');
  });

  console.log("Items to delete:", toDelete.length);
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const docSnap of toDelete) {
    batch.delete(docSnap.ref);
    count++;
    if (count === 500) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  console.log('Imported stock deletion complete. Deleted:', toDelete.length);
}

deleteImportedStock();
