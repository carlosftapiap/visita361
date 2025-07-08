import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let db: Firestore | null = null;

// Obtiene una instancia de Firestore, inicializando Firebase si es necesario.
// Este enfoque de "carga diferida" evita errores de inicialización a nivel de módulo
// y permite que los componentes de la interfaz de usuario capturen y muestren los errores de conexión.
export const getDb = (): Firestore => {
  if (db) {
    return db;
  }

  // Verifica que la configuración de Firebase no esté vacía.
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      throw new Error(
        'La configuración de Firebase está incompleta. ' +
        'Asegúrate de que tu archivo .env.local existe y contiene todas las credenciales de Firebase necesarias. ' +
        'Después de crearlo, reinicia el servidor de desarrollo.'
      );
  }

  // Inicializar Firebase
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  return db;
};
