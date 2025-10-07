// --- LOCAL STORAGE MANAGER MODULE ---
export const StorageManager = {
    // Uses question text as the key (ensures uniqueness)
    getAttemptedQuestions(topic) {
        try {
            const data = localStorage.getItem(`quiz_${topic}_attempted`);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return {};
        }
    },

    saveAttemptedQuestion(topic, questionText, userAnswer, isCorrect) {
        try {
            const attempted = this.getAttemptedQuestions(topic);
            // Store with timestamp for potential future features
            attempted[questionText] = { 
                userAnswer, 
                isCorrect,
                timestamp: Date.now()
            };
            localStorage.setItem(`quiz_${topic}_attempted`, JSON.stringify(attempted));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            // If quota exceeded, clear old data and retry
            if (error.name === 'QuotaExceededError') {
                this.clearOldAttempts(topic);
            }
        }
    },

    removeAttemptedQuestion(topic, questionText) {
        try {
            const attempted = this.getAttemptedQuestions(topic);
            delete attempted[questionText];
            localStorage.setItem(`quiz_${topic}_attempted`, JSON.stringify(attempted));
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    },

    removeMultipleAttemptedQuestions(topic, questionTexts) {
        try {
            const attempted = this.getAttemptedQuestions(topic);
            questionTexts.forEach(text => delete attempted[text]);
            localStorage.setItem(`quiz_${topic}_attempted`, JSON.stringify(attempted));
        } catch (error) {
            console.error('Failed to remove multiple from localStorage:', error);
        }
    },

    // Clear attempts older than 90 days (optional optimization)
    clearOldAttempts(topic) {
        const attempted = this.getAttemptedQuestions(topic);
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        
        Object.keys(attempted).forEach(key => {
            if (attempted[key].timestamp && attempted[key].timestamp < ninetyDaysAgo) {
                delete attempted[key];
            }
        });
        
        localStorage.setItem(`quiz_${topic}_attempted`, JSON.stringify(attempted));
    },

    // Get statistics
    getStats(topic) {
        const attempted = this.getAttemptedQuestions(topic);
        const total = Object.keys(attempted).length;
        const correct = Object.values(attempted).filter(a => a.isCorrect).length;
        
        return {
            total,
            correct,
            incorrect: total - correct,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    }
};
