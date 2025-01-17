
// This module contains functions for manipulating the DOM and updating the UI

import { fetchEggLogs, logEggCount, deleteEggLog, deleteSelectedEggLogs, updateEggLog } from './api.js'; // Import API call functions
import { fetchCartonById, updateCarton, deleteCarton } from './carton.js'; // Import carton-related functions

// Function to populate the egg log table with data
// Called after fetching logs from the server via api.js
export function populateTable(logs) {
    const tableBody = document.querySelector('#eggTable tbody');
    tableBody.innerHTML = '';
    logs.forEach(log => {
        const row = tableBody.insertRow();
        const cellCheckbox = row.insertCell(0);
        const cellDate = row.insertCell(1);
        const cellEggs = row.insertCell(2);
        const cellEdit = row.insertCell(3); // Cell for edit button
        const cellDelete = row.insertCell(4); // Cell for delete button
        cellCheckbox.innerHTML = `<input type="checkbox" class="select-entry" data-id="${log.id}"> `;
        cellDate.textContent = log.date;
        cellEggs.textContent = log.eggs;
        cellEdit.appendChild(createEditButton(log.id)); // Attach Edit button
        cellDelete.appendChild(createDeleteButton(log.id)); // Attach Delete button
    });
}

// Function to get selected entries
function getSelectedEntries() {
    return Array.from(document.querySelectorAll('.select-entry:checked')).map(checkbox => checkbox.getAttribute('data-id'));
}

// Function to handle bulk deletion
function handleBulkDelete() {
    const selectedEntries = getSelectedEntries();
    if (selectedEntries.length === 0) {
        alert('No entries selected for deletion.');
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedEntries.length} entries?`)) {
    deleteSelectedEggLogs(selectedEntries)
    .then(() => {
        selectedEntries.forEach(id => {
            const row = document.querySelector(`tr [data-id="${id}"]`).closest ('tr');
            row.remove();
        });
        updateTotalEggs(); // Refresh total egg count after deletion
    })
    .catch(error => {
        console.error('Error deleting selected egg logs:', error);
        alert('There was an error deleting the selected egg logs.  Please try again.');
        });
    }
}

// Attach event listener for bulk deletion
document.getElementById('deleteSelected').addEventListener('click', handleBulkDelete);

// Function to create a delete button for each log entry
// This button triggers the delete action when clicked
export function createDeleteButton(id) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';
    deleteButton.setAttribute('data-id', id);
    deleteButton.addEventListener('click', handleDeleteClick);
    return deleteButton;
}

// Event handler for when the delete button is clicked
// It confirms the action with the user before calling the API to delete the entry
function handleDeleteClick(event) {
    const id = event.target.getAttribute('data-id');
    const row = event.target.closest('tr');

    if (confirm('Are you sure you want to delete this entry?')){
        deleteEggLog(id) // Using the API function from api.js
            .then(() => {
                row.remove(); // Remove the row from the table after successful deletion
                updateTotalEggs(); // Recalculate the total eggs after deletion
            })
            .catch(error => {
                console.error('Error deleting egg log:', error);
                alert('There was an error deleting the egg log. Please try again.');
            });
    }
}

// Function to update the total egg count display
// This is called whenever logs are fetched or altered
export function updateTotalEggs(logs) {
    fetchEggLogs() // Using the API function from api.js to get latest logs
        .then(logs => {
            const totalEggsDiv = document.getElementById('totalEggs');
            const totalEggs = logs.reduce((sum, log) => sum + log.eggs, 0);
            totalEggsDiv.textContent = `Total Eggs: ${totalEggs}`;
        });    
}

//Function to create an edit button for each log entry
export function createEditButton(id) {
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit';
    editButton.setAttribute('data-id', id);
    editButton.addEventListener('click' , handleEditClick);
    return editButton;
}

// Function to handle the edit click event
function handleEditClick(event) {
    const id = event.target.getAttribute('data-id');
    const row = event.target.closest('tr');
    const dateCell = row.cells[1]; // Assuming date is in the second column
    const eggsCell = row.cells[2]; // Assuming eggs are in the third column

// Store the original date before turning it into an input field
const originalDate = dateCell.textContent;
dateCell.dataset.originalDate = originalDate; // Store it in a data attribute

// Convert the date string to the correct format for the date input
const dateParts = originalDate.split('/');
let formattedDate = '';
if (dateParts.length === 3){
    formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
} else {
    formattedDate = originalDate; // If not in expected format, use as is or handle differently
}

// Convert cells to editable inputs
dateCell.innerHTML = `<input type="date" value="${formattedDate}">`;
eggsCell.innerHTML = `<input type="number" value="${eggsCell.textContent}" min="0" max="1000">`;
cartonID.innerHTML = `<input type="number" value="${cartonID.textContent}">`;
// Change the edit button to a save button
event.target.textContent = 'Save';
event.target.removeEventListener('click', handleEditClick);
event.target.addEventListener('click', () => handleSaveClick(id, row));
}

// Function to handle saving changes
function handleSaveClick(id, row) {
    const dateInput = row.cells[1].querySelector('input');
    const eggsInput = row.cells[2].querySelector('input');

    let dateValue = dateInput.value || row.cells[1].dataset.originalDate;
    // Ensure date is in the correct format before creating a Date object
   
    const newEntry = {
        id: id,
        date: dateValue,
        eggs: parseInt(eggsInput.value)
    };

    // Validate input
    if (isNaN(newEntry.eggs) || newEntry.eggs < 0 || newEntry.eggs > 1000) {
        alert('Please enter a valid number of eggs between 0 and 1000.');
        return;
    }

    updateEggLog(newEntry)
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            // Update UI to reflect changes
  
            row.cells[1].textContent = newEntry.date;
            row.cells[2].textContent = newEntry.eggs;

            // Change the save button back to edit
            const editButton = row.cells[3].querySelector('button'); // Assuming the button is in the 4th cell
            if(editButton) {
                editButton.textContent = 'Edit';
                editButton.removeEventListener('click', handleSaveClick);
                editButton.addEventListener('click', handleEditClick);
            }

            updateTotalEggs(); // Assuming you have a function to update total Eggs
        })
        .catch(error => {
            console.error('Error updating egg log:', error);
            alert('There was an error updating the egg log. Please try again.');
        });
}

// Function to populate the carton selection when editing an egg log
export function updateCartonSelection(cartons) {
    const cartonSelect = document.getElementById('cartonSelect');
    cartonSelect.innerHTML = '<option value="">Select a carton</option>';
    cartons.forEach(carton => {
        const option = document.createElement('option');
        option.value = carton.id;
        option.textContent = `Carton ${carton.id} - Expires; ${carton.expiration_date}, Capacity: ${carton.capacity}`;
        cartonSelect.appendChild(option);
    });    
}

// Function to handle editing a carton
export function handleCartonEditClick(event) {
    const id = event.target.getAttribute('data-id');
    const row = event.target.closest('tr');
    const expirationCell = row.cells [1]; //Assuming expiration date is in the second column
    const capacityCell = row.cells[2]; // Assuming capacity is in the third column

    //Convert cells to editable inputs
    expirationCell.innerHTML = `<input type="date" value="$expirationCell.textContent}">`;
    capacityCell.innerHTML= `<input type="number" value="${capacityCell.textContent}" min="1">`;

    //Change the edit button to a save button
    event.target.textContent = 'Save';
    event.target.removeEventListener('click', handleCartonEditClick);
    event.target.addEventListener('click', () => handleCartonSaveClick(id, row));
}

// Function to handle saving changes to a carton
function handleCartonSaveClick(id, row) {
    const expirationInput = row.cells[1].querySelector('input');
    const capacityInput = row.cells[2].querySelector('input');
    const expirationDate = expirationInput.value;
    const capacity = parseInt(capacityInput.value, 10);

    if (!expirationDate || isNaN(capacity) || capacity <= 0) {
        alert('Please enter a valid expiration date and positive capacity');
        return;
    }
    updateCarton(id, { expiration_date: expirationDate, capacity: capacity })
        .then(() => {
            row.cells[1].textContent = expirationDate;
            row.cells[2].textContent = capacity;

            // Change the save button back to edit
            const editButton = row.cells[3].querySelector('button'); //Assuming the button is in the 4th cell
            if (editButton) {
                editButton.textContent = 'Edit';
                editButton.removeEventListener('click', handleCartonSaveClick);
                editButton.addEventListener('click', handleCartonEditClick);
            }

            alert('Carton updated successfully!');
        })
        .catch(error => {
            console.error('Error updating carton:', error);
            alert('There was an error updating the carton. Please try again.');
        });
}

// Function to handle deleting a carton
export function handleCartonDeleteClick(event) {
    const id = event.target.getAttribute('data-id');
    const row = event.target.closest('tr');

    if (confirm('Are you sure you want to delete this carton?')) {
        deleteCarton(id)
            .then(() => {
                row.remove(); // Remove the row from the table after successful deletion
                alert('Carton deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting carton:', error);
                alert('There was an error deleting the carton. Please try again');
            });
    }
}