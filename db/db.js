//This module handles the database connection and operations for the Egg Tracker application

const sqlite3 = require('sqlite3').verbose(); // Importing SQLite3 for database operations
const path = require('path'); // Importing the path module to handle file paths in a cross-platform manner
const fs = require('fs'); //Importing fs for reading files

// Establishing a connection to the SQLite database file
const db = new sqlite3.Database(path.join(__dirname, 'eggTracker.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');  //'egg_logs' TABLE CREATED HERE

        //Function to run SQL file
        function runSqlFile(filePath) {
            const sql = fs.readFileSync(filePath, 'utf8');
            db.exec(sql, (err) => {
                if (err) {
                    console.error(`Error executing ${filePath}:`, err.message);
                } else {
                    console.log (`${filePath} executed successfully.`);
                }
            });
        }

             // Run SQL scripts
            runSqlFile(path.join(__dirname, 'create_tables.sql'));
            runSqlFile(path.join(__dirname, 'alter_tables.sql'));
            runSqlFile(path.join(__dirname, 'seed_data.sql'));
        }
        
    });

// Exporting the database connection for use in route handlers (like in eggRoutes.js)
module.exports = db;

//Close the database connection when your applicatoin shuts down
process.on('exit', () => db.close());
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed due to app termination');
        process.exit(0);
    });
});