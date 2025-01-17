//This module handles the database connection and operations for the Egg Tracker application

const sqlite3 = require('sqlite3').verbose(); // Importing SQLite3 for database operations
const path = require('path'); // Importing the path module to handle file paths in a cross-platform manner

// Establishing a connection to the SQLite database file
const db = new sqlite3.Database(path.join(__dirname, '..', 'eggTracker.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');  //'egg_logs' TABLE CREATED HERE
        // Creating the 'egg_logs' table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS egg_logs ( 
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            date TEXT NOT NULL,
            eggs INTEGER NOT NULL,
            usable_eggs INTEGER,
            carton_id INTEGER
            )`, function(err) {
                if(err) {
                    console.error('Error creating egg_logs table:', err.message);
                } else {
                    console.log('Egg logs table created or already exists.');

                    // Create the 'cartons' table if it doesn't exist
                    db.run(`CREATE TABLE IF NOT EXISTS cartons (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        expiration_date TEXT NOT NULL,
                        capacity INTEGER NOT NULL,
                        date_collected TEXT
                        )`, function(err) {
                            if (err) {
                                console.error('Error creating cartons table:', err.message);
                            } else {
                                console.log('Cartons table created or already exists.');
                                
                                // Create the 'waste' table if it doesn't exist
                                db.run(`CREATE TABLE IF NOT EXISTS waste (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    date TEXT NOT NULL,
                                    eggs INTEGER NOT NULL
                                    )`, function(err) {
                                    if (err) {
                                        console.error('Error creating waste table:', err.message);
                                    } else {
                                        console.log('Waste table created or already exists.');
                                    }
                        });                
                    }
                });
            }
        });
    }
});

// Exporting the database connection for use in route handlers (like in eggRoutes.js)
module.exports = db;