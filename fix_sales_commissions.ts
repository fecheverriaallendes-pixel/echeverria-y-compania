
import { db } from './firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

async function fixSalesCommissions() {
  console.log('Starting Sales Commission cleanup...');
  const salesCol = collection(db, 'sales');
  const snap = await getDocs(salesCol);
  
  let batch = writeBatch(db);
  let count = 0;
  let fixed = 0;
  
  for (const d of snap.docs) {
    const data = d.data();
    let needsUpdate = false;
    let updatedData: any = {};

    const checkLote = (code: string, variant: string, currentType: string) => {
        const c = (code || '').toUpperCase();
        const v = (variant || '').toUpperCase();
        if ((c.includes('LOTE') || v.includes('LOTE')) && currentType !== 'Lote ($1.000)') {
            return 'Lote ($1.000)';
        }
        return currentType;
    };

    if (data.items) {
        const newItems = data.items.map((it: any) => {
            const newType = checkLote(it.codigoFardo || '', data.variante || '', it.tipoComision);
            if (newType !== it.tipoComision) {
                needsUpdate = true;
                return { ...it, tipoComision: newType };
            }
            return it;
        });
        if (needsUpdate) updatedData.items = newItems;
    } else {
        const newType = checkLote(data.codigoFardo || '', data.variante || '', data.tipoComision);
        if (newType !== data.tipoComision) {
            needsUpdate = true;
            updatedData.tipoComision = newType;
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
  console.log(`Fixed commissions for ${fixed} sales.`);
}

fixSalesCommissions().catch(console.error);
