const { updateSession } = require('./../controllers/tasklistControllers');

exports.isAuth = async (req, res, next) => {
    const session = req.session;

    if (!session.isLoggedIn) {
        // If no logged in user - record the requested URL then redirect to login page
        session.returnUrl = req.originalUrl;
        return res.redirect('/login');
    }
    // If user is logged in
    // Update the session with info of their projects and tasks
    try {
        await updateSession(session);
    } catch (err) {
        console.log(err);
        return res.redirect('/');
    }

    // Check the query string for attempts to access any projects or tasks
    const { project, task } = req.query;

    if (project !== undefined) {
        // If a project ID has been requested
        // check if it is owned by the logged in user
        // and if not - redirect them to the 404 page
        if (!session.userProjectIDs.includes(parseInt(project))) {
            return res.redirect('/404-page');
        }
    }

    if (task !== undefined) {
        // If a task ID has been requested
        // check if it is owned by the logged in user
        // and if not - redirect them to the 404 page
        if (!session.userTaskIDs.includes(parseInt(task))) {
            return res.redirect('/404-page');
        }
    }

    // Then continue
    next();
};