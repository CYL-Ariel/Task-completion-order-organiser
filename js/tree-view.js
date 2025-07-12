/**
 * Module for visualizing task trees
 */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import taskService from './task-service.js';
import { formatTime } from './utils.js';

class TreeView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = 600;
        this.margin = { top: 20, right: 90, bottom: 30, left: 90 };
    }

    // Initialize the tree view
    init() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create SVG container
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Set up zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                this.svg.attr('transform', event.transform);
            });
        
        d3.select('svg').call(this.zoom);
    }

    // Update the tree with new data
    update(rootTaskId) {
        if (!rootTaskId) {
            this.container.innerHTML = '<p>Select a task to view its dependency tree.</p>';
            return;
        }
        
        this.init();
        
        // Build the tree data structure
        const treeData = taskService.buildTaskTree(rootTaskId);
        if (!treeData) {
            this.container.innerHTML = '<p>No task found with the selected ID.</p>';
            return;
        }
        
        // Create a hierarchy
        const root = d3.hierarchy(treeData, d => d.children);
        
        // Tree layout// Tree layout with tighter spacing
        const treeLayout = d3.tree()
            .size([this.height - 100, this.width - 200])
            .nodeSize([50, 100]); // Reduced vertical and horizontal spacing
        treeLayout(root);
        
        // Draw links
        this.svg.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y));
        
        // Create node groups
        const node = this.svg.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        // Add circles to nodes
        node.append('circle')
            .attr('r', 10)
            .attr('fill', d => {
                if (d.data.task.completionPercentage >= 100) return '#2ecc71';
                return this.getNodeColor(d);
            })
            .attr('stroke', d => d.data.task.completionPercentage >= 100 ? '#27ae60' : '#fff');
        
        // Add text labels
        node.append('text')
            .attr('dy', '.31em')
            .attr('x', d => d.children ? -13 : 13)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.task.description.substring(0, 20) + (d.data.task.description.length > 20 ? '...' : ''))
            .append('title')
            .text(d => `${d.data.task.description}\nTeam: ${d.data.task.team}\nTime: ${formatTime(d.data.task.expectedTime)}`);
        
        // Add click handler to nodes
        node.on('click', (event, d) => {
            window.location.href = `edit-task.html?id=${d.data.task.id}`;
        });
    }

    // Get node color based on team
    getNodeColor(d) {
        const teamColors = {
            'Chassis': '#3498db',
            'Suspension': '#2ecc71',
            'Drivetrain': '#e74c3c',
            'Elec': '#9b59b6'
        };
        return teamColors[d.data.task.team] || '#95a5a6';
    }

    showAllUnconnectedTasks() {
    this.container.innerHTML = '';
    this.init();
    
    const rootTasks = taskService.getRootTasks();
    const svg = this.svg;
    const margin = this.margin;
    const width = this.width - margin.left - margin.right;
    
    // Calculate positions for each root tree
    const trees = rootTasks.map((task, i) => {
        const treeData = taskService.buildTaskTree(task.id);
        return {
            tree: d3.hierarchy(treeData, d => d.children),
            xOffset: (width / rootTasks.length) * i
        };
    });

    // Draw all trees
    trees.forEach(({tree, xOffset}) => {
        const treeLayout = d3.tree()
            .size([this.height - 100, (width / rootTasks.length) - 50])
            .nodeSize([50, 100]);
        
        treeLayout(tree);

        // Draw links
        svg.selectAll(`.link-${tree.data.task.id}`)
            .data(tree.links())
            .enter()
            .append('path')
            .attr('class', `link link-${tree.data.task.id}`)
            .attr('d', d3.linkVertical()
                .x(d => d.x + xOffset)
                .y(d => d.y));

        // Draw nodes
        const node = svg.selectAll(`.node-${tree.data.task.id}`)
            .data(tree.descendants())
            .enter()
            .append('g')
            .attr('class', `node node-${tree.data.task.id}`)
            .attr('transform', d => `translate(${d.x + xOffset},${d.y})`);

        node.append('circle')
            .attr('r', 10)
            .attr('fill', this.getNodeColor);

        node.append('text')
            .attr('dy', '.31em')
            .attr('x', d => d.children ? -13 : 13)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.task.description.substring(0, 15) + (d.data.task.description.length > 15 ? '...' : ''))
            .append('title')
            .text(d => `${d.data.task.description}\nTeam: ${d.data.task.team}\nTime: ${formatTime(d.data.task.expectedTime)}`);

        node.on('click', (event, d) => {
            window.location.href = `edit-task.html?id=${d.data.task.id}`;
        });
    });
}
}

// Initialize tree view when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tree-container')) {
        const treeView = new TreeView('tree-container');
        
        // Populate root task selector
        const rootTaskSelect = document.getElementById('root-task-select');
        const tasks = taskService.getAllTasks();
        
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `${task.id.substring(5, 9)}: ${task.description.substring(0, 20)}...`;
            rootTaskSelect.appendChild(option);
        });
        
        // Handle root task selection
        rootTaskSelect.addEventListener('change', (e) => {
            if (e.target.value === 'all-unconnected') {
                treeView.showAllUnconnectedTasks();
            } else {
                treeView.update(e.target.value);
            }
        });
        
        // Add "Show All Unconnected" option
        const allOption = document.createElement('option');
        allOption.value = 'all-unconnected';
        allOption.textContent = 'Show All Unconnected Tasks';
        rootTaskSelect.appendChild(allOption);
        
        // Handle show full tree button
        document.getElementById('show-full-tree')?.addEventListener('click', () => {
            treeView.showAllUnconnectedTasks();
            rootTaskSelect.value = 'all-unconnected';
        });
    }
});

// Export TreeView class if needed
export { TreeView };