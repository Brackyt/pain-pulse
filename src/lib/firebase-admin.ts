import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let firestore: Firestore | null = null;

function getFirebaseAdmin(): App {
  if (app) {
    return app;
  }

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin SDK credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
    );
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return app;
}

/**
 * Get Firestore instance (lazy initialization)
 */
export function getDb(): Firestore {
  if (firestore) {
    return firestore;
  }

  const adminApp = getFirebaseAdmin();
  firestore = getFirestore(adminApp);
  return firestore;
}

// For backwards compatibility, but prefer getDb() for lazy initialization
export const db = {
  collection: (name: string) => getDb().collection(name),
};
