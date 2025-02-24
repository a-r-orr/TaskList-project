const { updateSession } = require('./../controllers/tasklistControllers');

exports.isAuth = async (req, res, next) => {
    // console.log(`Middleware: ${req.originalUrl}`);
    const session = req.session;
    // const { isLoggedIn } = req.session;

    if (!session.isLoggedIn) {
        session.returnUrl = req.originalUrl;
        return res.redirect('/login');
    }

    try {
        await updateSession(session);
    } catch (err) {
        console.log(err);
        return res.redirect('/');
    }

    const { project, task } = req.query;

    if (project !== undefined) {
        // console.log(project);
        // console.log(session);
        if (!session.userProjectIDs.includes(parseInt(project))) {
            return res.redirect('/404-page');
        }
    }

    if (task !== undefined) {
        // console.log(task);
        // console.log(session);
        if (!session.userTaskIDs.includes(parseInt(task))) {
            return res.redirect('/404-page');
        }
    }

    next();
};