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

    const moviesCount = Object.values(state.allMedia).filter(m => m.type === 'movie' || !m.type).length;
    const seriesCount = Object.values(state.allMedia).filter(m => m.type === 'series').length;

    if (statsChart) {
        statsChart.destroy();
    }

    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    statsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Filmes', 'Séries'],
            datasets: [{
                data: [moviesCount, seriesCount],
                backgroundColor: [
                    'rgba(229, 9, 20, 0.8)',
                    'rgba(56, 189, 248, 0.8)'
                ],
                hoverBackgroundColor: [
                    '#E50914',
                    '#38BDF8'
                ],
                borderColor: 'rgba(255,255,255,0.05)',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 13, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false
                }
            },
            cutout: '75%'
        }
    });
}

export function updateDashboardStats() {
    const mediaList = Object.values(state.allMedia);
    const moviesCount = mediaList.filter(m => m.type === 'movie' || !m.type).length;
    const seriesCount = mediaList.filter(m => m.type === 'series').length;
    const franchiseCount = state.franchises?.length || 0;
    const totalViews = mediaList.reduce((acc, item) => acc + (parseInt(item.views) || 0), 0);

    // Animate numbers
    animateValue('statMovies', moviesCount);
    animateValue('statSeries', seriesCount);
    animateValue('statFranchises', franchiseCount);
    animateValue('statViews', totalViews);

    renderDashboardCharts();
}

function animateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    const start = parseInt(el.innerText) || 0;
    if (start === value) return;

    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart

        const current = Math.floor(start + (value - start) * ease);
        el.innerText = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}
