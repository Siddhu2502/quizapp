// --- EVENT HANDLING MODULE ---
import { AppState } from './state.js';
import { renderTopicSelection, renderTopicMenu, renderReviewScreen, renderResults } from './renderer.js';
import { 
    startNewQuiz, 
    handleOptionSelect, 
    handleNextQuestion, 
    handleExitQuiz,
    startSessionReview,
    startFullReview 
} from './quizLogic.js';

export function attachEventListeners(container) {
    container.addEventListener('click', (e) => {
        const targetId = e.target.id;
        const target = e.target;

        // Topic Selection
        if (target.closest('.topic-item')) {
            renderTopicMenu(container, target.closest('.topic-item').dataset.topic);
        }
        // Navigation
        else if (targetId === 'back-to-topics-btn') {
            renderTopicSelection(container);
        }
        else if (targetId === 'back-to-menu-btn') {
            renderTopicMenu(container, AppState.currentTopic);
        }
        // Quiz Actions
        else if (targetId === 'new-quiz-btn') {
            startNewQuiz(container, AppState.currentTopic, false);
        }
        else if (targetId === 'mixed-quiz-btn') {
            startNewQuiz(container, AppState.currentTopic, true);
        }
        else if (targetId === 'retake-quiz-btn') {
            startNewQuiz(container, AppState.currentTopic, true);
        }
        else if (targetId === 'exit-quiz-btn') {
            handleExitQuiz(container, renderTopicMenu);
        }
        // Question Interaction
        else if (target.closest('.option')) {
            handleOptionSelect(e, container);
        }
        else if (targetId === 'next-btn') {
            handleNextQuestion(container);
        }
        else if (targetId === 'hint-btn' || target.closest('#hint-btn')) {
            const hintBtn = target.closest('#hint-btn') || target;
            handleHintToggle(hintBtn);
        }
        // Review Actions
        else if (targetId === 'review-session-btn') {
            startSessionReview(container);
        }
        else if (targetId === 'review-attempted-btn') {
            startFullReview(container, AppState.currentTopic);
        }
        else if (targetId === 'review-next-btn') {
            handleReviewNavigation(container, 'next');
        }
        else if (targetId === 'review-prev-btn') {
            handleReviewNavigation(container, 'prev');
        }
        else if (targetId === 'review-back-btn') {
            handleReviewBack(container);
        }
    });
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

function handleReviewBack(container) {
    if (AppState.reviewReturnView === 'menu') {
        renderTopicMenu(container, AppState.currentTopic);
    } else {
        renderResults(container);
    }
}
