// --- RENDERING COMPONENTS MODULE ---
import { AppState, CONFIG } from './state.js';
import { StorageManager } from './storage.js';
import { escapeHtml, formatTopicName } from './utils.js';

export function renderHeader() {
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const questionCounterContainer = document.getElementById('question-counter-container');
    if (!breadcrumbsContainer || !questionCounterContainer) return;

    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    let breadcrumbsHTML = '<a href="/">Home</a>';

    if (parts.length > 0) {
        const topic = parts[0];
        breadcrumbsHTML += ` <span class="separator">&gt;</span> <a href="/${topic}">${formatTopicName(topic)}</a>`;
        if (parts.length > 1) {
            const view = parts[1];
            breadcrumbsHTML += ` <span class="separator">&gt;</span> <span class="current">${formatTopicName(view)}</span>`;
        } else {
             breadcrumbsHTML += ` <span class="separator">&gt;</span> <span class="current">Menu</span>`;
        }
    } else {
        breadcrumbsHTML += ` <span class="separator">&gt;</span> <span class="current">Topics</span>`;
    }

    breadcrumbsContainer.innerHTML = breadcrumbsHTML;

    // Handle question counter
    if (AppState.currentView === 'quiz' && AppState.quizQuestions.length > 0) {
        questionCounterContainer.textContent = `Question: ${AppState.currentQuestionIndex + 1} / ${AppState.quizQuestions.length}`;
        questionCounterContainer.style.display = 'block';
    } else {
        questionCounterContainer.style.display = 'none';
    }
}

export function renderTopicSelection(container) {
    AppState.currentView = 'topics';
    const topicItems = CONFIG.TOPICS.map(topic => 
        `<a href="/${topic}" class="topic-item" data-topic="${topic}">${formatTopicName(topic)}</a>`
    ).join('');
    
    container.innerHTML = `
        <div class="screen-container">
            <h1 class="screen-title">All In One Quiz</h1>
            <div class="topic-list">${topicItems}</div>
        </div>
    `;
}

export function renderTopicMenu(container, topic) {
    AppState.currentView = 'menu';
    AppState.currentTopic = topic;
    const attemptedCount = Object.keys(StorageManager.getAttemptedQuestions(topic)).length;
    const totalQuestions = AppState.allQuestions[topic]?.length || 0;

    container.innerHTML = `
        <div class="screen-container">
            <h1 class="screen-title">${formatTopicName(topic)}</h1>
            <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.9rem;">
                ${totalQuestions} questions available
            </p>
            <div class="topic-menu-list">
                <a href="/${topic}/quiz" class="topic-menu-item">New Quiz</a>
                <a href="/${topic}/review" class="topic-menu-item">Review Attempted (${attemptedCount})</a>
                <a href="/${topic}/mixed-quiz" class="topic-menu-item">Mixed Quiz</a>
                <a href="/" class="topic-menu-item">Back to Topics</a>
            </div>
        </div>
    `;
}

export function renderQuiz(container) {
    AppState.currentView = 'quiz';
    const question = AppState.quizQuestions[AppState.currentQuestionIndex];
    
    if (!question) {
        renderResults(container);
        return;
    }

    const optionsHTML = question.options.map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        return `<div class="option" data-answer="${option}">
                    <span class="option-letter">${letter}</span>
                    <span class="option-text">${option}</span>
                </div>`;
    }).join('');

    const codeBlockHTML = question.code 
        ? `<div class="code-block"><pre><code>${escapeHtml(question.code)}</code></pre></div>` 
        : '';

    container.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-header">
                <div class="quiz-header-top">
                    <div class="quiz-topic-name">${formatTopicName(AppState.currentTopic)}</div>
                    <button class="button exit-button" id="exit-quiz-btn">Exit Quiz</button>
                </div>
                <h2 class="question-text">${question.question}</h2>
                ${codeBlockHTML}
            </div>
            <div class="options-container">${optionsHTML}</div>
            
            <div id="explanation-box"></div>
            
            <div class="quiz-footer">
                <button class="button secondary-button" id="hint-btn">
                    <span class="hint-text">Show Hint</span>
                    <span class="hint-arrow">&#9660;</span>
                </button>
                <button class="button" id="next-btn" style="display: none;">Next</button>
            </div>
            
            <div id="hint-box">
                <strong>💡 Hint:</strong> ${question.hint || 'No hint available.'}
            </div>
        </div>
    `;
}

export function renderResults(container) {
    AppState.currentView = 'results';
    AppState.quizSessionActive = false;
    
    const correctAnswers = AppState.userAnswers.filter(a => a.isCorrect).length;
    const totalAttempted = AppState.userAnswers.length;
    const wrongAnswers = totalAttempted - correctAnswers;
    const skipped = AppState.quizQuestions.length - totalAttempted;
    const accuracy = totalAttempted > 0 ? Math.round((correctAnswers / totalAttempted) * 100) : 0;
    
    container.innerHTML = `
        <div class="screen-container">
            <h1 class="screen-title">🎉 Quiz Complete!</h1>
            <div class="results-summary">
                <div class="summary-card">
                    <div class="summary-value">${correctAnswers} / ${AppState.quizQuestions.length}</div>
                    <div class="summary-label">Score</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${accuracy}%</div>
                    <div class="summary-label">Accuracy</div>
                </div>
                <div class="summary-card stats-card">
                    <div class="summary-label">✓ Right: <span class="summary-value-small correct-text">${correctAnswers}</span></div>
                    <div class="summary-label">✗ Wrong: <span class="summary-value-small incorrect-text">${wrongAnswers}</span></div>
                    <div class="summary-label">○ Skipped: <span class="summary-value-small">${skipped}</span></div>
                </div>
            </div>
            <div class="results-actions">
                <button class="button secondary-button" id="review-session-btn">Review Quiz</button>
                <button class="button" id="retake-quiz-btn">Retake Quiz</button>
                <button class="button secondary-button" id="back-to-menu-btn">Back to Menu</button>
            </div>
        </div>
    `;
}

export function renderReviewScreen(container) {
    AppState.currentView = 'review';
    const { question, userAnswer } = AppState.reviewQuestions[AppState.currentReviewIndex];
    
    const optionsHTML = question.options.map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        let classes = "option disabled";
        if (option === question.answer) classes += " correct";
        else if (option === userAnswer) classes += " incorrect";
        return `<div class="${classes}">
                    <span class="option-letter">${letter}</span>
                    <span class="option-text">${option}</span>
                </div>`;
    }).join('');

    const codeBlockHTML = question.code 
        ? `<div class="code-block"><pre><code>${escapeHtml(question.code)}</code></pre></div>` 
        : '';

    container.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-header">
                <p class="question-counter">Reviewing ${AppState.currentReviewIndex + 1} / ${AppState.reviewQuestions.length}</p>
                <h2 class="question-text">${question.question}</h2>
                ${codeBlockHTML}
            </div>
            <div class="options-container">${optionsHTML}</div>
            <div id="explanation-box" class="force-visible visible">
                <strong>Explanation:</strong> ${question.explanation}
            </div>
            <div class="review-footer">
                <button class="button secondary-button" id="review-back-btn">Back</button>
                <div class="review-navigation">
                    <button class="button secondary-button" id="review-prev-btn" ${AppState.currentReviewIndex === 0 ? 'disabled' : ''}>Previous</button>
                    <button class="button" id="review-next-btn" ${AppState.currentReviewIndex === AppState.reviewQuestions.length - 1 ? 'disabled' : ''}>Next</button>
                </div>
            </div>
        </div>
    `;
}
