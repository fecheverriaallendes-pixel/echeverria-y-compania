
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

async function listStock() {
  const stockCol = collection(db, 'stock');
  const snapshot = await getDocs(stockCol);
  snapshot.forEach((doc) => {
    console.log(JSON.stringify({id: doc.id, ...doc.data()}));
  });
}

listStock();
