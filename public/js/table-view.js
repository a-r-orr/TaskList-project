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
                , {orderable: false, searchable: false}]
    });
} );