// Main application logic for 1M House
import { initCalendar, initTabs } from './calendar.js';
import { 
    getRooms, 
    getLocations, 
    addRoom, 
    updateRoom, 
    deleteRoom, 
    addLocation, 
    updateLocation, 
    deleteLocation 
} from './firebase.js';
import { showNotification } from './auth.js';

// DOM Elements for rooms management
const roomsList = document.getElementById('rooms-list');
const roomForm = document.getElementById('room-form');
const roomNameInput = document.getElementById('room-name');
const roomLocationSelect = document.getElementById('room-location');
const roomCapacityInput = document.getElementById('room-capacity');
const roomColorInput = document.getElementById('room-color');
const roomIdInput = document.getElementById('room-id');
const deleteRoomBtn = document.getElementById('delete-room');
const cancelRoomEditBtn = document.getElementById('cancel-room-edit');

// DOM Elements for locations management
const locationsList = document.getElementById('locations-list');
const locationForm = document.getElementById('location-form');
const locationNameInput = document.getElementById('location-name');
const locationAddressInput = document.getElementById('location-address');
const locationIdInput = document.getElementById('location-id');
const deleteLocationBtn = document.getElementById('delete-location');
const cancelLocationEditBtn = document.getElementById('cancel-location-edit');

// Initialize application
async function initApp() {
    try {
        // Initialize tabs
        initTabs();
        
        // Initialize calendar
        await initCalendar();
        
        // Initialize rooms management
        roomForm.addEventListener('submit', handleRoomSubmit);
        deleteRoomBtn.addEventListener('click', handleDeleteRoom);
        cancelRoomEditBtn.addEventListener('click', resetRoomForm);
        
        // Initialize locations management
        locationForm.addEventListener('submit', handleLocationSubmit);
        deleteLocationBtn.addEventListener('click', handleDeleteLocation);
        cancelLocationEditBtn.addEventListener('click', resetLocationForm);
        
        // Load rooms and locations when admin state changes
        document.addEventListener('adminStateChanged', async (e) => {
            if (e.detail.isAdmin) {
                await loadRooms();
                await loadLocations();
                await populateLocationSelect();
            }
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error initializing application. Please refresh.', 'error');
    }
}

// Rooms Management
async function loadRooms() {
    try {
        const rooms = await getRooms();
        const locations = await getLocations();
        
        // Create rooms list
        roomsList.innerHTML = '';
        
        rooms.forEach(room => {
            const location = locations.find(loc => loc.id === room.locationId);
            const locationName = location ? location.name : 'Unknown Location';
            
            const roomElement = document.createElement('div');
            roomElement.className = 'list-item';
            roomElement.innerHTML = `
                <div>
                    <strong>${room.name}</strong> (${locationName})
                    <span style="display: inline-block; width: 15px; height: 15px; background-color: ${room.color}; border: 1px solid #ddd; margin-left: 5px; vertical-align: middle;"></span>
                </div>
                <div class="list-item-action">
                    <button class="edit-btn" data-id="${room.id}">Edit</button>
                    <button class="delete-btn" data-id="${room.id}">Delete</button>
                </div>
            `;
            
            // Add event listeners
            roomElement.querySelector('.edit-btn').addEventListener('click', () => editRoom(room.id));
            roomElement.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteRoom(room.id));
            
            roomsList.appendChild(roomElement);
        });
    } catch (error) {
        console.error('Error loading rooms:', error);
        showNotification('Error loading rooms', 'error');
    }
}

async function populateLocationSelect() {
    try {
        const locations = await getLocations();
        
        roomLocationSelect.innerHTML = '';
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            roomLocationSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating location select:', error);
    }
}

async function editRoom(roomId) {
    try {
        const rooms = await getRooms();
        const room = rooms.find(r => r.id === roomId);
        
        if (!room) {
            throw new Error('Room not found');
        }
        
        // Populate form
        roomNameInput.value = room.name;
        roomLocationSelect.value = room.locationId;
        roomCapacityInput.value = room.capacity || 1;
        roomColorInput.value = room.color || '#4CAF50';
        roomIdInput.value = room.id;
        
        // Show delete button
        deleteRoomBtn.style.display = 'block';
        
        // Scroll to form
        roomForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing room:', error);
        showNotification('Error loading room details', 'error');
    }
}

function resetRoomForm() {
    roomForm.reset();
    roomIdInput.value = '';
    deleteRoomBtn.style.display = 'none';
    roomColorInput.value = '#4CAF50';
    roomCapacityInput.value = 1;
}

async function handleRoomSubmit(e) {
    e.preventDefault();
    
    try {
        const roomData = {
            name: roomNameInput.value,
            locationId: roomLocationSelect.value,
            capacity: parseInt(roomCapacityInput.value) || 1,
            color: roomColorInput.value
        };
        
        const roomId = roomIdInput.value;
        
        if (roomId) {
            // Update existing room
            await updateRoom(roomId, roomData);
            showNotification('Room updated successfully', 'success');
        } else {
            // Add new room
            await addRoom(roomData);
            showNotification('Room added successfully', 'success');
        }
        
        // Reset form and refresh lists
        resetRoomForm();
        await loadRooms();
        await initCalendar(); // Refresh calendar
    } catch (error) {
        console.error('Error saving room:', error);
        showNotification(error.message || 'Error saving room', 'error');
    }
}

async function confirmDeleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room? This will NOT delete any existing bookings.')) {
        return;
    }
    
    try {
        await deleteRoom(roomId);
        showNotification('Room deleted successfully', 'success');
        await loadRooms();
        await initCalendar(); // Refresh calendar
    } catch (error) {
        console.error('Error deleting room:', error);
        if (error.message.includes('existing bookings')) {
            showNotification('Cannot delete room with existing bookings', 'error');
        } else {
            showNotification('Error deleting room', 'error');
        }
    }
}

async function handleDeleteRoom() {
    if (!roomIdInput.value) {
        return;
    }
    
    await confirmDeleteRoom(roomIdInput.value);
    resetRoomForm();
}

// Locations Management
async function loadLocations() {
    try {
        const locations = await getLocations();
        
        // Create locations list
        locationsList.innerHTML = '';
        
        locations.forEach(location => {
            const locationElement = document.createElement('div');
            locationElement.className = 'list-item';
            locationElement.innerHTML = `
                <div>
                    <strong>${location.name}</strong>
                    <br>
                    <small>${location.address}</small>
                </div>
                <div class="list-item-action">
                    <button class="edit-btn" data-id="${location.id}">Edit</button>
                    <button class="delete-btn" data-id="${location.id}">Delete</button>
                </div>
            `;
            
            // Add event listeners
            locationElement.querySelector('.edit-btn').addEventListener('click', () => editLocation(location.id));
            locationElement.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteLocation(location.id));
            
            locationsList.appendChild(locationElement);
        });
    } catch (error) {
        console.error('Error loading locations:', error);
        showNotification('Error loading locations', 'error');
    }
}

async function editLocation(locationId) {
    try {
        const locations = await getLocations();
        const location = locations.find(l => l.id === locationId);
        
        if (!location) {
            throw new Error('Location not found');
        }
        
        // Populate form
        locationNameInput.value = location.name;
        locationAddressInput.value = location.address;
        locationIdInput.value = location.id;
        
        // Show delete button
        deleteLocationBtn.style.display = 'block';
        
        // Scroll to form
        locationForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing location:', error);
        showNotification('Error loading location details', 'error');
    }
}

function resetLocationForm() {
    locationForm.reset();
    locationIdInput.value = '';
    deleteLocationBtn.style.display = 'none';
}

async function handleLocationSubmit(e) {
    e.preventDefault();
    
    try {
        const locationData = {
            name: locationNameInput.value,
            address: locationAddressInput.value
        };
        
        const locationId = locationIdInput.value;
        
        if (locationId) {
            // Update existing location
            await updateLocation(locationId, locationData);
            showNotification('Location updated successfully', 'success');
        } else {
            // Add new location
            await addLocation(locationData);
            showNotification('Location added successfully', 'success');
        }
        
        // Reset form and refresh lists
        resetLocationForm();
        await loadLocations();
        await populateLocationSelect();
    } catch (error) {
        console.error('Error saving location:', error);
        showNotification(error.message || 'Error saving location', 'error');
    }
}

async function confirmDeleteLocation(locationId) {
    if (!confirm('Are you sure you want to delete this location? This will NOT delete any rooms or bookings.')) {
        return;
    }
    
    try {
        await deleteLocation(locationId);
        showNotification('Location deleted successfully', 'success');
        await loadLocations();
        await populateLocationSelect();
    } catch (error) {
        console.error('Error deleting location:', error);
        if (error.message.includes('existing rooms')) {
            showNotification('Cannot delete location with existing rooms', 'error');
        } else {
            showNotification('Error deleting location', 'error');
        }
    }
}

async function handleDeleteLocation() {
    if (!locationIdInput.value) {
        return;
    }
    
    await confirmDeleteLocation(locationIdInput.value);
    resetLocationForm();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);