/**
 * CineMaxBR - UI Engine
 * Handles all rendering, modals, and lazy loading
 */
import { dataEngine } from './data-engine.js';

class UIEngine {
    constructor() {
        this.lazyObserver = null;
    }

    renderAll(media) {
        this.updateHero(media);

        const sections = {
            movies: document.getElementById('moviesGrid'),
            series: document.getElementById('seriesGrid'),
            kids: document.getElementById('kidsGrid'),
            franchise: document.getElementById('franchiseSection'),
            catalog: document.getElementById('catalogGrid')
        };

        if (sections.movies) this.renderGrid(sections.movies, media.filter(m => (m.type === 'movie' || m.isOld) && !this.isKids(m)));
        if (sections.series) this.renderGrid(sections.series, media.filter(m => m.type === 'series' && !m.isOld && !this.isKids(m)));
        if (sections.kids) this.renderGrid(sections.kids, media.filter(m => this.isKids(m)));
        if (sections.franchise) this.renderFranchises(sections.franchise, media);

        if (sections.catalog) {
            const params = new URLSearchParams(window.location.search);
            const type = params.get('type');
            this.renderCatalog(sections.catalog, media, type);
        }

        this.renderContinueWatching();
        this.renderWatchlist();
    }

    renderGrid(container, items) {
        if (!container) return;
        if (items.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-dim">Nenhum conteúdo encontrado.</p></div>';
            return;
        }

        container.innerHTML = items.map((item, i) => `
            <div class="col-6 col-md-4 col-lg-2 mb-5 animate-fade-in" style="animation-delay: ${i * 0.03}s">
                <div class="media-card h-100" onclick="window.openDetailsById('${item.id}')"
                     onmouseenter="window.playPreview(this, '${item.trailerUrl}')"
                     onmouseleave="window.stopPreview(this)">
                    <div class="media-card-skeleton skeleton"></div>
                    <img data-src="${item.poster}" alt="${item.title}" class="img-lazy"
                         onload="this.previousElementSibling.style.display='none'; this.classList.add('img-loaded')">
                    <div class="media-card-info">
                        <h6 class="fw-bold text-truncate mb-1">${item.title}</h6>
                        <div class="d-flex justify-content-between align-items-center opacity-75">
                            <span class="extra-small">${item.year}</span>
                            <span class="small"><i class="fas fa-star text-warning me-1"></i>${item.rating || '8.5'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.initLazyLoading();
    }

    updateHero(media) {
        const featured = media.find(m => m.featured) || media[0];
        if (!featured) return;

        const hero = document.getElementById('hero');
        const heroBg = document.getElementById('heroBanner');
        const heroTitle = document.getElementById('heroTitle');
        const heroDesc = document.getElementById('heroDesc');

        if (heroBg && heroTitle && heroDesc) {
            hero.classList.remove('active');
            setTimeout(() => {
                heroBg.src = featured.banner || featured.poster;
                heroTitle.innerText = featured.title;
                heroDesc.innerText = featured.desc;

                document.getElementById('btnPlayHero').onclick = () => this.openDetails(featured);
                document.getElementById('btnInfoHero').onclick = () => this.openDetails(featured);
                hero.classList.add('active');
            }, 300);
        }
    }

    renderFranchises(container, media) {
        const groups = {};
        media.forEach(item => {
            const fId = item.franchiseId;
            if (fId && dataEngine.allFranchises[fId]) {
                const fName = dataEngine.allFranchises[fId].name;
                if (!groups[fName]) groups[fName] = [];
                groups[fName].push(item);
            }
        });

        const names = Object.keys(groups);
        if (names.length === 0 || !container) {
            if (container) container.innerHTML = '';
            return;
        }

        container.innerHTML = names.map(name => {
            const items = groups[name].sort((a, b) => (a.year || 0) - (b.year || 0));
            return `
                <section class="mb-5 animate-fade-in collection-row">
                    <h2 class="section-title">Coleção: ${name}</h2>
                    <div class="row g-3 overflow-auto flex-nowrap pb-3 custom-scrollbar">
                        ${items.map(item => `
                            <div class="col-6 col-md-3 col-lg-2 flex-shrink-0 px-2">
                                <div class="media-card" onclick="window.openDetailsById('${item.id}')">
                                    <img src="${item.poster}" alt="${item.title}" loading="lazy" class="rounded-3 shadow">
                                    <div class="media-card-info p-2">
                                        <h6 class="small text-white text-truncate m-0">${item.title}</h6>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }).join('');
    }

    renderCatalog(grid, media, type) {
        let filtered = [];
        if (type === 'movie') filtered = media.filter(m => m.type === 'movie');
        else if (type === 'series') filtered = media.filter(m => m.type === 'series');
        else if (type === 'favorites') {
            const favs = dataEngine.getFavorites();
            filtered = media.filter(m => favs.includes(m.id));
        }
        this.renderGrid(grid, filtered);
    }

    renderContinueWatching() {
        const section = document.getElementById('continueWatchingSection');
        const grid = document.getElementById('continueWatchingGrid');
        if (!section || !grid) return;

        const history = dataEngine.getHistory();
        if (history.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        grid.innerHTML = history.slice(0, 6).map(item => `
            <div class="col-6 col-md-4 col-lg-2">
                <div class="media-card" onclick="window.startPlayback('${item.id}')">
                    <img src="${item.poster}" class="img-lazy" onload="this.classList.add('img-loaded')">
                    <div class="media-card-info">
                        <div class="progress mb-2" style="height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
                            <div class="progress-bar bg-danger" style="width: ${item.progress}%"></div>
                        </div>
                        <h6 class="mb-0 text-truncate small fw-bold">${item.title}</h6>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderWatchlist() {
        const favs = dataEngine.getFavorites();
        const grid = document.getElementById('watchlistGrid');
        const section = document.getElementById('watchlistSection');
        if (!section || !grid) return;

        if (favs.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        this.renderGrid(grid, dataEngine.allMedia.filter(m => favs.includes(m.id)));
    }

    openDetails(item) {
        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="media-detail-backdrop" style="background-image: url('${item.banner || item.poster}'); z-index: 1;"></div>
            <div class="row g-0 position-relative glass-detail" style="z-index: 2;">
                <div class="col-md-4 d-none d-md-block p-4" style="z-index: 10;">
                    <img src="${item.poster}" class="img-fluid rounded-4 shadow-2xl animate-fade-in poster-main">
                </div>
                <div class="col-md-8 p-4 p-md-5" style="z-index: 10;">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-danger rounded-pill px-3 shadow-sm">${item.type.toUpperCase()}</span>
                        <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                    </div>
                    <h1 class="display-4 fw-900 mb-2 cinematic-title">${item.title}</h1>
                    <div class="d-flex gap-3 mb-4 text-white-50 small fw-bold">
                        <span class="text-warning"><i class="fas fa-star me-2"></i>${item.rating || '8.5'}</span>
                        <span class="text-white-50">${item.year}</span>
                        <span class="text-white-50">${item.genre}</span>
                    </div>
                    <p class="lead mb-4 description-text text-white" style="opacity: 0.95;">${item.desc}</p>
                    <div class="d-flex flex-wrap gap-3 mt-4">
                        <button class="btn btn-danger btn-lg px-5 rounded-pill fw-bold btn-hyper" onclick="window.startPlayback('${item.id}')">
                            <i class="fas fa-play me-2"></i> ASSISTIR
                        </button>
                        <button class="btn btn-outline-light btn-lg px-4 rounded-pill action-btn" onclick="window.toggleFavorite('${item.id}', this)">
                            <i class="${dataEngine.getFavorites().includes(item.id) ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        new bootstrap.Modal(document.getElementById('detailsModal')).show();
    }

    isKids(m) {
        const genres = (m.genre || '').toLowerCase();
        return m.rating === 'L' || ['animação', 'família', 'kids', 'infantil'].some(g => genres.includes(g));
    }

    initLazyLoading() {
        if (this.lazyObserver) this.lazyObserver.disconnect();
        this.lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                }
            });
        }, { rootMargin: '100px' });

        document.querySelectorAll('.img-lazy[data-src]').forEach(img => this.lazyObserver.observe(img));
    }
}

export const uiEngine = new UIEngine();
