// Get current project details from projectsArray
let project = projectsArray.find(project => project.project_id === currentProj);

// Then update the DOM to include the project name and description at the top of the page
let projectName = document.getElementById("project-name");
projectName.innerHTML=project.project_name;
let tableCaption = document.getElementById("table-caption");
tableCaption.innerHTML=project.description;

// Create and setup the DataTables table layout and behaviour
$(document).ready( function () {
    $('#myTable').DataTable();
} );

$(document).ready( function () {
    $('#task-table').DataTable({
        responsive: true,
        columns: [null
                , null
                , null
                , null
                , {type: 'date'}
                , {orderable: false, searchable: false}],
        order: [
            [4, 'asc']
        ],
        columnDefs: [
            {
                "targets": 2,
                "createdCell": (td, cellData) => {
                    // Colour code the priority cells
                    let priority = prioritiesArray.find(priority => priority.priority_name === cellData);
                    let colourCode = priority.tile_colour;
                    $(td).css('background-color', colourCode);
                }
            },
            {
                "targets": 3,
                "createdCell": (td, cellData) => {
                    // Colour code the completion status cells
                    let compStat = compStatsArray.find(compStat => compStat.completion_status_name === cellData);
                    let colourCode = compStat.tile_colour;
                    $(td).css('background-color', colourCode);
                }
            },
            // Prioritise the cells to show/hide as screen size adjusts
            {
                "responsivePriority": 1,
                "targets": [0, 5]
            },
            {
                "responsivePriority": 2,
                "targets": [4]
            },
            {
                "responsivePriority": 3,
                "targets": [1, 2, 3]
            }
        ],
        // Adjust text colour of completed tasks
        createdRow: (row, data) => {
            if (data[3] === 'Completed') {
                $(row).css('color', '#888');
            }
        }
    });
} );