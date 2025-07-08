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
} from 'firebase/firestore';

// Convierte un documento de Firestore a un objeto Visit, convirtiendo Timestamps a Dates
const visitFromDoc = (docSnap: any): Visit => {
    const data = docSnap.data();
    return {
        ...data,
        id: docSnap.id,
        date: data.date.toDate(),
    };
}

// Prepara un objeto Visit para ser guardado en Firestore, convirtiendo Dates a Timestamps
const visitToDoc = (visit: Partial<Omit<Visit, 'id'>>) => {
    const data: any = { ...visit };
    if (visit.date) {
        data.date = Timestamp.fromDate(visit.date);
    }
    return data;
}

export const getVisits = async (): Promise<Visit[]> => {
  const db = getDb();
  const visitsCollectionRef = collection(db, 'visits');
  const q = query(visitsCollectionRef, orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(visitFromDoc);
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
