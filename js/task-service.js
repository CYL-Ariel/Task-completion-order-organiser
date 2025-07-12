/**
 * Service for handling task data operations
 */

import { generateId } from './utils.js';

// File path for tasks data
const TASKS_FILE = 'data/tasks.json';

class TaskService {
    constructor() {
        this.tasks = this.loadTasks();
    }

    // Load tasks from JSON file
    // loadTasks() {
    //     try {
    //         // In a real local app, we might use localStorage or IndexedDB
    //         // For this demo, we'll simulate file operations
    //         const tasksJson = localStorage.getItem(TASKS_FILE) || '[]';
    //         return JSON.parse(tasksJson);
    //     } catch (error) {
    //         console.error('Error loading tasks:', error);
    //         return [];
    //     }
    // }
    // Modify the loadTasks method in task-service.js
    loadTasks() {
        try {
            let tasks = JSON.parse(localStorage.getItem(TASKS_FILE)) || [];
            
            // Initialize with sample data if empty
            if (tasks.length === 0) {
                tasks = [
                    {
                        id: this.generateId(),
                        description: "Design chassis frame",
                        team: "Chassis",
                        prerequisites: [],
                        expectedTime: 40,
                        workingLocation: "On site",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: this.generateId(),
                        description: "Develop suspension geometry",
                        team: "Suspension",
                        prerequisites: [],
                        expectedTime: 30,
                        workingLocation: "Any",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ];
                localStorage.setItem(TASKS_FILE, JSON.stringify(tasks));
            }
            
            return tasks;
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    // Save tasks to JSON file
    saveTasks() {
        try {
            localStorage.setItem(TASKS_FILE, JSON.stringify(this.tasks, null, 2));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    // Get all tasks
    getAllTasks() {
        return [...this.tasks];
    }

    // Get a task by ID
    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }

    // Create a new task
    createTask(taskData) {
        const newTask = {
            id: generateId(),
            ...taskData,
            expectedTime: taskData.expectedTime, // now in days
            completionPercentage: taskData.completionPercentage || 0, // new field
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }

    // Update an existing task
    updateTask(id, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return null;
        }
        
        const updatedTask = {
            ...this.tasks[taskIndex],
            ...taskData,
            updatedAt: new Date().toISOString()
        };
        
        this.tasks[taskIndex] = updatedTask;
        this.saveTasks();
        return updatedTask;
    }

    // Delete a task
    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return false;
        }
        
        // Remove this task from other tasks' prerequisites
        this.tasks.forEach(task => {
            if (task.prerequisites && task.prerequisites.includes(id)) {
                task.prerequisites = task.prerequisites.filter(prereqId => prereqId !== id);
            }
        });
        
        this.tasks.splice(taskIndex, 1);
        this.saveTasks();
        return true;
    }

    // Get tasks by team
    getTasksByTeam(team) {
        return this.tasks.filter(task => task.team === team);
    }

    // Get tasks that have no prerequisites (root tasks)
    getRootTasks() {
        return this.tasks.filter(task => 
            !task.prerequisites || task.prerequisites.length === 0
        );
    }

    // Get tasks that depend on a specific task
    getDependentTasks(taskId) {
        return this.tasks.filter(task => 
            task.prerequisites && task.prerequisites.includes(taskId)
        );
    }

    // Build a task tree starting from a specific task
    buildTaskTree(rootTaskId, maxDepth = 5, currentDepth = 0) {
        if (currentDepth >= maxDepth) return null;
        
        const rootTask = this.getTaskById(rootTaskId);
        if (!rootTask) return null;
        
        const treeNode = {
            task: rootTask,
            children: []
        };
        
        if (rootTask.prerequisites && rootTask.prerequisites.length > 0) {
            rootTask.prerequisites.forEach(prereqId => {
                const childTree = this.buildTaskTree(prereqId, maxDepth, currentDepth + 1);
                if (childTree) {
                    treeNode.children.push(childTree);
                }
            });
        }
        
        return treeNode;
    }

    // Get recent tasks (sorted by creation date)
    getRecentTasks(limit = 5) {
        return [...this.tasks]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
}

// Create a singleton instance
const taskService = new TaskService();

// Export the service instance
export default taskService;