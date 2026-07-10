/**
 * Firebase initialization and database services for Web Portal.
 *
 * SECURITY NOTE: In professional environments, use environment variables.
 * For this Web implementation, we use a global config that can be injected
 * during deployment (e.g., Vercel, Netlify) or locally via .env.
 */

const firebaseConfig = {
    apiKey: window.CINE_MAX_CONFIG?.FIREBASE_API_KEY || "",
    projectId: window.CINE_MAX_CONFIG?.FIREBASE_PROJECT_ID || "",
    databaseURL: window.CINE_MAX_CONFIG?.FIREBASE_DATABASE_URL || "",
    storageBucket: window.CINE_MAX_CONFIG?.FIREBASE_STORAGE_BUCKET || "",
    appId: window.CINE_MAX_CONFIG?.FIREBASE_APP_ID || ""
};

if (!firebase.apps.length && firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
} else if (!firebaseConfig.apiKey) {
    console.warn("Firebase configuration not found. Please provide config.js");
}

export const db = firebase.database();

export async function verifyAccessCode(code) {
    const snapshot = await db.ref('access_codes').child(code).once('value');
    return snapshot.exists();
}

export function subscribeToMedia(callback) {
    db.ref('media').on('value', snap => {
        const data = [];
        snap.forEach(child => {
            data.push({ ...child.val(), id: child.key });
        });
        callback(data);
    });
}

export function subscribeToOldMovies(callback) {
    db.ref('movies').on('value', snap => {
        const data = [];
        snap.forEach(child => {
            data.push({ ...child.val(), id: child.key, isOld: true });
        });
        callback(data);
    });
}
