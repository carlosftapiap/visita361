import { db } from '@/lib/firebase';
import type { Visit } from '@/types';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';

const visitsCollectionRef = collection(db, 'visits');

// Convierte un documento de Firestore a un objeto Visit, convirtiendo Timestamps a Dates
const visitFromDoc = (docSnap: any): Visit => {
    const data = docSnap.data();
    return {
        ...data,
        id: docSnap.id,
        date: data.date.toDate(),
    };
}

export const getVisits = async (): Promise<Visit[]> => {
  const querySnapshot = await getDocs(visitsCollectionRef);
  const visits = querySnapshot.docs.map(visitFromDoc);
  // Ordenar por fecha descendente
  return visits.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const addVisit = async (visit: Omit<Visit, 'id'>) => {
    return await addDoc(visitsCollectionRef, visit);
}

export const updateVisit = async (id: string, visit: Partial<Omit<Visit, 'id'>>) => {
    const visitDoc = doc(db, 'visits', id);
    return await updateDoc(visitDoc, visit);
}

export const addBatchVisits = async (visits: Omit<Visit, 'id'>[]) => {
    const batch = writeBatch(db);
    visits.forEach((visit) => {
        const newDocRef = doc(visitsCollectionRef);
        batch.set(newDocRef, visit);
    });
    await batch.commit();
}

export const deleteAllVisits = async () => {
    const querySnapshot = await getDocs(visitsCollectionRef);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
