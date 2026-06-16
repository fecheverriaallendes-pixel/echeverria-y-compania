
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function checkSpecificSales() {
  const salesCol = collection(db, 'sales');
  const numbers = [2138, 2106];
  
  for (const num of numbers) {
      const q = query(salesCol, where('numeroVenta', '==', num));
      const snap = await getDocs(q);
      if (snap.empty) {
          console.log(`Sale ${num} not found.`);
          continue;
      }
      snap.docs.forEach(d => {
          const data = d.data();
          console.log(`Sale ${num}: TipoComision=${data.tipoComision}, Variante=${data.variante}, Codigo=${data.codigoFardo}`);
          if (data.items) {
              console.log('  Items:', data.items.map(i => ({code: i.codigoFardo, type: i.tipoComision})));
          }
      });
  }
}
checkSpecificSales();
