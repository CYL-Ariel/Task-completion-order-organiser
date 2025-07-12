/**
 * Dashboard page functionality
 */
import taskService from '../services/task-service.js';

export function initDashboardPage() {
    const tasks = taskService.getAllTasks();
    const totalTasks = tasks.length;
    const incompleteTasks = tasks.filter(t => t.completionPercentage < 100).length;
    const completedTasks = totalTasks - incompleteTasks;

    // Update stats cards
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('incomplete-tasks').textContent = incompleteTasks;

    // Update team stats with completion info
    updateTeamStats(tasks);
    updateStatusStats(tasks);
    updateProjectDuration();
}

function updateTeamStats(tasks) {
    const teamStatsContainer = document.getElementById('team-stats');
    const teams = ['Chassis', 'Suspension', 'Drivetrain', 'Elec'];
    
    teamStatsContainer.innerHTML = '';
    teams.forEach(team => {
        const teamTasks = tasks.filter(t => t.team === team);
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
}

function updateStatusStats(tasks) {
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
}

function updateProjectDuration() {
    const projectDuration = taskService.calculateProjectDuration();
    const durationElement = document.getElementById('project-duration');
    durationElement.textContent = projectDuration.days;
    durationElement.title = `Critical Path: ${projectDuration.criticalPath.join(' → ')}`;
    durationElement.style.cursor = 'help';
}