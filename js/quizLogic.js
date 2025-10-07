// --- QUIZ LOGIC MODULE ---
import { AppState, CONFIG } from './state.js';
import { StorageManager } from './storage.js';
import { shuffleArray } from './utils.js';
import { renderQuiz, renderReviewScreen } from './renderer.js';

export function startNewQuiz(container, topic, isMixed = false) {
    const allQuestionsForTopic = AppState.allQuestions[topic];
    
    if (!allQuestionsForTopic || allQuestionsForTopic.length === 0) {
        alert(`No questions available for ${topic}. Please check the data files.`);
        return;
    }

    const attemptedQuestions = StorageManager.getAttemptedQuestions(topic);
    let questionPool;

    if (isMixed) {
        questionPool = [...allQuestionsForTopic];
    } else {
        // Filter using question text instead of ID
        questionPool = allQuestionsForTopic.filter(q => !attemptedQuestions.hasOwnProperty(q.question));
    }
    
    if (questionPool.length === 0 && !isMixed) {
        alert("You've attempted all available questions for this topic! Try Mixed Quiz.");
        return;
    }

    const quizLength = Math.min(CONFIG.QUIZ_LENGTH, questionPool.length);
    AppState.quizQuestions = shuffleArray(questionPool).slice(0, quizLength);
    AppState.currentQuestionIndex = 0;
    AppState.userAnswers = [];
    AppState.quizSessionActive = true;
    renderQuiz(container);
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
    
    // Save using question text instead of ID
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
    renderQuiz(container);
}

export function handleExitQuiz(container, renderMenuCallback) {
    if (!AppState.quizSessionActive) return;

    const confirmed = confirm('Are you sure you want to exit? Your progress in this quiz will be lost and answered questions will not be saved.');
    
    if (confirmed) {
        // Remove all answered questions from this session from localStorage
        const answeredQuestions = AppState.userAnswers
            .filter(answer => answer !== undefined)
            .map(answer => answer.questionText);
        
        if (answeredQuestions.length > 0) {
            StorageManager.removeMultipleAttemptedQuestions(AppState.currentTopic, answeredQuestions);
        }
        
        // Reset quiz state
        AppState.quizQuestions = [];
        AppState.currentQuestionIndex = 0;
        AppState.userAnswers = [];
        AppState.quizSessionActive = false;
        
        // Return to topic menu
        renderMenuCallback(container, AppState.currentTopic);
    }
}

export function startSessionReview(container) {
    AppState.reviewReturnView = 'results';
    
    // Only include questions that were actually attempted
    AppState.reviewQuestions = AppState.quizQuestions
        .map((q, index) => ({
            question: q,
            userAnswer: AppState.userAnswers[index]?.answer || null
        }))
        .filter(item => item.userAnswer !== null); // Only show attempted questions
    
    if (AppState.reviewQuestions.length === 0) {
        alert("No questions were attempted in this quiz session.");
        return;
    }
    
    AppState.currentReviewIndex = 0;
    renderReviewScreen(container);
}

export function startFullReview(container, topic) {
    AppState.reviewReturnView = 'menu';
    const allQuestionsForTopic = AppState.allQuestions[topic];
    const attemptedData = StorageManager.getAttemptedQuestions(topic);
    const attemptedTexts = Object.keys(attemptedData);

    if (attemptedTexts.length === 0) {
        alert("You haven't attempted any questions for this topic yet.");
        return;
    }

    AppState.reviewQuestions = allQuestionsForTopic
        .filter(q => attemptedTexts.includes(q.question))
        .map(q => ({
            question: q,
            userAnswer: attemptedData[q.question].userAnswer
        }));
    
    AppState.currentReviewIndex = 0;
    renderReviewScreen(container);
}
