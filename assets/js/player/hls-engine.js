/**
 * HLS.js Engine Integration
 */
export class HLSEngine {
    constructor(videoElement) {
        this.video = videoElement;
        this.hls = null;
    }

    loadSource(url) {
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
                this.video.play().catch(e => console.log("Auto-play blocked", e));
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = url;
            this.video.addEventListener('loadedmetadata', () => {
                this.video.play().catch(e => console.log("Auto-play blocked", e));
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
