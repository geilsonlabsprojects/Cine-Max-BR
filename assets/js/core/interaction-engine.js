/**
 * CineMaxBR - Interaction Engine
 * Handles UX effects, custom cursor, scroll logic, and logout
 */
import { auth } from '../services/firebase-service.js';

class InteractionEngine {
    init() {
        this.initHyperUI();
        this.initCustomCursor();
        this.initLogout();
        this.initSidebar();
    }

    initSidebar() {
        const navHome = document.getElementById('navHome');
        if (navHome) {
            navHome.onclick = (e) => {
                e.preventDefault();
                if (window.filterCategory) window.filterCategory('all');

                // Active class management
                document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
                navHome.classList.add('active');
            };
        }
    }

    initHyperUI() {
        const nav = document.querySelector('.navbar-pro');
        if (nav) {
            window.addEventListener('scroll', () => {
                nav.classList.toggle('scrolled', window.scrollY > 80);
            }, { passive: true });
        }

        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth * 100).toFixed(2);
            const y = (e.clientY / window.innerHeight * 100).toFixed(2);
            document.body.style.setProperty('--mouse-x', `${x}%`);
            document.body.style.setProperty('--mouse-y', `${y}%`);
        }, { passive: true });
    }

    initCustomCursor() {
        if (window.innerWidth < 1024) return;

        const cursor = document.createElement('div');
        cursor.id = 'customCursor';
        const follower = document.createElement('div');
        follower.id = 'cursorFollower';
        document.body.appendChild(cursor);
        document.body.appendChild(follower);

        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursor.style.left = `${e.clientX - 4}px`;
                cursor.style.top = `${e.clientY - 4}px`;
                follower.style.left = `${e.clientX - 17.5}px`;
                follower.style.top = `${e.clientY - 17.5}px`;
            });
        }, { passive: true });
    }

    initLogout() {
        const avatar = document.querySelector('.avatar-circle');
        const sidebarLogout = document.querySelector('.sidebar-item[onclick*="signOut"], #sidebarLogout');

        const handleLogout = () => {
            if (confirm("Deseja sair da sua conta?")) {
                auth.signOut().then(() => window.location.href = 'login.html');
            }
        };

        if (avatar) {
            avatar.style.cursor = 'pointer';
            avatar.title = 'Clique para Sair';
            avatar.onclick = handleLogout;
        }

        if (sidebarLogout) {
            sidebarLogout.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        }
    }
}

export const interactionEngine = new InteractionEngine();
