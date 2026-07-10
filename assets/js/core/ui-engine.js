/**
 * CineMaxBR - UI Engine (V2 - High Performance)
 * Handles batched rendering and cinematic transitions
 */
import { dataEngine } from './data-engine.js';

class UIEngine {
    constructor() {
        this.lazyObserver = null;
        this.currentFilter = 'all';
    }

    init() {
        this.setupListeners();
    }

    setupListeners() {
        dataEngine.subscribe((state) => {
            this.renderDashboard(state);
        });
    }

    renderDashboard(state) {
        if (state.isLoading) return;

        // 1. Update Hero (with safety try-catch)
        try {
            this.updateHero(state.allMedia);
        } catch (e) {
            console.error("Hero Update Error:", e);
        }

        // 2. Render Main Grid (Generic Catalog)
        const mainGrid = document.getElementById('mainContentGrid');
        if (mainGrid) {
            const filtered = dataEngine.getFilteredMedia(this.currentFilter);
            this.renderGrid(mainGrid, filtered);
        }

        // 3. Render Specific Home Sections
        const homeSections = [
            { id: 'moviesGrid', items: state.allMedia.filter(m => m.type === 'movie').slice(0, 12) },
            { id: 'seriesGrid', items: state.allMedia.filter(m => m.type === 'series').slice(0, 12) },
            { id: 'kidsGrid', items: state.allMedia.filter(m => dataEngine.isKids(m)).slice(0, 12) },
            { id: 'latestGrid', items: state.allMedia.slice(0, 12) }
        ];

        // Apply filters if we are in Home but category is selected
        if (this.currentFilter !== 'all') {
            const filteredAll = dataEngine.getFilteredMedia(this.currentFilter);
            homeSections.forEach(sec => {
                sec.items = filteredAll.filter(m => {
                    if (sec.id === 'moviesGrid') return m.type === 'movie';
                    if (sec.id === 'seriesGrid') return m.type === 'series';
                    if (sec.id === 'kidsGrid') return dataEngine.isKids(m);
                    return true;
                }).slice(0, 12);
            });
        }

        homeSections.forEach(sec => {
            const container = document.getElementById(sec.id);
            if (container) this.renderGrid(container, sec.items);
        });

        // History Section with toggle
        const historyContainer = document.getElementById('continueWatchingGrid');
        const historySection = document.getElementById('continueWatchingSection');
        if (historySection) {
            if (state.history && state.history.length > 0) {
                historySection.style.display = 'block';
                if (historyContainer) this.renderGrid(historyContainer, state.history, true);
            } else {
                historySection.style.display = 'none';
            }
        }

        // Watchlist Section with toggle
        const watchlistContainer = document.getElementById('watchlistGrid');
        const watchlistSection = document.getElementById('watchlistSection');
        if (watchlistSection) {
            const favItems = state.allMedia.filter(m => state.favorites.has(m.id));
            if (favItems.length > 0) {
                watchlistSection.style.display = 'block';
                if (watchlistContainer) this.renderGrid(watchlistContainer, favItems);
            } else {
                watchlistSection.style.display = 'none';
            }
        }

        this.initLazyLoading();
    }

    renderGrid(container, items, isHistory = false) {
        if (!container) return;
        if (items.length === 0 && !isHistory) {
            // Only show empty state if it's not a secondary section
            return;
        }

        container.innerHTML = items.map((item, i) =>
            isHistory ? this.createHistoryCardHTML(item) : this.createCardHTML(item, i)
        ).join('');
    }

    createHistoryCardHTML(item) {
        return `
            <div class="col-6 col-md-4 col-lg-2 mb-4 animate-fade-in">
                <div class="media-card" onclick="window.startPlayback('${item.id}')">
                    <img src="${item.poster}" loading="lazy">
                    <div class="media-card-info">
                        <div class="progress mb-2" style="height: 4px; background: rgba(255,255,255,0.2);">
                            <div class="progress-bar bg-danger" style="width: ${item.progress}%"></div>
                        </div>
                        <h6 class="mb-0 text-truncate small fw-bold">${item.title}</h6>
                    </div>
                </div>
            </div>
        `;
    }

    renderHistoryGrid(container, items) {
        container.innerHTML = items.map(item => `
            <div class="col-6 col-md-4 col-lg-2">
                <div class="media-card" onclick="window.startPlayback('${item.id}')">
                    <img src="${item.poster}" loading="lazy">
                    <div class="media-card-info">
                        <div class="progress mb-2" style="height: 4px; background: rgba(255,255,255,0.2);">
                            <div class="progress-bar bg-danger" style="width: ${item.progress}%"></div>
                        </div>
                        <h6 class="mb-0 text-truncate small fw-bold">${item.title}</h6>
                    </div>
                </div>
            </div>
        `).join('');
    }

    createCardHTML(item, index) {
        return `
            <div class="col-6 col-md-4 col-lg-2 mb-4 animate-fade-in" style="animation-delay: ${index * 0.05}s">
                <div class="media-card h-100"
                     onclick="window.openDetailsById('${item.id}')"
                     onmouseenter="window.playPreview(this, '${item.trailerUrl}')"
                     onmouseleave="window.stopPreview(this)">
                    <div class="media-card-skeleton skeleton"></div>
                    <img data-src="${item.poster}" alt="${item.title}" class="img-lazy">
                    <div class="media-card-info">
                        <h6 class="fw-bold text-truncate mb-1">${item.title}</h6>
                        <div class="d-flex justify-content-between align-items-center opacity-75">
                            <span class="extra-small">${item.year}</span>
                            <span class="small"><i class="fas fa-star text-warning me-1"></i>${item.rating || '8.5'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateHero(media) {
        const hero = document.getElementById('hero');
        if (!hero) return;

        const featured = media.find(m => m.featured) || media[0];
        if (!featured) {
            hero.style.display = 'none';
            return;
        }
        hero.style.display = 'flex';

        const heroBg = document.getElementById('heroBanner');
        const heroTitle = document.getElementById('heroTitle');
        const heroDesc = document.getElementById('heroDesc');

        if (!heroBg || !heroTitle || !heroDesc) return;

        // Fix image source
        const bannerUrl = featured.banner || featured.poster;
        if (heroBg.src && heroBg.src.includes(bannerUrl)) return;

        hero.classList.remove('active');

        // Immediate update to avoid blank state
        heroBg.src = bannerUrl;
        heroTitle.innerText = featured.title;
        heroDesc.innerText = featured.desc;

        document.getElementById('btnPlayHero').onclick = () => window.startPlayback(featured.id);
        document.getElementById('btnInfoHero').onclick = () => this.openDetails(featured);

        setTimeout(() => hero.classList.add('active'), 100);
    }

    openDetails(item) {
        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        const isFav = dataEngine.state.favorites.has(item.id);

        modalBody.innerHTML = `
            <div class="media-detail-backdrop" style="background-image: url('${item.banner || item.poster}');"></div>
            <div class="row g-0 position-relative glass-detail">
                <div class="col-md-4 d-none d-md-block p-4">
                    <img src="${item.poster}" class="img-fluid rounded-4 shadow-2xl animate-fade-in poster-main">
                </div>
                <div class="col-md-8 p-4 p-md-5">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-danger rounded-pill px-3 shadow-sm">${item.type.toUpperCase()}</span>
                        <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                    </div>
                    <h1 class="display-4 fw-900 mb-2 cinematic-title">${item.title}</h1>
                    <div class="d-flex gap-3 mb-4 text-white-50 small fw-bold">
                        <span class="text-warning"><i class="fas fa-star me-2"></i>${item.rating || '8.5'}</span>
                        <span>${item.year}</span>
                        <span>${item.genre}</span>
                    </div>
                    <p class="lead mb-4 description-text text-white">${item.desc}</p>
                    <div class="d-flex flex-wrap gap-3 mt-4">
                        <button class="btn btn-danger btn-lg px-5 rounded-pill fw-bold btn-hyper" onclick="window.startPlayback('${item.id}')">
                            <i class="fas fa-play me-2"></i> ASSISTIR
                        </button>
                        <button class="btn btn-outline-light btn-lg px-4 rounded-pill action-btn" onclick="window.toggleFavorite('${item.id}', this)">
                            <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    }

    initLazyLoading() {
        if (this.lazyObserver) this.lazyObserver.disconnect();
        this.lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.onload = () => img.classList.add('img-loaded');
                    this.lazyObserver.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });

        document.querySelectorAll('.img-lazy').forEach(img => this.lazyObserver.observe(img));
    }
}

export const uiEngine = new UIEngine();
