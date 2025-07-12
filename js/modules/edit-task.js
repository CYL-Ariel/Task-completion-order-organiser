/**
 * Edit Task page functionality
 */
import taskService from '../services/task-service.js';
import { 
    getTaskIdFromUrl, 
    isViewMode, 
    navigateToEditTask, 
    showConfirmation,
    escapeHtml
} from '../utils.js';

export function initEditTaskPage() {
    const taskId = getTaskIdFromUrl();
    const isView = isViewMode();
    const task = taskId ? taskService.getTaskById(taskId) : null;

    if (taskId && !task) {
        alert('Task not found!');
        window.location.href = 'index.html';
        return;
    }

    setupFormTitle(taskId, isView);
    setupDeleteButton(taskId);
    setupPrerequisiteManagement(taskId, task);
    setupPeopleManagement(taskId, task);
    populateFormFields(taskId, task);
    setupFormSubmission(taskId, task);
    setupViewMode(isView);
}

function setupFormTitle(taskId, isView) {
    const formTitle = document.getElementById('form-title');
    formTitle.textContent = isView ? 'View Task' : (taskId ? 'Edit Task' : 'Create New Task');
}

function setupDeleteButton(taskId) {
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
}

function setupPrerequisiteManagement(taskId, task) {
    const prerequisitesContainer = document.getElementById('prerequisites-container');
    const prerequisitesSelect = document.getElementById('prerequisites-select');
    const addPrerequisiteBtn = document.getElementById('add-prerequisite-btn');

    if (task?.prerequisites) {
        renderPrerequisites(task.prerequisites);
    }
    updatePrerequisiteOptions();

    addPrerequisiteBtn.addEventListener('click', () => {
        const selectedId = prerequisitesSelect.value;
        if (selectedId) {
            const currentPrerequisites = getCurrentPrerequisites();
            if (!currentPrerequisites.includes(selectedId)) {
                renderPrerequisites([...currentPrerequisites, selectedId]);
                updatePrerequisiteOptions();
                prerequisitesSelect.value = '';
            }
        }
    });

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

        document.querySelectorAll('.remove-prerequisite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prereqIdToRemove = e.target.dataset.id;
                const updatedPrerequisites = getCurrentPrerequisites()
                    .filter(id => id !== prereqIdToRemove);
                renderPrerequisites(updatedPrerequisites);
                updatePrerequisiteOptions();
            });
        });
    }

    function updatePrerequisiteOptions() {
        const currentPrerequisites = getCurrentPrerequisites();
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

    function getCurrentPrerequisites() {
        return Array.from(prerequisitesContainer.querySelectorAll('.prerequisite-tag'))
            .map(tag => tag.querySelector('button').dataset.id);
    }
}

function setupPeopleManagement(taskId, task) {
    const peopleContainer = document.getElementById('people-involved-container');
    const newPersonInput = document.getElementById('new-person-input');
    const addPersonBtn = document.getElementById('add-person-btn');
    
    if (taskId && task?.peopleInvolved) {
        renderPeopleInvolved(task.peopleInvolved);
    }
    
    addPersonBtn.addEventListener('click', () => {
        const newPerson = newPersonInput.value.trim();
        if (newPerson) {
            const currentPeople = getCurrentPeople();
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

    function renderPeopleInvolved(people) {
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

        document.querySelectorAll('.remove-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const personToRemove = e.target.getAttribute('data-person');
                const updatedPeople = getCurrentPeople()
                    .filter(person => person !== personToRemove);
                renderPeopleInvolved(updatedPeople);
            });
        });
    }

    function getCurrentPeople() {
        return Array.from(peopleContainer.querySelectorAll('.person-tag'))
            .map(tag => tag.textContent.trim().replace('×', '').trim());
    }
}

function populateFormFields(taskId, task) {
    if (!taskId || !task) return;
    
    document.getElementById('task-id').value = task.id;
    document.getElementById('description').value = task.description;
    document.getElementById('team').value = task.team;
    document.getElementById('expected-time').value = task.expectedTime;
    document.getElementById('working-location').value = task.workingLocation;
    
    if (task.estimatedStartDate) {
        document.getElementById('estimated-start-date').value = task.estimatedStartDate.split('T')[0];
    }
    if (task.actualStartDate) {
        document.getElementById('actual-start-date').value = task.actualStartDate.split('T')[0];
    }
}

function setupFormSubmission(taskId, task) {
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = getFormData();
        
        if (taskId) {
            taskService.updateTask(taskId, formData);
        } else {
            taskService.createTask(formData);
        }
        
        window.location.href = taskId ? `edit-task.html?id=${taskId}` : 'index.html';
    });

    function getFormData() {
        return {
            description: document.getElementById('description').value,
            team: document.getElementById('team').value,
            expectedTime: parseFloat(document.getElementById('expected-time').value),
            completionPercentage: parseInt(document.getElementById('completion-percentage').value) || 0,
            workingLocation: document.getElementById('working-location').value,
            prerequisites: Array.from(document.getElementById('prerequisites-container').querySelectorAll('.prerequisite-tag'))
                .map(tag => tag.querySelector('button').dataset.id),
            estimatedStartDate: document.getElementById('estimated-start-date').value || null,
            actualStartDate: document.getElementById('actual-start-date').value || null,
            peopleInvolved: Array.from(document.getElementById('people-involved-container').querySelectorAll('.person-tag'))
                .map(tag => tag.textContent.trim().replace('×', '').trim())
                .filter(person => person !== '')
        };
    }
}

function setupViewMode(isView) {
    if (!isView) return;
    
    const taskForm = document.getElementById('task-form');
    Array.from(taskForm.elements).forEach(element => {
        element.disabled = true;
    });
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('cancel-btn').textContent = 'Back';
}