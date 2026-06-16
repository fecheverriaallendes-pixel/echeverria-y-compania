
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function findMaxMDF() {
  const stockCol = collection(db, 'stock');
  const snapshot = await getDocs(stockCol);
  let max = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.codigo && data.codigo.startsWith('MDF-')) {
        const num = parseInt(data.codigo.split('-')[1]);
        if (!isNaN(num) && num > max) {
            max = num;
        }
    }
  });
  console.log("Max MDF:", max);
}

findMaxMDF();
