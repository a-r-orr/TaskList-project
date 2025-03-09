// Import required modules
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const morgan = require('morgan');
const dotenv = require('dotenv').config({ path: './config.env' });
const router = require('./routes/tasklistRoutes');
const path = require('path');
const sessions = require('express-session');
const axios = require('axios');

// Set up the app, and the web socket
const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});

// More app setup including sessions
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessions({
    secret: 'verySecretKey0987',
    resave: false,
    saveUninitialized: false
}));

// Apply the router to the app, and EJS view engine
app.use('/', router);
app.set('view engine', 'ejs');

// Web Socket listening to the connection
io.on('connection', async (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
    
    // When a priority update event is picked up
    socket.on('priority update', async (priorityID, projectID, taskID) => {
        const vals = { priorityID };
        const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}/priority`;

        // Send PATCH request to API, then emit event confirming success, or else log the error.
        try {
            const updateResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
            socket.emit('priority update complete');
        } catch (err) {
            console.log(`Patch priority - Error making API request: ${error}`);
            session.errorMessage = "Sorry, something went wrong. Please try that again."
        }

    } )
    // When a completion status update event is picked up
    socket.on('completion status update', async (compStatID, compStatName, projectID, taskID) => {
        const vals = { compStatID, compStatName };
        const endpoint = `${process.env.API_URL}/projects/${projectID}/tasks/${taskID}/completion`;

        // Send PATCH request to API, then emit event confirming success, or else log the error.
        try {
            const updateResponse = await axios.patch(endpoint, vals, { validateStatus: (status) => { return status < 500 } });
            socket.emit('completion status update complete');
        } catch (error) {
            console.log(`Patch completion status - Error making API request: ${error}`);
            session.errorMessage = "Sorry, something went wrong. Please try that again."
        }
    } )
});

// Listen to the port defined in the config.env file
server.listen(process.env.PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Express listening on port ${process.env.PORT}`);
});
