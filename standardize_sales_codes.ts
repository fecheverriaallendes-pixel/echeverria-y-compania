
import { db } from './firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

async function standardizeSalesCodes() {
  console.log('Standardizing Sales Codes...');
  const salesCol = collection(db, 'sales');
  const snap = await getDocs(salesCol);
  
  let batch = writeBatch(db);
  let count = 0;
  let fixed = 0;
  
  const standardize = (code: string) => {
      const c = (code || '').trim().toUpperCase();
      // Case 1: "130 LOTE" -> "MDF-130"
      const matchNum = c.match(/^(\d+)/);
      if (matchNum) {
          const num = parseInt(matchNum[1]);
          return `MDF-${String(num).padStart(3, '0')}`;
      }
      // Case 2: "MDF-001" -> already ok but might be 4 digits "MDF-0001"
      const matchMdf = c.match(/^MDF-(\d+)$/);
      if (matchMdf) {
          const num = parseInt(matchMdf[1]);
          return `MDF-${String(num).padStart(3, '0')}`;
      }
      return code; // No pattern matched
  };

  for (const d of snap.docs) {
    const data = d.data();
    let needsUpdate = false;
    let updatedData: any = {};

    if (data.items) {
        const newItems = data.items.map((it: any) => {
            const newCode = standardize(it.codigoFardo);
            if (newCode !== it.codigoFardo) {
                needsUpdate = true;
                return { ...it, codigoFardo: newCode };
            }
            return it;
        });
        if (needsUpdate) updatedData.items = newItems;
    } else {
        const newCode = standardize(data.codigoFardo);
        if (newCode !== data.codigoFardo) {
            needsUpdate = true;
            updatedData.codigoFardo = newCode;
        }
    }

    if (needsUpdate) {
        batch.update(d.ref, updatedData);
        fixed++;
        count++;
        if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }
  }
  
  if (count > 0) await batch.commit();
  console.log(`Standardized codes for ${fixed} sales.`);
}

standardizeSalesCodes().catch(console.error);
