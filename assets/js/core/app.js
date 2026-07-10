/**
 * CineMaxBR - Main Orchestrator
 * Integrates all specialized modules
 */
import { checkAuth } from './auth.js';
import { dataEngine } from './data-engine.js';
import { uiEngine } from './ui-engine.js';
import { interactionEngine } from './interaction-engine.js';
import { searchEngine } from './search-engine.js';
import { incrementViews } from '../services/firebase-service.js';

class App {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        try {
            // 1. Guardião de Acesso
            this.currentUser = await checkAuth();

            // 2. Configura Fluxo de Dados Reativo ANTES de iniciar o motor
            dataEngine.onDataUpdate = (media) => uiEngine.renderAll(media);

            // 3. Inicializa Motores
            await dataEngine.init(this.currentUser);
            interactionEngine.init();
            searchEngine.init();

            // 4. Global Window Bindings (for HTML event handlers)
            this.bindGlobals();

        } catch (error) {
            console.error("CineMaxBR App Init Failed:", error);
        }
    }

    bindGlobals() {
        window.openDetailsById = (id) => {
            const item = dataEngine.getMediaById(id);
            if (item) uiEngine.openDetails(item);
        };

        window.startPlayback = (id) => {
            const item = dataEngine.getMediaById(id);
            if (!item) return;
            incrementViews(item.id, item.isOld);
            window.location.href = `player.html?id=${id}`;
        };

        window.toggleFavorite = (id, btn) => {
            const isFav = dataEngine.toggleFavorite(id);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
            }
            uiEngine.renderWatchlist();
        };

        window.playPreview = (card, url) => {
            if (!url || window.innerWidth < 768) return;
            this.stopPreview(card);
            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.autoplay = true;
            video.loop = true;
            video.playsInline = true;
            video.style.pointerEvents = 'none';
            card.appendChild(video);
            setTimeout(() => { video.style.opacity = '1'; }, 100);
        };

        window.stopPreview = (card) => {
            const video = card.querySelector('video');
            if (video) {
                video.pause();
                video.remove();
            }
        };

        window.filterCategory = (category) => {
            // Re-render with filter logic (delegated to UI Engine)
            const filtered = dataEngine.allMedia.filter(item => {
                if (category === 'all') return true;
                if (category === 'movie') return item.type === 'movie';
                if (category === 'series') return item.type === 'series';
                const genre = (item.genre || '').toLowerCase();
                const filter = category.toLowerCase();
                return genre.includes(filter) || (item.tags && item.tags.toLowerCase().includes(filter));
            });
            uiEngine.renderAll(filtered);
        };
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
