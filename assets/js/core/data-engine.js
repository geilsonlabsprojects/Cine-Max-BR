/**
 * CineMaxBR - Data Engine
 * Manages Firebase data flow, state, and normalization
 */
import { subscribeToMedia, subscribeToOldMovies } from '../services/firebase-service.js';

class DataEngine {
    constructor() {
        this.allMedia = [];
        this.allFranchises = {};
        this.onDataUpdate = null;
        this.currentUser = null;
    }

    async init(user) {
        this.currentUser = user;
        const db = firebase.database();

        try {
            const franchiseSnap = await db.ref('franchises').once('value');
            this.allFranchises = franchiseSnap.val() || {};

            // Initial subscriptions
            subscribeToMedia(data => this.handleNewData(data));
            subscribeToOldMovies(data => this.handleNewData(data));
        } catch (err) {
            console.error("DataEngine Init Error:", err);
        }
    }

    handleNewData(newData) {
        this.allMedia = this.mergeUnique(this.allMedia, newData);
        if (this.onDataUpdate) this.onDataUpdate(this.allMedia);
    }

    mergeUnique(existing, newData) {
        const map = new Map(existing.map(item => [item.id, item]));
        newData.forEach(item => map.set(item.id, item));
        return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    getMediaById(id) {
        return this.allMedia.find(m => m.id === id);
    }

    getHistory() {
        if (!this.currentUser) return [];
        return JSON.parse(localStorage.getItem(`cinemax_history_${this.currentUser.uid}`) || '[]');
    }

    saveHistory(item, currentTime, duration) {
        if (!this.currentUser || !item || isNaN(currentTime) || isNaN(duration) || duration === 0) return;

        const progress = Math.floor((currentTime / duration) * 100);
        if (progress < 1) return;

        let history = this.getHistory();
        history = history.filter(h => h.id !== item.id);

        if (progress < 95) {
            history.unshift({
                id: item.id,
                title: item.title,
                poster: item.poster,
                progress: progress,
                time: currentTime,
                duration: duration,
                timestamp: Date.now()
            });
        }

        localStorage.setItem(`cinemax_history_${this.currentUser.uid}`, JSON.stringify(history.slice(0, 20)));
    }

    getFavorites() {
        return JSON.parse(localStorage.getItem('cinemax_favorites') || '[]');
    }

    toggleFavorite(id) {
        let favs = this.getFavorites();
        const isFav = favs.includes(id);
        if (isFav) favs = favs.filter(f => f !== id);
        else favs.push(id);
        localStorage.setItem('cinemax_favorites', JSON.stringify(favs));
        return !isFav;
    }
}

export const dataEngine = new DataEngine();
