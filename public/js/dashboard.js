// Gather the priority labels for all non-completed tasks
let priorities = tasksArray.map((task) => {
    if (task.completed_date === null) {
        return task.priority_name;
    } else {
        return null;
    }
});
// Filter out any nulls
let allPriorities = priorities.filter(el => el !== null);

// Get creation dates for all tasks
let allCreatedDates = tasksArray.map((task) => {
    return Date.parse(task.created_date);
});

// Get due dates for all non-completed tasks
let dueDates = tasksArray.map((task) => {
    if (task.completed_date === null) {
        return Date.parse(task.due_date);
    } else {
        return null;
    }
});
// Filter out any nulls
let allDueDates = dueDates.filter(el => el !== null);

// Get completion dates for all tasks
let allCompletedDates = tasksArray.map((task) => {
    return Date.parse(task.completed_date);
});

// Get list of objects containing unique priority names and their counts, then sort by most common to least common
const prioritiesData = getValuesAndCounts(allPriorities);
prioritiesData.sort((a,b) => b.count - a.count);

// Add the tile colour for each priority name to its object for colouring the charts correctly
for (val of prioritiesData) {
    let priorityDetail = prioritiesArray.find(priority => priority.priority_name === val.value);
    val.colour = priorityDetail.tile_colour;
}

// Set up significant dates for filtering data
const today = todaysDate();
const startOfThisWeek = new Date(today);
startOfThisWeek.setDate(today.getDate()-today.getDay()+1);
const startOfNextWeek = new Date(startOfThisWeek);
startOfNextWeek.setDate(startOfThisWeek.getDate()+7);
const startOfLastWeek = new Date(startOfThisWeek);
startOfLastWeek.setDate(startOfThisWeek.getDate()-7);

// const dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
// console.log(Intl.DateTimeFormat('en-GB', dateFormat).format(today));
// console.log(Intl.DateTimeFormat('en-GB', dateFormat).format(startOfThisWeek));
// console.log(Intl.DateTimeFormat('en-GB', dateFormat).format(startOfNextWeek));

// Initiate counter variable
let createdThisWeek = 0, createdLastWeek = 0;
let completedThisWeek = 0, completedLastWeek = 0;
let overdue = 0, dueThisWeek = 0, dueBeyondThisWeek = 0;

// Count created dates
for (date of allCreatedDates) {
    if (date>=startOfThisWeek) {
        createdThisWeek+=1;
    } else if (date<startOfThisWeek && date>=startOfLastWeek) {
        createdLastWeek+=1;
    }
}
// Count due dates
for (date of allDueDates) {
    if (date<today) {
        overdue+=1;
    } else if (date<startOfNextWeek) {
        dueThisWeek+=1;
    } else {
        dueBeyondThisWeek+=1;
    }
}
// Count completed dates
for (date of allCompletedDates) {
    if (date>=startOfThisWeek) {
        completedThisWeek+=1;
    } else if (date<startOfThisWeek && date>=startOfLastWeek) {
        completedLastWeek+=1;
    }
}

Chart.defaults.color = '#17252A';

// Task Priorities chart setup
const chart1Config = {
    type: 'bar',
    data: {
        datasets: [{
            label: 'Tasks',
            data: prioritiesData,
            backgroundColor: (c) => c.raw.colour,
            color: ['#17252A']
        }]
    },
    options: {
        responsive: false,
        animation: true,
        aspectRatio: 1,
        maintainAspectRatio: true,
        scales: { 
            y: {
                beginAtZero: true,
                ticks: {
                    display: false
                },
                grid: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        parsing: {
            xAxisKey: 'value',
            yAxisKey: 'count',
        },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            title: {
                display: true,
                text: 'Task Priorities',
                font: {
                    size: 18
                }
            }
        }
    }
};

const chart1 = new Chart('dashboardChart1', chart1Config);

// Tasks Created chart setup
const chart2Config = {
    type: 'doughnut',
    data: {
        labels: ['This Week', 'Last Week'],
        datasets: [{
            label: 'Tasks',
            data: [createdThisWeek, createdLastWeek],
            backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 205, 86)'],
            color: ['#17252A']
        }]
    },
    options: {
        responsive: false,
        animation: true,
        aspectRatio: 1,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            title: {
                display: true,
                text: 'Tasks Created',
                font: {
                    size: 18
                }
            }
        }
    }
};

const chart2 = new Chart('dashboardChart2', chart2Config);

// Tasks Completed chart setup
const chart3Config = {
    type: 'doughnut',
    data: {
        labels: ['This Week', 'Last Week'],
        datasets: [{
            label: 'Tasks',
            data: [completedThisWeek, completedLastWeek],
            backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 205, 86)'],
            color: ['#17252A']
        }]
    },
    options: {
        responsive: false,
        animation: true,
        aspectRatio: 1,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            title: {
                display: true,
                text: 'Tasks Completed',
                font: {
                    size: 18
                }
            }
        }
    }
};

const chart3 = new Chart('dashboardChart3', chart3Config);

// Tasks Due chart setup
const chart4Config = {
    type: 'doughnut',
    data: {
        labels: ['Overdue', 'Due This Week', 'Further Out'],
        datasets: [{
            label: 'Tasks',
            data: [overdue, dueThisWeek, dueBeyondThisWeek],
            backgroundColor: ['#FFA080', '#FFDF80', '#A5D46A'],
        }]
    },
    options: {
        responsive: false,
        animation: true,
        aspectRatio: 1,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            title: {
                display: true,
                text: 'Tasks Due',
                font: {
                    size: 20
                }
            }
        }
    }
};

const chart4 = new Chart('dashboardChart4', chart4Config);

function getValuesAndCounts(inputArray) {
    // Utility function to return a list of objects
    // containing the unique values and their counts in the provided inputArray
    const uniqueVals = [...new Set(inputArray)];
    let result = [];
    
    for (val of uniqueVals) {
        let count = inputArray.filter(item => item === val).length;
        result.push({ value: val, count: count });
    }

    return result;
}

function todaysDate() {
    // Utility function to provide a date object with today's date
    const date = new Date();
    return date;
}