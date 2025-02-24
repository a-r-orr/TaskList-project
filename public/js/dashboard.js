let priorities = tasksArray.map((task) => {
    if (task.completed_date === null) {
        return task.priority_name;
    } else {
        return null;
    }
});
let allPriorities = priorities.filter(el => el !== null);

let allCompStats = tasksArray.map((task) => {
    return task.completion_status_name;
});

let allCreatedDates = tasksArray.map((task) => {
    return Date.parse(task.created_date);
});

let dueDates = tasksArray.map((task) => {
    if (task.completed_date === null) {
        return Date.parse(task.due_date);
    } else {
        return null;
    }
});
let allDueDates = dueDates.filter(el => el !== null);

let allCompletedDates = tasksArray.map((task) => {
    return Date.parse(task.completed_date);
});

const prioritiesData = getValuesAndCounts(allPriorities);
const compStatsData = getValuesAndCounts(allCompStats);
prioritiesData.sort((a,b) => b.count - a.count);

for (val of prioritiesData) {
    let priorityDetail = prioritiesArray.find(priority => priority.priority_name === val.value);
    val.colour = priorityDetail.tile_colour;
    // console.log(val);
}

for (val of compStatsData) {
    let compStatDetail = compStatsArray.find(compStat => compStat.completion_status_name === val.value);
    val.colour = compStatDetail.tile_colour;
}


const today = todaysDate();
const startOfThisWeek = new Date();
startOfThisWeek.setDate(today.getDate()-today.getDay()+1);
const startOfNextWeek = new Date();
startOfNextWeek.setDate(startOfThisWeek.getDate()+7);
const startOfLastWeek = new Date();
startOfLastWeek.setDate(startOfThisWeek.getDate()-7);

const dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

// console.log(Intl.DateTimeFormat('en-GB', dateFormat).format(today));
// console.log(Intl.DateTimeFormat('en-GB', dateFormat).format(startOfThisWeek));
// console.log(Intl.DateTimeFormat('en-GB', dateFormat).format(startOfNextWeek));

let createdThisWeek = 0, createdLastWeek = 0;
let completedThisWeek = 0, completedLastWeek = 0;
let overdue = 0, dueThisWeek = 0, dueBeyondThisWeek = 0;


for (date of allCreatedDates) {
    if (date>=startOfThisWeek) {
        createdThisWeek+=1;
    } else if (date<startOfThisWeek && date>=startOfLastWeek) {
        createdLastWeek+=1;
    }
}

for (date of allDueDates) {
    if (date<today) {
        overdue+=1;
    } else if (date<startOfNextWeek) {
        dueThisWeek+=1;
    } else {
        dueBeyondThisWeek+=1;
    }
}

for (date of allCompletedDates) {
    if (date>=startOfThisWeek) {
        completedThisWeek+=1;
    } else if (date<startOfThisWeek && date>=startOfLastWeek) {
        completedLastWeek+=1;
    }
}

Chart.defaults.color = '#17252A';

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
                // max: maxPriorityCount+1,
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
            // backgroundColor: 'colour'
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

/*
const chart2Config = {
    type: 'bar',
    data: {
        datasets: [{
            label: 'Tasks',
            data: compStatsData,
            backgroundColor: (c) => c.raw.colour
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
                // max: maxPriorityCount+1,
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
            // backgroundColor: 'colour'
        },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            title: {
                display: true,
                text: 'Task Completion',
                font: { size: 18 }
            }
        }
    }
};

const chart2 = new Chart('dashboardChart2', chart2Config); */

const chart3Config = {
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

const chart3 = new Chart('dashboardChart3', chart3Config);

const chart4Config = {
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

const chart4 = new Chart('dashboardChart4', chart4Config);

const chart5Config = {
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

const chart5 = new Chart('dashboardChart5', chart5Config);

function getValuesAndCounts(inputArray) {
    const uniqueVals = [...new Set(inputArray)];
    let result = [];
    // let valCounts = [];
    for (val of uniqueVals) {
        let count = inputArray.filter(item => item === val).length;
        result.push({ value: val, count: count });
    }

    return result;
}

function todaysDate() {
    const date = new Date();
    return date;
}