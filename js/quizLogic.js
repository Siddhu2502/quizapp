// --- QUIZ LOGIC MODULE ---
import { AppState, CONFIG } from './state.js';
import { StorageManager } from './storage.js';
import { shuffleArray } from './utils.js';
import { renderQuiz, renderReviewScreen, renderHeader, renderResults } from './renderer.js';
import { navigate } from './router.js';

/**
 * Sets up a new quiz session.
 * @param {string} topic The quiz topic.
 * @param {string} quizType 'new' or 'mixed'.
 */
export function handleQuizStart(topic, quizType = 'new') {
    const allQuestionsForTopic = AppState.allQuestions[topic];
    
    if (!allQuestionsForTopic || allQuestionsForTopic.length === 0) {
        alert(`No questions available for ${topic}. Please check the data files.`);
        navigate(`/${topic}`);
        return;
    }

    let questionPool;
    if (quizType === 'mixed') {
        questionPool = [...allQuestionsForTopic];
    } else {
        const attemptedQuestions = StorageManager.getAttemptedQuestions(topic);
        questionPool = allQuestionsForTopic.filter(q => !attemptedQuestions.hasOwnProperty(q.question));
    }
    
    if (questionPool.length === 0 && quizType === 'new') {
        alert("You've attempted all available questions for this topic! Try a Mixed Quiz or refresh content.");
        AppState.currentTopic = topic;
        navigate(`/${topic}`);
        return;
    }
    
    AppState.currentTopic = topic;

    const quizLength = Math.min(CONFIG.QUIZ_LENGTH, questionPool.length);
    const selectedQuestions = shuffleArray(questionPool).slice(0, quizLength);

    // Create a deep copy of the questions for this session to isolate it from background updates
    AppState.quizQuestions = JSON.parse(JSON.stringify(selectedQuestions));

    AppState.currentQuestionIndex = 0;
    AppState.userAnswers = [];
    AppState.quizSessionActive = true;
    AppState.lastQuizType = quizType; // For 'retake' functionality
}

export function handleOptionSelect(e, container) {
    const selectedOption = e.target.closest('.option');
    if (!selectedOption || document.querySelector('.options-container').classList.contains('answered')) {
        return;
    }

    const question = AppState.quizQuestions[AppState.currentQuestionIndex];
    const userAnswer = selectedOption.dataset.answer;
    const isCorrect = userAnswer === question.answer;

    AppState.userAnswers[AppState.currentQuestionIndex] = {
        questionText: question.question,
        answer: userAnswer,
        isCorrect: isCorrect
    };
    
    StorageManager.saveAttemptedQuestion(AppState.currentTopic, question.question, userAnswer, isCorrect);
    
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.add('disabled');
        if (opt.dataset.answer === question.answer) opt.classList.add('correct');
    });
    
    if (!isCorrect) {
        selectedOption.classList.add('incorrect');
    }

    const explanationBox = document.getElementById('explanation-box');
    explanationBox.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
    explanationBox.classList.add('visible');
    
    document.getElementById('next-btn').style.display = 'inline-flex';
    document.querySelector('.options-container').classList.add('answered');
}

export function handleNextQuestion(container) {
    AppState.currentQuestionIndex++;
    if (AppState.currentQuestionIndex < AppState.quizQuestions.length) {
        renderQuiz(container);
    } else {
        renderResults(container);
    }
    // Always re-render header to update counter or hide it on results page
    renderHeader();
}

export function handleExitQuiz() {
    if (!AppState.quizSessionActive) return;

    const confirmed = confirm('Are you sure you want to exit? Your progress in this quiz will be lost.');
    
    if (confirmed) {
        // Since progress is only saved on answer, we don't need to clean up storage.
        // Reset quiz state
        AppState.quizQuestions = [];
        AppState.currentQuestionIndex = 0;
        AppState.userAnswers = [];
        AppState.quizSessionActive = false;
        
        // Navigation is handled by the event handler
    }
}

export function startSessionReview(container) {
    AppState.reviewReturnView = 'results';
    
    AppState.reviewQuestions = AppState.quizQuestions
        .map((q, index) => ({
            question: q,
            userAnswer: AppState.userAnswers[index]?.answer || null
        }))
        .filter(item => item.userAnswer !== null);
    
    if (AppState.reviewQuestions.length === 0) {
        alert("No questions were attempted in this quiz session.");
        return;
    }
    
    AppState.currentReviewIndex = 0;
    renderReviewScreen(container);
}

export function handleReviewStart(topic) {
    AppState.reviewReturnView = 'menu';
    const allQuestionsForTopic = AppState.allQuestions[topic];
    const attemptedData = StorageManager.getAttemptedQuestions(topic);
    const attemptedTexts = Object.keys(attemptedData);

    if (attemptedTexts.length === 0) {
        return false;
    }

    const validReviewQuestions = [];
    
    for (const questionText of attemptedTexts) {
        const currentQuestion = allQuestionsForTopic.find(q => q.question === questionText);
        
        if (currentQuestion) {
            validReviewQuestions.push({
                question: currentQuestion,
                userAnswer: attemptedData[questionText].userAnswer
            });
        }
    }
    
    if (validReviewQuestions.length === 0) {
        return false;
    }
    
    AppState.reviewQuestions = validReviewQuestions;
    AppState.currentReviewIndex = 0;
    return true;
}

export function synchronizeActiveQuiz() {
    if (!AppState.quizSessionActive || !AppState.currentTopic) return;

    console.log('Syncing active quiz with updated content...');
    const newQuestionSet = new Set(AppState.allQuestions[AppState.currentTopic].map(q => q.question));
    const originalLength = AppState.quizQuestions.length;

    // Filter out questions that have been removed AND have not been seen yet
    AppState.quizQuestions = AppState.quizQuestions.filter((question, index) => {
        const isQuestionSeen = index < AppState.currentQuestionIndex;
        const questionExists = newQuestionSet.has(question.question);

        if (!questionExists && !isQuestionSeen) {
            console.log(`Silently removing unseen, deleted question: "${question.question.substring(0, 30)}..."`);
            return false;
        }
        return true;
    });

    const newLength = AppState.quizQuestions.length;
    if (originalLength !== newLength) {
        console.log(`Quiz length adjusted due to content update: ${originalLength} -> ${newLength}`);
        renderHeader(); // Re-render header to update the question count
    }
}