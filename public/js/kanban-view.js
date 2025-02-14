let project = projectsArray.find(project => project.project_id === currentProj);

let projectName = document.getElementById("project-name");
projectName.innerHTML=project.project_name;

let tableCaption = document.getElementById("table-caption");
tableCaption.innerHTML=project.description;

const socket = io();

let tasks = document.getElementsByClassName("task");
let categories = document.getElementsByClassName("task-category");

for (task of tasks) {
    let dragPoints = task.getElementsByClassName("task-drag");
    let dragPoint = dragPoints[0];
    dragPoint.addEventListener("dragstart", function (e) {
        let selected_task = e.target.parentElement;
        e.dataTransfer.setDragImage(selected_task, 0, 0);
        for (category of categories) {
            const dragArea = createDragArea();
            category.appendChild(dragArea);
            dragArea.addEventListener("dragover", function (e) {
                e.preventDefault();
            });
            dragArea.addEventListener("dragenter", handleDragEnter);
            dragArea.addEventListener("dragleave", handleDragLeave);

            dragArea.addEventListener("drop", function (e) {
                let selected_cat = parseInt(e.target.parentElement.dataset.category);
                let cat = newCats.find(cat => cat.completion_status_id === selected_cat);
                socket.emit('completion status update', cat.completion_status_id, cat.completion_status_name, currentProj, selected_task.dataset.task);

                selected_task = null;
                selected_cat=null;
            });
        }
    });
    dragPoint.addEventListener("dragend", function (e) {
        for (category of categories) {
            dragAreas = category.getElementsByClassName("drag-area");
            for (area of dragAreas) {
                category.removeChild(area);
            }
        }
    });

    let editTaskButton = task.getElementsByClassName("edit-task-button")[0];
    let closeEditTaskButton = task.getElementsByClassName("close-edit-task-button")[0];
    let editTaskPanel = task.getElementsByClassName("edit-task-panel")[0];

    editTaskButton.addEventListener("click", function (e) {
        editTaskPanel.classList.add("active");
        closeEditTaskButton.classList.add("active");
        this.classList.remove("active");
    })
    closeEditTaskButton.addEventListener("click", function (e) {
        editTaskButton.classList.add("active");
        editTaskPanel.classList.remove("active");
        this.classList.remove("active");
    })

    let taskTileLabels = task.getElementsByClassName("task-tile-label");
    for (label of taskTileLabels) {
        let labelText = label.innerHTML;
        let priority = prioritiesArray.find(priority => priority.priority_name === labelText);
        label.style.backgroundColor = priority.tile_colour;
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

socket.on('completion status update complete', () => {
    location.reload();
});