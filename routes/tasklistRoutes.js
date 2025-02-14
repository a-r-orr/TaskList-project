const express = require('express');
const controller = require('./../controllers/tasklistControllers');
const router = express.Router();

router.get('/', controller.getRoot);

router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/register', controller.getRegister);
router.post('/register', controller.postRegister);

router.get('/logout', controller.getLogout);

router.get('/new-project', controller.getNewProject);
router.post('/new-project', controller.postNewProject);

router.get('/edit-project', controller.getEditProject);
router.post('/edit-project/:projectID', controller.putEditProject);
router.post('/complete-project/:projectID', controller.patchCompleteProject);
router.post('/uncomplete-project/:projectID', controller.patchUncompleteProject);

router.get('/new-task', controller.getNewTask);
router.post('/new-task', controller.postNewTask);

router.get('/edit-task', controller.getEditTask);
router.post('/edit-task/:taskID', controller.putEditTask);

router.get('/priority-view', controller.getPriorityView);
router.get('/kanban-view', controller.getKanbanView);
router.get('/table-view', controller.getTableView);

module.exports = router;