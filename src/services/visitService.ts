import { getDb } from '@/lib/firebase';
import type { Visit } from '@/types';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  query,
  orderBy,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  WithFieldValue,
  where
} from 'firebase/firestore';
import { subMonths } from 'date-fns';

// Convierte un documento de Firestore a un objeto Visit, convirtiendo Timestamps a Dates de forma segura
const visitFromDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Visit => {
    const data = docSnap.data();

    // Validación robusta de la fecha
    if (!data.date || typeof data.date.toDate !== 'function') {
        throw new Error(`Document ${docSnap.id} has an invalid or missing 'date' field.`);
    }

    return {
        id: docSnap.id,
        trade_executive: data.trade_executive || '',
        agent: data.agent || '',
        channel: data.channel || '',
        chain: data.chain || '',
        pdv_detail: data.pdv_detail || '',
        activity: ['Visita', 'Impulso', 'Verificación'].includes(data.activity) ? data.activity : 'Visita',
        schedule: data.schedule || '',
        city: data.city || '',
        zone: data.zone || '',
        date: data.date.toDate(),
        budget: typeof data.budget === 'number' ? data.budget : 0,
    };
}

// Prepara un objeto Visit para ser guardado en Firestore, convirtiendo Dates a Timestamps
const visitToDoc = (visit: Partial<Omit<Visit, 'id'>>): WithFieldValue<DocumentData> => {
    const data: any = { ...visit };
    if (visit.date) {
        data.date = Timestamp.fromDate(visit.date);
    }
    return data;
}

export const getVisits = async (): Promise<Visit[]> => {
  const db = getDb();
  const visitsCollectionRef = collection(db, 'visits');

  // Para mejorar el rendimiento, solo obtenemos las visitas de los últimos 6 meses.
  // Esto evita cargar todo el historial de la base de datos al inicio.
  const sixMonthsAgo = subMonths(new Date(), 6);

  const q = query(
    visitsCollectionRef,
    orderBy("date", "desc"),
    where("date", ">=", Timestamp.fromDate(sixMonthsAgo))
  );

  const querySnapshot = await getDocs(q);
  
  const visits: Visit[] = [];
  querySnapshot.forEach((doc) => {
      try {
          visits.push(visitFromDoc(doc));
      } catch (e) {
          console.warn(`Skipping corrupted document ${doc.id}:`, e);
      }
  });

  return visits;
};

export const addVisit = async (visit: Omit<Visit, 'id'>) => {
    const db = getDb();
    const visitsCollectionRef = collection(db, 'visits');
    return await addDoc(visitsCollectionRef, visitToDoc(visit));
}

export const updateVisit = async (id: string, visit: Partial<Omit<Visit, 'id'>>) => {
    const db = getDb();
    const visitDoc = doc(db, 'visits', id);
    return await updateDoc(visitDoc, visitToDoc(visit));
}

export const addBatchVisits = async (visits: Omit<Visit, 'id'>[]) => {
    const db = getDb();
    const visitsCollectionRef = collection(db, 'visits');
    const batch = writeBatch(db);
    visits.forEach((visit) => {
        const newDocRef = doc(visitsCollectionRef);
        batch.set(newDocRef, visitToDoc(visit));
    });
    await batch.commit();
}

export const deleteAllVisits = async () => {
    const db = getDb();
    const visitsCollectionRef = collection(db, 'visits');
    const querySnapshot = await getDocs(visitsCollectionRef);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
