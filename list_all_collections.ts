
import { db } from './firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function listCollections() {
  const collections = ['stock', 'sales', 'staff', 'customers', 'purchases', 'productionRecords', 'adjustments', 'coupons', 'cheques', 'settings'];
  for (const c of collections) {
      const snap = await getDocs(query(collection(db, c), limit(1)));
      console.log(`Collection ${c}: ${snap.size > 0 ? 'exists' : 'empty/not exists'}`);
      if (snap.size > 0) {
          const data = snap.docs[0].data();
          if (JSON.stringify(data).toUpperCase().includes('PROVISORIO')) {
              console.log(`  !! FOUND PROVISORIO IN ${c}`);
          }
      }
  }
}
listCollections();
