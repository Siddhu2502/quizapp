// --- EVENT HANDLING MODULE ---
import { AppState } from './state.js';
import { renderReviewScreen, renderResults, renderTopicMenu } from './renderer.js';
import { navigate, handleRouteChange } from './router.js';
import { 
    handleOptionSelect, 
    handleNextQuestion, 
    handleExitQuiz,
    startSessionReview,
    handleQuizStart
} from './quizLogic.js';

export function attachEventListeners(container) {
    container.addEventListener('click', (e) => {
        const targetId = e.target.id;
        const target = e.target;
        const appContainer = document.getElementById('app');

        // --- Event Delegation ---

        // Retake quiz from results screen
        if (targetId === 'retake-quiz-btn') {
            handleQuizStart(AppState.currentTopic, AppState.lastQuizType);
            navigate(`/${AppState.currentTopic}/${AppState.lastQuizType}-quiz`);
        }
        // Exit quiz button
        else if (targetId === 'exit-quiz-btn') {
            handleExitQuiz();
            navigate(`/${AppState.currentTopic}`);
        }
        // Go back to menu from results screen
        else if (targetId === 'back-to-menu-btn') {
            navigate(`/${AppState.currentTopic}`);
        }
        // Question Interaction (options, next, hint)
        else if (target.closest('.option')) {
            handleOptionSelect(e, appContainer);
        }
        else if (targetId === 'next-btn') {
            handleNextQuestion(appContainer);
        }
        else if (targetId === 'hint-btn' || target.closest('#hint-btn')) {
            const hintBtn = target.closest('#hint-btn') || target;
            handleHintToggle(hintBtn);
        }
        // Review Actions
        else if (targetId === 'review-session-btn') {
            startSessionReview(appContainer);
        }
        else if (targetId === 'review-next-btn') {
            handleReviewNavigation(appContainer, 'next');
        }
        else if (targetId === 'review-prev-btn') {
            handleReviewNavigation(appContainer, 'prev');
        }
        else if (targetId === 'review-back-btn') {
            handleReviewBack();
        }
        // Manual content refresh
        else if (targetId === 'refresh-content-btn') {
            handleManualRefresh();
        }
    });
}

async function handleManualRefresh() {
    const confirmed = confirm('Check for new quiz content? This will refresh all questions while keeping your progress.');
    if (!confirmed) return;
    
    const refreshButton = document.getElementById('refresh-content-btn');
    const originalButtonText = refreshButton.textContent;

    refreshButton.disabled = true;
    refreshButton.textContent = '...';
    
    try {
        const { manualRefresh } = await import('./dataService.js');
        const { CONFIG } = await import('./state.js');
        
        await manualRefresh(CONFIG.TOPICS);
        
        alert('✅ Content updated! The latest questions are now available.');
        
        // Correctly re-render the current view by calling the router's handler
        handleRouteChange();

    } catch (error) {
        console.error('Manual refresh failed:', error);
        alert('❌ Failed to check for updates. Please check your internet connection.');
    } finally {
        // Restore button state
        refreshButton.disabled = false;
        refreshButton.textContent = originalButtonText;
    }
}

function handleHintToggle(button) {
    const hintBox = document.getElementById('hint-box');
    const isVisible = hintBox.classList.toggle('visible');
    
    const hintText = button.querySelector('.hint-text');
    const hintArrow = button.querySelector('.hint-arrow');
    
    if (isVisible) {
        hintText.textContent = 'Hide Hint';
        hintArrow.innerHTML = '&#9650;'; // Up arrow
    } else {
        hintText.textContent = 'Show Hint';
        hintArrow.innerHTML = '&#9660;'; // Down arrow
    }
}

function handleReviewNavigation(container, direction) {
    if (direction === 'next' && AppState.currentReviewIndex < AppState.reviewQuestions.length - 1) {
        AppState.currentReviewIndex++;
        renderReviewScreen(container);
    } else if (direction === 'prev' && AppState.currentReviewIndex > 0) {
        AppState.currentReviewIndex--;
        renderReviewScreen(container);
    }
}

function handleReviewBack() {
    if (AppState.reviewReturnView === 'menu') {
        navigate(`/${AppState.currentTopic}`);
    } else { // 'results'
        navigate(`/${AppState.currentTopic}/results`);
    }
}
