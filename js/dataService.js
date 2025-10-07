// --- DATA FETCHING MODULE ---
import { AppState } from './state.js';
import { StorageManager } from './storage.js';
import { synchronizeActiveQuiz } from './quizLogic.js';

const CHECK_INTERVAL = 5 * 60 * 1000; // Check for updates every 5 minutes
let updateCheckTimer = null;

// Retry logic for slow/unstable networks
async function fetchWithRetry(url, retries = 3, delay = 1000, bypassCache = false) {
    for (let i = 0; i < retries; i++) {
        try {
            const cacheMode = bypassCache ? 'no-cache' : 'default';
            const response = await fetch(url, {
                cache: cacheMode,
                headers: bypassCache ? {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                } : {}
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function fetchQuizData(topic, forceRefresh = false) {
    // Check if already loaded in memory and not forcing refresh
    if (!forceRefresh && AppState.allQuestions[topic] && AppState.allQuestions[topic].length > 0) {
        return AppState.allQuestions[topic];
    }

    try {
        const response = await fetchWithRetry(
            `./QUIZ_CONTENT/${topic}/quizcontent.json`,
            3,
            1000,
            forceRefresh
        );
        const newData = await response.json();
        
        // Validate data
        if (!Array.isArray(newData) || newData.length === 0) {
            throw new Error('Invalid or empty quiz data');
        }
        
        // Check if content changed
        const oldData = AppState.allQuestions[topic];
        if (oldData && oldData.length !== newData.length) {
            console.log(`📦 ${topic}: Content updated (${oldData.length} → ${newData.length} questions)`);
        }
        
        // Clean up invalid progress for deleted questions
        if (oldData) {
            cleanupDeletedQuestions(topic, oldData, newData);
        }
        
        AppState.allQuestions[topic] = newData;
        return AppState.allQuestions[topic];
    } catch (error) {
        console.error(`Could not fetch quiz data for ${topic}:`, error);
        return [];
    }
}

// Remove progress for questions that no longer exist
function cleanupDeletedQuestions(topic, oldData, newData) {
    const newQuestionTexts = new Set(newData.map(q => q.question));
    const attemptedQuestions = StorageManager.getAttemptedQuestions(topic);
    const attemptedTexts = Object.keys(attemptedQuestions);
    
    const deletedQuestions = attemptedTexts.filter(text => !newQuestionTexts.has(text));
    
    if (deletedQuestions.length > 0) {
        console.log(`🧹 Cleaning up ${deletedQuestions.length} deleted questions from ${topic}`);
        StorageManager.removeMultipleAttemptedQuestions(topic, deletedQuestions);
    }
}

export async function prefetchAllData(topics, forceRefresh = false) {
    const promises = topics.map(topic => fetchQuizData(topic, forceRefresh));
    const results = await Promise.allSettled(promises);
    
    // Log any failed fetches
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Failed to load ${topics[index]}:`, result.reason);
        }
    });
    
    // Check if at least one topic loaded successfully
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    if (successCount === 0) {
        throw new Error('Failed to load any quiz data. Please check your internet connection.');
    }
}

// Background update check (silent, doesn't interrupt user)
export async function checkForUpdatesInBackground(topics) {
    try {
        console.log('🔄 Checking for content updates...');
        await prefetchAllData(topics, true);

        // If a quiz is active, synchronize its questions with the new data
        if (AppState.quizSessionActive) {
            synchronizeActiveQuiz();
        }
    } catch (error) {
        // Silent fail - normal if offline or no network
        if (error.message) {
            console.log('Background update check failed (normal if offline)');
        }
    }
}

// Start automatic background updates
export function startAutoUpdateCheck(topics) {
    // Initial check after 10 seconds (give user time to start)
    setTimeout(() => {
        checkForUpdatesInBackground(topics);
    }, 10000);
    
    // Then check every 5 minutes
    if (updateCheckTimer) {
        clearInterval(updateCheckTimer);
    }
    
    updateCheckTimer = setInterval(() => {
        checkForUpdatesInBackground(topics);
    }, CHECK_INTERVAL);
}

// Stop automatic updates (cleanup)
export function stopAutoUpdateCheck() {
    if (updateCheckTimer) {
        clearInterval(updateCheckTimer);
        updateCheckTimer = null;
    }
}

// Manual refresh (for "Check for Updates" button)
export async function manualRefresh(topics) {
    console.log('🔄 Manual refresh requested...');
    await prefetchAllData(topics, true);
    
    // Clear service worker cache
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter(name => name.includes('runtime'))
                .map(name => caches.delete(name))
        );
    }
    
    return true;
}
