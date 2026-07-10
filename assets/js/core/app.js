/**
 * CineMaxBR HYPER-PREMIUM Core Engine - Otimizado para GitHub Pages
 */
import {
    subscribeToMedia, subscribeToOldMovies, verifyAccessCode, incrementViews,
    googleLogin, checkUserAuthorization, linkAccount, auth
} from '../services/firebase-service.js';
import { WebPlayer } from '../player/player.js';

// Cache e Estado Global
let allMedia = [];
let allFranchises = {};
let groupedFranchises = {};
let currentUser = null;
let currentFilter = 'all';
const player = new WebPlayer('videoContainer');

// Inicialização segura
document.addEventListener('DOMContentLoaded', () => {
    try {
        initAuthObserver();
        initHyperUI();
        initCustomCursor();
    } catch (error) {
        console.error("Erro na inicialização básica:", error);
    }
});

/**
 * Gatekeeper de Acesso com Firebase Auth e Vínculo de Conta
 */
function initAuthObserver() {
    const gate = document.getElementById('accessGate');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const isAuthorized = await checkUserAuthorization(user.uid);
            const termsAccepted = localStorage.getItem(`cinemax_terms_${user.uid}`);

            if (isAuthorized && termsAccepted === 'true') {
                if (gate) gate.style.display = 'none';
                startApp();
            } else if (!isAuthorized) {
                showStep('codeStep');
                setupAuthEvents();
            } else {
                showStep('termsStep');
                setupAuthEvents();
            }
        } else {
            showStep('loginStep');
            setupAuthEvents();
        }
    });
}

// Filtros e Categorias
window.filterCategory = (category) => {
    currentFilter = category;
    document.querySelectorAll('.category-pill, .sidebar-item').forEach(el => el.classList.remove('active'));

    // Update UI
    const pills = document.querySelectorAll(`.category-pill`);
    pills.forEach(p => {
        if (p.innerText.toLowerCase() === category.toLowerCase() || (category === 'all' && p.innerText === 'Tudo')) {
            p.classList.add('active');
        }
    });

    renderAllSections();
};

function renderAllSections() {
    const moviesGrid = document.getElementById('moviesGrid');
    const seriesGrid = document.getElementById('seriesGrid');
    const kidsGrid = document.getElementById('kidsGrid');

    if (!moviesGrid || !seriesGrid || !kidsGrid) return;

    // Filter Logic
    const filtered = allMedia.filter(item => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'movie') return item.type === 'movie';
        if (currentFilter === 'series') return item.type === 'series';

        const genre = (item.genre || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const filter = currentFilter.toLowerCase();

        return genre.includes(filter) || type === filter || (item.tags && item.tags.toLowerCase().includes(filter));
    });

    renderGrid(moviesGrid, filtered.filter(m => m.type === 'movie' && m.genre !== 'Kids'));
    renderGrid(seriesGrid, filtered.filter(m => m.type === 'series'));
    renderGrid(kidsGrid, filtered.filter(m => m.genre === 'Kids'));

    renderFranchises(filtered);
    renderContinueWatching();
}

/**
 * Continue Assistindo
 */
function renderContinueWatching() {
    const section = document.getElementById('continueWatchingSection');
    const grid = document.getElementById('continueWatchingGrid');
    if (!section || !grid) return;

    const history = JSON.parse(localStorage.getItem(`cinemax_history_${currentUser?.uid}`) || '[]');
    if (history.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = history.slice(0, 6).map(item => `
        <div class="col">
            <div class="media-card" onclick="startPlayback('${item.id}')">
                <img src="${item.poster}" class="img-lazy" onload="this.classList.add('img-loaded')">
                <div class="media-card-info">
                    <div class="progress mb-2" style="height: 4px; background: rgba(255,255,255,0.2);">
                        <div class="progress-bar bg-danger" style="width: ${item.progress}%"></div>
                    </div>
                    <h6 class="mb-0 text-truncate">${item.title}</h6>
                </div>
            </div>
        </div>
    `).join('');
}

function showStep(stepId) {
    ['loginStep', 'codeStep', 'termsStep'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === stepId) ? 'block' : 'none';
    });
}

function setupAuthEvents() {
    const btnGoogle = document.getElementById('btnGoogleLogin');
    const btnVerify = document.getElementById('btnVerifyAccess');
    const btnAccept = document.getElementById('btnAcceptTerms');
    const input = document.getElementById('accessCodeInput');
    const checkTerms = document.getElementById('checkTerms');
    const error = document.getElementById('accessError');

    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            try {
                await googleLogin();
            } catch (e) {
                console.error("Login failed", e);
                alert("Falha no login com Google.");
            }
        };
    }

    if (btnVerify && input) {
        btnVerify.onclick = async () => {
            const code = input.value.trim();
            if (!code || !currentUser) return;

            btnVerify.disabled = true;
            btnVerify.innerText = "VERIFICANDO...";

            try {
                const linked = await linkAccount(currentUser.uid, code);
                if (linked) {
                    showStep('termsStep');
                } else {
                    throw new Error("Código inválido");
                }
            } catch (e) {
                if (error) error.style.display = 'block';
                btnVerify.disabled = false;
                btnVerify.innerText = "VINCULAR CONTA";
                input.value = '';
            }
        };
        input.onkeypress = (e) => { if (e.key === 'Enter') btnVerify.click(); };
    }

    if (btnAccept && checkTerms) {
        checkTerms.onchange = () => btnAccept.disabled = !checkTerms.checked;
        btnAccept.onclick = () => {
            if (currentUser) {
                localStorage.setItem(`cinemax_terms_${currentUser.uid}`, 'true');
                document.getElementById('accessGate').style.display = 'none';
                startApp();
            }
        };
    }
}

function startApp() {
    initDataFlow();
    initSearch();
    initLogout(); // Adiciona função de logout
}

/**
 * Função para limpar acesso e pedir senha novamente
 */
function initLogout() {
    const avatar = document.querySelector('.avatar-circle');
    if (avatar) {
        avatar.style.cursor = 'pointer';
        avatar.title = 'Clique para Sair';
        avatar.onclick = () => {
            if (confirm("Deseja sair da sua conta Google?")) {
                auth.signOut().then(() => window.location.reload());
            }
        };
    }
}

/**
 * Interface Otimizada
 */
function initHyperUI() {
    const nav = document.querySelector('.navbar-pro');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 80);
        }, { passive: true });
    }

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth * 100).toFixed(2);
        const y = (e.clientY / window.innerHeight * 100).toFixed(2);
        document.body.style.setProperty('--mouse-x', `${x}%`);
        document.body.style.setProperty('--mouse-y', `${y}%`);
    }, { passive: true });
}

function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.id = 'customCursor';
    const follower = document.createElement('div');
    follower.id = 'cursorFollower';
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            cursor.style.left = `${e.clientX - 4}px`;
            cursor.style.top = `${e.clientY - 4}px`;
            follower.style.left = `${e.clientX - 17.5}px`;
            follower.style.top = `${e.clientY - 17.5}px`;
        });
    }, { passive: true });
}

/**
 * Fluxo de Dados com Cache e Tratamento de Erros
 */
function initDataFlow() {
    const db = firebase.database();

    // Carregamento assíncrono paralelo
    Promise.all([
        db.ref('franchises').once('value').then(snap => allFranchises = snap.val() || {}),
        new Promise(resolve => subscribeToMedia(data => {
            allMedia = mergeUnique(allMedia, data);
            resolve();
            renderHyperUI();
        })),
        new Promise(resolve => subscribeToOldMovies(data => {
            allMedia = mergeUnique(allMedia, data);
            resolve();
            renderHyperUI();
        }))
    ]).catch(err => console.error("Erro no fluxo de dados:", err));
}

function mergeUnique(existing, newData) {
    const map = new Map(existing.map(item => [item.id, item]));
    newData.forEach(item => map.set(item.id, item));
    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function renderHyperUI() {
    const sections = {
        movies: document.getElementById('moviesGrid'),
        series: document.getElementById('seriesGrid'),
        kids: document.getElementById('kidsGrid'),
        franchise: document.getElementById('franchiseSection')
    };

    updateHero();
    processFranchiseGroups();

    if (sections.movies) renderGrid(sections.movies, allMedia.filter(m => (m.type === 'movie' || m.isOld) && !isKids(m)));
    if (sections.series) renderGrid(sections.series, allMedia.filter(m => m.type === 'series' && !m.isOld && !isKids(m)));
    if (sections.kids) renderGrid(sections.kids, allMedia.filter(m => isKids(m)));
    if (sections.franchise) renderFranchiseGroupsUI(sections.franchise);

    renderWatchlist();
}

function updateHero() {
    const featured = allMedia.find(m => m.featured) || allMedia[0];
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

            document.getElementById('btnPlayHero').onclick = () => openDetails(featured);
            document.getElementById('btnInfoHero').onclick = () => openDetails(featured);
            hero.classList.add('active');
        }, 300);
    }
}

function processFranchiseGroups() {
    groupedFranchises = {};
    allMedia.forEach(item => {
        const fId = item.franchiseId;
        if (fId && allFranchises[fId]) { // Somente se a franquia existir
            const fName = allFranchises[fId].name;
            if (!groupedFranchises[fName]) groupedFranchises[fName] = [];
            groupedFranchises[fName].push(item);
        }
    });
}

function renderFranchiseGroupsUI(container) {
    const names = Object.keys(groupedFranchises);
    if (names.length === 0) return;

    container.innerHTML = names.map(name => {
        const items = groupedFranchises[name].sort((a, b) => (a.year || 0) - (b.year || 0));
        return `
            <section class="mb-5 animate-fade-in collection-row">
                <h2 class="section-title">Coleção: ${name}</h2>
                <div class="row g-3 overflow-auto flex-nowrap pb-3 custom-scrollbar">
                    ${items.map(item => `
                        <div class="col-6 col-md-3 col-lg-2 flex-shrink-0 px-2">
                            <div class="media-card" onclick="openDetailsById('${item.id}')">
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

function renderGrid(container, items) {
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-dim">Nenhum conteúdo nesta categoria.</p></div>';
        return;
    }

    container.innerHTML = items.map((item, i) => `
        <div class="col-6 col-md-4 col-lg-2 mb-4 animate-fade-in" style="animation-delay: ${i * 0.05}s">
            <div class="media-card" onclick="openDetailsById('${item.id}')">
                <div class="media-card-skeleton skeleton"></div>
                <img data-src="${item.poster}" alt="${item.title}" class="img-lazy"
                     onload="this.previousElementSibling.style.display='none'; this.classList.add('img-loaded')">
                <div class="media-card-info">
                    <h5 class="fw-bold text-truncate mb-1">${item.title}</h5>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge border border-secondary extra-small">${item.year}</span>
                        <span class="text-accent fw-bold small"><i class="fas fa-star text-warning me-1"></i>${item.rating || '8.5'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    initLazyLoading();
}

/**
 * Lazy Loading Engine com Intersection Observer
 */
function initLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                // Continua observando para lidar com carregamento/descarregamento se necessário,
                // mas para performance simples, podemos parar de observar após carregar.
                // No entanto, o usuário pediu "quando para de amostrar para de carregar".
                // Tecnicamente a imagem já está no cache, mas podemos "limpar" o src para economizar memória
                // em listas gigantes, embora não seja o padrão para imagens pequenas.
            } else {
                // Se quiser economizar banda real (parar de carregar se o usuário rolar rápido demais)
                // O navegador já faz algum gerenciamento, mas podemos tentar:
                const img = entry.target;
                if (img.src && !img.classList.contains('img-loaded')) {
                    // Se ainda não carregou e saiu da tela, cancelamos
                    img.src = '';
                }
            }
        });
    }, { rootMargin: '100px' });

    document.querySelectorAll('.img-lazy[data-src]').forEach(img => observer.observe(img));
}

window.openDetailsById = (id) => {
    const item = allMedia.find(m => m.id === id);
    if (item) openDetails(item);
};

function isKids(m) {
    const genres = (m.genre || '').toLowerCase();
    return m.rating === 'L' || ['animação', 'família', 'kids', 'infantil'].some(g => genres.includes(g));
}

window.openDetails = function(item) {
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
                    <button class="btn btn-danger btn-lg px-5 rounded-pill fw-bold btn-hyper" onclick="startPlayback('${item.id}')">
                        <i class="fas fa-play me-2"></i> ASSISTIR
                    </button>
                    <button class="btn btn-outline-light btn-lg px-4 rounded-pill action-btn" onclick="toggleFavorite('${item.id}', this)">
                        <i class="${isFavorite(item.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(document.getElementById('detailsModal')).show();
};

window.startPlayback = function(id) {
    const item = allMedia.find(m => m.id === id);
    if (!item) return;

    incrementViews(item.id, item.isOld);
    const url = item.videoUrl || item.trailerUrl;

    bootstrap.Modal.getInstance(document.getElementById('detailsModal'))?.hide();

    if (!url) {
        alert("Vídeo não disponível.");
        return;
    }

    // Get saved progress
    const history = JSON.parse(localStorage.getItem(`cinemax_history_${currentUser?.uid}`) || '[]');
    const savedItem = history.find(h => h.id === id);
    const startTime = savedItem ? (savedItem.time || 0) : 0;

    document.getElementById('playerOverlay').style.display = 'block';
    player.render(item, url, startTime);
};

window.saveProgress = function(item, currentTime, duration) {
    if (!currentUser || !item || isNaN(currentTime) || isNaN(duration) || duration === 0) return;

    const progress = Math.floor((currentTime / duration) * 100);
    // Don't save if it's less than 1% or more than 95% (assume finished)
    if (progress < 1) return;

    let history = JSON.parse(localStorage.getItem(`cinemax_history_${currentUser.uid}`) || '[]');

    // Remove if exists to re-add at the top
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

    // Keep only last 20 items
    localStorage.setItem(`cinemax_history_${currentUser.uid}`, JSON.stringify(history.slice(0, 20)));

    // Refresh UI if home section is visible
    renderContinueWatching();
};

window.closePlayer = () => {
    const overlay = document.getElementById('playerOverlay');
    overlay.style.display = 'none';
    overlay.classList.remove('mini-mode');
    overlay.style.transform = '';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    player.stop();
};

window.toggleMiniPlayer = () => {
    const overlay = document.getElementById('playerOverlay');
    const isMini = overlay.classList.toggle('mini-mode');

    if (isMini) {
        overlay.style.width = '350px';
        overlay.style.height = '200px';
        overlay.style.top = 'auto';
        overlay.style.bottom = '30px';
        overlay.style.left = 'auto';
        overlay.style.right = '30px';
        overlay.style.borderRadius = '16px';
        overlay.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8)';
        overlay.style.border = '2px solid var(--accent)';
        overlay.style.overflow = 'hidden';
        initDraggable(overlay);
    } else {
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.top = '0';
        overlay.style.bottom = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.borderRadius = '0';
        overlay.style.boxShadow = 'none';
        overlay.style.border = 'none';
        overlay.style.transform = '';
    }
};

function initDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.closest('.video-controls')) return; // Don't drag if interacting with controls
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
        el.style.bottom = 'auto';
        el.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Favoritos e Watchlist
window.isFavorite = (id) => JSON.parse(localStorage.getItem('cinemax_favorites') || '[]').includes(id);

window.toggleFavorite = (id, btn) => {
    let favs = JSON.parse(localStorage.getItem('cinemax_favorites') || '[]');
    const isFav = favs.includes(id);

    if (isFav) favs = favs.filter(f => f !== id);
    else favs.push(id);

    localStorage.setItem('cinemax_favorites', JSON.stringify(favs));
    btn.querySelector('i').classList.toggle('fas');
    btn.querySelector('i').classList.toggle('far');
    renderWatchlist();
};

function renderWatchlist() {
    const favs = JSON.parse(localStorage.getItem('cinemax_favorites') || '[]');
    const grid = document.getElementById('watchlistGrid');
    const section = document.getElementById('watchlistSection');

    if (favs.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = 'block';
    renderGrid(grid, allMedia.filter(m => favs.includes(m.id)));
}

/**
 * Motor de Busca Ultra Rápido
 */
function initSearch() {
    const input = document.getElementById('searchInput');
    const grid = document.getElementById('searchResults');
    const overlay = document.getElementById('searchOverlay');

    if (!input || !grid) return;

    document.getElementById('btnOpenSearch').onclick = () => {
        overlay.classList.add('active');
        input.focus();
    };

    document.getElementById('btnCloseSearch').onclick = () => {
        overlay.classList.remove('active');
        input.value = '';
        grid.innerHTML = '';
    };

    input.oninput = () => {
        const query = input.value.toLowerCase().trim();
        if (query.length < 2) {
            grid.innerHTML = '';
            return;
        }
        const found = allMedia.filter(m =>
            m.title.toLowerCase().includes(query) ||
            (m.tags && m.tags.toLowerCase().includes(query))
        );
        renderGrid(grid, found);
    };
}
