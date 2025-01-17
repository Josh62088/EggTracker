const express = require('express');
const router = express.Router();
const db = require('../db/db'); // Importing the database module for SQL operations


// Route to log a new egg count entry into the database
// This route expects a POST request with 'date' and 'eggs' in the request body
// It validates the input before inserting into the 'egg_logs' table in the database
router.post('/logEgg', (req, res) => {
    const { date, eggs, usable_eggs, carton_id } = req.body;
    //Validation of input data
    if (typeof date !== 'string' || isNaN(eggs) || eggs < 0 || usable_eggs > eggs){
        return res.status(400).json({ error: 'Invalid data format' });
    }

 // Find the first carton with enough space
 db.get('SELECT id FROM cartons WHERE available_space >= ? ORDER BY expiration_date ASC LIMIT 1', [usable_eggs], (err, carton) => {
    if (err) {
        console.error('Error finding available carton:', err);
        return res.status(500).json({ error: 'Failed to find an available carton', details: err.message });
    }

    let carton_id = null;
    if (carton) {
        carton_id = carton.id;
        
        // Update carton's available space
        db.run('UPDATE cartons SET available_space = available_space - ? WHERE id = ?', [usable_eggs, carton_id], (updateErr) => {
            if (updateErr) {
                console.error('Error updating carton space:', updateErr);
                return res.status(500).json({ error: 'Failed to update carton space', details: updateErr.message });
            }
        });
    }

    // Insert the egg log with the auto-assigned carton_id
    db.run('INSERT INTO egg_logs(date, eggs, usable_eggs, carton_id) VALUES (?, ?, ?, ?)', 
        [date, eggs, usable_eggs, carton_id], 
        function(err){
            if (err) {
                console.error('Database error inserting egg log:', err);
                return res.status(500).json({ error: 'Failed to log egg count', details: err.message });
            }
            res.json({ message: 'Egg log added successfully!', id: this.lastID, carton_id: carton_id || 'Unassigned' });
        });
});

    
    // Using the database module to insert a new entry
    db.run('INSERT INTO egg_logs(date, eggs, usable_eggs, carton_id) VALUES (?, ?, ?, ?)', 
        [date, eggs, usable_eggs, carton_id || null], 
        function(err){
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

// CREATE - Add a new carton
router.post('/createCarton', (req, res) => {
    const { expiration_date, date_collected } = req.body;
    if (!expiration_date || !date_collected) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    
    db.run('INSERT INTO cartons (expiration_date, capacity, first_collected_date, last_collected_date, eggs) VALUES (?, ?, ?, ?, ?)', 
           [expiration_date, 12, date_collected, date_collected, 0], function(err) { // Changed variables to match what's available
        if (err) return res.status(500).json({ error: 'Failed to create carton'});
        res.json({ message: 'Carton created', id: this.lastID });
    });    
});

// READ - Get all cartons
router.get('/getCartons', (req, res) => {
    db.all('SELECT * FROM cartons', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch cartons' });
        res.json(rows);
    });
});

// READ - Get a specific carton by ID
router.get('/getCarton/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM cartons WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch carton'});
        if (!row) return res.status(404).json({ error: 'Carton not found' });
        res.json(row);
    });
});

// UPDATE - Update a carton's details
router.put('/updateCarton/:id', (req, res) => {
    const { id } = req.params;
    const { expiration_date, capacity, date_collected } = req.body;

    db.run('UPDATE cartons SET expiration_date = ?, capacity = ?, date_collected = ? WHERE id = ?', [expiration_date, capacity, date_collected, id], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update carton' });
        if (this.changes === 0) return res.status(404).json({ error: 'Carton not found' });
        res.json({ message: 'Carton updated successfully' });
    });
});

// DELETE - Remove a carton
router.delete('/deleteCarton/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM cartons WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to delete carton'});
        if (this.changes === 0) return res.status(404).json({ error: 'Carton not found' });
        res.json({ message: 'Carton deleted successfully' });
    });
});

// BULK DELETE - Removes selected cartons
router.post('/deleteSelectedCartons', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.some(id => !Number.isInteger(id))) {
        return res.status(400).json({ error: 'Invalid ID format for bulk deletion' });
    }

    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM cartons WHERE id IN (${placeholders})`, ids, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete selected cartons' });
        }
        res.json({ message: `${this.changes} cartons deleted successfully!` });
    });
});

router.post('/logEgg', (req, res) => {
    const { date, eggs, usable_eggs } = req.body;
    const cartonCapacity = 12; // Standard carton size
    let remainingEggs = usable_eggs; // Use usable_eggs for processing
    let promises = [];
    let fullCartonsCreated = 0;
    let partialCartonsUpdated = 0;

    db.serialize(() => {
        // First, try to fill existing partial cartons
        db.all('SELECT id, eggs FROM cartons WHERE eggs < ? ORDER BY id', [cartonCapacity], (err, partialCartons) => {
            if (err) {
                console.error('Error fetching partial cartons:', err);
                return res.status(500).json({ error: 'Failed to fetch partial cartons', details: err.message });
            }

            partialCartons.forEach(carton => {
                let spaceAvailable = cartonCapacity - carton.eggs;
                let eggsToFill = Math.min(spaceAvailable, remainingEggs);
                if (eggsToFill > 0) {
                    remainingEggs -= eggsToFill;
                    promises.push(new Promise((resolve, reject) => {
                        db.run('UPDATE cartons SET eggs = eggs + ? WHERE id = ?', 
                               [eggsToFill, carton.id], function(err) {
                            if (err) reject(err);
                            else {
                                partialCartonsUpdated++;
                                if (this.changes === 1 && carton.eggs + eggsToFill === cartonCapacity) {
                                    fullCartonsCreated++; // This carton is now full
                                }
                                resolve();
                            }
                        });
                    }));
                }
            });

            // After filling partial cartons, create new ones for remaining eggs
            while (remainingEggs > 0) {
                let eggsForCarton = Math.min(cartonCapacity, remainingEggs);
                remainingEggs -= eggsForCarton;

                promises.push(new Promise((resolve, reject) => {
                    let expirationDate = new Date(new Date(date).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 21 days from collection
                    db.run('INSERT INTO cartons (expiration_date, capacity, first_collected_date, last_collected_date, eggs) VALUES (?, ?, ?, ?, ?)', 
                           [expirationDate, cartonCapacity, date, date, eggsForCarton], function(err) {
                        if (err) {
                            console.error('Error creating new carton:', err);
                            reject(err);
                        } else {
                            // If we've created a full carton, increment fullCartonsCreated
                            if (eggsForCarton === cartonCapacity) {
                                fullCartonsCreated++;
                            }
                            // Here we would log the eggs in egg_logs if needed
                            db.run('INSERT INTO egg_logs (date, eggs, usable_eggs, carton_id) VALUES (?, ?, ?, ?)', 
                                   [date, eggsForCarton, eggsForCarton, this.lastID], 
                                   function(logErr) {
                                if (logErr) {
                                    console.error('Error logging eggs:', logErr);
                                }
                                resolve();
                            });
                        }
                    });
                }));
            }

            Promise.all(promises).then(() => {
                res.json({ 
                    message: `Processed ${usable_eggs} eggs. Created ${fullCartonsCreated} full carton(s), updated ${partialCartonsUpdated} partial carton(s).`,
                    fullCartons: fullCartonsCreated,
                    partialCartons: partialCartonsUpdated
                });
            }).catch(err => {
                console.error('Error in egg assignment:', err);
                res.status(500).json({ error: 'Failed to assign eggs', details: err.message });
            });
        });
    });
});

module.exports = router; // Exporting the router for use in server.js