// This is the main client-side script that ties together UI, API, and event handling

import { populateTable, updateTotalEggs } from './ui.js'; // Import UI manipulation functions
import { fetchEggLogs, logEggCount, updateEggLog } from './api.js'; // Import API call functions
import { fetchCartons, createCarton, fetchCartonById, updateCarton, deleteCarton, deleteSelectedCartons, assignEggs } from './carton.js'; // Import carton-related API functions

document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('eggForm');
    const cartonForm = document.getElementById('cartonForm'); //Form for creating new cartons
    const cartonSelect = document.getElementById('cartonSelect');
    const selectAllCartons = document.getElementById('selectAllCartons'); // Checkbox to select all cartons
    const deleteSelectedCartonsButton = document.getElementById('deleteSelectedCartons');// Button for bulk deletion

    // Function to load egg logs from the server and update the UI
    function loadAndDisplayLogs(){
        Promise.all([fetchEggLogs(), fetchCartons()])        
            .then(([logs, cartons]) => {
                populateTable(logs); // Update table with logs
                updateTotalEggs(logs); // Update total egg count
                populateCartonTable(cartons); // Populate carton table
            })
            .catch(error => {
                console.error('Error fetching logs:', error);
                alert('Failed to load egg logs.  Please try again.');
            });
    }
    
    // Load logs when the page loads or refreshes
    loadAndDisplayLogs();

    // Event listener for form submission to log new egg count with date
    form.addEventListener('submit', function(e){
        e.preventDefault();

        const dateInput = document.getElementById('date');
        const eggsInput = document.getElementById('eggs');
        const usableEggsInput = document.getElementById('usableEggs');
        const date = dateInput.value;
        const eggs = parseInt(eggsInput.value, 10);
        const usableEggs = parseInt(usableEggsInput.value, 10) || eggs; // If no usable eggs input, use total eggs

        // Validate user input to ensure it's a number within a reasonable range
        if (!date || isNaN(eggs) || eggs < 0 || eggs > 1000) {
            alert('Please enter a valid date and number of eggs between 0 and 1000');
            return;
        }

        // Prepare data object for the new entry
        const entry = {
            date: date,
            eggs: eggs,
            usable_eggs: usableEggs,
        };

        // Send the new egg count to the server
        logEggCount(entry)
            .then(data => {
                // Check if the server returned an error
                if (data.error) {
                    alert(data.error);
                    return;
                }
                // If successful, refresh the logs to show the new entry
                handleEggAssignment(date, usableEggs); 
                // Clear the input field and set focus for the next entry
                dateInput.value= '';
                eggsInput.value = '';
                dateInput.focus();
            })
            .catch((error) => {
                // Log the error for debugging and inform the user
                console.error('Error:', error);
                alert('There was an error logging the egg count.  Please try again.');
            });
    });

    // Event listener for carton form submission
    cartonForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const expirationDate = document.getElementById('expirationDate').value;
        const capacity = parseInt(document.getElementById('capacity').value, 10);

        //Validate input
        if (!expirationDate || isNaN(capacity) || capacity <= 0) {
            alert('Please enter a valid expiration date and positive capacity');
            return;
        }

        createCarton({ expiration_date: expirationDate, capacity: capacity })
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            alert('New carton created successfully!');
            loadAndDisplayLogs(); // Refresh carton list and logs
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an error creating the carton.  Please try again.');
        });

        // Clear the form for next use
        e.target.reset();
    });

    // Event listener for selecting all cartons
    selectAllCartons.addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('#cartonTable input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });

    // Event listener for bulk deletion of cartons
    deleteSelectedCartonsButton.addEventListener('click', function() {
        const selectedCartonIds = Array.from(document.querySelectorAll('#cartonTable input[type="checkbox"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        if (selectedCartonIds.length === 0) {
            alert('No cartons selected for deletion.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedCartonIds.length} cartons?`)) {
            deleteSelectedCartons(selectedCartonIds)
                .then(() => {
                    alert('Selected cartons deleted successfully!');
                    loadAndDisplayLogs(); // Refresh the page with updated data
                })
                .catch(error => {
                    console.error('Error deleting selected cartons:', error);
                    alert('There was an error deleting the selected cartons. Please try again.');
                });
        }
    });

// Event listener for individual carton deletion
document.querySelector('#cartonTable').addEventListener('click', function(e) {
    if (e.target && e.target.className === 'delete') {
        const id = e.target.getAttribute('data-id');
        const row = e.target.closest('tr');

        if (confirm('Are you sure you want to delete this carton?')) {
            deleteCarton(id)
                .then(() => {
                    row.remove(); // Remove the row from the table after successful deletion
                    alert('Carton deleted successfully!');
                    loadAndDisplayLogs(); // Refresh the UI to reflect the change
                })
                .catch(error => {
                    console.error('Error deleting carton:', error);
                    alert('There was an error deleting the carton. Please try again.');
                });
        }
    }
});

    function populateCartonTable(cartons) {
        const tableBody = document.querySelector('#cartonTable tbody');
        tableBody.innerHTML = '';
        cartons.forEach(carton => {
            console.log('Carton data:', carton); // Debug log to check what data is received
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td><input type="checkbox" value="${carton.id}"></td>
                <td>${carton.id}</td>
                <td>From: ${carton.first_collected_date || carton.date_collected} - To: ${carton.last_collected_date || carton.date_collected} - Expires: ${carton.expiration_date}</td>
                <td>12</td> <!-- Fixed capacity -->
                <td>${Math.max(0, 12 - carton.eggs)}</td> <!-- Correct calculation with fixed capacity -->
                <td><button class="delete" data-id="${carton.id}">Delete</button></td>
            `;
        });
    }

    function handleEggAssignment(date, usableEggs) {
        assignEggs(date, usableEggs)
            .then(data => {
                let message = data.message;
                if(data.partialFill) {
                    message += ` Partial carton created with ID: ${data.partialFill.id}, containing ${data.partialFil.eggs} eggs.`;
                }
                if (data.unassigned > 0) {
                    message += ` ${data.unassigned} eggs are unassigned and will be tracked for later assignment.`
                }
                alert(message);
                loadAndDisplayLogs(); //Refresh UI
            })
            .catch(error => {
                console.error('Error assigning eggs:', error);
                alert('There was an error assigning eggs. Please try again.');
            });
    }
});

