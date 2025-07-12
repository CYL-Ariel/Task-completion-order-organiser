/**
 * Utility functions for the project management app
 */

// Generate a unique ID
function generateId() {
    return 'task-' + Math.random().toString(36).substr(2, 9);
}

// Format time in hours to readable format
function formatTime(days) {
    if (days < 1) {
        const hours = Math.round(days * 8); // Assuming 8-hour work days
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (days % 1 === 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
        const wholeDays = Math.floor(days);
        const hours = Math.round((days % 1) * 8);
        return `${wholeDays}d ${hours}h`;
    }
}

// Parse time from string to hours
function parseTime(timeString) {
    if (!timeString) return 0;
    
    // Handle decimal hours (e.g., "2.5")
    if (!isNaN(timeString)) return parseFloat(timeString);
    
    // Handle "Xh Ym" format
    const hoursMatch = timeString.match(/(\d+)h/);
    const minsMatch = timeString.match(/(\d+)m/);
    
    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const mins = minsMatch ? parseFloat(minsMatch[1]) : 0;
    
    return hours + (mins / 60);
}

// Navigate to edit task page
function navigateToEditTask(taskId = null) {
    const url = taskId ? `edit-task.html?id=${taskId}` : 'edit-task.html';
    window.location.href = url;
}

// Navigate to view task page
function navigateToViewTask(taskId) {
    window.location.href = `edit-task.html?view=true&id=${taskId}`;
}

// Get task ID from URL parameters
function getTaskIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Check if we're in view mode from URL parameters
function isViewMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'true';
}

// Show confirmation dialog
async function showConfirmation(message) {
    return new Promise((resolve) => {
        const confirmed = confirm(message);
        resolve(confirmed);
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function calculateDaysBetweenDates(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((new Date(endDate) - new Date(startDate)) / oneDay));
}

// Export utility functions
export {
    generateId,
    formatTime,
    parseTime,
    navigateToEditTask,
    navigateToViewTask,
    getTaskIdFromUrl,
    isViewMode,
    showConfirmation,
    escapeHtml,
    calculateDaysBetweenDates
};