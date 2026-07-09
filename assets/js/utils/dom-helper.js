/**
 * UI and DOM manipulation helpers.
 */
import { normalizeUrl } from './url-helper.js';

export function updateImagePreview(containerId, url) {
    const container = document.getElementById(containerId);
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
        container.innerHTML = `<img src="${url}" class="preview-img" onerror="this.parentElement.innerHTML='<div class=\'preview-placeholder\'>Erro ao carregar imagem</div>'">`;
    } else {
        container.innerHTML = `<div class="preview-placeholder">Sem imagem</div>`;
    }
}

export function showVideoPreview(containerId, url) {
    const previewBox = document.getElementById(containerId);
    if (!url) {
        alert("Insira uma URL primeiro!");
        return;
    }

    const embedUrl = normalizeUrl(url);

    previewBox.innerHTML = `
        <div class="ratio ratio-16x9">
            <iframe src="${embedUrl}" title="Video Preview" allowfullscreen style="border-radius:14px; border: 1px solid var(--border);"></iframe>
        </div>
        <button class="btn btn-sm btn-link text-danger w-100 mt-2" id="closePreviewBtn">Fechar Preview</button>
    `;
    previewBox.style.display = 'block';
    previewBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    document.getElementById('closePreviewBtn').onclick = () => {
        previewBox.style.display = 'none';
    };
}

export function analyzeLinkType(url) {
    if (!url) return null;

    if (url.includes('google.com/drive') || url.includes('docs.google.com')) {
        return { type: "Google Drive (Recomendado)", color: "#34A853" };
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return { type: "YouTube (Limitado)", color: "#FF0000" };
    } else if (url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.m3u8')) {
        return { type: "Link Direto (Premium)", color: "#3DDC84" };
    } else {
        return { type: "Iframe/Web (Compatibilidade)", color: "#94A3B8" };
    }
}

export function showAnalysis(containerId, analysis) {
    const resBox = document.getElementById(containerId);
    if (!analysis) {
        resBox.style.display = 'none';
        return;
    }
    resBox.innerHTML = `Identificado como: <b style="color:${analysis.color}">${analysis.type}</b>`;
    resBox.style.display = 'block';
}
