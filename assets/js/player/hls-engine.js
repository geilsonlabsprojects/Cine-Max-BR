/**
 * HLS.js Engine Integration
 */
export class HLSEngine {
    constructor(videoElement) {
        this.video = videoElement;
        this.hls = null;
    }

    loadSource(url) {
        const loadingOverlay = document.getElementById('playerLoading');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const isArchiveOrg = url.includes('archive.org');
        const isGoogleDrive = url.includes('drive.google.com') || url.includes('googleusercontent.com');
        const isDirectVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');

        if (isArchiveOrg || isGoogleDrive || isDirectVideo || !Hls.isSupported()) {
            if (isArchiveOrg) this.video.removeAttribute('crossorigin');
            else this.video.setAttribute('crossorigin', 'anonymous');
            this.video.src = url;
            this.video.load();
            this.video.play().catch(e => { if (e.name !== 'AbortError') console.error("Playback failed", e); });
            return;
        }

        if (Hls.isSupported()) {
            if (this.hls) this.hls.destroy();
            this.hls = new Hls({ startLevel: -1 });
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const levels = this.hls.levels;
                window.dispatchEvent(new CustomEvent('hlsLevels', { detail: levels }));
                this.video.play();
            });

            this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                window.dispatchEvent(new CustomEvent('hlsLevelChanged', { detail: data.level }));
            });
        }
    }

    switchLevel(index) {
        if (this.hls) {
            this.hls.currentLevel = index; // -1 for Auto
        }
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
}
