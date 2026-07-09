/**
 * Service to interact with TMDB API.
 */

const TMDB_API_KEY = "3fd2be359042b31238e8334469796e6a"; // Note: User should provide their own in production
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";

export async function searchTMDB(query, type = 'movie') {
    const searchType = type === 'movie' ? 'movie' : 'tv';
    const url = `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("TMDB Search Error:", error);
        return [];
    }
}

export async function getTMDBDetails(id, type = 'movie') {
    const searchType = type === 'movie' ? 'movie' : 'tv';
    const url = `${TMDB_BASE_URL}/${searchType}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            title: data.title || data.name,
            originalTitle: data.original_title || data.original_name,
            year: (data.release_date || data.first_air_date || "").split("-")[0],
            desc: data.overview,
            poster: data.poster_path ? TMDB_IMAGE_BASE + data.poster_path : null,
            banner: data.backdrop_path ? TMDB_IMAGE_BASE + data.backdrop_path : null,
            genres: data.genres ? data.genres.map(g => g.name).join(", ") : ""
        };
    } catch (error) {
        console.error("TMDB Details Error:", error);
        return null;
    }
}
