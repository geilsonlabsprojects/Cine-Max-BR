/**
 * Main Player Class (Modular) - CineMaxBR Ultra Evolution
 */
import { playerTemplate } from './ui-templates.js';
import { HLSEngine } from './hls-engine.js';
import { initControls } from './controls.js';

export class WebPlayer {
    constructor(mountPointId) {
        this.mountPoint = document.getElementById(mountPointId);
        this.engine = null;
        this.video = null;
    }

    render(item, url) {
        if (!this.mountPoint) return;

        // Clean up previous state
        this.stop();

        this.mountPoint.innerHTML = playerTemplate;

        // Add title info if available
        const titleContainer = document.createElement('div');
        titleContainer.className = 'player-info-overlay';
        titleContainer.innerHTML = `
            <div class="fw-bold fs-4">${item?.title || 'Conteúdo'}</div>
            <div class="text-white-50 small">${item?.year || ''} • ${item?.type === 'series' ? 'Série' : 'Filme'}</div>
        `;
        this.mountPoint.querySelector('#playerContainer').prepend(titleContainer);

        this.video = this.mountPoint.querySelector('#mainVideo');
        this.engine = new HLSEngine(this.video);

        initControls(this.video, this.mountPoint.querySelector('#playerContainer'));

        // Load source
        this.engine.loadSource(url);
    }

    stop() {
        if (this.engine) {
            this.engine.destroy();
            this.engine = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.src = "";
            this.video.load();
            this.video = null;
        }
        if (this.mountPoint) {
            this.mountPoint.innerHTML = "";
        }
    }
}
