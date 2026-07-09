/**
 * Main Application Entry Point.
 */
import { subscribeToMedia, subscribeToOldMovies, subscribeToFranchises } from '../services/firebase-service.js';
import { state, updateMedia, updateFranchises } from './state.js';
import { showTab } from './navigation.js';
import { initMediaForm, setMediaTypeUI, handleSaveMedia, addSeason, handleTMDBFetch } from '../components/media-form.js';
import { renderCatalog, filterList, selectAll, handleDeleteBulk } from '../components/catalog-renderer.js';
import { renderFranchises, handleSaveFranchise } from '../components/franchise-manager.js';
import { showVideoPreview, analyzeLinkType, showAnalysis } from '../utils/dom-helper.js';
import { initDashboard, updateDashboardStats } from '../components/dashboard.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    // Global toast availability
    window.showToast = showToast;
    // Initialize services
    subscribeToMedia((data, isOld) => {
        updateMedia(data, isOld);
        renderCatalog();
        renderFranchises(); // Update franchise select if needed
        updateDashboardStats();
    });

    subscribeToOldMovies((data, isOld) => {
        updateMedia(data, isOld);
        renderCatalog();
        updateDashboardStats();
    });

    subscribeToFranchises((franchises) => {
        updateFranchises(franchises);
        renderFranchises();
    });

    // Initialize components
    initMediaForm();
    initDashboard();

    // Event Delegation / Global bindings for HTML onclicks if needed
    attachGlobalListeners();
});

function attachGlobalListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(nav => {
        const tabId = nav.getAttribute('data-tab') || (nav.onclick ? nav.onclick.toString().match(/'(.*?)'/)?.[1] : null);
        if (tabId) {
            nav.onclick = (e) => showTab(tabId, e);
        }
    });

    // Media Type Toggle
    document.getElementById('typeM').onclick = () => setMediaTypeUI('movie');
    document.getElementById('typeS').onclick = () => setMediaTypeUI('series');

    // Previews & Analysis
    document.getElementById('btnPreviewTrailer').onclick = () => showVideoPreview('trailerPreview', document.getElementById('mTrailer').value);
    document.getElementById('btnPreviewVideo').onclick = () => showVideoPreview('trailerPreview', document.getElementById('mUrl').value);
    document.getElementById('btnAnalyzeLink').onclick = () => {
        const analysis = analyzeLinkType(document.getElementById('mUrl').value);
        showAnalysis('analysisResult', analysis);
    };

    // Form Submissions
    document.getElementById('btnSaveMedia').onclick = handleSaveMedia;
    document.getElementById('btnSaveFranchise').onclick = handleSaveFranchise;
    const btnAddSeason = document.getElementById('btnAddSeason');
    if (btnAddSeason) btnAddSeason.onclick = () => addSeason();
    document.getElementById('btnFetchTMDB').onclick = handleTMDBFetch;

    // Catalog search & bulk
    document.getElementById('search').onkeyup = filterList;
    document.getElementById('selectAll').onchange = (e) => selectAll(e.target.checked);
    document.getElementById('btnDeleteBulk').onclick = handleDeleteBulk;
}
