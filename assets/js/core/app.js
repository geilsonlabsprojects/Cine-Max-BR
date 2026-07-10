/**
 * CineMaxBR - Main Orchestrator (V2 - High Logic)
 * Unified initialization and global bridge
 */
import { checkAuth } from './auth.js';
import { dataEngine } from './data-engine.js';
import { uiEngine } from './ui-engine.js';
import { interactionEngine } from './interaction-engine.js';
import { searchEngine } from './search-engine.js';
import { incrementViews } from '../services/firebase-service.js';

class App {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // 1. Auth Guard (Strict)
            const user = await checkAuth();

            // 2. Core Engines Init
            await dataEngine.init(user);
            uiEngine.init();
            interactionEngine.init();
            searchEngine.init();

            // 3. Global Bridge for Legacy/Inline Event Handlers
            this.bridgeGlobals();

            // 4. Hide Preloader
            this.hidePreloader();

            this.isInitialized = true;
            console.log("CineMaxBR V2 Initialized Successfully");

        } catch (error) {
            console.error("App Initialization Failed:", error);
            // Critical failure handling could go here
        }
    }

    bridgeGlobals() {
        // Playback & History
        window.startPlayback = (id) => {
            const item = dataEngine.getMediaById(id);
            if (!item) return;
            incrementViews(item.id, item.isOld);
            window.location.href = `player.html?id=${id}`;
        };

        // UI & Details
        window.openDetailsById = (id) => {
            const item = dataEngine.getMediaById(id);
            if (item) uiEngine.openDetails(item);
        };

        window.toggleFavorite = (id, btn) => {
            const isNowFav = dataEngine.toggleFavorite(id);
            const icon = btn.querySelector('i');
            if (icon) icon.className = isNowFav ? 'fas fa-heart' : 'far fa-heart';
        };

        // Preview Logic
        window.playPreview = (card, url) => {
            if (!url || window.innerWidth < 768) return;
            this.stopPreview(card);

            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.autoplay = true;
            video.loop = true;
            video.playsInline = true;
            video.classList.add('preview-video');
            card.appendChild(video);

            video.onplaying = () => video.classList.add('visible');
        };

        window.stopPreview = (card) => {
            const video = card.querySelector('video');
            if (video) {
                video.pause();
                video.remove();
            }
        };

        // Category Filtering
        window.filterCategory = (category) => {
            uiEngine.currentFilter = category;

            // Update UI State for Category Pills
            document.querySelectorAll('.category-pill').forEach(btn => {
                btn.classList.toggle('active', btn.innerText.toLowerCase() === category.toLowerCase());
            });

            // Re-trigger render through data update or direct call
            uiEngine.renderDashboard(dataEngine.state);
        };
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            // Force a smooth transition after content is ready
            requestAnimationFrame(() => {
                setTimeout(() => {
                    preloader.classList.add('fade-out');
                    setTimeout(() => preloader.style.display = 'none', 800);
                }, 1200);
            });
        }
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
