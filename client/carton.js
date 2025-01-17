// This module contains functions for making API calls to the server related to cartons 

// Function to fetch all cartons from the server
export function fetchCartons() {
    return fetch('/api/getCartons')
        .then(response => response.json());
}

// Function to fetch a specific carton by ID
export function fetchCartonById(id) {
    return fetch(`/api/getCarton/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Carton not found');
            }
            return response.json();
        });
}

// Function to create a new carton
export function createCarton(data) {
    return fetch('/api/createCarton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json());
}

// Function to update an existing carton
export function updateCarton(id, data) {
    return fetch(`/api/updateCarton/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to update carton');
        }
        return response.json();
    });
}

// Function to delete a carton
export function deleteCarton(id) {
    return fetch(`/api/deleteCarton/${id}`, {
        method: 'DELETE'
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete carton');
        }
        return response.json();
    });
}

// Function for bulk deletion of cartons
export function deleteSelectedCartons(ids) {
    return fetch('/api/deleteSelectedCartons', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete selected cartons');
        }
        return response.json();
    });
}

// Function to assign eggs to cartons
export function assignEggs(date, usableEggs) {
    return fetch('/api/assignEggs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date_collected: date, usable_eggs: usableEggs })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to assign eggs');
        }
        return response.json();
    });
}