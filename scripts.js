// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC8uVpbtW7gs73ydp2u2eJAVGIXK3dwHr8",
    projectId: "cine-max-br",
    databaseURL: "https://cine-max-br-default-rtdb.firebaseio.com",
    storageBucket: "cine-max-br.firebasestorage.app",
    appId: "1:388609107323:android:5233689d7da7b54b0d49de"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentType = 'movie';
let allMedia = {};
let selected = new Set();
let seasonsCount = 0;
let currentEditId = null;

// --- Tab Management ---
function showTab(id, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (el) el.classList.add('active');

    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
        // Option to hide/collapse if needed
    }
}

function setMediaType(t, btn) {
    currentType = t;
    document.querySelectorAll('#add-media .btn-dark').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('movieBox').style.display = t === 'movie' ? 'block' : 'none';
    document.getElementById('seriesBox').style.display = t === 'series' ? 'block' : 'none';
}

// --- Live Preview ---
function setupPreviews() {
    const posterInput = document.getElementById('mPoster');
    const bannerInput = document.getElementById('mBanner');

    posterInput.addEventListener('input', (e) => updatePreview('posterPreview', e.target.value));
    bannerInput.addEventListener('input', (e) => updatePreview('bannerPreview', e.target.value));
}

function updatePreview(containerId, url) {
    const container = document.getElementById(containerId);
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
        container.innerHTML = `<img src="${url}" class="preview-img" onerror="this.parentElement.innerHTML='<div class=\'preview-placeholder\'>Erro ao carregar imagem</div>'">`;
    } else {
        container.innerHTML = `<div class="preview-placeholder">Sem imagem</div>`;
    }
}

// --- Season & Episode Logic ---
function addSeason(data = null) {
    seasonsCount++;
    const sId = `season_${seasonsCount}`;
    const html = `
        <div id="${sId}" class="mb-4 p-3 border border-secondary rounded season-block" style="background: rgba(255,255,255,0.02)">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="m-0 fw-bold">Temporada ${seasonsCount}</h5>
                <button class="btn btn-sm btn-outline-danger" onclick="removeElement('${sId}')"><i class="fas fa-trash"></i></button>
            </div>
            <div class="episodes-root mb-2"></div>
            <button class="btn btn-sm btn-outline-info" onclick="addEpisode('${sId}')"><i class="fas fa-plus"></i> Episódio</button>
        </div>
    `;
    document.getElementById('seasonsRoot').insertAdjacentHTML('beforeend', html);

    if (data && data.episodes) {
        data.episodes.forEach(ep => addEpisode(sId, ep));
    }
}

function addEpisode(sId, data = null) {
    const root = document.querySelector(`#${sId} .episodes-root`);
    const eCount = root.children.length + 1;
    const html = `
        <div class="input-group mb-2">
            <span class="input-group-text bg-dark text-white border-secondary">E${eCount}</span>
            <input type="text" class="form-control-pro m-0 ep-title" placeholder="Nome do Ep" value="${data ? data.title : ''}" style="width: 25%;">
            <input type="text" class="form-control-pro m-0 ep-url" id="ep_url_${sId}_${eCount}" placeholder="URL/Iframe" value="${data ? data.url : ''}" style="width: 45%;">
            <button class="btn btn-outline-info" onclick="previewVideo('ep_url_${sId}_${eCount}')"><i class="fas fa-play"></i></button>
            <button class="btn btn-outline-danger" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        </div>
    `;
    root.insertAdjacentHTML('beforeend', html);
}

function removeElement(id) { document.getElementById(id).remove(); }

// --- URL Utilities ---
function extractUrl(input) {
    if (!input) return "";
    input = input.trim();
    if (input.includes('<iframe')) {
        const match = input.match(/src="([^"]+)"/);
        return match ? match[1] : input;
    }
    return input;
}

function getYoutubeId(url) {
    const patterns = [
        /v=([^&]+)/,
        /youtu\.be\/([^/?]+)/,
        /embed\/([^/?]+)/,
        /shorts\/([^/?]+)/,
        /live\/([^/?]+)/
    ];
    for (let p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function normalizeUrl(url) {
    url = extractUrl(url);
    const yid = getYoutubeId(url);
    if (yid) {
        return `https://www.youtube.com/embed/${yid}`;
    }
    if (url.includes('drive.google.com')) {
        if (url.includes('/view')) return url.replace('/view', '/preview');
        if (!url.includes('/preview') && !url.includes('/embed')) {
            return url.endsWith('/') ? url + 'preview' : url + '/preview';
        }
    }
    return url;
}

// --- Preview Actions ---
function previewVideo(inputId) {
    let url = document.getElementById(inputId).value;
    const previewBox = document.getElementById('trailerPreview');
    if (!url) { alert("Insira uma URL primeiro!"); return; }

    const embedUrl = normalizeUrl(url);

    previewBox.innerHTML = `
        <div class="ratio ratio-16x9">
            <iframe src="${embedUrl}" title="Video Preview" allowfullscreen style="border-radius:14px; border: 1px solid var(--border);"></iframe>
        </div>
        <button class="btn btn-sm btn-link text-danger w-100 mt-2" onclick="document.getElementById('trailerPreview').style.display='none'">Fechar Preview</button>
    `;
    previewBox.style.display = 'block';
    previewBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function previewTrailer() {
    previewVideo('mTrailer');
}

function analyzeLink(inputId) {
    const url = document.getElementById(inputId).value;
    const resBox = document.getElementById('analysisResult');
    if (!url) return;

    let type = "Desconhecido";
    let color = "white";

    if (url.includes('google.com/drive') || url.includes('docs.google.com')) {
        type = "Google Drive (Recomendado)";
        color = "#34A853";
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        type = "YouTube (Limitado)";
        color = "#FF0000";
    } else if (url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.m3u8')) {
        type = "Link Direto (Premium)";
        color = "#3DDC84";
    } else {
        type = "Iframe/Web (Compatibilidade)";
        color = "#94A3B8";
    }

    resBox.innerHTML = `Identificado como: <b style="color:${color}">${type}</b>`;
    resBox.style.display = 'block';
}

// --- Data Operations ---
async function saveMedia() {
    const title = document.getElementById('mTitle').value;
    if (!title) { alert("O título é obrigatório!"); return; }

    const id = currentEditId || Date.now().toString();
    const rawTrailer = document.getElementById('mTrailer').value;
    const rawVideo = document.getElementById('mUrl').value;

    const data = {
        id, type: currentType, title: title,
        originalTitle: document.getElementById('mOriginal').value,
        year: parseInt(document.getElementById('mYear').value) || 0,
        genre: document.getElementById('mGenre').value,
        rating: document.getElementById('mRating').value,
        duration: document.getElementById('mDuration').value,
        trailerUrl: extractUrl(rawTrailer),
        desc: document.getElementById('mDesc').value,
        studio: document.getElementById('mStudio').value,
        distributor: document.getElementById('mDistributor').value,
        director: document.getElementById('mDirector').value,
        franchiseId: document.getElementById('mFranchise').value,
        poster: document.getElementById('mPoster').value,
        banner: document.getElementById('mBanner').value,
        featured: document.getElementById('mFeatured').checked,
        timestamp: Date.now(), views: allMedia[id]?.views || 0
    };

    if(currentType === 'movie') {
        data.videoUrl = extractUrl(rawVideo);
    } else {
        const seasons = [];
        document.querySelectorAll('#seasonsRoot > div').forEach((sDiv, sIdx) => {
            const episodes = [];
            sDiv.querySelectorAll('.episodes-root > div').forEach((eDiv, eIdx) => {
                episodes.push({
                    number: eIdx + 1,
                    title: eDiv.querySelector('.ep-title').value,
                    url: eDiv.querySelector('.ep-url').value
                });
            });
            seasons.push({ number: sIdx + 1, episodes });
        });
        data.seasons = seasons;
    }

    try {
        await db.ref('media/' + id).set(data);
        alert("Sucesso: Mídia publicada!");
        location.reload();
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
}

function saveFranchise() {
    const name = document.getElementById('fName').value;
    if(!name) return;
    const id = "f_" + Date.now();
    db.ref('franchises/' + id).set({ id, name });
    document.getElementById('fName').value = '';
}

function deleteMedia(id, old) {
    if(confirm("Deseja realmente excluir este conteúdo?")) {
        db.ref((old ? 'movies/' : 'media/') + id).remove();
    }
}

function deleteFranchise(id) {
    if(confirm("Excluir Franquia?")) db.ref('franchises/' + id).remove();
}

// --- Bulk Management ---
function toggleSelect(id, c) {
    if(c) selected.add(id); else selected.delete(id);
    updateBulkBar();
}

function selectAll(c) {
    const checkboxes = document.querySelectorAll('#mediaList input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = c;
        const id = cb.getAttribute('data-id');
        if(c) selected.add(id); else selected.delete(id);
    });
    updateBulkBar();
}

function updateBulkBar() {
    document.getElementById('bulkBar').classList.toggle('active', selected.size > 0);
    document.getElementById('bulkCount').innerText = `${selected.size} selecionados`;
}

async function deleteBulk() {
    if(confirm(`Excluir ${selected.size} itens selecionados?`)) {
        for(let id of selected) {
            const item = allMedia[id];
            await db.ref((item.isOld ? 'movies/' : 'media/') + id).remove();
        }
        selected.clear();
        location.reload();
    }
}

// --- Catalog Rendering ---
function renderCatalog() {
    const list = document.getElementById('mediaList');
    list.innerHTML = '';
    let m=0, s=0, v=0;

    Object.values(allMedia).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).forEach(item => {
        if(item.type === 'movie') m++; else s++;
        v += (item.views || 0);

        const badgeClass = item.type === 'movie' ? 'badge-movie' : 'badge-series';
        const featuredBadge = item.featured ? '<span class="badge bg-warning text-dark ms-2" style="font-size: 8px;">DESTAQUE</span>' : '';
        list.innerHTML += `
            <div class="media-item" data-title="${item.title.toLowerCase()}">
                <input type="checkbox" data-id="${item.id}" onchange="toggleSelect('${item.id}', this.checked)">
                <img src="${item.poster || ''}" class="poster-mini" loading="lazy">
                <div>
                    <div class="fw-bold text-truncate" style="max-width: 300px;">${item.title} ${featuredBadge}</div>
                    <div class="small text-dim text-truncate" style="max-width: 300px;">${item.genre || ''}</div>
                </div>
                <div class="badge-type ${badgeClass}">${item.type.toUpperCase()} ${item.type === 'series' ? `(${item.seasons?.length || 0} Temp)` : ''}</div>
                <div class="text-dim text-center">${item.year || 'N/A'}</div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-info" onclick="editMedia('${item.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMedia('${item.id}', ${item.isOld})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    document.getElementById('statMovies').innerText = m;
    document.getElementById('statSeries').innerText = s;
    document.getElementById('statViews').innerText = v.toLocaleString();
}

function filterList() {
    const query = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('#mediaList .media-item').forEach(el => {
        const title = el.getAttribute('data-title');
        el.style.display = title.includes(query) ? 'grid' : 'none';
    });
}

function editMedia(id) {
    const item = allMedia[id];
    if (!item) return;

    currentEditId = id;
    showTab('add-media', document.querySelector('[onclick*="add-media"]'));

    // Set type
    setMediaType(item.type, item.type === 'movie' ? document.getElementById('typeM') : document.getElementById('typeS'));

    // Fill fields
    document.getElementById('mTitle').value = item.title || '';
    document.getElementById('mOriginal').value = item.originalTitle || '';
    document.getElementById('mYear').value = item.year || '';
    document.getElementById('mGenre').value = item.genre || '';
    document.getElementById('mRating').value = item.rating || 'L';
    document.getElementById('mDuration').value = item.duration || '';
    document.getElementById('mTrailer').value = item.trailerUrl || '';
    document.getElementById('mDesc').value = item.desc || '';
    document.getElementById('mStudio').value = item.studio || '';
    document.getElementById('mDistributor').value = item.distributor || '';
    document.getElementById('mDirector').value = item.director || '';
    document.getElementById('mFranchise').value = item.franchiseId || '';
    document.getElementById('mPoster').value = item.poster || '';
    document.getElementById('mBanner').value = item.banner || '';
    document.getElementById('mFeatured').checked = item.featured || false;

    // Update previews
    updatePreview('posterPreview', item.poster);
    updatePreview('bannerPreview', item.banner);

    if (item.type === 'movie') {
        document.getElementById('mUrl').value = item.videoUrl || '';
    } else {
        document.getElementById('seasonsRoot').innerHTML = '';
        seasonsCount = 0;
        if (item.seasons) {
            item.seasons.forEach(s => addSeason(s));
        }
    }

    const btn = document.querySelector('.btn-premium');
    btn.innerText = "ATUALIZAR MÍDIA";
    btn.classList.add('btn-info');

    // Add cancel button if not exists
    if (!document.getElementById('cancelEdit')) {
        btn.insertAdjacentHTML('afterend', '<button id="cancelEdit" class="btn btn-link text-dim w-100 mt-2" onclick="location.reload()">Cancelar Edição</button>');
    }
}

// --- Initialization ---
function init() {
    // Load Franchises
    db.ref('franchises').on('value', snap => {
        const select = document.getElementById('mFranchise');
        const list = document.getElementById('franchiseList');
        select.innerHTML = '<option value="">Sem Franquia</option>';
        list.innerHTML = '';
        let fCount = 0;
        snap.forEach(child => {
            fCount++;
            const f = child.val();
            select.innerHTML += `<option value="${child.key}">${f.name}</option>`;
            list.innerHTML += `
                <div class="media-item" style="grid-template-columns: 1fr 80px;">
                    <div class="fw-bold">${f.name}</div>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFranchise('${child.key}')"><i class="fas fa-trash"></i></button>
                </div>`;
        });
        document.getElementById('statFranchises').innerText = fCount;
    });

    // Load All Media
    db.ref('media').on('value', snap => {
        allMedia = {};
        snap.forEach(child => { allMedia[child.key] = { ...child.val(), id: child.key }; });
        renderCatalog();
    });

    // Backwards compatibility
    db.ref('movies').on('value', snap => {
        snap.forEach(child => {
            if(!allMedia[child.key]) allMedia[child.key] = { ...child.val(), id: child.key, isOld: true };
        });
        renderCatalog();
    });

    setupPreviews();
}

init();
