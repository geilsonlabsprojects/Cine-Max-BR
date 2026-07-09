/**
 * Library (Catalog) rendering and management.
 */
import { state, toggleSelection, clearSelection } from '../core/state.js';
import { deleteMediaItem } from '../services/firebase-service.js';
import { fillFormForEdit } from './media-form.js';
import { showTab } from '../core/navigation.js';
import { showToast } from '../utils/dom-helper.js';

let itemsPerPage = 20;
let currentPage = 1;

export function renderCatalog() {
    const list = document.getElementById('mediaList');
    if (!list) return;

    if (currentPage === 1) list.innerHTML = '';

    const sortedMedia = Object.values(state.allMedia).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const query = document.getElementById('search')?.value.toLowerCase() || '';
    const filteredMedia = sortedMedia.filter(item => item.title.toLowerCase().includes(query));

    const paginatedMedia = filteredMedia.slice(0, itemsPerPage * currentPage);

    paginatedMedia.forEach(item => {
        // Skip if already in list (for infinite scroll)
        if (list.querySelector(`[data-id="${item.id}"]`)) return;

        const badgeClass = item.type === 'movie' ? 'badge-movie' : 'badge-series';
        const featuredBadge = item.featured ? '<span class="badge bg-warning text-dark ms-2" style="font-size: 8px;">DESTAQUE</span>' : '';

        const itemHtml = `
            <div class="media-item animate-fade-in" data-title="${item.title.toLowerCase()}" data-id="${item.id}">
                <div class="d-flex align-items-center gap-3">
                    <input type="checkbox" data-id="${item.id}" ${state.selectedIds.has(item.id) ? 'checked' : ''} class="form-check-input">
                    <img src="${item.poster || ''}" class="poster-mini" loading="lazy">
                </div>
                <div>
                    <div class="fw-bold text-truncate" style="max-width: 300px;">${item.title} ${featuredBadge}</div>
                    <div class="small text-dim text-truncate" style="max-width: 300px;">${item.genre || ''}</div>
                </div>
                <div class="badge-type ${badgeClass}">${item.type.toUpperCase()} ${item.type === 'series' ? `(${item.seasons?.length || 0} Temp)` : ''}</div>
                <div class="text-dim text-center">${item.year || 'N/A'}</div>
                <div class="text-dim text-center"><i class="fas fa-eye me-1"></i>${item.views || 0}</div>
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-info btn-edit" data-id="${item.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${item.id}" data-old="${item.isOld || false}" title="Excluir"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', itemHtml);
    });

    if (currentPage === 1) initInfiniteScroll();

    attachCatalogListeners();
    updateBulkBar();
}

function initInfiniteScroll() {
    window.onscroll = () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            const totalItems = Object.keys(state.allMedia).length;
            if (itemsPerPage * currentPage < totalItems) {
                currentPage++;
                renderCatalog();
            }
        }
    };
}

function attachCatalogListeners() {
    document.querySelectorAll('#mediaList input[type="checkbox"]').forEach(cb => {
        cb.onchange = (e) => {
            toggleSelection(cb.dataset.id, e.target.checked);
            updateBulkBar();
        };
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.onclick = () => {
            fillFormForEdit(btn.dataset.id);
            showTab('add-media');
        };
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("Deseja realmente excluir este conteúdo?")) {
                try {
                    await deleteMediaItem(btn.dataset.id, btn.dataset.old === 'true');
                    showToast("Mídia excluída com sucesso!", "success");
                } catch (e) {
                    showToast("Erro ao excluir: " + e.message, "error");
                }
            }
        };
    });
}

export function updateBulkBar() {
    const bulkBar = document.getElementById('bulkBar');
    const bulkCount = document.getElementById('bulkCount');
    if (!bulkBar || !bulkCount) return;

    bulkBar.classList.toggle('active', state.selectedIds.size > 0);
    bulkCount.innerText = `${state.selectedIds.size} selecionados`;
}

export async function handleDeleteBulk() {
    if (confirm(`Excluir ${state.selectedIds.size} itens selecionados?`)) {
        try {
            for (let id of state.selectedIds) {
                const item = state.allMedia[id];
                await deleteMediaItem(id, item?.isOld);
            }
            clearSelection();
            showToast("Itens excluídos com sucesso!", "success");
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            showToast("Erro na exclusão em massa: " + e.message, "error");
        }
    }
}

export function filterList() {
    currentPage = 1;
    renderCatalog();
}

export function selectAll(checked) {
    document.querySelectorAll('#mediaList input[type="checkbox"]').forEach(cb => {
        cb.checked = checked;
        toggleSelection(cb.dataset.id, checked);
    });
    updateBulkBar();
}
