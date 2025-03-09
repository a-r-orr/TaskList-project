// Get current project details from projectsArray
let project = projectsArray.find(project => project.project_id === currentProj);

// Then update the DOM to include the project name and description at the top of the page
let projectName = document.getElementById("project-name");
projectName.innerHTML=project.project_name;
let tableCaption = document.getElementById("table-caption");
tableCaption.innerHTML=project.description;

// Initiate web socket
const socket = io();

// Setup drag-and-drop functionality for all tasks
let tasks = document.getElementsByClassName("task");
let categories = document.getElementsByClassName("task-category");

for (task of tasks) {
    let dragPoints = task.getElementsByClassName("task-drag");
    let dragPoint = dragPoints[0];
    dragPoint.addEventListener("dragstart", function (e) {
        let selected_task = e.target.parentElement;
        e.dataTransfer.setDragImage(selected_task, 0, 0);
        for (category of categories) {
            // Create "drag areas" in each category for the task to be dropped on
            const dragArea = createDragArea();
            category.appendChild(dragArea);
            dragArea.addEventListener("dragover", function (e) {
                e.preventDefault();
            });
            dragArea.addEventListener("dragenter", handleDragEnter);
            dragArea.addEventListener("dragleave", handleDragLeave);

            dragArea.addEventListener("drop", function (e) {
                // Detect which category the task has been dropped on
                let selected_cat = parseInt(e.target.parentElement.dataset.category);
                let cat = newCats.find(cat => cat.priority_id === selected_cat);
                // Then emit an event on the web socket to request the database be updated to reflect this change
                socket.emit('priority update', cat.priority_id, currentProj, selected_task.dataset.task);

                selected_task = null;
                selected_cat=null;
            });
        }
    });
    dragPoint.addEventListener("dragend", function (e) {
        // Remove "drag areas" from category tiles
        for (category of categories) {
            dragAreas = category.getElementsByClassName("drag-area");
            for (area of dragAreas) {
                category.removeChild(area);
            }
        }
    });

    let taskTileLabels = task.getElementsByClassName("task-tile-label");
    // Add coloured completion status labels to each task
    for (label of taskTileLabels) {
        let labelText = label.innerHTML;
        let compStat = compStatsArray.find(compStat => compStat.completion_status_name === labelText);
        label.style.backgroundColor = compStat.tile_colour;
    };

}

function createDragArea() {
    const dragArea = document.createElement("div");
    dragArea.classList.add("drag-area");
    return dragArea;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

const toggles = document.querySelectorAll(".task-toggle");

toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
        toggle.parentElement.classList.toggle("active");
    });
})

// When web socket event is received confirming update - reload the page
socket.on('priority update complete', () => {
    location.reload();
});