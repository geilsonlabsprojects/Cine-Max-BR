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

    render(item, url, startTime = 0) {
        if (!this.mountPoint) return;

        // Clean up previous state
        this.stop();

        this.mountPoint.innerHTML = playerTemplate;
        this.currentItem = item; // Store for progress saving

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

        initControls(this.video, this.mountPoint.querySelector('#playerContainer'), item);

        // Listen for quality switch
        window.addEventListener('hlsSwitchLevel', (e) => {
            if (this.engine) this.engine.switchLevel(e.detail);
        });

        // Resume from saved time
        if (startTime > 0) {
            this.video.onloadedmetadata = () => {
                this.video.currentTime = startTime;
            };
        }

        // Load source
        this.engine.loadSource(url);
    }

    stop() {
        if (this.video && this.video._playerCleanup) {
            this.video._playerCleanup();
        }
        if (this.engine) {
            this.engine.destroy();
            this.engine = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src'); // Better than src=""
            this.video.load();
            this.video = null;
        }
        if (this.mountPoint) {
            this.mountPoint.innerHTML = "";
        }
    }
}
