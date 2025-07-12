/**
 * Main application logic
 */

import taskService from './task-service.js';
import { 
    navigateToEditTask, 
    getTaskIdFromUrl, 
    isViewMode, 
    formatTime,
    showConfirmation,
    escapeHtml
} from './utils.js';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Common initialization for all pages
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

// Initialize common elements across all pages
function initCommon() {
    // Set up new task button
    document.getElementById('new-task-btn')?.addEventListener('click', () => {
        navigateToEditTask();
    });
    
    // Set up cancel button (on edit page)
    document.getElementById('cancel-btn')?.addEventListener('click', () => {
        window.history.back();
    });
}

// Initialize the dashboard page
// Initialize the dashboard page
function initDashboardPage() {
    const tasks = taskService.getAllTasks();
    const totalTasks = tasks.length;
    const incompleteTasks = tasks.filter(t => t.completionPercentage < 100).length;
    const completedTasks = totalTasks - incompleteTasks;

    // Update stats cards
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('incomplete-tasks').textContent = incompleteTasks;

    // Update team stats with completion info
    const teamStatsContainer = document.getElementById('team-stats');
    const teams = ['Chassis', 'Suspension', 'Drivetrain', 'Elec'];
    
    teamStatsContainer.innerHTML = '';
    teams.forEach(team => {
        const teamTasks = taskService.getTasksByTeam(team);
        const teamCompleted = teamTasks.filter(t => t.completionPercentage >= 100).length;
        
        const statElement = document.createElement('div');
        statElement.className = 'team-stat';
        statElement.innerHTML = `
            <strong>${team}:</strong> ${teamTasks.length} tasks
            <div class="progress-bar">
                <div class="progress" style="width: ${teamTasks.length ? (teamCompleted/teamTasks.length)*100 : 0}%"></div>
            </div>
            ${teamCompleted}/${teamTasks.length} completed
        `;
        teamStatsContainer.appendChild(statElement);
    });

    const statusStatsContainer = document.getElementById('status-stats');
    
    const statusCounts = {
        'Not Started': tasks.filter(t => !t.actualStartDate).length,
        'Started': tasks.filter(t => t.actualStartDate && t.completionPercentage < 100).length,
        'Completed': tasks.filter(t => t.completionPercentage >= 100).length
    };
    
    statusStatsContainer.innerHTML = '';
    Object.entries(statusCounts).forEach(([status, count]) => {
        const statElement = document.createElement('div');
        statElement.className = 'status-stat';
        statElement.innerHTML = `
            <strong>${status}:</strong> ${count} tasks
        `;
        statusStatsContainer.appendChild(statElement);
    });

    // Add project duration calculation
    const projectDuration = taskService.calculateProjectDuration();
    const durationElement = document.getElementById('project-duration');
    durationElement.textContent = projectDuration.days;
    
    // Add tooltip with critical path
    durationElement.title = `Critical Path: ${projectDuration.criticalPath.join(' → ')}`;
    durationElement.style.cursor = 'help';
}

// Initialize the all tasks page
function initAllTasksPage() {
    const tasksTableBody = document.getElementById('tasks-table-body');
    
    // Function to render tasks
    function renderTasks(tasks) {
        tasksTableBody.innerHTML = '';
        
        tasks.forEach(task => {
            const row = document.createElement('tr');

            // Determine status
            let status = 'Not Started';
            if (task.actualStartDate) status = 'Started';
            if (task.completionPercentage >= 100) status = 'Completed';
            
            // Get prerequisite descriptions
            const prereqs = task.prerequisites?.map(prereqId => {
                const prereqTask = taskService.getTaskById(prereqId);
                return prereqTask ? prereqTask.description.substring(0, 20) + '...' : 'Deleted Task';
            }) || [];
            
            // Add completion status class
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
            
            tasksTableBody.appendChild(row);
        });
            
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                navigateToEditTask(e.target.dataset.id);
            });
        });
        
        // Add event listeners to delete buttons
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
    
    // Initial render
    renderTasks(taskService.getAllTasks());
    
    // Set up filter handlers
    document.getElementById('team-filter')?.addEventListener('change', (e) => {
        const team = e.target.value;
        const location = document.getElementById('location-filter').value;
        applyFilters(team, location);
    });
    
    document.getElementById('location-filter')?.addEventListener('change', (e) => {
        const location = e.target.value;
        const team = document.getElementById('team-filter').value;
        applyFilters(team, location);
    });
    
    // Apply filters based on team and location
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
}

// Initialize the edit task page
function initEditTaskPage() {
    const taskForm = document.getElementById('task-form');
    const taskId = getTaskIdFromUrl();
    const isView = isViewMode();

    // Initialize task as null for new tasks
    let task = null;
    
    // Load task data if editing
    if (taskId) {
        task = taskService.getTaskById(taskId);
        if (!task) {
            alert('Task not found!');
            window.location.href = 'index.html';
            return; // Exit early if task not found
        }
    }
    
    // Set up form title
    const formTitle = document.getElementById('form-title');
    formTitle.textContent = isView ? 'View Task' : (taskId ? 'Edit Task' : 'Create New Task');
    
    // Set up delete button (only for existing tasks)
    const deleteBtn = document.getElementById('delete-btn');
    if (taskId) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmation('Are you sure you want to delete this task? This action cannot be undone.');
            if (confirmed) {
                taskService.deleteTask(taskId);
                window.location.href = 'index.html';
            }
        });
    } else {
        deleteBtn.style.display = 'none';
    }
     // Prerequisite Management
    const prerequisitesContainer = document.getElementById('prerequisites-container');
    const prerequisitesSelect = document.getElementById('prerequisites-select');
    const addPrerequisiteBtn = document.getElementById('add-prerequisite-btn');

    // Function to render selected prerequisites
    function renderPrerequisites(selectedPrerequisites) {
        prerequisitesContainer.innerHTML = '';
        
        selectedPrerequisites.forEach(prereqId => {
            const prereqTask = taskService.getTaskById(prereqId);
            if (!prereqTask) return;
            
            const tag = document.createElement('div');
            tag.className = 'prerequisite-tag';
            tag.innerHTML = `
                ${prereqTask.description.substring(0, 20)}${prereqTask.description.length > 20 ? '...' : ''}
                <button type="button" class="remove-prerequisite" data-id="${prereqId}">&times;</button>
            `;
            prerequisitesContainer.appendChild(tag);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-prerequisite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prereqIdToRemove = e.target.dataset.id;
                const updatedPrerequisites = Array.from(prerequisitesContainer.querySelectorAll('.prerequisite-tag'))
                    .map(tag => tag.querySelector('button').dataset.id)
                    .filter(id => id !== prereqIdToRemove);
                renderPrerequisites(updatedPrerequisites);
                updatePrerequisiteOptions();
            });
        });
    }
    // Function to update available prerequisite options
    function updatePrerequisiteOptions() {
        const currentPrerequisites = Array.from(prerequisitesContainer.querySelectorAll('.prerequisite-tag'))
            .map(tag => tag.querySelector('button').dataset.id);
        
        // Clear and repopulate select
        prerequisitesSelect.innerHTML = '<option value="">Select a prerequisite...</option>';
        

        taskService.getAllTasks().forEach(t => {
            if (t.id !== taskId && !currentPrerequisites.includes(t.id)) {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = `${t.id.substring(5, 9)}: ${t.description.substring(0, 30)}...`;
                prerequisitesSelect.appendChild(option);
            }
        });
    }

    // Add prerequisite button handler
    addPrerequisiteBtn.addEventListener('click', () => {
        const selectedId = prerequisitesSelect.value;
        if (selectedId) {
            const currentPrerequisites = Array.from(prerequisitesContainer.querySelectorAll('.prerequisite-tag'))
                .map(tag => tag.querySelector('button').dataset.id);
            
            if (!currentPrerequisites.includes(selectedId)) {
                renderPrerequisites([...currentPrerequisites, selectedId]);
                updatePrerequisiteOptions();
                prerequisitesSelect.value = '';
            }
        }
    });

    // Initialize with existing prerequisites
    if (task && task.prerequisites) {
        renderPrerequisites(task.prerequisites);
    }
    updatePrerequisiteOptions();

    const peopleContainer = document.getElementById('people-involved-container');
    const newPersonInput = document.getElementById('new-person-input');
    const addPersonBtn = document.getElementById('add-person-btn');
    
    function renderPeopleInvolved(people) {
        const peopleContainer = document.getElementById('people-involved-container');
        peopleContainer.innerHTML = '';
        
        people.forEach(person => {
            const tag = document.createElement('div');
            tag.className = 'person-tag';
            tag.innerHTML = `
                ${person}
                <button type="button" class="remove-person" data-person="${escapeHtml(person)}">&times;</button>
            `;
            peopleContainer.appendChild(tag);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const personToRemove = e.target.getAttribute('data-person');
                const updatedPeople = Array.from(peopleContainer.querySelectorAll('.person-tag'))
                    .map(tag => tag.textContent.trim().replace('×', '').trim())
                    .filter(person => person !== personToRemove);
                renderPeopleInvolved(updatedPeople);
            });
        });
    }
    
    addPersonBtn.addEventListener('click', () => {
        const newPerson = newPersonInput.value.trim();
        if (newPerson) {
            const currentPeople = Array.from(peopleContainer.querySelectorAll('.person-tag'))
                .map(tag => tag.textContent.trim().replace('×', '').trim());
            
            if (!currentPeople.includes(newPerson)) {
                renderPeopleInvolved([...currentPeople, newPerson]);
                newPersonInput.value = '';
            }
        }
    });
    
    newPersonInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPersonBtn.click();
        }
    });
    
    // Load existing people if editing
    if (taskId && task.peopleInvolved) {
        renderPeopleInvolved(task.peopleInvolved);
    }
    
    // Load dates if they exist
    if (taskId && task.estimatedStartDate) {
        document.getElementById('estimated-start-date').value = task.estimatedStartDate.split('T')[0];
    }
    if (taskId && task.actualStartDate) {
        document.getElementById('actual-start-date').value = task.actualStartDate.split('T')[0];
    }
    

    const allTasks = taskService.getAllTasks();
    allTasks.forEach(task => {
        if (task.id !== taskId) { // Don't allow self as prerequisite
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `${task.id.substring(5, 9)}: ${task.description.substring(0, 30)}...`;
            prerequisitesSelect.appendChild(option);
        }
    });
    
    // Load task data if editing
    if (taskId) {
        const task = taskService.getTaskById(taskId);
        if (task) {
            document.getElementById('task-id').value = task.id;
            document.getElementById('description').value = task.description;
            document.getElementById('team').value = task.team;
            document.getElementById('expected-time').value = task.expectedTime;
            document.getElementById('working-location').value = task.workingLocation;
            
            // Select prerequisites
            if (task.prerequisites && task.prerequisites.length > 0) {
                task.prerequisites.forEach(prereqId => {
                    const option = Array.from(prerequisitesSelect.options).find(opt => opt.value === prereqId);
                    if (option) option.selected = true;
                });
            }
        } else {
            alert('Task not found!');
            window.location.href = 'index.html';
        }
    }
    
    // Disable form if in view mode
    if (isView) {
        Array.from(taskForm.elements).forEach(element => {
            element.disabled = true;
        });
        document.getElementById('save-btn').style.display = 'none';
        document.getElementById('cancel-btn').textContent = 'Back';
    }
    
    // Handle form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            description: document.getElementById('description').value,
            team: document.getElementById('team').value,
            expectedTime: parseFloat(document.getElementById('expected-time').value),
            completionPercentage: parseInt(document.getElementById('completion-percentage').value) || 0,
            workingLocation: document.getElementById('working-location').value,
            prerequisites: Array.from(prerequisitesContainer.querySelectorAll('.prerequisite-tag'))
                .map(tag => tag.querySelector('button').dataset.id),
            estimatedStartDate: document.getElementById('estimated-start-date').value || null,
            actualStartDate: document.getElementById('actual-start-date').value || null,
            peopleInvolved: Array.from(peopleContainer.querySelectorAll('.person-tag'))
                .map(tag => tag.textContent.trim().replace('×', '').trim())
                .filter(person => person !== '') // Ensure no empty names
        };
        
        if (taskId) {
            // Update existing task
            taskService.updateTask(taskId, formData);
        } else {
            // Create new task
            taskService.createTask(formData);
        }
        
        window.location.href = taskId ? `edit-task.html?id=${taskId}` : 'index.html';
    });
}