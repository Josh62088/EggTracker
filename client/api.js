// This module contains functions for making API calls to the server

// Function to fetch all egg logs from the server
// Used by index.js to populate the table and update total count
export function fetchEggLogs() {
    return fetch ('/api/getEggLogs')
        .then(response => response.json());
}

// Function to log a new egg count to the server
// Called when a user submits the form in index.js
export function logEggCount(data) {
    return fetch('/api/logEgg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        //Handle the response here, e.g., update UI with fullCartons, partial cartons info

    })
}

// Function to delete an egg log entry from the server
// Invoked when a user decides to delete an entry in the UI
export function deleteEggLog(id) {
    return fetch(`/api/deleteEggLog/${id}`, {
        method: 'DELETE'
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

// Function to handle bulk deletion
export function deleteSelectedEggLogs(ids) {
    return fetch('/api/deleteSelectedEggLogs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids })
    }).then(response => {
        if (!response.ok){
            throw new Error ('Network response was not ok');
        }
        return response.json();
    });
}

// Function to update an egg log entry
export function updateEggLog(data) {
    return fetch(`/api/updateEggLog/${data.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: data.date, eggs: data.eggs })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}