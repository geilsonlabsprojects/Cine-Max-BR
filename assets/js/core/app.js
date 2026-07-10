/**
 * CineMaxBR HYPER-PREMIUM Core Engine - Otimizado para GitHub Pages
 */
import { subscribeToMedia, subscribeToOldMovies, verifyAccessCode, incrementViews } from '../services/firebase-service.js';
import { WebPlayer } from '../player/player.js';

// Cache e Estado Global
let allMedia = [];
let allFranchises = {};
let groupedFranchises = {};
const player = new WebPlayer('videoContainer');

// Inicialização segura
document.addEventListener('DOMContentLoaded', () => {
    try {
        initAccessControl();
        initHyperUI();
        initCustomCursor();
    } catch (error) {
        console.error("Erro na inicialização básica:", error);
    }
});

/**
 * Gatekeeper de Acesso com Persistência Segura
 */
function initAccessControl() {
    const isAuthorized = localStorage.getItem('cinemax_access_granted');
    const termsAccepted = localStorage.getItem('cinemax_terms_accepted');
    const gate = document.getElementById('accessGate');

    if (isAuthorized === 'true' && termsAccepted === 'true') {
        if (gate) gate.style.display = 'none';
        startApp();
    } else {
        setupGateEvents(gate);
    }
}

function setupGateEvents(gate) {
    const codeStep = document.getElementById('codeStep');
    const termsStep = document.getElementById('termsStep');
    const btnVerify = document.getElementById('btnVerifyAccess');
    const input = document.getElementById('accessCodeInput');
    const error = document.getElementById('accessError');
    const btnAccept = document.getElementById('btnAcceptTerms');
    const checkTerms = document.getElementById('checkTerms');

    if (!btnVerify || !input) return;

    if (localStorage.getItem('cinemax_access_granted') === 'true') {
        if (codeStep) codeStep.style.display = 'none';
        if (termsStep) termsStep.style.display = 'block';
    }

    btnVerify.onclick = async () => {
        const code = input.value.trim();
        if (!code) return;

        btnVerify.disabled = true;
        btnVerify.innerText = "VERIFICANDO...";

        try {
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
                throw new Error("Código inválido");
            }
        } catch (e) {
            if (error) error.style.display = 'block';
            btnVerify.disabled = false;
            btnVerify.innerText = "ENTRAR AGORA";
            input.value = '';
            input.focus();
        }
    };

    if (checkTerms && btnAccept) {
        checkTerms.onchange = () => btnAccept.disabled = !checkTerms.checked;
        btnAccept.onclick = () => {
            localStorage.setItem('cinemax_terms_accepted', 'true');
            if (gate) gate.classList.add('animate-fade-out');
            setTimeout(() => {
                if (gate) gate.style.display = 'none';
                startApp();
            }, 500);
        };
    }

    input.onkeypress = (e) => { if (e.key === 'Enter') btnVerify.click(); };
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
            if (confirm("Deseja sair e bloquear o acesso com senha novamente?")) {
                localStorage.removeItem('cinemax_access_granted');
                localStorage.removeItem('cinemax_terms_accepted');
                window.location.reload();
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
        if (fId) {
            const fName = allFranchises[fId]?.name || fId;
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

    document.getElementById('playerOverlay').style.display = 'block';
    player.render(item, url);
};

window.closePlayer = () => {
    document.getElementById('playerOverlay').style.display = 'none';
    player.stop();
};

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
