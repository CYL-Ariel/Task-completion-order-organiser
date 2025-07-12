/**
 * Main application entry point
 */
import { initCommon } from './modules/common.js';
import { initDashboardPage } from './modules/dashboard.js';
import { initAllTasksPage } from './modules/all-tasks.js';
import { initEditTaskPage } from './modules/edit-task.js';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    
    // Page-specific initialization
    if (document.getElementById('tasks-table-body')) {
        initAllTasksPage();
    } else if (document.getElementById('task-form')) {
        initEditTaskPage();
    } else {
        initDashboardPage();
    }
});