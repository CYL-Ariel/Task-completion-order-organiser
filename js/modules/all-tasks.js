/**
 * All Tasks page functionality
 */
import taskService from '../services/task-service.js';
import { navigateToEditTask, showConfirmation, formatTime } from '../utils.js';

export function initAllTasksPage() {
    renderTasks(taskService.getAllTasks());
    setupFilters();
}

function renderTasks(tasks) {
    const tasksTableBody = document.getElementById('tasks-table-body');
    tasksTableBody.innerHTML = '';
    
    tasks.forEach(task => {
        const row = createTaskRow(task);
        tasksTableBody.appendChild(row);
    });
    
    setupRowEventListeners();
}

function createTaskRow(task) {
    const row = document.createElement('tr');
    const status = getTaskStatus(task);
    const prereqs = getPrerequisiteDescriptions(task);
    const completionClass = task.completionPercentage >= 100 ? 'completed' : 'in-progress';
    
    row.innerHTML = `
        <td>${task.id.substring(5, 9)}</td>
        <td><a href="edit-task.html?id=${task.id}">${task.description}</a></td>
        <td>${task.team}</td>
        <td>${prereqs.join(', ') || 'None'}</td>
        <td>${formatTime(task.expectedTime)}</td>
        <td>${task.estimatedStartDate ? new Date(task.estimatedStartDate).toLocaleDateString() : '-'}</td>
        <td>${status}</td>
        <td>${task.peopleInvolved?.join(', ') || '-'}</td>
        <td class="${completionClass}">
            <div class="progress-cell">
                <span>${task.completionPercentage}%</span>
                <div class="progress-bar small">
                    <div class="progress" style="width: ${task.completionPercentage}%"></div>
                </div>
            </div>
        </td>
        <td>${task.workingLocation}</td>
        <td>
            <button class="edit-btn" data-id="${task.id}">Edit</button>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
        </td>
    `;
    
    return row;
}

function getTaskStatus(task) {
    if (task.completionPercentage >= 100) return 'Completed';
    if (task.actualStartDate) return 'Started';
    return 'Not Started';
}

function getPrerequisiteDescriptions(task) {
    return task.prerequisites?.map(prereqId => {
        const prereqTask = taskService.getTaskById(prereqId);
        return prereqTask ? prereqTask.description.substring(0, 20) + '...' : 'Deleted Task';
    }) || [];
}

function setupRowEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            navigateToEditTask(e.target.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const confirmed = await showConfirmation('Are you sure you want to delete this task?');
            if (confirmed) {
                taskService.deleteTask(e.target.dataset.id);
                renderTasks(taskService.getAllTasks());
            }
        });
    });
}

function setupFilters() {
    document.getElementById('team-filter')?.addEventListener('change', (e) => {
        applyFilters(e.target.value, document.getElementById('location-filter').value);
    });
    
    document.getElementById('location-filter')?.addEventListener('change', (e) => {
        applyFilters(document.getElementById('team-filter').value, e.target.value);
    });
}

function applyFilters(team, location) {
    let filteredTasks = taskService.getAllTasks();
    
    if (team) {
        filteredTasks = filteredTasks.filter(task => task.team === team);
    }
    
    if (location) {
        filteredTasks = filteredTasks.filter(task => task.workingLocation === location);
    }
    
    renderTasks(filteredTasks);
}