import { CONFIG, AppState } from './state.js';
import { prefetchAllData } from './dataService.js';
import { initRouter } from './router.js';
import { attachEventListeners } from './eventHandlers.js';

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
                
                // Check for updates immediately
                registration.update();
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is installed but waiting
                            console.log('New version available!');
                            
                            // ✅ SAFE: Only reload if NOT in active quiz
                            if (!AppState.quizSessionActive) {
                                console.log('Reloading to apply update...');
                                window.location.reload();
                            } else {
                                console.log('Update pending - will reload after quiz ends');
                                // Store update flag
                                sessionStorage.setItem('updatePending', 'true');
                            }
                        }
                    });
                });
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

    // Check if there's a pending update from previous session
    if (sessionStorage.getItem('updatePending') === 'true') {
        sessionStorage.removeItem('updatePending');
        console.log('Applying pending update...');
        window.location.reload();
        return;
    }

    // ...existing code...
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
        attachEventListeners(document.body);
        await prefetchAllData(CONFIG.TOPICS);
        initRouter();
        
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

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost - using cached data');
});