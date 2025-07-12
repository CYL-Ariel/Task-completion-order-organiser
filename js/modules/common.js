/**
 * Common functionality used across all pages
 */
import { navigateToEditTask } from '../utils.js';

export function initCommon() {
    // Set up new task button
    document.getElementById('new-task-btn')?.addEventListener('click', () => {
        navigateToEditTask();
    });
    
    // Set up cancel button (on edit page)
    document.getElementById('cancel-btn')?.addEventListener('click', () => {
        window.history.back();
    });
}