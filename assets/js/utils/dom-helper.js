/**
 * DOM Manipulation Helpers for Web Portal.
 */

export function createMediaCard(item, onClick) {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-2 animate-fade-in';

    col.innerHTML = `
        <div class="media-card" data-id="${item.id}">
            <img src="${item.poster}" alt="${item.title}" loading="lazy">
            <div class="media-info">
                <p class="fw-bold mb-1 text-truncate">${item.title}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-secondary extra-small" style="font-size: 0.6rem;">${item.year}</span>
                    <span class="text-accent fw-bold" style="color: #E50914; font-size: 0.8rem;">★ ${item.rating || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;

    col.querySelector('.media-card').onclick = () => onClick(item);
    return col;
}

export function renderPlayer(url, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1] || url.split('/').pop();
        container.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
    } else {
        container.innerHTML = `<iframe width="100%" height="100%" src="${url}" frameborder="0" allowfullscreen></iframe>`;
    }
}
