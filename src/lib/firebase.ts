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
export const getDb = (): Firestore => {
  if (db) {
    return db;
  }

  try {
    // Verifica que la configuración de Firebase no esté vacía.
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        throw new Error(
          'La configuración de Firebase está incompleta. ' +
          'Asegúrate de que tu archivo .env.local existe y contiene todas las credenciales necesarias. ' +
          'Después de crearlo o modificarlo, REINICIA el servidor de desarrollo.'
        );
    }

    // Inicializar Firebase
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    return db;
  } catch (error: any) {
    // Re-lanza el error con un mensaje más descriptivo que orienta al usuario.
    console.error("Firebase initialization error:", error);
    throw new Error(
      `Falló la inicialización de Firebase: ${error.message}. ` +
      'Por favor, revise que las credenciales en su archivo .env.local son correctas y que no hay errores de tipeo.'
    );
  }
};
