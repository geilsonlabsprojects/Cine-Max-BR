/**
 * Firebase initialization and database services.
 */

const firebaseConfig = {
    apiKey: "AIzaSyC8uVpbtW7gs73ydp2u2eJAVGIXK3dwHr8",
    projectId: "cine-max-br",
    databaseURL: "https://cine-max-br-default-rtdb.firebaseio.com",
    storageBucket: "cine-max-br.firebasestorage.app",
    appId: "1:388609107323:android:5233689d7da7b54b0d49de"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.database();

export async function saveMediaItem(id, data) {
    return db.ref('media/' + id).set(data);
}

export async function deleteMediaItem(id, isOld = false) {
    const path = isOld ? 'movies/' : 'media/';
    return db.ref(path + id).remove();
}

export async function saveFranchiseItem(id, data) {
    return db.ref('franchises/' + id).set(data);
}

export async function deleteFranchiseItem(id) {
    return db.ref('franchises/' + id).remove();
}

export function subscribeToMedia(callback) {
    db.ref('media').on('value', snap => {
        const data = {};
        snap.forEach(child => {
            data[child.key] = { ...child.val(), id: child.key };
        });
        callback(data, false);
    });
}

export function subscribeToOldMovies(callback) {
    db.ref('movies').on('value', snap => {
        const data = {};
        snap.forEach(child => {
            data[child.key] = { ...child.val(), id: child.key, isOld: true };
        });
        callback(data, true);
    });
}

export function subscribeToFranchises(callback) {
    db.ref('franchises').on('value', snap => {
        const franchises = [];
        snap.forEach(child => {
            franchises.push({ ...child.val(), id: child.key });
        });
        callback(franchises);
    });
}
