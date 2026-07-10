/**
 * Firebase initialization and database services for Web Portal.
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

// Função única para contar visualizações
export async function incrementViews(id, isOld = false) {
    try {
        const path = isOld ? `movies/${id}/views` : `media/${id}/views`;
        const ref = db.ref(path);
        await ref.transaction(current => (current || 0) + 1);
    } catch (e) {
        console.error("Error incrementing views:", e);
    }
}
