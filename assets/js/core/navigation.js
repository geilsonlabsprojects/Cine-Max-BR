/**
 * Navigation and Tab management.
 */

export function showTab(tabId, event) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // Close sidebar on mobile if it's open (optional polish)
    if (window.innerWidth < 768) {
        // You could add logic here to toggle a 'sidebar-open' class on body
    }

    // Show selected tab
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Activate nav item
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // Fallback: find by onclick attribute if called programmatically
        const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`) ||
                        document.querySelector(`.nav-item[onclick*="'${tabId}'"]`);
        if (navItem) navItem.classList.add('active');
    }
}
