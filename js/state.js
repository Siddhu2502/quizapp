// --- STATE MANAGEMENT MODULE ---
export const AppState = {
    currentView: 'topics', // 'topics', 'menu', 'quiz', 'results', 'review'
    currentTopic: null,
    allQuestions: {}, // Stored by topic
    quizQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    reviewQuestions: [],
    currentReviewIndex: 0,
    reviewReturnView: null,
    quizSessionActive: false, // Track if quiz is in progress
    lastQuizType: 'new', // 'new' or 'mixed', for retake logic
};

export const CONFIG = {
    QUIZ_LENGTH: 20,
    TOPICS: ['DEVOPS', 'JAVA', 'GENAI', 'PYTHON', 'MYSQL', 'SOFTWARE_FUNDAMENTALS', 'WEBDEV'],
};
