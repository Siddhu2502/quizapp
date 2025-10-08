// --- UTILITY FUNCTIONS MODULE ---

export function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function formatTopicName(topic) {
    if (!topic) return 'Unknown';
    // Improved formatting for multi-word topics like "devops_devsecops"
    return topic.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function renderInlineCode(text) {
    if (!text) return '';
    // Convert newlines to <br>, then backticks to <code> tags
    return escapeHtml(text)
        .replace(/\\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}
