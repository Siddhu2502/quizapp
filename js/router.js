// --- SIMPLE CLIENT-SIDE ROUTER ---
import { renderTopicSelection, renderTopicMenu, renderQuiz, renderReviewScreen, renderResults, renderHeader } from './renderer.js';
import { AppState } from './state.js';
import { handleQuizStart, handleReviewStart } from './quizLogic.js';

const routes = {
    '/': renderTopicSelection,
    '/:topic': (container, topic) => renderTopicMenu(container, topic),
    '/:topic/quiz': (container, topic) => {
        if (!AppState.quizSessionActive) {
            handleQuizStart(topic, 'new');
        }
        renderQuiz(container);
    },
    '/:topic/mixed-quiz': (container, topic) => {
        if (!AppState.quizSessionActive) {
            handleQuizStart(topic, 'mixed');
        }
        renderQuiz(container);
    },
    '/:topic/review': (container, topic) => {
        handleReviewStart(topic, 'all');
        renderReviewScreen(container);
    },
    '/:topic/results': (container, topic) => {
        // This view is usually transitioned to from the quiz, not via URL directly
        // But we handle it just in case.
        if (AppState.userAnswers.length > 0) {
            renderResults(container);
        } else {
            // If there's no result state, go back to the menu
            navigate(`/${topic}`);
        }
    }
};

export function handleRouteChange() {
    const path = window.location.pathname;
    const appContainer = document.getElementById('app');

    if (!appContainer) return;

    // Very simple route matching
    const parts = path.split('/').filter(p => p); // e.g., ["java", "quiz"]
    let handler;
    let params = {};

    if (parts.length === 0) {
        handler = routes['/'];
    } else if (parts.length === 1) {
        handler = routes['/:topic'];
        params.topic = parts[0];
    } else if (parts.length === 2) {
        const routeKey = `/:topic/${parts[1]}`;
        if (routes[routeKey]) {
            handler = routes[routeKey];
            params.topic = parts[0];
        }
    }

    if (handler) {
        // Clear previous content before rendering new view
        appContainer.innerHTML = '';
        handler(appContainer, params.topic);
        renderHeader(); // Update breadcrumbs and counter after every view change
    } else {
        // 404 - Not Found, redirect to home
        console.warn(`No route found for ${path}. Redirecting to home.`);
        navigate('/');
    }
}

export function navigate(path) {
    // Don't push the same path multiple times
    if (window.location.pathname === path) {
        return;
    }
    window.history.pushState({}, '', path);
    handleRouteChange();
}

export function initRouter() {
    // Handle initial page load
    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();

    // Hijack link clicks
    document.addEventListener('click', (e) => {
        // Find the closest anchor tag
        const anchor = e.target.closest('a');
        if (anchor && anchor.target !== '_blank' && anchor.getAttribute('href').startsWith('/')) {
            e.preventDefault();
            navigate(anchor.getAttribute('href'));
        }
    });
}