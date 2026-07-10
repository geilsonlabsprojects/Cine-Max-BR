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
                grid.innerHTML = '';
                return;
            }
            const found = dataEngine.allMedia.filter(m =>
                m.title.toLowerCase().includes(query) ||
                (m.tags && m.tags.toLowerCase().includes(query))
            );
            uiEngine.renderGrid(grid, found);
        };
    }
}

export const searchEngine = new SearchEngine();
