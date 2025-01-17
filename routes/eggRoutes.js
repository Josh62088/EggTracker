const express = require('express');
const router = express.Router();
const db = require('../db/db'); // Importing the database module for SQL operations

// Route to log a new egg count entry into the database
// This route expects a POST request with 'date' and 'eggs' in the request body
// It validates the input before inserting into the 'egg_logs' table in the database
router.post('/logEgg', (req, res) => {
    const { date, eggs, usable_eggs } = req.body;
    //Validation of input data
    if (typeof date !== 'string' || isNaN(eggs) || eggs < 0 || usable_eggs > eggs) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    // Using the database module to insert a new entry
    db.run('INSERT INTO egg_logs(date, eggs, usable_eggs, carton_assignment) VALUES (?, ?,?, ?)', [date, eggs, usable_eggs, carton_assignment], function(err){
        if (err) {
            console.error('Database error inserting egg log:', err);
            console.error('Request body:', req.body); // Log what was recieved
            console.error('SQL statement:', this.sql); // Log the SQL statement executed
            return res.status(500).json({ error: 'Failed to log egg count', details: err.message });
        }
        // Respond with success message and the new entry's ID
        res.json({ message: 'Egg log added successfully!', id: this.lastID });
    });
});

// Route to retrieve all egg log entries from the database
// This sends back all records from the 'egg_logs' table
// The data is used to populate the table on the front end (see ui.js)
router.get('/getEggLogs', (req, res) => {
    db.all('SELECT * FROM egg_logs', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch egg logs'});
         }
         // Send the fetched logs as JSON to the client, which will use it to update the UI
         res.json(rows); //Send the data back
    });
});

// Route to delete an egg log entry
// This expects a DELETE request with the ID of the entry to delete in the URL parameters
// It uses the database module to remove the entry from the 'egg_logs' table
router.delete('/deleteEggLog/:id', (req, res) => {
    console.log('attempting to delete log with ID:', req.params.id);
    const { id } = req.params;
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    db.run('DELETE FROM egg_logs WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete egg log'});
        }
        // Check if any row was affected by the DELETE operation
        if (this.changes === 0) {
            return res.status(404).json({ error: 'No log found with that ID'});
        }
        // Respond with an success message if deletion was successful
        res.json({ message: 'Egg log deleted successfully!'});
    });
});

// Route for bulk deletion of egg logs
router.post('/deleteSelectedEggLogs', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.some(isNaN)) {
        return res.status(400).json({ error: 'Invalid ID format for bulk deletion'});
    }

    const placeholders = ids.map(() => '?').join(',');
        db.run(`DELETE FROM egg_logs WHERE id IN (${placeholders})`, ids, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete selected egg logs' });
            }
        res.json({ message: `${this.changes} egg logs deleted successfully!`});
    });
});


//Rout to update an egg log entry
router.put('/updateEggLog/:id', (req, res) => {
    const { id } = req.params;
    const { date, eggs } = req.body;

    if (typeof date !== 'string' || isNaN(eggs) || eggs < 0 || eggs > 1000 || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    db.run('UPDATE egg_logs SET date = ?, eggs = ? WHERE id = ?', [date, eggs, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update selected egg logs' });
        }
        res.json({ message: `Date successfully updated!`});
    });
});

module.exports = router; // Exporting the router for use in server.js