const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const morgan = require('morgan');
// const events = require('events');
// const eventEmitter = new events.EventEmitter();
const dotenv = require('dotenv').config({ path: './config.env' });
const router = require('./routes/tasklistRoutes');
const path = require('path');
const sessions = require('express-session');
const axios = require('axios');

// const { checkLogin } = require('./middleware/mymiddleware');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});

// const controller = require('./controllers/tasklistControllers');

app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessions({
    secret: 'verySecretKey0987',
    resave: false,
    saveUninitialized: false
}));

// app.use('/', checkLogin);
app.use('/', router);
app.set('view engine', 'ejs');

io.on('connection', async (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });

    socket.on('priority update', async (priorityID, projectID, taskID) => {
        const vals = { priorityID };

        const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}/priority`;
    
        try {
            const updateResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
            socket.emit('priority update complete');
            
        } catch (err) {
            console.log(`Patch priority - Error making API request: ${error}`);
            session.errorMessage = "Sorry, something went wrong. Please try that again."
        }

    } )

    socket.on('completion status update', async (compStatID, compStatName, projectID, taskID) => {
        const vals = { compStatID, compStatName };

        const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}/completion`;

        try {
            const updateResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
            socket.emit('completion status update complete');
            
        } catch (error) {
            console.log(`Patch completion status - Error making API request: ${error}`);
            session.errorMessage = "Sorry, something went wrong. Please try that again."
        }
    } )
});

server.listen(process.env.PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Express listening on port ${process.env.PORT}`);
});
