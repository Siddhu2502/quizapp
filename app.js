document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const AppState = {
        currentView: 'topics', // 'topics', 'menu', 'quiz', 'results', 'review'
        currentTopic: null,
        allQuestions: {}, // Stored by topic
        quizQuestions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        reviewQuestions: [],
        currentReviewIndex: 0,
        reviewReturnView: null,
    };

    const QUIZ_LENGTH = 25;
    const TOPICS = ['DEVOPS', 'JAVA', 'AZURE'];
    const appContainer = document.getElementById('app');

    // --- LOCAL STORAGE MANAGER (MODIFIED) ---
    const StorageManager = {
        // Now uses question text as the key
        getAttemptedQuestions(topic) {
            const data = localStorage.getItem(`quiz_${topic}_attempted`);
            return data ? JSON.parse(data) : {};
        },
        saveAttemptedQuestion(topic, questionText, userAnswer, isCorrect) {
            const attempted = this.getAttemptedQuestions(topic);
            attempted[questionText] = { userAnswer, isCorrect };
            localStorage.setItem(`quiz_${topic}_attempted`, JSON.stringify(attempted));
        }
    };

    // --- DATA FETCHING ---
    async function fetchQuizData(topic) {
        try {
            const response = await fetch(`./QUIZ_CONTENT/${topic}/quizcontent.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            AppState.allQuestions[topic] = await response.json();
            return AppState.allQuestions[topic];
        } catch (error) {
            console.error("Could not fetch quiz data:", error);
            return [];
        }
    }

    async function prefetchAllData() {
        for (const topic of TOPICS) {
            await fetchQuizData(topic);
        }
    }

    // --- UTILITY FUNCTIONS ---
    // CORRECTED FUNCTION
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            // THIS LINE WAS MISSING
            const j = Math.floor(Math.random() * (i + 1)); 
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // --- RENDERING COMPONENTS ---

    function renderTopicSelection() {
        AppState.currentView = 'topics';
        let topicItems = TOPICS.map(topic => `<div class="topic-item" data-topic="${topic}">${topic.charAt(0) + topic.slice(1).toLowerCase()}</div>`).join('');
        
        appContainer.innerHTML = `
            <div class="screen-container">
                <h1 class="screen-title">All In One Quiz</h1>
                <div class="topic-list">${topicItems}</div>
            </div>
        `;
    }

    function renderTopicMenu(topic) {
        AppState.currentView = 'menu';
        AppState.currentTopic = topic;
        const attemptedCount = Object.keys(StorageManager.getAttemptedQuestions(topic)).length;

        appContainer.innerHTML = `
            <div class="screen-container">
                <h1 class="screen-title">${topic.charAt(0) + topic.slice(1).toLowerCase()}</h1>
                <div class="topic-menu-list">
                    <div class="topic-menu-item" id="new-quiz-btn">New Quiz</div>
                    <div class="topic-menu-item" id="review-attempted-btn">Review Attempted (${attemptedCount})</div>
                    <div class="topic-menu-item" id="mixed-quiz-btn">Mixed Quiz</div>
                    <div class="topic-menu-item" id="back-to-topics-btn">Back to Topics</div>
                </div>
            </div>
        `;
    }
    
    function renderQuiz() {
        AppState.currentView = 'quiz';
        const question = AppState.quizQuestions[AppState.currentQuestionIndex];
        
        if (!question) {
            renderResults();
            return;
        }

        const optionsHTML = question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return `<div class="option" data-answer="${option}">
                        <span class="option-letter">${letter}</span>
                        <span class="option-text">${option}</span>
                    </div>`;
        }).join('');

        const codeBlockHTML = question.code ? `<div class="code-block"><pre><code>${question.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>` : '';

        appContainer.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <p class="question-counter">${AppState.currentQuestionIndex + 1} / ${AppState.quizQuestions.length}</p>
                    <h2 class="question-text">${question.question}</h2>
                    ${codeBlockHTML}
                </div>
                <div class="options-container">${optionsHTML}</div>
                
                <div id="hint-box">${question.hint || 'No hint available.'}</div>
                <div id="explanation-box"></div>
                
                <div class="quiz-footer">
                    <button class="button secondary-button" id="hint-btn">Hint &#9660;</button>
                    <button class="button" id="next-btn" style="display: none;">Next</button>
                </div>
            </div>
        `;
    }

    function renderResults() {
        AppState.currentView = 'results';
        const correctAnswers = AppState.userAnswers.filter(a => a.isCorrect).length;
        const totalAttempted = AppState.userAnswers.length;
        const wrongAnswers = totalAttempted - correctAnswers;
        const skipped = AppState.quizQuestions.length - totalAttempted;
        const accuracy = totalAttempted > 0 ? Math.round((correctAnswers / totalAttempted) * 100) : 0;
        
        appContainer.innerHTML = `
            <div class="screen-container">
                <h1 class="screen-title">You did it! Quiz Complete.</h1>
                <div class="results-summary">
                    <div class="summary-card">
                        <div class="summary-value">${correctAnswers} / ${AppState.quizQuestions.length}</div>
                        <div class="summary-label">Score</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${accuracy}%</div>
                        <div class="summary-label">Accuracy</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Right: <span class="summary-value-small">${correctAnswers}</span></div>
                        <div class="summary-label">Wrong: <span class="summary-value-small">${wrongAnswers}</span></div>
                        <div class="summary-label">Skipped: <span class="summary-value-small">${skipped}</span></div>
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

    function renderReviewScreen() {
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

        const codeBlockHTML = question.code ? `<div class="code-block"><pre><code>${question.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>` : '';

        appContainer.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <p class="question-counter">Reviewing ${AppState.currentReviewIndex + 1} / ${AppState.reviewQuestions.length}</p>
                    <h2 class="question-text">${question.question}</h2>
                    ${codeBlockHTML}
                </div>
                <div class="options-container">${optionsHTML}</div>
                <div id="explanation-box" class="force-visible visible">Explanation: ${question.explanation}</div>
                <div class="review-footer">
                    <button class="button secondary-button" id="review-back-btn">Back</button>
                    <div>
                        <button class="button secondary-button" id="review-prev-btn" ${AppState.currentReviewIndex === 0 ? 'disabled' : ''}>Previous</button>
                        <button class="button" id="review-next-btn" ${AppState.currentReviewIndex === AppState.reviewQuestions.length - 1 ? 'disabled' : ''}>Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- QUIZ LOGIC (MODIFIED) ---

    function startNewQuiz(topic, isMixed = false) {
        const allQuestionsForTopic = AppState.allQuestions[topic];
        const attemptedQuestions = StorageManager.getAttemptedQuestions(topic);
        let questionPool;

        if (isMixed) {
            questionPool = [...allQuestionsForTopic];
        } else {
            // Filter using question text instead of ID
            questionPool = allQuestionsForTopic.filter(q => !attemptedQuestions.hasOwnProperty(q.question));
        }
        
        if (questionPool.length === 0 && !isMixed) {
            alert("You've attempted all available questions for this topic!");
            return;
        }

        AppState.quizQuestions = shuffleArray(questionPool).slice(0, QUIZ_LENGTH);
        AppState.currentQuestionIndex = 0;
        AppState.userAnswers = [];
        renderQuiz();
    }
    
    function handleOptionSelect(e) {
        const selectedOption = e.target.closest('.option');
        if (!selectedOption || document.querySelector('.options-container').classList.contains('answered')) return;

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
        explanationBox.textContent = `Explanation: ${question.explanation}`;
        explanationBox.classList.add('visible');
        
        document.getElementById('next-btn').style.display = 'inline-flex';
        document.querySelector('.options-container').classList.add('answered');
    }
    
    function handleNextQuestion() {
        AppState.currentQuestionIndex++;
        renderQuiz();
    }

    // --- REVIEW LOGIC (MODIFIED) ---
    function startSessionReview() {
        AppState.reviewReturnView = 'results';
        AppState.reviewQuestions = AppState.quizQuestions.map((q, index) => ({
            question: q,
            userAnswer: AppState.userAnswers[index]?.answer || null
        }));
        AppState.currentReviewIndex = 0;
        renderReviewScreen();
    }

    function startFullReview(topic) {
        AppState.reviewReturnView = 'menu';
        const allQuestionsForTopic = AppState.allQuestions[topic];
        const attemptedData = StorageManager.getAttemptedQuestions(topic);
        const attemptedTexts = Object.keys(attemptedData);

        if (attemptedTexts.length === 0) {
            alert("You haven't attempted any questions for this topic yet.");
            return;
        }

        AppState.reviewQuestions = allQuestionsForTopic
            // Find questions whose text is in our attempted list
            .filter(q => attemptedTexts.includes(q.question))
            .map(q => ({
                question: q,
                userAnswer: attemptedData[q.question].userAnswer
            }));
        
        AppState.currentReviewIndex = 0;
        renderReviewScreen();
    }

    // --- EVENT HANDLING ---
    function attachEventListeners() {
        appContainer.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const target = e.target;

            if (target.closest('.topic-item')) renderTopicMenu(target.closest('.topic-item').dataset.topic);
            else if (targetId === 'back-to-topics-btn') renderTopicSelection();
            else if (targetId === 'back-to-menu-btn') renderTopicMenu(AppState.currentTopic);
            else if (targetId === 'new-quiz-btn') startNewQuiz(AppState.currentTopic, false);
            else if (targetId === 'mixed-quiz-btn') startNewQuiz(AppState.currentTopic, true);
            else if (targetId === 'retake-quiz-btn') startNewQuiz(AppState.currentTopic, true);
            else if (target.closest('.option')) handleOptionSelect(e);
            else if (targetId === 'next-btn') handleNextQuestion();
            else if (targetId === 'hint-btn') {
                document.getElementById('hint-box').classList.toggle('visible');
                target.innerHTML = target.innerHTML.includes('9660') ? 'Hint &#9650;' : 'Hint &#9660;';
            }
            else if (targetId === 'review-session-btn') startSessionReview();
            else if (targetId === 'review-attempted-btn') startFullReview(AppState.currentTopic);
            else if (targetId === 'review-next-btn' && AppState.currentReviewIndex < AppState.reviewQuestions.length - 1) {
                AppState.currentReviewIndex++;
                renderReviewScreen();
            } else if (targetId === 'review-prev-btn' && AppState.currentReviewIndex > 0) {
                AppState.currentReviewIndex--;
                renderReviewScreen();
            } else if (targetId === 'review-back-btn') {
                if (AppState.reviewReturnView === 'menu') renderTopicMenu(AppState.currentTopic);
                else renderResults();
            }
        });
    }

    // --- INITIALIZATION ---
    async function init() {
        await prefetchAllData();
        renderTopicSelection();
        attachEventListeners();
    }

    init();
});