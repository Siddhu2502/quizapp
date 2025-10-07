// --- MAIN APPLICATION MODULE ---
import { CONFIG } from './state.js';
import { prefetchAllData } from './dataService.js';
import { renderTopicSelection } from './renderer.js';
import { attachEventListeners } from './eventHandlers.js';

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// --- INITIALIZATION ---
async function init() {
    const appContainer = document.getElementById('app');
    
    if (!appContainer) {
        console.error('App container not found!');
        return;
    }

    // Show loading state
    appContainer.innerHTML = `
        <div class="screen-container">
            <h1 class="screen-title">Loading Quiz...</h1>
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 1rem; color: var(--text-muted);">
                    ${navigator.onLine ? 'Fetching quiz data...' : 'Loading offline content...'}
                </p>
            </div>
        </div>
    `;

    try {
        await prefetchAllData(CONFIG.TOPICS);
        renderTopicSelection(appContainer);
        attachEventListeners(appContainer);
        
        // Start background update checks
        const { startAutoUpdateCheck } = await import('./dataService.js');
        startAutoUpdateCheck(CONFIG.TOPICS);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        const isOffline = !navigator.onLine;
        appContainer.innerHTML = `
            <div class="screen-container">
                <h1 class="screen-title">Error Loading Quiz</h1>
                <p style="text-align: center; color: var(--incorrect-color);">
                    ${isOffline 
                        ? 'You appear to be offline and no cached data is available.' 
                        : 'Failed to load quiz data. Please check your internet connection.'}
                </p>
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="button" onclick="location.reload()">Retry</button>
                </div>
            </div>
        `;
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Handle online/offline events
window.addEventListener('online', () => {
    console.log('Connection restored');
    // Show a subtle notification if needed
});

window.addEventListener('offline', () => {
    console.log('Connection lost - using cached data');
});
