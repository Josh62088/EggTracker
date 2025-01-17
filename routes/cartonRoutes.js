const express = require('express');
const router = express.Router();
const db = require('../db/db');

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

router.post('/assignEggs', (req, res) => {
    const { date_collected, usable_eggs } = req.body;
    const cartonCapacity = 12; // Fixed capacity for now
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

    let promises = [];
    let remainingEggs = usable_eggs;

    //Check for partial cartons less than a week old
    db.all('SELECT id, capacity, eggs, last_collected_date FROM cartons WHERE capacity > eggs AND (julianday(\'now\') - julianday(last_collected_date)) * 24 * 60 * 60 * 1000 < ? ORDER BY id', [oneWeekMs], (err, partialCartons) => {
        if (err) {
            console.error('Error checking for partial cartons:', err);
            return res.status(500).json({ error: 'Error checking for partial cartons', details: err.message });
        }

        let eggsToCombine = 0;
        let combinedCartonId;
        let partialCarton;

        //First, try to combine existing partial cartons
        for (partialCarton of partialCartons) {
            if (eggsToCombine + partialCarton.eggs <= cartonCapacity) {
                eggsToCombine += partialCarton.eggs;
                promises.push(new Promise((resolve, reject) => {
                    db.run('UPDATE cartons SET eggs = 0 WHERE id = ?',
                            [partialCarton.id], function(err) {
                        if (err) reject(err);
                        else resolve(`Emptied partial carton ${partialCarton.id}`);
                    });
                }));
            } else {
                //If this carton would make us exceed capacity, we stop here
                break;
            }
        }

        // If we've combined enough eggs, update or create a new carton
        if(eggsToCombine > 0) {
            if (eggsToCombine === cartonCapacity) {
                // If we have exactly a dozen, update the last carton we took eggs from
                combinedCartonId = partialCartons[partialCartons.length -1].id;
                promises.push(new Promise((resolve, reject) => {
                    db.run('UPDATE cartons SET eggs = ?, last_collected_date = ? WHERE id = ?',
                            [cartonCapacity, date_collected, combinedCartonId], function(err) {
                        if (err) reject(err);
                        else resolve(`Filled carton ${combinedCartonId} to capacity`);
                    });
                }));
            } else {
                // If combined eggs are less than 12 add to remaining eggs
                remainingEggs += eggsToCombine;
            }
        }
        /*while(partialCarton && remainingEggs > 0) {
            let spaceAvailable = partialCarton.capacity - partialCarton.eggs;
            let eggsToFill = Math.min(spaceAvailable, remainingEggs);
            remainingEggs -= eggsToFill;

            promises.push(new Promise((resolve, reject) => {
                db.run('UPDATE cartons SET eggs = eggs + ?, last_collected_date = ? WHERE id = ?', 
                       [eggsToFill, date_collected, partialCarton.id], function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`Filled partial carton ${partialCarton.id} with ${eggsToFill} eggs`);
                        resolve();
                        
                        // Check if there's still space for more eggs
                        if (remainingEggs > 0) {
                            db.get('SELECT id, capacity, eggs, last_collected_date FROM cartons WHERE capacity > eggs AND (julianday(\'now\') - julianday(last_collected_date)) * 24 * 60 * 60 * 1000 < ? ORDER BY id LIMIT 1', [oneWeekMs], (err, nextPartialCarton) => {
                                if (err) {
                                    console.error('Error checking for next partial carton:', err);
                                    reject(err);
                                } else {
                                    partialCarton = nextPartialCarton;
                                }
                            });
                        } else {
                            partialCarton = null; // No more eggs to fill or no more space
                        }
                    }
                });
            }));
        }*/

        // Now handle any remaining eggs after filling partial cartons
        let cartonsToCreate = Math.floor(remainingEggs / cartonCapacity);
        let finalRemaining = remainingEggs % cartonCapacity;

        for (let i = 0; i < cartonsToCreate; i++) {
            let expirationDate = new Date(new Date(date_collected).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            promises.push(new Promise((resolve, reject) => {
                db.run('INSERT INTO cartons (expiration_date, capacity, first_collected_date, last_collected_date, eggs) VALUES (?, ?, ?, ?, ?)', 
                       [expirationDate, cartonCapacity, date_collected, date_collected, cartonCapacity], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            }));
        }

        // If there's still a remainder, create one more partial carton
        if (finalRemaining > 0) {
            let expirationDate = new Date(new Date(date_collected).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            promises.push(new Promise((resolve, reject) => {
                db.run('INSERT INTO cartons (expiration_date, capacity, first_collected_date, last_collected_date, eggs) VALUES (?, ?, ?, ?, ?)', 
                       [expirationDate, finalRemaining, date_collected, date_collected, finalRemaining], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            }));
        }

        Promise.all(promises).then(results => {
            res.json({ 
                message: `Assigned ${usable_eggs - finalRemaining} eggs to cartons, ${finalRemaining} eggs remain unassigned or partially fill a carton.`,
                cartonsFilledOrCreated: cartonsToCreate + (partialCarton ? 1 : 0),
                unassigned: finalRemaining
            });
        }).catch(err => {
            console.error('Error in egg assignment:', err);
            res.status(500).json({ error: 'Failed to assign eggs', details: err.message });
        });
    });
});

module.exports = router;