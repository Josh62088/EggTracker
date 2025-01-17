const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const eggRoutes = require('./routes/eggRoutes');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public'))); //Serve static files from 'public' folder

app.use('/client', express.static(path.join(__dirname, 'client')));

app.use(morgan('dev')); //Logging middleware

app.use('/api', eggRoutes); //Mounting the eggRoutes under /api

app.use('/api', require('./routes/cartonRoutes')); //Mounting the cartonRoutes under /api

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

process.on('uncaughtExeption', (err) => {
    console.error('Uncaught Exception: ', err);
    process.exit(1); // Exit the process with failure
});

process.on('unhandledRejection', (reason, promis) => {
    console.error('Unhandled Rejection at:', promis, 'reason:', reason);
});