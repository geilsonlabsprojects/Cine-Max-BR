/**
 * CineMaxBR - Authentication Module
 */
import {
    googleLogin, checkUserAuthorization, linkAccount, auth
} from '../services/firebase-service.js';

/**
 * Initialize Login Page Logic
 */
export function initLogin() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const isAuthorized = await checkUserAuthorization(user.uid);
            const termsAccepted = localStorage.getItem(`cinemax_terms_${user.uid}`);

            if (isAuthorized && termsAccepted === 'true') {
                window.location.href = 'index.html';
            } else if (!isAuthorized) {
                showStep('codeStep');
                setupLoginEvents(user);
            } else {
                showStep('termsStep');
                setupLoginEvents(user);
            }
        } else {
            showStep('loginStep');
            setupLoginEvents(null);
        }
    });
}

/**
 * Simple authentication check for protected pages
 */
export function checkAuth() {
    return new Promise((resolve) => {
        // Timeout para não travar a tela em branco/loading se o Firebase demorar
        const timeout = setTimeout(() => {
            console.warn("Auth check timed out, redirecting to login...");
            window.location.href = 'login.html';
        }, 8000);

        auth.onAuthStateChanged(async (user) => {
            clearTimeout(timeout);
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            try {
                const isAuthorized = await checkUserAuthorization(user.uid);
                const termsAccepted = localStorage.getItem(`cinemax_terms_${user.uid}`);

                if (!isAuthorized || termsAccepted !== 'true') {
                    window.location.href = 'login.html';
                    return;
                }

                resolve(user);
            } catch (err) {
                console.error("Authorization check failed:", err);
                window.location.href = 'login.html';
            }
        });
    });
}

function showStep(stepId) {
    ['loginStep', 'codeStep', 'termsStep'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === stepId) ? 'block' : 'none';
    });
}

function setupLoginEvents(user) {
    const btnGoogle = document.getElementById('btnGoogleLogin');
    const btnVerify = document.getElementById('btnVerifyAccess');
    const btnAccept = document.getElementById('btnAcceptTerms');
    const input = document.getElementById('accessCodeInput');
    const checkTerms = document.getElementById('checkTerms');
    const error = document.getElementById('accessError');

    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            try {
                await googleLogin();
            } catch (e) {
                console.error("Login failed", e);
                alert("Falha no login com Google.");
            }
        };
    }

    if (btnVerify && input) {
        btnVerify.onclick = async () => {
            const code = input.value.trim();
            if (!code || !user) return;

            btnVerify.disabled = true;
            btnVerify.innerText = "VERIFICANDO...";

            try {
                const linked = await linkAccount(user.uid, code);
                if (linked) {
                    showStep('termsStep');
                } else {
                    throw new Error("Código inválido");
                }
            } catch (e) {
                if (error) error.style.display = 'block';
                btnVerify.disabled = false;
                btnVerify.innerText = "VINCULAR CONTA";
                input.value = '';
            }
        };
        input.onkeypress = (e) => { if (e.key === 'Enter') btnVerify.click(); };
    }

    if (checkTerms && btnAccept) {
        checkTerms.onchange = (e) => {
            btnAccept.disabled = !e.target.checked;
        };

        btnAccept.onclick = () => {
            if (user) {
                localStorage.setItem(`cinemax_terms_${user.uid}`, 'true');
                window.location.href = 'index.html';
            }
        };
    }
}
