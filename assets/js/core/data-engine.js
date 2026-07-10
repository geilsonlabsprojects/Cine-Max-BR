/**
 * CineMaxBR - Data Engine (V2 - Optimized)
 * Manages Firebase data flow, reactive state, and normalization
 */
import { subscribeToMedia, subscribeToOldMovies } from '../services/firebase-service.js';

class DataEngine {
    constructor() {
        this.state = {
            allMedia: [],
            franchises: {},
            favorites: new Set(JSON.parse(localStorage.getItem('cinemax_favorites') || '[]')),
            history: [],
            currentUser: null,
            isLoading: true
        };
        this.listeners = [];
    }

    async init(user) {
        this.state.currentUser = user;
        this.state.history = this.getHistory();

        const db = firebase.database();
        try {
            // Load franchises once
            const franchiseSnap = await db.ref('franchises').once('value');
            this.state.franchises = franchiseSnap.val() || {};

            // Reactive subscriptions
            subscribeToMedia(data => this.updateMedia(data, 'new'));
            subscribeToOldMovies(data => this.updateMedia(data, 'old'));
        } catch (err) {
            console.error("DataEngine Init Error:", err);
            this.notify(true); // Notify even on error to stop loading states
        }
    }

    updateMedia(newData, source) {
        const existingMap = new Map(this.state.allMedia.map(m => [m.id, m]));

        newData.forEach(item => {
            if (source === 'old') item.isOld = true;
            existingMap.set(item.id, item);
        });

        this.state.allMedia = Array.from(existingMap.values())
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        this.state.isLoading = false;
        this.notify();
    }

    // Observable Pattern
    subscribe(callback) {
        this.listeners.push(callback);
        // Immediate call with current state
        if (!this.state.isLoading) callback(this.state);
    }

    notify(hasError = false) {
        this.listeners.forEach(cb => cb(this.state, hasError));
    }

    // Selectors
    getMediaById(id) {
        return this.state.allMedia.find(m => m.id === id);
    }

    getFilteredMedia(filter = 'all') {
        const { allMedia, favorites } = this.state;
        switch(filter) {
            case 'all': return allMedia;
            case 'movie': return allMedia.filter(m => m.type === 'movie');
            case 'series': return allMedia.filter(m => m.type === 'series');
            case 'favorites': return allMedia.filter(m => favorites.has(m.id));
            case 'kids': return allMedia.filter(m => this.isKids(m));
            default:
                const query = filter.toLowerCase();
                return allMedia.filter(m =>
                    (m.genre || '').toLowerCase().includes(query) ||
                    (m.title || '').toLowerCase().includes(query) ||
                    (m.tags || '').toLowerCase().includes(query)
                );
        }
    }

    isKids(m) {
        const genres = (m.genre || '').toLowerCase();
        return m.rating === 'L' || ['animação', 'família', 'kids', 'infantil'].some(g => genres.includes(g));
    }

    // Persistence
    getHistory() {
        if (!this.state.currentUser) return [];
        return JSON.parse(localStorage.getItem(`cinemax_history_${this.state.currentUser.uid}`) || '[]');
    }

    saveHistory(item, currentTime, duration) {
        if (!this.state.currentUser || !item) return;

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

        this.state.history = history.slice(0, 20);
        localStorage.setItem(`cinemax_history_${this.state.currentUser.uid}`, JSON.stringify(this.state.history));
        this.notify();
    }

    toggleFavorite(id) {
        if (this.state.favorites.has(id)) {
            this.state.favorites.delete(id);
        } else {
            this.state.favorites.add(id);
        }
        localStorage.setItem('cinemax_favorites', JSON.stringify(Array.from(this.state.favorites)));
        this.notify();
        return this.state.favorites.has(id);
    }
}

export const dataEngine = new DataEngine();
