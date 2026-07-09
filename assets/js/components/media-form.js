/**
 * Logic for the Media Creation/Edition form.
 */
import { state } from '../core/state.js';
import { saveMediaItem } from '../services/firebase-service.js';
import { extractUrl } from '../utils/url-helper.js';
import { updateImagePreview, showVideoPreview, analyzeLinkType, showAnalysis, showToast } from '../utils/dom-helper.js';
import { searchTMDB, getTMDBDetails } from '../services/tmdb-service.js';

export function initMediaForm() {
    const posterInput = document.getElementById('mPoster');
    const bannerInput = document.getElementById('mBanner');

    if (posterInput) {
        posterInput.addEventListener('input', (e) => updateImagePreview('posterPreview', e.target.value));
    }
    if (bannerInput) {
        bannerInput.addEventListener('input', (e) => updateImagePreview('bannerPreview', e.target.value));
    }
}

export function setMediaTypeUI(type) {
    state.currentType = type;
    const typeM = document.getElementById('typeM');
    const typeS = document.getElementById('typeS');

    if (type === 'movie') {
        typeM?.classList.add('active');
        typeS?.classList.remove('active');
        document.getElementById('movieBox').style.display = 'block';
        document.getElementById('seriesBox').style.display = 'none';
    } else {
        typeS?.classList.add('active');
        typeM?.classList.remove('active');
        document.getElementById('movieBox').style.display = 'none';
        document.getElementById('seriesBox').style.display = 'block';
    }
}

export function addSeason(data = null) {
    state.seasonsCount++;
    const sId = `season_${state.seasonsCount}`;
    const html = `
        <div id="${sId}" class="mb-4 p-3 border border-secondary rounded season-block" style="background: rgba(255,255,255,0.02)">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="m-0 fw-bold">Temporada ${state.seasonsCount}</h5>
                <button class="btn btn-sm btn-outline-danger btn-remove-season" data-target="${sId}"><i class="fas fa-trash"></i></button>
            </div>
            <div class="episodes-root mb-2"></div>
            <button class="btn btn-sm btn-outline-info btn-add-episode" data-season="${sId}"><i class="fas fa-plus"></i> Episódio</button>
        </div>
    `;
    document.getElementById('seasonsRoot').insertAdjacentHTML('beforeend', html);

    const seasonDiv = document.getElementById(sId);
    seasonDiv.querySelector('.btn-remove-season').onclick = () => seasonDiv.remove();
    seasonDiv.querySelector('.btn-add-episode').onclick = () => addEpisode(sId);

    if (data && data.episodes) {
        data.episodes.forEach(ep => addEpisode(sId, ep));
    }
}

export function addEpisode(sId, data = null) {
    const root = document.querySelector(`#${sId} .episodes-root`);
    const eCount = root.children.length + 1;
    const epId = `ep_url_${sId}_${eCount}`;
    const html = `
        <div class="input-group mb-2">
            <span class="input-group-text bg-dark text-white border-secondary">E${eCount}</span>
            <input type="text" class="form-control-pro m-0 ep-title" placeholder="Nome do Ep" value="${data ? data.title : ''}" style="width: 25%;">
            <input type="text" class="form-control-pro m-0 ep-url" id="${epId}" placeholder="URL/Iframe" value="${data ? data.url : ''}" style="width: 45%;">
            <button class="btn btn-outline-info btn-preview-ep" data-target="${epId}"><i class="fas fa-play"></i></button>
            <button class="btn btn-outline-danger btn-remove-ep"><i class="fas fa-times"></i></button>
        </div>
    `;
    root.insertAdjacentHTML('beforeend', html);

    const lastEp = root.lastElementChild;
    lastEp.querySelector('.btn-preview-ep').onclick = () => showVideoPreview('trailerPreview', document.getElementById(epId).value);
    lastEp.querySelector('.btn-remove-ep').onclick = () => lastEp.remove();
}

export async function handleSaveMedia() {
    const title = document.getElementById('mTitle').value;
    if (!title) {
        alert("O título é obrigatório!");
        return;
    }

    const id = state.currentEditId || Date.now().toString();
    const rawTrailer = document.getElementById('mTrailer').value;
    const rawVideo = document.getElementById('mUrl')?.value || "";

    const data = {
        id,
        type: state.currentType,
        title: title,
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
        timestamp: Date.now(),
        views: state.allMedia[id]?.views || 0
    };

    if (state.currentType === 'movie') {
        const urlInput = document.getElementById('mUrl');
        if (urlInput) data.videoUrl = extractUrl(urlInput.value);
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
        await saveMediaItem(id, data);
        showToast("Mídia publicada com sucesso!", "success");
        setTimeout(() => location.reload(), 1500);
    } catch (e) {
        showToast("Erro ao salvar: " + e.message, "error");
    }
}

export async function handleTMDBFetch() {
    const title = document.getElementById('mTitle').value;
    if (!title) {
        showToast("Digite um título para buscar!", "warning");
        return;
    }

    const btn = document.getElementById('btnFetchTMDB');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> BUSCANDO...';
    btn.disabled = true;

    try {
        const results = await searchTMDB(title, state.currentType);

        if (results.length === 0) {
            showToast("Nenhum resultado encontrado no TMDB.", "warning");
            return;
        }

        // Use the first result, but with deep fetch
        const details = await getTMDBDetails(results[0].id, state.currentType);

        if (details) {
            document.getElementById('mTitle').value = details.title || "";
            document.getElementById('mOriginal').value = details.originalTitle || "";
            document.getElementById('mYear').value = details.year || "";
            document.getElementById('mDesc').value = details.desc || "";
            document.getElementById('mGenre').value = details.genres || "";
            document.getElementById('mStudio').value = details.studio || "";
            document.getElementById('mDirector').value = details.director || "";
            document.getElementById('mPoster').value = details.poster || "";
            document.getElementById('mBanner').value = details.banner || "";

            if (details.trailer) {
                document.getElementById('mTrailer').value = details.trailer;
            }

            if (details.poster) updateImagePreview('posterPreview', details.poster);
            if (details.banner) updateImagePreview('bannerPreview', details.banner);

            showToast(`"${details.title}" importado com sucesso!`, "success");
        }
    } catch (err) {
        showToast("Erro ao buscar no TMDB", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

export function fillFormForEdit(id) {
    const item = state.allMedia[id];
    if (!item) return;

    state.currentEditId = id;
    // Navigation should be handled by app.js or navigation.js

    setMediaTypeUI(item.type);

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

    updateImagePreview('posterPreview', item.poster);
    updateImagePreview('bannerPreview', item.banner);

    if (item.type === 'movie') {
        const urlInput = document.getElementById('mUrl');
        if (urlInput) urlInput.value = item.videoUrl || '';
    } else {
        document.getElementById('seasonsRoot').innerHTML = '';
        state.seasonsCount = 0;
        if (item.seasons) {
            item.seasons.forEach(s => addSeason(s));
        }
    }

    const btn = document.getElementById('btnSaveMedia');
    if (btn) {
        btn.innerText = "ATUALIZAR MÍDIA";
        btn.classList.add('btn-info');
    }

    if (!document.getElementById('cancelEdit') && btn) {
        const btnContainer = btn.parentElement;
        btnContainer.insertAdjacentHTML('beforeend', '<button id="cancelEdit" class="btn btn-link text-dim w-100 mt-2" onclick="location.reload()">Cancelar Edição</button>');
    }
}
