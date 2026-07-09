/**
 * Franchise Management logic.
 */
import { state } from '../core/state.js';
import { saveFranchiseItem, deleteFranchiseItem } from '../services/firebase-service.js';
import { showToast } from './toast.js';

export function renderFranchises() {
    const select = document.getElementById('mFranchise');
    const list = document.getElementById('franchiseList');
    if (!select || !list) return;

    select.innerHTML = '<option value="">Sem Franquia</option>';
    list.innerHTML = '';

    state.franchises.forEach(f => {
        select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        list.innerHTML += `
            <div class="media-item" style="grid-template-columns: 1fr 80px;">
                <div class="fw-bold">${f.name}</div>
                <button class="btn btn-sm btn-outline-danger btn-delete-franchise" data-id="${f.id}"><i class="fas fa-trash"></i></button>
            </div>`;
    });

    document.getElementById('statFranchises').innerText = state.franchises.length;

    document.querySelectorAll('.btn-delete-franchise').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("Excluir Franquia?")) {
                try {
                    await deleteFranchiseItem(btn.dataset.id);
                    showToast("Franquia excluída!", "success");
                } catch (e) {
                    showToast("Erro ao excluir franquia: " + e.message, "error");
                }
            }
        };
    });
}

export async function handleSaveFranchise() {
    const nameInput = document.getElementById('fName');
    const name = nameInput.value;
    if (!name) return;

    const id = "f_" + Date.now();
    try {
        await saveFranchiseItem(id, { id, name });
        nameInput.value = '';
        showToast("Franquia criada com sucesso!", "success");
    } catch (e) {
        showToast("Erro ao salvar franquia: " + e.message, "error");
    }
}
