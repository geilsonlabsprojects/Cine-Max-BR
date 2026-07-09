/**
 * Centralized state management for the Admin Portal.
 */

export const state = {
    currentType: 'movie',
    allMedia: {},
    selectedIds: new Set(),
    seasonsCount: 0,
    currentEditId: null,
    franchises: []
};

export function updateMedia(data, isOld) {
    if (isOld) {
        // Only add old movies if they don't exist in the new media node
        Object.keys(data).forEach(id => {
            if (!state.allMedia[id]) {
                state.allMedia[id] = data[id];
            }
        });
    } else {
        // Full update/merge for new media
        state.allMedia = { ...state.allMedia, ...data };
    }
}

export function updateFranchises(data) {
    state.franchises = data;
}

export function setMediaType(type) {
    state.currentType = type;
}

export function setEditId(id) {
    state.currentEditId = id;
}

export function toggleSelection(id, selected) {
    if (selected) {
        state.selectedIds.add(id);
    } else {
        state.selectedIds.delete(id);
    }
}

export function clearSelection() {
    state.selectedIds.clear();
}
