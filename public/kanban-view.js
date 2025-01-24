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
                let selected_cat = e.target.parentElement;
                socket.emit('completion status update', selected_cat.dataset.category, selected_task.dataset.task);

                selected_task = null;
                selected_cat=null;
                // setTimeout(() => {
                //     location.reload();
                // }, 10);
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