/**
 * Utility functions for URL manipulation and extraction.
 */

export function extractUrl(input) {
    if (!input) return "";
    input = input.trim();
    if (input.includes('<iframe')) {
        const match = input.match(/src="([^"]+)"/);
        return match ? match[1] : input;
    }
    return input;
}

export function getYoutubeId(url) {
    const patterns = [
        /v=([^&]+)/,
        /youtu\.be\/([^/?]+)/,
        /embed\/([^/?]+)/,
        /shorts\/([^/?]+)/,
        /live\/([^/?]+)/
    ];
    for (let p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

export function normalizeUrl(url) {
    url = extractUrl(url);
    const yid = getYoutubeId(url);
    if (yid) {
        return `https://www.youtube.com/embed/${yid}`;
    }
    if (url.includes('drive.google.com')) {
        if (url.includes('/view')) return url.replace('/view', '/preview');
        if (!url.includes('/preview') && !url.includes('/embed')) {
            return url.endsWith('/') ? url + 'preview' : url + '/preview';
        }
    }
    return url;
}
