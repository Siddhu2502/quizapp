// --- DATA FETCHING MODULE ---
import { AppState } from './state.js';

// Retry logic for slow/unstable networks
async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                cache: 'force-cache' // Use browser cache when available
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

export async function fetchQuizData(topic) {
    // Check if already loaded in memory
    if (AppState.allQuestions[topic] && AppState.allQuestions[topic].length > 0) {
        return AppState.allQuestions[topic];
    }

    try {
        const response = await fetchWithRetry(`./QUIZ_CONTENT/${topic}/quizcontent.json`);
        AppState.allQuestions[topic] = await response.json();
        
        // Validate data
        if (!Array.isArray(AppState.allQuestions[topic]) || AppState.allQuestions[topic].length === 0) {
            throw new Error('Invalid or empty quiz data');
        }
        
        return AppState.allQuestions[topic];
    } catch (error) {
        console.error(`Could not fetch quiz data for ${topic}:`, error);
        return [];
    }
}

export async function prefetchAllData(topics) {
    const promises = topics.map(topic => fetchQuizData(topic));
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
