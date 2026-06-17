// Persistence has two layers:
//   1. localStorage — always on, zero config, instant. Per-browser.
//   2. Firebase Firestore — optional shared/synced storage for the whole team,
//      switched on purely by setting VITE_FIREBASE_* env vars (see .env.example).
// Nothing about Firebase loads unless it is configured.

const LOCAL_KEY = "frogpad:data:v1";

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

const env = import.meta.env || {};

export function firebaseEnabled() {
  return Boolean(
    env.VITE_FIREBASE_API_KEY &&
      env.VITE_FIREBASE_PROJECT_ID &&
      env.VITE_FIREBASE_APP_ID
  );
}

// Connects to Firestore, streams remote changes to `onRemote`, and returns a
// `saveRemote(data)` writer. Returns null if Firebase is not configured or fails.
export async function initFirebaseSync(onRemote) {
  if (!firebaseEnabled()) return null;
  try {
    const { initializeApp } = await import("firebase/app");
    const { getFirestore, doc, onSnapshot, setDoc } = await import(
      "firebase/firestore"
    );

    const app = initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain:
        env.VITE_FIREBASE_AUTH_DOMAIN ||
        `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    });
    const db = getFirestore(app);
    const docId = env.VITE_FIREBASE_DOC || "shared";
    const ref = doc(db, "frogpad", docId);

    onSnapshot(ref, (snap) => {
      const remote = snap.data();
      if (remote?.payload) {
        try {
          onRemote(JSON.parse(remote.payload));
        } catch {
          // malformed remote payload — ignore
        }
      }
    });

    return {
      saveRemote(data) {
        setDoc(ref, {
          payload: JSON.stringify(data),
          updatedAt: Date.now(),
        }).catch(() => {});
      },
    };
  } catch {
    return null;
  }
}
