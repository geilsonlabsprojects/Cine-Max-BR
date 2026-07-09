/**
 * Dashboard enhancements and visualizations.
 */
import { state } from '../core/state.js';

let statsChart = null;

export function initDashboard() {
    renderDashboardCharts();
}

export function renderDashboardCharts() {
    const ctx = document.getElementById('statsChart');
    if (!ctx) return;

    const moviesCount = Object.values(state.allMedia).filter(m => m.type === 'movie').length;
    const seriesCount = Object.values(state.allMedia).filter(m => m.type === 'series').length;

    if (statsChart) {
        statsChart.destroy();
    }

    statsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Filmes', 'Séries'],
            datasets: [{
                data: [moviesCount, seriesCount],
                backgroundColor: ['#E50914', '#38BDF8'],
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 12 } }
                }
            },
            cutout: '70%'
        }
    });
}

export function updateDashboardStats() {
    const moviesCount = Object.values(state.allMedia).filter(m => m.type === 'movie').length;
    const seriesCount = Object.values(state.allMedia).filter(m => m.type === 'series').length;
    const totalViews = Object.values(state.allMedia).reduce((acc, item) => acc + (item.views || 0), 0);

    document.getElementById('statMovies').innerText = moviesCount;
    document.getElementById('statSeries').innerText = seriesCount;
    document.getElementById('statViews').innerText = totalViews.toLocaleString();

    renderDashboardCharts();
}
