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

        // Navigation (SPA Style)
        window.navigateTo = (view) => {
            const mainContent = document.getElementById('mainContent');
            const homeContent = document.getElementById('homeContent');
            const sectionTitle = document.getElementById('viewSectionTitle');

            if (!mainContent || !homeContent) return;

            // Reset Search
            if (window.closeSearch) window.closeSearch();

            if (view === 'home') {
                homeContent.style.display = 'block';
                mainContent.style.display = 'none';
                uiEngine.renderDashboard(dataEngine.state);
            } else {
                homeContent.style.display = 'none';
                mainContent.style.display = 'block';

                uiEngine.currentFilter = view;
                if (sectionTitle) {
                    const titles = { 'movie': 'Filmes', 'series': 'Séries', 'favorites': 'Minha Lista' };
                    sectionTitle.innerText = titles[view] || 'Catálogo';
                }

                uiEngine.renderDashboard(dataEngine.state);
            }

            // Update Sidebar UI
            document.querySelectorAll('.sidebar-item').forEach(item => {
                const onclickAttr = item.getAttribute('onclick') || '';
                const isMatch = onclickAttr.includes(`'${view}'`);
                item.classList.toggle('active', isMatch);
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // Category Filtering
        window.filterCategory = (category) => {
            uiEngine.currentFilter = category;

            document.querySelectorAll('.category-pill').forEach(btn => {
                const btnText = btn.innerText.toLowerCase().trim();
                const targetText = (category === 'all' ? 'tudo' : category).toLowerCase().trim();
                btn.classList.toggle('active', btnText === targetText);
            });

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
