const express = require('express');
const controller = require('./../controllers/tasklistControllers');
const { isAuth } = require('./../middleware/mymiddleware');

const router = express.Router();

router.get('/', controller.getRoot);

router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/register', controller.getRegister);
router.post('/register', controller.postRegister);

router.get('/logout', controller.getLogout);

router.get('/new-project', isAuth, controller.getNewProject);
router.post('/new-project', isAuth, controller.postNewProject);

router.get('/edit-project', isAuth, controller.getEditProject);
router.post('/edit-project/:projectID', isAuth, controller.putEditProject);
router.post('/complete-project/:projectID', isAuth, controller.patchCompleteProject);
router.post('/uncomplete-project/:projectID', isAuth, controller.patchUncompleteProject);

router.get('/new-task', isAuth, controller.getNewTask);
router.post('/new-task', isAuth, controller.postNewTask);

router.get('/edit-task', isAuth, controller.getEditTask);
router.post('/edit-task/:taskID', isAuth, controller.putEditTask);
router.post('/uncomplete-task/:taskID', isAuth, controller.patchTaskUncomplete);
router.post('/delete-task/:taskID', isAuth, controller.deleteTask);

router.get('/overview', isAuth, controller.getProjectOverview);
router.get('/priority-view', isAuth, controller.getPriorityView);
router.get('/kanban-view', isAuth, controller.getKanbanView);
router.get('/table-view', isAuth, controller.getTableView);

router.get('/404-page', isAuth, controller.get404Page);

module.exports = router;