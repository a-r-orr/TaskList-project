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

exports.getTableView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    session.userProjects = await getUsersProjects(session.userID);
    // console.log(`User's projects: ${userProjects}`);

    try {
        // const [ categories, fielddata1 ] = await conn.query(selectCategories, project_id);
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        
        res.render('table-view', { tasks: tasks, userProjects: session.userProjects, currentProject: projectID });
        
    } catch (err) {
        console.error(err);
    }
}

exports.getKanbanView = async (req, res) => {
    const projectID = req.query.project;
    const session = req.session;
    session.userProjects = await getUsersProjects(session.userID);

    try {
        const tasksObject = await getProjectTasks(projectID);
        const tasks = tasksObject.tasks;
        const categories = tasksObject.compStats;
        
        res.render('kanban-view', { tasks: tasks, categories: categories, userProjects: session.userProjects, currentProject: projectID });
        
    } catch (err) {
        console.error(err);
    }

}

exports.getPriorityView = async (req, res) => {
    const project_id = 1;
    
    const selectCategories = `SELECT DISTINCT priority_id as category_id,
                                             priority_name as category_name,
                                             tile_colour FROM priority WHERE project_id=?`;

    const selectTasks = `SELECT task_id, task_name, description, priority_id as category_id, 
                        completion_status_id, created_date, due_date, completed_date
                        FROM task WHERE project_id=?`;
    
    const { userID } = req.session;
    const userProjects = await getUsersProjects(userID);
    // console.log(`User's projects: ${userProjects}`);

    try {
        const [ categories, fielddata1 ] = await conn.query(selectCategories, project_id);
        const [ tasks, fielddata2 ] = await conn.query(selectTasks, project_id);
        
        res.render('priority-view', { tasks: tasks, categories: categories, userProjects: userProjects });
        // res.render('priority-view', { tasks: tasks, priorities: priorities, userProjects: userProjects });
        
    } catch (err) {
        console.error(err);
    }

}

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