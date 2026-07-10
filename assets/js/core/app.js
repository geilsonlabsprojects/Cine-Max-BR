/**
 * CineMaxBR HYPER-PREMIUM Core Engine
 * "One Million Times Better" Implementation
 */
import { subscribeToMedia, subscribeToOldMovies, verifyAccessCode, incrementViews } from '../services/firebase-service.js';
import { WebPlayer } from '../components/web-player.js';

let allMedia = [];
let allFranchises = {};
let groupedFranchises = {};
const player = new WebPlayer('videoContainer');

document.addEventListener('DOMContentLoaded', () => {
    initAccessControl();
});

/**
 * Access Control Gatekeeper
 */
function initAccessControl() {
    const isAuthorized = localStorage.getItem('cinemax_access_granted');
    const termsAccepted = localStorage.getItem('cinemax_terms_accepted');
    const gate = document.getElementById('accessGate');

    if (isAuthorized === 'true' && termsAccepted === 'true') {
        gate.style.display = 'none';
        startApp();
    } else {
        const codeStep = document.getElementById('codeStep');
        const termsStep = document.getElementById('termsStep');

        const btnVerify = document.getElementById('btnVerifyAccess');
        const input = document.getElementById('accessCodeInput');
        const error = document.getElementById('accessError');

        const btnAccept = document.getElementById('btnAcceptTerms');
        const checkTerms = document.getElementById('checkTerms');

        // Stage 1: Auth
        if (isAuthorized === 'true') {
            codeStep.style.display = 'none';
            termsStep.style.display = 'block';
        }

        btnVerify.onclick = async () => {
            const code = input.value.trim();
            if (!code) return;

            btnVerify.disabled = true;
            btnVerify.innerText = "VERIFICANDO...";

            const isValid = await verifyAccessCode(code);

            if (isValid) {
                localStorage.setItem('cinemax_access_granted', 'true');
                codeStep.classList.add('animate-fade-out');
                setTimeout(() => {
                    codeStep.style.display = 'none';
                    termsStep.style.display = 'block';
                    termsStep.classList.add('animate-fade-in');
                }, 400);
            } else {
                error.style.display = 'block';
                btnVerify.disabled = false;
                btnVerify.innerText = "ENTRAR AGORA";
                input.value = '';
                input.focus();
            }
        };

        // Stage 2: Terms
        checkTerms.onchange = () => {
            btnAccept.disabled = !checkTerms.checked;
        };

        btnAccept.onclick = () => {
            localStorage.setItem('cinemax_terms_accepted', 'true');
            gate.classList.add('animate-fade-out');
            setTimeout(() => {
                gate.style.display = 'none';
                startApp();
            }, 500);
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') btnVerify.click();
        };
    }
}

function startApp() {
    initHyperUI();
    initDataFlow();
    initCustomCursor();
    initSearch();
}

/**
 * Enhanced UI Effects
 */
function initHyperUI() {
    // Navbar Scroll Polish
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar-pro');
        if (window.scrollY > 80) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Ambient Lighting Effect
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth * 100;
        const y = e.clientY / window.innerHeight * 100;
        document.body.style.setProperty('--mouse-x', `${x}%`);
        document.body.style.setProperty('--mouse-y', `${y}%`);
    });
}

/**
 * Custom Cursor Implementation
 */
function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.id = 'customCursor';
    const follower = document.createElement('div');
    follower.id = 'cursorFollower';
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 4 + 'px';
        cursor.style.top = e.clientY - 4 + 'px';

        follower.style.left = e.clientX - 17.5 + 'px';
        follower.style.top = e.clientY - 17.5 + 'px';
    });

    document.querySelectorAll('button, a, .media-card, #btnOpenSearch, #btnCloseSearch').forEach(el => {
        el.addEventListener('mouseenter', () => {
            follower.style.transform = 'scale(1.5)';
            follower.style.borderColor = 'var(--accent)';
            follower.style.background = 'rgba(229, 9, 20, 0.1)';
        });
        el.addEventListener('mouseleave', () => {
            follower.style.transform = 'scale(1)';
            follower.style.borderColor = 'rgba(255,255,255,0.2)';
            follower.style.background = 'transparent';
        });
    });
}

/**
 * Hyper-Premium Data Rendering
 */
function initDataFlow() {
    const db = firebase.database();

    // Subscribe to Franchises metadata
    db.ref('franchises').on('value', snapshot => {
        allFranchises = snapshot.val() || {};
        renderHyperUI();
    });

    subscribeToMedia(data => {
        allMedia = mergeUnique(allMedia, data);
        renderHyperUI();
    });

    subscribeToOldMovies(data => {
        allMedia = mergeUnique(allMedia, data);
        renderHyperUI();
    });
}

function mergeUnique(existing, newData) {
    const map = new Map();
    [...existing, ...newData].forEach(item => map.set(item.id, item));
    return Array.from(map.values());
}

function renderHyperUI() {
    console.log("--- START HYPER RENDER ---");
    const moviesGrid = document.getElementById('moviesGrid');
    const seriesGrid = document.getElementById('seriesGrid');
    const kidsGrid = document.getElementById('kidsGrid');
    const franchiseContainer = document.getElementById('franchiseSection');

    if (!franchiseContainer) {
        console.error("CRITICAL: Element #franchiseSection not found in HTML!");
    }

    allMedia.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Process Franchises
    processFranchiseGroups();

    console.log("Grouped Franchises Count:", Object.keys(groupedFranchises).length);

    // Update Hero
    // ... (rest of hero logic)
    const featured = allMedia.find(m => m.featured) || allMedia[0];
    if (featured) {
        const hero = document.getElementById('hero');
        const heroBg = document.getElementById('heroBanner');

        hero.classList.remove('active');
        setTimeout(() => {
            heroBg.src = featured.banner || featured.poster;
            document.getElementById('heroTitle').innerText = featured.title;
            document.getElementById('heroDesc').innerText = featured.desc;

            // Remove the "Original" badge if it exists
            const badge = document.querySelector('.hero-badge');
            if (badge) badge.style.display = 'none';

            document.getElementById('btnPlayHero').onclick = () => openPlayer(featured);
            document.getElementById('btnInfoHero').onclick = () => openDetails(featured);
            hero.classList.add('active');
        }, 500);
    }

    renderGrid(moviesGrid, allMedia.filter(m => (m.type === 'movie' || m.isOld) && !isKids(m)));
    renderGrid(seriesGrid, allMedia.filter(m => m.type === 'series' && !m.isOld && !isKids(m)));
    renderGrid(kidsGrid, allMedia.filter(m => isKids(m)));
    renderFranchiseGroupsUI(franchiseContainer);
    renderWatchlist();
}

function renderWatchlist() {
    const favorites = JSON.parse(localStorage.getItem('cinemax_favorites') || '[]');
    const watchlistGrid = document.getElementById('watchlistGrid');
    const section = document.getElementById('watchlistSection');

    if (favorites.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    if (!section) {
        const main = document.querySelector('main');
        const html = `
            <section id="watchlistSection" class="mb-5 animate-fade-in">
                <h2 class="section-title">Minha Lista</h2>
                <div class="row g-4" id="watchlistGrid"></div>
            </section>
        `;
        main.insertAdjacentHTML('afterbegin', html);
    } else {
        section.style.display = 'block';
    }

    const filtered = allMedia.filter(m => favorites.includes(m.id));
    renderGrid(document.getElementById('watchlistGrid'), filtered);
}

function processFranchiseGroups() {
    groupedFranchises = {};
    console.log("Processing groups. Media:", allMedia.length, "Franchise Metadata:", Object.keys(allFranchises).length);

    allMedia.forEach(item => {
        const fId = item.franchiseId;
        if (fId) {
            // Se temos o metadado (nome da franquia), usamos o nome.
            // Caso contrário, usamos o ID como fallback para não perder o agrupamento.
            const fName = allFranchises[fId]?.name || (fId.startsWith('f_') ? null : fId);

            if (fName) {
                if (!groupedFranchises[fName]) {
                    groupedFranchises[fName] = [];
                }
                groupedFranchises[fName].push(item);
            } else if (allFranchises[fId]) {
                // Se existe no metadado mas não tem nome (improvável)
                const fallbackName = allFranchises[fId].name || "Coleção";
                if (!groupedFranchises[fallbackName]) groupedFranchises[fallbackName] = [];
                groupedFranchises[fallbackName].push(item);
            }
        }
    });
}

function renderFranchiseGroupsUI(container) {
    if (!container) return;

    const names = Object.keys(groupedFranchises);
    console.log("Rendering Franchise Names:", names);

    if (names.length === 0) {
        container.innerHTML = '<!-- No franchises found to display -->';
        return;
    }

    let html = '';
    names.forEach(name => {
        const items = groupedFranchises[name].sort((a, b) => (a.year || 0) - (b.year || 0));
        console.log(`Franchise "${name}" has ${items.length} items`);

        html += `
            <section class="mb-5 animate-fade-in" style="position: relative; z-index: 10;">
                <h2 class="section-title" style="color: #fff; font-weight: 900; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">Coleção: ${name}</h2>
                <div class="row g-3 overflow-auto flex-nowrap pb-3 custom-scrollbar" style="scrollbar-width: thin; -webkit-overflow-scrolling: touch; margin: 0 -10px;">
        `;

        items.forEach(item => {
            html += `
                <div class="col-6 col-md-3 col-lg-2 flex-shrink-0 px-2">
                    <div class="media-card h-100" onclick="openDetailsById('${item.id}')" style="cursor: pointer; transition: transform 0.3s ease;">
                        <img src="${item.poster}" alt="${item.title}" loading="lazy" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
                        <div class="media-card-info" style="padding: 10px 5px;">
                            <h6 class="fw-bold mb-0 text-white text-truncate small">${item.title}</h6>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></section>`;
    });

    container.innerHTML = html;
}

window.openDetailsById = function(id) {
    const item = allMedia.find(m => m.id === id);
    if (item) openDetails(item);
}

function isKids(m) {
    const kidsGenres = ['animação', 'família', 'kids', 'infantil'];
    const genre = (m.genre || '').toLowerCase();
    const isL = m.rating === 'L';
    const hasKidsGenre = kidsGenres.some(g => genre.includes(g));
    return isL || hasKidsGenre;
}

function renderGrid(container, items) {
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 animate-fade-in">
                <i class="fas fa-film fa-3x text-dim mb-3"></i>
                <p class="text-dim">Nenhum conteúdo encontrado nesta categoria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    items.forEach((item, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-2 mb-4';
        col.style.animationDelay = `${index * 0.05}s`;

        col.innerHTML = `
            <div class="media-card animate-fade-in">
                <div class="media-card-skeleton"></div>
                <img src="${item.poster}" alt="${item.title}" loading="lazy" onload="this.previousElementSibling.style.display='none'">
                <div class="media-card-info">
                    <h5 class="fw-900 mb-1 text-truncate">${item.title}</h5>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge border border-secondary extra-small">${item.year}</span>
                        <div class="d-flex align-items-center gap-1">
                             <i class="fas fa-star text-warning small"></i>
                             <span class="text-accent fw-bold small">${item.rating || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        col.querySelector('.media-card').onclick = () => openDetails(item);
        container.appendChild(col);
    });
}

window.openDetails = function(item) {
    const modalBody = document.getElementById('modalBody');
    const isSeries = item.type === 'series';

    modalBody.innerHTML = `
        <div class="media-detail-backdrop" style="background-image: url('${item.banner || item.poster}')"></div>
        <div class="row g-0 position-relative" style="z-index: 2;">
            <div class="col-md-4 d-none d-md-block">
                <div class="poster-glow-container">
                    <img src="${item.poster}" class="poster-main shadow-lg">
                </div>
            </div>
            <div class="col-md-8 p-4 p-md-5 d-flex flex-column content-glass">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge bg-danger rounded-pill px-3 py-2 fw-bold">${item.type === 'series' ? 'SÉRIE' : 'FILME'}</span>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <h1 class="display-3 fw-900 mb-2 cinematic-title">${item.title}</h1>

                <div class="d-flex flex-wrap gap-3 mb-4 fw-700">
                    <span class="text-warning"><i class="fas fa-star me-2"></i>${item.rating || 'N/A'}</span>
                    <span class="text-white-50"><i class="far fa-calendar-alt me-2"></i>${item.year}</span>
                    <span class="text-white-50"><i class="fas fa-film me-2"></i>${item.genre || 'Aventura'}</span>
                </div>

                <p class="lead mb-4 description-text" style="max-height: 150px; overflow-y: auto;">${item.desc}</p>

                ${item.tags ? `
                <div class="d-flex flex-wrap gap-2 mb-4">
                    ${item.tags.split(',').map(tag => `<span class="detail-pill">${tag.trim()}</span>`).join('')}
                </div>
                ` : ''}

                ${renderFranchiseSuggest(item)}

                <div class="d-flex flex-wrap gap-3 mb-4 mt-auto">
                    <button class="btn btn-danger btn-lg px-5 py-3 fw-900 rounded-pill action-btn pulse-glow" onclick="startPlayback('${item.id}')">
                        <i class="fas fa-play me-2"></i> ASSISTIR AGORA
                    </button>
                    <button class="btn btn-outline-light btn-lg px-4 py-3 fw-800 rounded-pill action-btn" onclick="toggleFavorite('${item.id}', this)">
                        <i class="${isFavorite(item.id) ? 'fas' : 'far'} fa-heart me-2"></i> MINHA LISTA
                    </button>
                    ${item.trailer ? `
                    <button class="btn btn-outline-light btn-lg px-4 py-3 fw-800 rounded-pill action-btn" onclick="openTrailer('${item.trailer}')">
                        <i class="fas fa-film me-2"></i> TRAILER
                    </button>` : ''}
                </div>

                <div class="mt-4 pt-4 border-top border-secondary row g-3">
                    <div class="col-4"><p class="mb-0 x-small fw-bold text-secondary text-uppercase">Direção</p><p class="small text-white mb-0">${item.director || 'N/A'}</p></div>
                    <div class="col-4"><p class="mb-0 x-small fw-bold text-secondary text-uppercase">Estúdio</p><p class="small text-white mb-0">${item.studio || 'N/A'}</p></div>
                    <div class="col-4"><p class="mb-0 x-small fw-bold text-secondary text-uppercase">Lançamento</p><p class="small text-white mb-0">${item.year}</p></div>
                </div>
            </div>
        </div>
    `;

    const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
    detailsModal.show();
};

function renderFranchiseSuggest(item) {
    if (!item.franchiseId || !groupedFranchises) return '';
    const fName = allFranchises[item.franchiseId]?.name;
    if (!fName || !groupedFranchises[fName]) return '';

    const related = groupedFranchises[fName].filter(m => m.id !== item.id);
    if (related.length === 0) return '';

    let html = `<div class="mb-4"><h6 class="text-secondary fw-bold text-uppercase small mb-3">Mais da Coleção ${fName}</h6><div class="d-flex gap-2 overflow-auto pb-2 custom-scrollbar">`;
    related.forEach(m => {
        html += `<img src="${m.poster}" class="rounded-2 cursor-pointer shadow-sm hover-scale" style="height: 120px; width: 85px; object-fit: cover; transition: 0.3s;" onclick="openDetailsById('${m.id}')">`;
    });
    html += `</div></div>`;
    return html;
}

window.startPlayback = function(id) {
    const item = allMedia.find(m => m.id === id);
    if (!item) return;

    incrementViews(item.id, item.isOld);

    const url = item.videoUrl || item.trailerUrl;
    bootstrap.Modal.getInstance(document.getElementById('detailsModal'))?.hide();
    openPlayer(item, url);
}

function openPlayer(item, url) {
    if (!url) {
        showToast("Este conteúdo ainda não possui um link de vídeo disponível.", "warning");
        return;
    }
    document.getElementById('playerOverlay').style.display = 'block';
    player.render(item, url);
}

window.closePlayer = function() {
    document.getElementById('playerOverlay').style.display = 'none';
    player.stop(); // Assuming stop method added or just innerHTML = ''
}

/**
 * Watchlist Logic
 */
window.isFavorite = function(id) {
    const favorites = JSON.parse(localStorage.getItem('cinemax_favorites') || '[]');
    return favorites.includes(id);
}

window.toggleFavorite = function(id, btn) {
    let favorites = JSON.parse(localStorage.getItem('cinemax_favorites') || '[]');
    const icon = btn.querySelector('i');

    if (favorites.includes(id)) {
        favorites = favorites.filter(fid => fid !== id);
        icon.classList.replace('fas', 'far');
    } else {
        favorites.push(id);
        icon.classList.replace('far', 'fas');
    }

    localStorage.setItem('cinemax_favorites', JSON.stringify(favorites));
    renderWatchlist();
}

/**
 * Search Engine Implementation
 */
function initSearch() {
    const btnOpen = document.getElementById('btnOpenSearch');
    const btnClose = document.getElementById('btnCloseSearch');
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const resultsGrid = document.getElementById('searchResults');

    if (!btnOpen || !btnClose || !overlay || !input) return;

    btnOpen.onclick = () => {
        overlay.classList.add('active');
        input.focus();
        document.body.style.overflow = 'hidden';
    };

    btnClose.onclick = () => {
        overlay.classList.remove('active');
        input.value = '';
        resultsGrid.innerHTML = '';
        document.body.style.overflow = 'auto';
    };

    input.onkeyup = (e) => {
        if (e.key === 'Escape') btnClose.click();

        const query = input.value.toLowerCase().trim();
        if (query.length < 2) {
            resultsGrid.innerHTML = '';
            return;
        }

        const filtered = allMedia.filter(m =>
            m.title.toLowerCase().includes(query) ||
            (m.genre && m.genre.toLowerCase().includes(query)) ||
            (m.director && m.director.toLowerCase().includes(query)) ||
            (m.tags && m.tags.toLowerCase().includes(query))
        );

        renderGrid(resultsGrid, filtered);
    };
}
