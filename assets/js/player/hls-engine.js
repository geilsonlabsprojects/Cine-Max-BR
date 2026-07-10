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

        if (Hls.isSupported()) {
            if (this.hls) this.hls.destroy();

            this.hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                startLevel: -1 // Auto
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const playPromise = this.video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') {
                            console.log("Auto-play blocked", e);
                        }
                    });
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = url;
            this.video.addEventListener('loadedmetadata', () => {
                const playPromise = this.video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') {
                            console.log("Auto-play blocked", e);
                        }
                    });
                }
            });
        }
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
}
