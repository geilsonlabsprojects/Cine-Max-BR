/**
 * Global Toast Notification System
 */

export function showToast(message, type = 'success') {
    const toastEl = document.getElementById('appToast');
    const msgEl = document.getElementById('toastMessage');

    if (!toastEl || !msgEl) {
        console.error("Toast elements not found in DOM");
        return;
    }

    msgEl.innerText = message;

    // Reset classes
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');

    // Set type color
    switch(type) {
        case 'error':
        case 'danger':
            toastEl.classList.add('bg-danger');
            break;
        case 'warning':
            toastEl.classList.add('bg-warning');
            break;
        case 'info':
            toastEl.classList.add('bg-info');
            break;
        default:
            toastEl.classList.add('bg-success');
    }

    // Initialize and show via Bootstrap
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();
}

// Global helper for consistent error messages
export function showError(message) {
    showToast(message, 'error');
}
