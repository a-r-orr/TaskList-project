const conn = require('./../utils/dbconn');
const project_id = 1;
const bcrypt = require('bcrypt');

exports.getRoot = (req, res) => {
    res.render('landing');
}

exports.getRegister = (req, res) => {
    res.render('register', { returnMessage: ""});
}

exports.postRegister = async (req, res) => {
    const { name, username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log(hashedPassword);
        const checkUserSQL = `SELECT user_id FROM user
        WHERE user.username = ? OR user.email = ?`;
        const checkVals = [username, email];
        const [ userDetails, fielddata1 ] = await conn.query(checkUserSQL, checkVals);
        // const userID = userDetails[0].user_id;

        if (userDetails.length>0) {
            res.status(400);
            res.render('register', { returnMessage: "Username or email already registered." });
        } else {
            const registerUserSQL = `INSERT INTO user (username, email, password, display_name, usertype_id)
             VALUES (?, ?, ?, ?, 1)`;
            
            const newUserVals = [username, email, hashedPassword, name];
            const [ newUserDetails, fielddata2 ] = await conn.query(registerUserSQL, newUserVals);
            res.redirect('/login');
        }

    } catch (err) {
        console.error(err);
    }
    
}

exports.getLogin = (req, res) => {
    res.render('login', { returnMessage: ""});
}

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const vals = [email, email];
        // console.log(vals);
        const checkUserSQL = `SELECT user_id, password FROM user
        WHERE user.email = ? OR user.username = ?`;

        const [ userDetails, fielddata1 ] = await conn.query(checkUserSQL, vals);
        // console.log(userDetails);
        
        // console.log(userID);
        if (userDetails.length > 0) {
            const userID = userDetails[0].user_id;
            if (await bcrypt.compare(password, userDetails[0].password)) {
                const session = req.session;
                session.isLoggedIn = true;
                session.userID = userID;
                // console.log(session);
                res.redirect('/table-view');
            } else {
                res.render('login', { returnMessage: "The credentials provided did not match a registered user"});
            }
            
        } else {
            res.render('login', { returnMessage: "The credentials provided did not match a registered user"});
        }

    } catch (err) {
        console.error(err);
    }

}

exports.getLogout = async (req, res) => {
    const session = req.session;
    if (session.isLoggedIn) {
        session.destroy();
    }

    res.redirect('/');
}

exports.getDashboard = async (req, res) => {
    
}

exports.getTableView = async (req, res) => {
    const project_id = 1;
    // const selectCategories = `SELECT DISTINCT completion_status_id as category_id,
    //                                          completion_status_name as category_name,
    //                                          tile_colour FROM completion_status WHERE project_id=?`;
    const selectTasks = `SELECT task_id, task_name, description, priority_id, 
                        completion_status_id, created_date, DATE_FORMAT(due_date, "%a %D %b") as due_date, completed_date
                        FROM task WHERE project_id=?`;
    const { userID } = req.session;
    const userProjects = await getUsersProjects(userID);
    // console.log(`User's projects: ${userProjects}`);

    try {
        // const [ categories, fielddata1 ] = await conn.query(selectCategories, project_id);
        const [ tasks, fielddata2 ] = await conn.query(selectTasks, project_id);
        
        res.render('table-view', { tasks: tasks, userProjects: userProjects });
        
    } catch (err) {
        console.error(err);
    }

}

exports.getKanbanView = async (req, res) => {
    const project_id = 1;
    const selectCategories = `SELECT DISTINCT completion_status_id as category_id,
                                             completion_status_name as category_name,
                                             tile_colour FROM completion_status WHERE project_id=?`;
    const selectTasks = `SELECT task_id, task_name, description, priority_id, 
                        completion_status_id as category_id, created_date, due_date, completed_date
                        FROM task WHERE project_id=?`;
    const { userID } = req.session;
    const userProjects = await getUsersProjects(userID);
    // console.log(`User's projects: ${userProjects}`);

    try {
        const [ categories, fielddata1 ] = await conn.query(selectCategories, project_id);
        const [ tasks, fielddata2 ] = await conn.query(selectTasks, project_id);
        
        res.render('kanban-view', { tasks: tasks, categories: categories, userProjects: userProjects });
        
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
    console.log(userID);
    const selectProjects = `SELECT project_id, project_name FROM project WHERE user_id=?`;
    try {
        const [ projects, fielddata ] = await conn.query(selectProjects, userID);

        return projects;
    } catch (err) {
        console.error(err);
    }
}