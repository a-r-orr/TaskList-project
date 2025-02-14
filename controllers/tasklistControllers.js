const conn = require('./../utils/dbconn');
const bcrypt = require('bcrypt');
const axios = require('axios');

const project_id = 1;

exports.getRoot = async (req, res) => {
    const session = req.session;
    if (session.isLoggedIn) {
        session.userProjects = await getUsersProjects(session.userID);
        res.render('dashboard', { userDetails: session.userDetails, userProjects: session.userProjects });
    } else {
        res.render('landing');
    }
}

exports.getRegister = (req, res) => {
    const session = req.session;
    res.render('register', { error: session.errorMessage });
}

exports.postRegister = async (req, res) => {
    const { name, username, email, password } = req.body;
    const session = req.session;
    const endpoint = `${process.env.API_URL}/users/new`;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const vals = { 
            name: name,
            username: username,
            email: email,
            hashedPassword: hashedPassword
         };
        
        axios
            .post(endpoint, vals, { validateStatus: (status) => { return status < 500 } })
            .then((response) => {
                const status = response.status;
                if (status === 201) {
                    session.errorMessage = null;
                    res.redirect('/login');
                } else {
                    const data = response.data;
                    session.errorMessage = data.message;
                    res.redirect('/register');
                }
            })
            .catch((error) => {
                console.log(`Error making API request: ${error}`);
                session.errorMessage = "Sorry, something went wrong. Please try that again."
                res.redirect('/register');
            });

    } catch (err) {
        console.error(err);
    }
    
}

exports.getLogin = (req, res) => {
    res.render('login', { returnMessage: ""});
}

exports.postLogin = async (req, res) => {
    const vals = { email, password } = req.body;
    const session = req.session;
    const endpoint = `${process.env.API_URL}/users`;
    let userEndpoint = null;
    let projectsEndpoint = null;
    // let tasksEndpoint = null;
    let loginData = null;
    let endpoints = null;

    try {
        const loginResponse = await axios.post(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        if (loginResponse.status === 200) {
            session.errorMessage = null;
            session.isLoggedIn = true;
            loginData = loginResponse.data.result;
            session.userID = loginData.userID;
            // res.redirect('/');
        } else {
            loginData = loginResponse.data;
            session.errorMessage = loginData.message;
            res.redirect('/login');
        }

        userEndpoint = `${process.env.API_URL}/users/${session.userID}`;
        projectsEndpoint = `${process.env.API_URL}/users/${session.userID}/projects`;
        // tasksEndpoint = `${process.env.API_URL}/users/${session.userID}/projects`;
        endpoints = [ userEndpoint, projectsEndpoint ];

        const requests = endpoints.map((endpoint) => axios.get(endpoint, { validateStatus: (status) => { return status < 500 } }));
        await Promise.all(requests).then(( [ {data: user}, {data: userProjects} ] ) => {
            // console.log(user);
            // console.log(userProjects);
            if (user.result) {
                session.userDetails = user.result[0];
            }
            if (userProjects.result) {
                session.userProjects = userProjects.result;
            } else {
                session.userProjects = [];
            }
            
        });

        res.redirect('/');

    } catch (error) {
        console.log(`postLogin - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect('/login');
    }
}

exports.getLogout = async (req, res) => {
    const session = req.session;
    if (session.isLoggedIn) {
        session.destroy();
    }

    res.redirect('/');
}

exports.getNewProject = (req, res) => {

    res.render('new-project');
}

exports.postNewProject = async (req, res) => {
    const { projectName, projectDescription } = req.body;
    const session = req.session;
    const { userID } = session;
    const vals = { projectName, projectDescription, userID };

    const endpoint = `${process.env.API_URL}/projects`;

    try {
        const projectResponse = await axios.post(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect('/');
        } else {
            session.projectInputVals = { 
                projectName: projectName, 
                projectDescription: projectDescription
            };
            res.redirect('/new-project');
        }
        
    } catch (error) {
        console.log(`postNewProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        session.projectInputVals = { 
            projectName: projectName, 
            projectDescription: projectDescription
        };
        res.redirect('/new-project');
    }
}

exports.getEditProject = async (req, res) => {
    const projectID = parseInt(req.query.project);
    try {
        const projectEndpoint = `${process.env.API_URL}/projects/${projectID}`;
        const projectDetails = await axios.get(projectEndpoint, { validateStatus: (status) => { return status < 500 } });
        // console.log(projectDetails.data.result);
        res.render('edit-project', { project: projectDetails.data.result[0] });

    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
}

exports.putEditProject = async (req, res) => {
    const projectID = req.params.projectID;
    const { projectName, projectDescription } = req.body;
    const completionDate = null;
    const session = req.session;

    const endpoint = `${process.env.API_URL}/projects/${projectID}`;

    try {
        const vals = { projectName, projectDescription, completionDate };
        
        const projectResponse = await axios.put(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(`/table-view/?project=${projectID}`);
        } else {
            console.log(projectResponse);
            res.redirect(`/table-view/?project=${projectID}`);
        }
        
    } catch (error) {
        console.log(`putEditProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(`/table-view/?project=${projectID}`);
    }
}

exports.patchCompleteProject = async (req, res) => {
    const projectID = req.params.projectID;
    const completionDate = todaysDate();
    const session = req.session;

    try {
        const endpoint = `${process.env.API_URL}/projects/${projectID}/completion`;
        const vals = { completionDate };
        
        const projectResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(`/`);
        } else {
            console.log(projectResponse);
            res.redirect(`/table-view/?project=${projectID}`);
        }
        
    } catch (error) {
        console.log(`putEditProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(`/table-view/?project=${projectID}`);
    }
}

exports.patchUncompleteProject = async (req, res) => {
    const projectID = req.params.projectID;
    const completionDate = null;
    const session = req.session;

    try {
        const endpoint = `${process.env.API_URL}/projects/${projectID}/completion`;
        const vals = { completionDate };
        
        const projectResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(`/`);
        } else {
            console.log(projectResponse);
            res.redirect(`/table-view/?project=${projectID}`);
        }
        
    } catch (error) {
        console.log(`putEditProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(`/table-view/?project=${projectID}`);
    }
}

exports.getNewTask = async (req, res) => {
    const projectID = parseInt(req.query.project);
    const session = req.session;
    try {
        session.userProjects = await getUsersProjects(session.userID);
        const currentProject = session.userProjects.find(project => project.project_id === projectID);
        session.currentProject = currentProject;
        const tasks = await getProjectTasks(projectID);
        const priorities = tasks.priorities;
    
        res.render('new-task', { tomorrow: tomorrowsDate(), userProjects: session.userProjects, currentProject: currentProject, priorities: priorities });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
    
}

exports.postNewTask = async (req, res) => {
    const { taskName, taskDescription, priorityID, dueDate } = req.body;
    const session = req.session;
    // const currentProject = session.userProjects.find(project => project.project_name === projectName);
    const projectID = session.currentProject.project_id;
    // console.log({ taskName, taskDescription, priorityID, dueDate, projectID });

    const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks`;

    try {
        const tasks = await getProjectTasks(projectID);
        const compStats = tasks.compStats;
        const notStarted = compStats.find(compStat => compStat.completion_status_name === "Not Started");
        const compStatID = notStarted.completion_status_id;
        const vals = { taskName, taskDescription, projectID, priorityID, compStatID, dueDate };
        console.log(vals);
        const projectResponse = await axios.post(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(`/table-view/?project=${projectID}`);
        } else {
            // session.projectInputVals = { 
            //     projectName: projectName, 
            //     projectDescription: projectDescription
            // };
            console.log(projectResponse);
            res.redirect('/');
        }
        
    } catch (error) {
        console.log(`postNewTask - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        // session.projectInputVals = { 
        //     projectName: projectName, 
        //     projectDescription: projectDescription
        // };
        res.redirect('/');
    }
}

exports.getEditTask = async (req, res) => {
    const projectID = parseInt(req.query.project);
    const taskID = parseInt(req.query.task);
    const session = req.session;
    try {
        session.userProjects = await getUsersProjects(session.userID);
        const currentProject = session.userProjects.find(project => project.project_id === projectID);
        session.currentProject = currentProject;
        const taskDetails = await getSpecificTask(projectID, taskID);
        const task = taskDetails.task;
        const priorities = taskDetails.priorities;
        const compStats = taskDetails.compStats;
    
        res.render('edit-task', { task: task, userProjects: session.userProjects, currentProject: currentProject, priorities: priorities, compStats: compStats });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
    
}

exports.putEditTask = async (req, res) => {
    const taskID = req.params.taskID;
    const { taskName, taskDescription, priorityID, compStatID, dueDate } = req.body;
    const session = req.session;
    const projectID = session.currentProject.project_id;

    const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}`;

    try {
        const vals = { taskName, taskDescription, priorityID, compStatID, dueDate };
        // console.log(vals);
        const projectResponse = await axios.put(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        // console.log(projectResponse);
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(`/table-view/?project=${projectID}`);
        } else {
            // session.projectInputVals = { 
            //     projectName: projectName, 
            //     projectDescription: projectDescription
            // };
            console.log(projectResponse);
            res.redirect('/');
        }
        
    } catch (error) {
        console.log(`putEditTask - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        // session.projectInputVals = { 
        //     projectName: projectName, 
        //     projectDescription: projectDescription
        // };
        res.redirect('/');
    }
}

exports.getTableView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;

    try {
        session.userProjects = await getUsersProjects(session.userID);
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const compStats = tasksObject.compStats;
        const priorities = tasksObject.priorities;
        
        res.render('table-view', { tasks: tasks, userProjects: session.userProjects, currentProject: projectID, compStats: compStats, priorities: priorities });
        
    } catch (err) {
        console.error(err);
    }
}

exports.getKanbanView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    
    try {
        session.userProjects = await getUsersProjects(session.userID);
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const categories = tasksObject.compStats;
        const priorities = tasksObject.priorities;
        
        res.render('kanban-view', { tasks: tasks, categories: categories, userProjects: session.userProjects, currentProject: projectID, priorities: priorities });
        
    } catch (err) {
        console.error(err);
    }
}

exports.getPriorityView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    
    try {
        session.userProjects = await getUsersProjects(session.userID);
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const categories = tasksObject.priorities;
        const compStats = tasksObject.compStats;
        
        res.render('priority-view', { tasks: tasks, categories: categories, userProjects: session.userProjects, currentProject: projectID, compStats: compStats });
        
    } catch (err) {
        console.error(err);
    }
}

// async function updateProject(projectID, vals) {
//     return 0;
// }

async function getUsersProjects(userID) {
    
    try {
        const projectsEndpoint = `${process.env.API_URL}/users/${userID}/projects`;
        const userProjects = await axios.get(projectsEndpoint, { validateStatus: (status) => { return status < 500 } });
        if (userProjects.data.result) {
            return userProjects.data.result;
        } else {
            return [];
        }
    } catch (err) {
        console.log(err);
        return [];
    }
}

async function getProjectTasks(projectID) {
    
    try {
        const tasksEndpoint = `${process.env.API_URL}/projects/${projectID}/tasks`;
        const projectTasks = await axios.get(tasksEndpoint, { validateStatus: (status) => { return status < 500 } });
        if (projectTasks.data.result) {
            // console.log(projectTasks.data.result);
            return projectTasks.data.result;
        } else {
            return [];
        }
    } catch (err) {
        console.log(err);
        return [];
    }
}

async function getSpecificTask(projectID, taskID) {
    try {
        const projectTasks = await getProjectTasks(projectID);
        
        const currentTask = projectTasks.tasks.find(task => task.task_id === taskID);
        const priorities = projectTasks.priorities;
        const compStats = projectTasks.compStats;
        console.log(currentTask);

        if (currentTask && priorities && compStats) {
            return {
                task: currentTask,
                priorities: priorities,
                compStats: compStats
            }
        } else {
            return {};
        }
    } catch (err) {
        console.log(err);
        return {};
    }
}

function todaysDate() {
    const date = new Date().toJSON().slice(0,10);
    return date;
}

function tomorrowsDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const date = tomorrow.toJSON().slice(0,10);
    return date;
}