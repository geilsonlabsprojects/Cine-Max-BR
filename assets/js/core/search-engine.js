/**
 * CineMaxBR - Search Engine
 * Handles the high-speed search overlay and filtering
 */
import { dataEngine } from './data-engine.js';
import { uiEngine } from './ui-engine.js';

class SearchEngine {
    init() {
        const input = document.getElementById('searchInput');
        const grid = document.getElementById('searchResults');
        const overlay = document.getElementById('searchOverlay');
        const btnOpen = document.getElementById('btnOpenSearch');
        const btnClose = document.getElementById('btnCloseSearch');

        if (!input || !grid || !overlay || !btnOpen) return;

        btnOpen.onclick = () => {
            overlay.classList.add('active');
            input.focus();
        };

        if (btnClose) {
            btnClose.onclick = () => {
                overlay.classList.remove('active');
                input.value = '';
                grid.innerHTML = '';
            };
        }

        input.oninput = () => {
            const query = input.value.toLowerCase().trim();
            if (query.length < 2) {
                grid.innerHTML = '<div class="col-12 text-center text-white-50 py-5">Digite pelo menos 2 caracteres...</div>';
                return;
            }
            const found = dataEngine.allMedia.filter(m =>
                m.title.toLowerCase().includes(query) ||
                (m.tags && m.tags.toLowerCase().includes(query)) ||
                (m.genre && m.genre.toLowerCase().includes(query))
            );

            if (found.length === 0) {
                grid.innerHTML = '<div class="col-12 text-center text-white-50 py-5">Nenhum resultado encontrado para "' + query + '"</div>';
            } else {
                uiEngine.renderGrid(grid, found);
            }
        };

        window.closeSearch = () => {
            overlay.classList.remove('active');
            input.value = '';
            grid.innerHTML = '';
        };
    }
}

export const searchEngine = new SearchEngine();
