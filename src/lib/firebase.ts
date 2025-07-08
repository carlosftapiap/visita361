import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase para la aplicación web
// IMPORTANTE: Reemplaza esto con tu configuración real.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verifica que la configuración de Firebase no esté vacía, lo que usualmente
// indica que el archivo .env.local no se ha configurado correctamente.
if (typeof window !== 'undefined' && (!firebaseConfig.projectId || !firebaseConfig.apiKey)) {
    throw new Error(
      'La configuración de Firebase está incompleta. ' +
      'Asegúrate de que tu archivo .env.local existe y contiene todas las credenciales de Firebase necesarias. ' +
      'Después de crearlo, reinicia el servidor de desarrollo.'
    );
}

// Inicializar Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
