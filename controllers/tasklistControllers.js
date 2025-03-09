const bcrypt = require('bcrypt');
const axios = require('axios');

exports.getRoot = async (req, res) => {
    const session = req.session;
    
    if (session.isLoggedIn) {
        // If logged in, gather user's project info into the session
        session.userProjects = await getUsersProjects(session.userID);
        let userTasks = [];
        let userPriorities = [];
        let userCompStats = [];
        for (project of session.userProjects) {
            let projectTasks = await getProjectTasks(project.project_id);
            let projectTaskList = projectTasks.tasks;
            for (task of projectTaskList) {
                userTasks.push(task);
            }
            let projectPriorityList = projectTasks.priorities;
            for (priority of projectPriorityList) {
                userPriorities.push(priority);
            }
            let projectCompStatList = projectTasks.compStats;
            for (compStat of projectCompStatList) {
                userCompStats.push(compStat);
            }
        }
        // Then render the dashboard
        res.render('dashboard', { userDetails: session.userDetails, userProjects: session.userProjects, userTasks: userTasks, priorities: userPriorities, compStats: userCompStats });
    } else {
        // If not logged in, render the landing page
        res.render('landing');
    }
}

exports.getRegister = (req, res) => {
    // Render the registration page
    const session = req.session;
    res.render('register', { error: session.errorMessage });
}

exports.postRegister = async (req, res) => {
    const { name, username, email, password } = req.body;
    const session = req.session;
    const endpoint = `${process.env.API_URL}/users/new`;

    try {
        // Use bcrypt to hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Values to send with API request
        const vals = { 
            name: name,
            username: username,
            email: email,
            hashedPassword: hashedPassword
         };
        // POST to API
        axios
            .post(endpoint, vals, { validateStatus: (status) => { return status < 500 } })
            .then((response) => {
                // Handle success and failure responses
                const status = response.status;
                if (status === 201) {
                    session.errorMessage = "Registration Successful";
                    res.redirect('/login');
                } else {
                    const data = response.data;
                    session.errorMessage = data.message;
                    res.redirect('/register');
                }
            })
            .catch((error) => {
                // Handle error responses
                console.log(`Error making API request: ${error}`);
                session.errorMessage = "Sorry, something went wrong. Please try that again."
                res.redirect('/register');
            });

    } catch (err) {
        console.error(err);
    }
    
}

exports.getLogin = (req, res) => {
    const session = req.session;
    // Render Login page
    if (session.errorMessage !== undefined) {
        res.render('login', { returnMessage: session.errorMessage});
    } else {
        res.render('login', { returnMessage: ""});
    }
    
}

exports.postLogin = async (req, res) => {
    const vals = { email, password } = req.body;
    const session = req.session;
    const endpoint = `${process.env.API_URL}/users`;
    let userEndpoint = null;
    let projectsEndpoint = null;
    let loginData = null;
    let endpoints = null;

    try {
        // Attempt Login
        const loginResponse = await axios.post(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        if (loginResponse.status === 200) {
            // If successful - update session, then continue below
            session.errorMessage = null;
            session.isLoggedIn = true;
            loginData = loginResponse.data.result;
            session.userID = loginData.userID;
        } else {
            // If unsuccessful - redirect to Login page with error message
            loginData = loginResponse.data;
            session.errorMessage = loginData.message;
            return res.redirect('/login');
        }


        userEndpoint = `${process.env.API_URL}/users/${session.userID}`;
        projectsEndpoint = `${process.env.API_URL}/users/${session.userID}/projects`;
        endpoints = [ userEndpoint, projectsEndpoint ];

        // Send multiple requests to API for User Details and details of their Projects
        const requests = endpoints.map((endpoint) => axios.get(endpoint, { validateStatus: (status) => { return status < 500 } }));
        await Promise.all(requests).then(( [ {data: user}, {data: userProjects} ] ) => {
            if (user.result) {
                session.userDetails = user.result[0];
            }
            if (userProjects.result) {
                session.userProjects = userProjects.result;
                session.userProjectIDs = userProjects.result.map((item) => {return item.project_id});
            } else {
                session.userProjects = [];
                session.userProjectIDs = [];
            }
            
        });

        // Return user either to the URL they had previously requested, or to their dashboard
        if (session.returnUrl !== undefined) {
            res.redirect(session.returnUrl);
        } else {
            res.redirect('/');
        }
        

    } catch (error) {
        console.log(`postLogin - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect('/login');
    }
}

exports.getLogout = async (req, res) => {
    // Destroy session then redirect to landing page
    const session = req.session;
    if (session.isLoggedIn) {
        session.destroy();
    }

    res.redirect('/');
}

exports.getNewProject = (req, res) => {
    // Render New Project page
    res.render('new-project');
}

exports.postNewProject = async (req, res) => {
    const { projectName, projectDescription } = req.body;
    const session = req.session;
    const { userID } = session;
    const vals = { projectName, projectDescription, userID };

    const endpoint = `${process.env.API_URL}/projects`;

    try {
        // Send POST request to API
        const projectResponse = await axios.post(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        if (projectResponse.status === 201) {
            // If successful - redirect to project overview page for the new project
            session.projectInputVals = {};
            const projectID = projectResponse.data.result.projectID;
            res.redirect(`/overview/?project=${projectID}`);
        } else {
            // If unsuccessful - send back to new project page
            session.projectInputVals = { 
                projectName: projectName, 
                projectDescription: projectDescription
            };
            res.redirect('/new-project');
        }
        
    } catch (error) {
        // If there is an error - send back to new project page with error message
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
    const session = req.session;
    const returnUrl = session.returnUrl

    try {
        // GET Project details from API, then render the edit project page with these details.
        const projectEndpoint = `${process.env.API_URL}/projects/${projectID}`;
        const projectDetails = await axios.get(projectEndpoint, { validateStatus: (status) => { return status < 500 } });
        res.render('edit-project', { project: projectDetails.data.result[0] });

    } catch (err) {
        // If error - return to previous screen
        console.log(err);
        res.redirect(returnUrl);
    }
}

exports.putEditProject = async (req, res) => {
    const projectID = req.params.projectID;
    const { projectName, projectDescription } = req.body;
    const completionDate = null;
    const session = req.session;
    const returnUrl = session.returnUrl
    const endpoint = `${process.env.API_URL}/projects/${projectID}`;

    try {
        // Send PUT request to API to update project details, then return to previous page
        const vals = { projectName, projectDescription, completionDate };
        
        const projectResponse = await axios.put(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(returnUrl);
        } else {
            console.log(projectResponse);
            res.redirect(returnUrl);
        }
        
    } catch (error) {
        console.log(`putEditProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(returnUrl);
    }
}

exports.patchCompleteProject = async (req, res) => {
    const projectID = req.params.projectID;
    const completionDate = todaysDate();
    const session = req.session;
    const returnUrl = session.returnUrl

    try {
        // Send PATCH request to API to update only the completion date for the project
        const endpoint = `${process.env.API_URL}/projects/${projectID}/completion`;
        const vals = { completionDate };
        
        const projectResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(returnUrl);
        } else {
            console.log(projectResponse);
            res.redirect(returnUrl);
        }
        
    } catch (error) {
        console.log(`putEditProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(returnUrl);
    }
}

exports.patchUncompleteProject = async (req, res) => {
    const projectID = req.params.projectID;
    const completionDate = null;
    const session = req.session;
    const returnUrl = session.returnUrl

    try {
        // Send PATCH request to API to update only the completion date for the project - change to NULL so that project is "incomplete"
        const endpoint = `${process.env.API_URL}/projects/${projectID}/completion`;
        const vals = { completionDate };
        
        const projectResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(returnUrl);
        } else {
            console.log(projectResponse);
            res.redirect(returnUrl);
        }
        
    } catch (error) {
        console.log(`putEditProject - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(returnUrl);
    }
}

exports.getNewTask = async (req, res) => {
    const projectID = parseInt(req.query.project);
    const session = req.session;
    const returnUrl = session.returnUrl

    try {
        // Render the New Task page, with the correct priority options for the current project
        const currentProject = session.userProjects.find(project => project.project_id === projectID);
        session.currentProject = currentProject;
        const tasks = await getProjectTasks(projectID);
        const priorities = tasks.priorities;
    
        res.render('new-task', { tomorrow: tomorrowsDate(), userProjects: session.userProjects, currentProject: currentProject, priorities: priorities });
    } catch (err) {
        // If there is an error - return user to previous page
        console.log(err);
        res.redirect(returnUrl);
    }
    
}

exports.postNewTask = async (req, res) => {
    const { taskName, taskDescription, priorityID, dueDate } = req.body;
    const session = req.session;
    const returnUrl = session.returnUrl
    const projectID = session.currentProject.project_id;

    const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks`;

    try {
        // Bring together data to send to API
        // Must have correct Priority ID and Completion Status ID for the project the task has been added to.
        const tasks = await getProjectTasks(projectID);
        const compStats = tasks.compStats;
        const notStarted = compStats.find(compStat => compStat.completion_status_name === "Not Started");
        const compStatID = notStarted.completion_status_id;
        const vals = { taskName, taskDescription, projectID, priorityID, compStatID, dueDate };
        
        // Then send POST request to API to create the new task
        const projectResponse = await axios.post(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(returnUrl);
        } else {
            console.log(projectResponse);
            res.redirect(returnUrl);
        }
        
    } catch (error) {
        console.log(`postNewTask - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(returnUrl);
    }
}

exports.getEditTask = async (req, res) => {
    const projectID = parseInt(req.query.project);
    const taskID = parseInt(req.query.task);
    const session = req.session;
    const returnUrl = session.returnUrl

    try {
        // Gather the selected task's details, then render the Edit Task page
        const currentProject = session.userProjects.find(project => project.project_id === projectID);
        session.currentProject = currentProject;
        const taskDetails = await getSpecificTask(projectID, taskID);
        const task = taskDetails.task;
        const priorities = taskDetails.priorities;
        const compStats = taskDetails.compStats;
    
        res.render('edit-task', { task: task, userProjects: session.userProjects, currentProject: currentProject, priorities: priorities, compStats: compStats });
    } catch (err) {
        console.log(err);
        res.redirect(returnUrl);
    }
    
}

exports.putEditTask = async (req, res) => {
    const taskID = req.params.taskID;
    const { taskName, taskDescription, priorityID, compStatID, dueDate } = req.body;
    const session = req.session;
    const returnUrl = session.returnUrl
    const projectID = session.currentProject.project_id;

    const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}`;

    try {
        // Send PUT request to API to update the selected task's details
        const vals = { taskName, taskDescription, priorityID, compStatID, dueDate };
        const projectResponse = await axios.put(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        
        if (projectResponse.status === 201) {
            session.projectInputVals = {};
            res.redirect(returnUrl);
        } else {
            console.log(projectResponse);
            res.redirect(returnUrl);
        }
        
    } catch (error) {
        console.log(`putEditTask - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(returnUrl);
    }
}

exports.patchTaskUncomplete = async (req, res) => {
    const taskID = req.params.taskID;
    const compStatID = parseInt(req.body.compStatID);
    const session = req.session;
    const returnUrl = session.returnUrl

    const projectID = session.currentProject.project_id;
    const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}/completion`;

    try {
        // Gather correct completion status info for the project
        const projDetails = await getProjectTasks(projectID);
        const compStats = projDetails.compStats;
        const compStat = compStats.find(compStatus => compStatus.completion_status_id === compStatID);
        const compStatName = compStat.completion_status_name;

        const vals = { compStatID, compStatName };
        // Then send PATCH request to API to "uncomplete" the task
        const updateResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
        res.redirect(returnUrl);
        
    } catch (error) {
        console.log(`patchTaskUncomplete - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."

        res.redirect(returnUrl);
    }
}

exports.deleteTask = async (req, res) => {
    const taskID = req.params.taskID;
    const { projectID } = req.body;
    const session = req.session;
    const returnUrl = session.returnUrl

    const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}`;

    try {
        // Send DELETE request to API
        const taskResponse = await axios.delete(endpoint, { validateStatus: (status) => { return status < 500 } });
        if (taskResponse.status === 200) {
            session.projectInputVals = {};
            res.redirect(returnUrl);
        } else {
            res.redirect(returnUrl);
        }
        
    } catch (error) {
        console.log(`deleteTask - Error making API request: ${error}`);
        session.errorMessage = "Sorry, something went wrong. Please try that again."
        res.redirect(returnUrl);
    }
}

exports.getProjectOverview = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    session.returnUrl = req.originalUrl;

    try {
        // Gather the tasks for the given project
        const tasksObject = await getProjectTasks(projectID);
        const userTasks = tasksObject.tasks;
        const compStats = tasksObject.compStats;
        const priorities = tasksObject.priorities;
        
        // Then render the Project Overview page
        res.render('project-overview', { userProjects: session.userProjects, currentProject: projectID, userTasks: userTasks, priorities: priorities, compStats: compStats });
    } catch (err) {
        console.error(err);
    }

    
}

exports.getTableView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    session.returnUrl = req.originalUrl;

    try {
        // Gather the tasks for the given project
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const compStats = tasksObject.compStats;
        const priorities = tasksObject.priorities;
        
        // Then render the Table View page
        res.render('table-view', { tasks: tasks, userProjects: session.userProjects, currentProject: projectID, compStats: compStats, priorities: priorities });
    } catch (err) {
        console.error(err);
    }
}

exports.getKanbanView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    session.returnUrl = req.originalUrl;
    
    try {
        // Gather the tasks for the given project
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const categories = tasksObject.compStats;
        const priorities = tasksObject.priorities;
        
        // Then render the Kanban View page
        res.render('kanban-view', { tasks: tasks, categories: categories, userProjects: session.userProjects, currentProject: projectID, priorities: priorities });
    } catch (err) {
        console.error(err);
    }
}

exports.getPriorityView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    session.returnUrl = req.originalUrl;
    
    try {
        // Gather the tasks for the given project
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const categories = tasksObject.priorities;
        const compStats = tasksObject.compStats;
        
        // Then render the Priority View page
        res.render('priority-view', { tasks: tasks, categories: categories, userProjects: session.userProjects, currentProject: projectID, compStats: compStats });
    } catch (err) {
        console.error(err);
    }
}

exports.get404Page = async (req, res) => {
    // Render the 404 page
    res.render('404-page');
}

async function getUsersProjects(userID) {
    // Utility function to gather all the projects that belong to a given userID
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
    // Utility function to gather all the tasks belonging to a given projectID
    try {
        const tasksEndpoint = `${process.env.API_URL}/projects/${projectID}/tasks`;
        const projectTasks = await axios.get(tasksEndpoint, { validateStatus: (status) => { return status < 500 } });
        if (projectTasks.data.result) {
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
    // Utlity function to get the details for a specific task, denoted by taskID and part of projectID
    try {
        const projectTasks = await getProjectTasks(projectID);
        
        const currentTask = projectTasks.tasks.find(task => task.task_id === taskID);
        const priorities = projectTasks.priorities;
        const compStats = projectTasks.compStats;

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

exports.updateSession = async (session) => {
    // Utility function to update the session with lists of
    // the user's projects, projectIDs and taskIDs
    // Exported for use in the middleware to protect against unallowed access
    session.userProjects = await getUsersProjects(session.userID);
    session.userProjectIDs = session.userProjects.map((item) => {return item.project_id});
    let tasks = [];
    let taskIDs = [];
    for (ID of session.userProjectIDs) {
        tasks = await getProjectTasks(ID);
        for (task of tasks.tasks) {
            taskIDs.push(task.task_id);
        }
    }
    session.userTaskIDs = taskIDs;
}

function todaysDate() {
    // Utility function to return a string with today's date
    const date = new Date().toJSON().slice(0,10);
    return date;
}

function tomorrowsDate() {
    // Utility function to return a string with tomorrow's date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const date = tomorrow.toJSON().slice(0,10);
    return date;
}