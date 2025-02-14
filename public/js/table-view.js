// let table = new DataTable('#task-table');

let project = projectsArray.find(project => project.project_id === currentProj);

let projectName = document.getElementById("project-name");
projectName.innerHTML=project.project_name;

let tableCaption = document.getElementById("table-caption");
tableCaption.innerHTML=project.description;

$(document).ready( function () {
    $('#myTable').DataTable();
} );

$(document).ready( function () {
    $('#task-table').DataTable({
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
                    let priority = prioritiesArray.find(priority => priority.priority_name === cellData);
                    let colourCode = priority.tile_colour;
                    $(td).css('background-color', colourCode);
                }
            },
            {
                "targets": 3,
                "createdCell": (td, cellData) => {
                    let compStat = compStatsArray.find(compStat => compStat.completion_status_name === cellData);
                    let colourCode = compStat.tile_colour;
                    $(td).css('background-color', colourCode);
                    // if (cellData.toLowerCase() === 'completed') {
                    //     $(row).find('td').css('color', '#888');
                    // }
                }
            }
        ],
        createdRow: (row, data) => {
            if (data[3] === 'Completed') {
                $(row).css('color', '#888');
            }
        }

        //,
        // layout: {
        //     top1: 'searchPanes'
        // }
        // ,
        // columnDefs: [
        //     {
        //         searchPanes: {
        //             options: [
        //                 {
        //                     label: 'Not Completed',
        //                     value: function (rowData, rowIdx) {
        //                         return rowData[3] !== 'Completed';
        //                     }
        //                 },
        //                 {
        //                     label: 'Include Completed Tasks',
        //                     value: function (rowData, rowIdx) {
        //                         return rowData[3];
        //                     }
        //                 }
        //             ]
        //         },
        //         targets: [3]
        //     }
        // ]
    });
} );