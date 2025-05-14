// Calendar functionality for 1M House
import { database } from './firebase-config.js';
import { isAuthenticated } from './auth.js';
import { 
    ref, 
    onValue, 
    push, 
    update, 
    remove, 
    get, 
    set 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// DOM Elements
const calendarEl = document.getElementById('calendar');
const bookingModal = document.getElementById('bookingModal');
const roomsModal = document.getElementById('roomsModal');
const locationsModal = document.getElementById('locationsModal');
const bookingForm = document.getElementById('bookingForm');
const roomForm = document.getElementById('roomForm');
const locationForm = document.getElementById('locationForm');
const roomsList = document.getElementById('roomsList');
const locationsList = document.getElementById('locationsList');
const roomSelect = document.getElementById('roomSelect');
const roomLocation = document.getElementById('roomLocation');
const modalTitle = document.getElementById('modalTitle');
const bookingId = document.getElementById('bookingId');
const locationDropdown = document.getElementById('locationDropdown');

// Close buttons for modals
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        bookingModal.style.display = 'none';
        roomsModal.style.display = 'none';
        locationsModal.style.display = 'none';
    });
});

// Global variables
let calendar;
let currentBookings = [];
let rooms = [];
let locations = [];
let currentLocation = 'Granada, Spain';

// Initialize calendar
export function initCalendar() {
    // Create calendar instance
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'resourceTimelineMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
        },
        selectable: true,
        selectMirror: true,
        editable: isAuthenticated(),
        resourceAreaHeaderContent: 'Rooms',
        resourceLabelDidMount: function(info) {
            // Style the resource labels
            info.el.style.padding = '8px';
        },
        eventClick: handleEventClick,
        select: handleDateSelect,
        events: [], // Will be populated from Firebase
        resources: [], // Will be populated from Firebase
        resourceOrder: 'title',
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
    });
    
    // Render the calendar
    calendar.render();
    
    // Load data from Firebase
    loadLocations();
    loadRooms();
    loadBookings();
    
    // Initialize form event listeners
    initFormHandlers();
    
    // Initialize location dropdown
    initLocationDropdown();
}

// Initialize location dropdown
function initLocationDropdown() {
    document.querySelectorAll('.dropdown-content a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.classList.contains('disabled')) {
                return;
            }
            
            const value = this.getAttribute('data-value');
            const text = this.textContent;
            
            // Update dropdown button text
            locationDropdown.textContent = text;
            currentLocation = text;
            
            // Update active class
            document.querySelectorAll('.dropdown-content a').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
            
            // If we had multiple locations, we would reload data based on selected location
            // For now, we'll just simulate that
            if (value === 'granada') {
                // Default location is already loaded
            }
        });
    });
}

// Load locations from Firebase
function loadLocations() {
    const locationsRef = ref(database, 'locations');
    
    onValue(locationsRef, (snapshot) => {
        locations = [];
        roomLocation.innerHTML = '';
        locationsList.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            const locationData = childSnapshot.val();
            const locationKey = childSnapshot.key;
            
            locations.push({
                id: locationKey,
                name: locationData.name,
                address: locationData.address
            });
            
            // Populate location select dropdown
            const option = document.createElement('option');
            option.value = locationKey;
            option.textContent = locationData.name;
            roomLocation.appendChild(option);
            
            // Populate locations list for admin
            if (isAuthenticated()) {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.innerHTML = `
                    <div>
                        <strong>${locationData.name}</strong><br>
                        ${locationData.address}
                    </div>
                    <button class="delete-btn" data-id="${locationKey}">Delete</button>
                `;
                locationsList.appendChild(listItem);
                
                // Add delete event listener
                listItem.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteLocation(locationKey);
                });
            }
        });
        
        // If no locations exist, add default Granada location
        if (locations.length === 0 && isAuthenticated()) {
            addDefaultLocation();
        }
    });
}

// Add default Granada location
function addDefaultLocation() {
    const locationsRef = ref(database, 'locations');
    push(locationsRef, {
        name: 'Granada House',
        address: 'Calle Principal, Granada, Spain'
    });
}

// Load rooms from Firebase
function loadRooms() {
    const roomsRef = ref(database, 'rooms');
    
    onValue(roomsRef, (snapshot) => {
        rooms = [];
        roomSelect.innerHTML = '';
        roomsList.innerHTML = '';
        
        // Clear calendar resources
        calendar.getResources().forEach(resource => resource.remove());
        
        snapshot.forEach((childSnapshot) => {
            const roomData = childSnapshot.val();
            const roomKey = childSnapshot.key;
            
            rooms.push({
                id: roomKey,
                name: roomData.name,
                locationId: roomData.locationId
            });
            
            // Add room to calendar resources
            calendar.addResource({
                id: roomKey,
                title: roomData.name
            });
            
            // Populate room select dropdown
            const option = document.createElement('option');
            option.value = roomKey;
            option.textContent = roomData.name;
            roomSelect.appendChild(option);
            
            // Populate rooms list for admin
            if (isAuthenticated()) {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                
                // Find location name
                const location = locations.find(loc => loc.id === roomData.locationId);
                const locationName = location ? location.name : 'Unknown';
                
                listItem.innerHTML = `
                    <div>
                        <strong>${roomData.name}</strong><br>
                        ${locationName}
                    </div>
                    <button class="delete-btn" data-id="${roomKey}">Delete</button>
                `;
                roomsList.appendChild(listItem);
                
                // Add delete event listener
                listItem.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteRoom(roomKey);
                });
            }
        });
        
        // If no rooms exist and authenticated, add default rooms
        if (rooms.length === 0 && locations.length > 0 && isAuthenticated()) {
            addDefaultRooms(locations[0].id);
        }
    });
}

// Add default rooms
function addDefaultRooms(locationId) {
    const roomsRef = ref(database, 'rooms');
    
    // Add 5 bedrooms
    for (let i = 1; i <= 5; i++) {
        push(roomsRef, {
            name: `Bedroom ${i}`,
            locationId: locationId
        });
    }
}

// Load bookings from Firebase
function loadBookings() {
    const bookingsRef = ref(database, 'bookings');
    
    onValue(bookingsRef, (snapshot) => {
        // Remove all existing events
        currentBookings = [];
        calendar.getEvents().forEach(event => event.remove());
        
        snapshot.forEach((childSnapshot) => {
            const bookingData = childSnapshot.val();
            const bookingKey = childSnapshot.key;
            
            currentBookings.push({
                id: bookingKey,
                memberId: bookingData.memberId,
                roomId: bookingData.roomId,
                start: bookingData.start,
                end: bookingData.end
            });
            
            // Find room for the booking
            const room = rooms.find(room => room.id === bookingData.roomId);
            const roomName = room ? room.name : 'Unknown Room';
            
            // Add event to calendar
            calendar.addEvent({
                id: bookingKey,
                title: `ID: ${bookingData.memberId}`,
                start: bookingData.start,
                end: bookingData.end,
                resourceId: bookingData.roomId,
                extendedProps: {
                    memberId: bookingData.memberId
                }
            });
        });
    });
}

// Event handler for clicking an event
function handleEventClick(info) {
    if (!isAuthenticated()) return;
    
    const event = info.event;
    
    // Set modal title and fill form fields
    modalTitle.textContent = 'Edit Booking';
    document.getElementById('memberID').value = event.extendedProps.memberId;
    document.getElementById('roomSelect').value = event.getResources()[0].id;
    
    // Format dates for input fields (YYYY-MM-DD)
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    document.getElementById('startDate').value = formatDateForInput(startDate);
    document.getElementById('endDate').value = formatDateForInput(endDate);
    bookingId.value = event.id;
    
    // Show the modal
    bookingModal.style.display = 'block';
}

// Event handler for selecting dates
function handleDateSelect(info) {
    if (!isAuthenticated()) return;
    
    // Set modal title and clear form fields
    modalTitle.textContent = 'Add Booking';
    bookingForm.reset();
    
    // Set selected dates
    document.getElementById('startDate').value = formatDateForInput(info.start);
    document.getElementById('endDate').value = formatDateForInput(info.end);
    bookingId.value = '';
    
    // Show the modal
    bookingModal.style.display = 'block';
}

// Format date for input field
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize form handlers
function initFormHandlers() {
    // Booking form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const memberId = document.getElementById('memberID').value;
        const roomId = document.getElementById('roomSelect').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const bookingIdValue = bookingId.value;
        
        // Prepare booking data
        const bookingData = {
            memberId: memberId,
            roomId: roomId,
            start: startDate,
            end: endDate
        };
        
        if (bookingIdValue) {
            // Update existing booking
            const bookingRef = ref(database, `bookings/${bookingIdValue}`);
            update(bookingRef, bookingData);
        } else {
            // Add new booking
            const bookingsRef = ref(database, 'bookings');
            push(bookingsRef, bookingData);
        }
        
        // Close the modal
        bookingModal.style.display = 'none';
    });
    
    // Room form submission
    roomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const roomName = document.getElementById('roomName').value;
        const locationId = document.getElementById('roomLocation').value;
        
        // Add new room
        const roomsRef = ref(database, 'rooms');
        push(roomsRef, {
            name: roomName,
            locationId: locationId
        });
        
        // Reset form
        roomForm.reset();
    });
    
    // Location form submission
    locationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const locationName = document.getElementById('locationName').value;
        const locationAddress = document.getElementById('locationAddress').value;
        
        // Add new location
        const locationsRef = ref(database, 'locations');
        push(locationsRef, {
            name: locationName,
            address: locationAddress
        });
        
        // Reset form
        locationForm.reset();
    });
}

// Delete a room
function deleteRoom(roomId) {
    if (!isAuthenticated()) return;
    
    // Check if room has bookings
    const hasBookings = currentBookings.some(booking => booking.roomId === roomId);
    if (hasBookings) {
        alert('Cannot delete room with existing bookings');
        return;
    }
    
    // Delete room from Firebase
    const roomRef = ref(database, `rooms/${roomId}`);
    remove(roomRef);
}

// Delete a location
function deleteLocation(locationId) {
    if (!isAuthenticated()) return;
    
    // Check if location has rooms
    const hasRooms = rooms.some(room => room.locationId === locationId);
    if (hasRooms) {
        alert('Cannot delete location with existing rooms');
        return;
    }
    
    // Delete location from Firebase
    const locationRef = ref(database, `locations/${locationId}`);
    remove(locationRef);
}

// Export functions for use in other modules
export { showBookingModal, showRoomsModal, showLocationsModal };

// Show booking modal for adding a new booking
function showBookingModal() {
    modalTitle.textContent = 'Add Booking';
    bookingForm.reset();
    bookingId.value = '';
    bookingModal.style.display = 'block';
}

// Show rooms modal
function showRoomsModal() {
    roomsModal.style.display = 'block';
}

// Show locations modal
function showLocationsModal() {
    locationsModal.style.display = 'block';
}// Calendar functionality for 1M House
import { database } from './firebase-config.js';
import { isAuthenticated } from './auth.js';
import { 
    ref, 
    onValue, 
    push, 
    update, 
    remove, 
    get, 
    set 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// DOM Elements
const calendarEl = document.getElementById('calendar');
const bookingModal = document.getElementById('bookingModal');
const roomsModal = document.getElementById('roomsModal');
const locationsModal = document.getElementById('locationsModal');
const bookingForm = document.getElementById('bookingForm');
const roomForm = document.getElementById('roomForm');
const locationForm = document.getElementById('locationForm');
const roomsList = document.getElementById('roomsList');
const locationsList = document.getElementById('locationsList');
const roomSelect = document.getElementById('roomSelect');
const roomLocation = document.getElementById('roomLocation');
const modalTitle = document.getElementById('modalTitle');
const bookingId = document.getElementById('bookingId');

// Close buttons for modals
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        bookingModal.style.display = 'none';
        roomsModal.style.display = 'none';
        locationsModal.style.display = 'none';
    });
});

// Global variables
let calendar;
let currentBookings = [];
let rooms = [];
let locations = [];

// Initialize calendar
export function initCalendar() {
    // Create calendar instance
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,resourceTimelineMonth'
        },
        selectable: true,
        selectMirror: true,
        editable: isAuthenticated(),
        eventClick: handleEventClick,
        select: handleDateSelect,
        events: [], // Will be populated from Firebase
        resources: [] // Will be populated from Firebase
    });
    
    // Render the calendar
    calendar.render();
    
    // Load data from Firebase
    loadLocations();
    loadRooms();
    loadBookings();
    
    // Initialize form event listeners
    initFormHandlers();
}

// Load locations from Firebase
function loadLocations() {
    const locationsRef = ref(database, 'locations');
    
    onValue(locationsRef, (snapshot) => {
        locations = [];
        roomLocation.innerHTML = '';
        locationsList.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            const locationData = childSnapshot.val();
            const locationKey = childSnapshot.key;
            
            locations.push({
                id: locationKey,
                name: locationData.name,
                address: locationData.address
            });
            
            // Populate location select dropdown
            const option = document.createElement('option');
            option.value = locationKey;
            option.textContent = locationData.name;
            roomLocation.appendChild(option);
            
            // Populate locations list for admin
            if (isAuthenticated()) {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.innerHTML = `
                    <div>
                        <strong>${locationData.name}</strong><br>
                        ${locationData.address}
                    </div>
                    <button class="delete-btn" data-id="${locationKey}">Delete</button>
                `;
                locationsList.appendChild(listItem);
                
                // Add delete event listener
                listItem.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteLocation(locationKey);
                });
            }
        });
        
        // If no locations exist, add default Granada location
        if (locations.length === 0 && isAuthenticated()) {
            addDefaultLocation();
        }
    });
}

// Add default Granada location
function addDefaultLocation() {
    const locationsRef = ref(database, 'locations');
    push(locationsRef, {
        name: 'Granada House',
        address: 'Calle Principal, Granada, Spain'
    });
}

// Load rooms from Firebase
function loadRooms() {
    const roomsRef = ref(database, 'rooms');
    
    onValue(roomsRef, (snapshot) => {
        rooms = [];
        roomSelect.innerHTML = '';
        roomsList.innerHTML = '';
        
        // Clear calendar resources
        calendar.getResources().forEach(resource => resource.remove());
        
        snapshot.forEach((childSnapshot) => {
            const roomData = childSnapshot.val();
            const roomKey = childSnapshot.key;
            
            rooms.push({
                id: roomKey,
                name: roomData.name,
                locationId: roomData.locationId
            });
            
            // Add room to calendar resources
            calendar.addResource({
                id: roomKey,
                title: roomData.name
            });
            
            // Populate room select dropdown
            const option = document.createElement('option');
            option.value = roomKey;
            option.textContent = roomData.name;
            roomSelect.appendChild(option);
            
            // Populate rooms list for admin
            if (isAuthenticated()) {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                
                // Find location name
                const location = locations.find(loc => loc.id === roomData.locationId);
                const locationName = location ? location.name : 'Unknown';
                
                listItem.innerHTML = `
                    <div>
                        <strong>${roomData.name}</strong><br>
                        ${locationName}
                    </div>
                    <button class="delete-btn" data-id="${roomKey}">Delete</button>
                `;
                roomsList.appendChild(listItem);
                
                // Add delete event listener
                listItem.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteRoom(roomKey);
                });
            }
        });
        
        // If no rooms exist and authenticated, add default rooms
        if (rooms.length === 0 && locations.length > 0 && isAuthenticated()) {
            addDefaultRooms(locations[0].id);
        }
    });
}

// Add default rooms
function addDefaultRooms(locationId) {
    const roomsRef = ref(database, 'rooms');
    
    // Add 5 bedrooms
    for (let i = 1; i <= 5; i++) {
        push(roomsRef, {
            name: `Bedroom ${i}`,
            locationId: locationId
        });
    }
}

// Load bookings from Firebase
function loadBookings() {
    const bookingsRef = ref(database, 'bookings');
    
    onValue(bookingsRef, (snapshot) => {
        // Remove all existing events
        currentBookings = [];
        calendar.getEvents().forEach(event => event.remove());
        
        snapshot.forEach((childSnapshot) => {
            const bookingData = childSnapshot.val();
            const bookingKey = childSnapshot.key;
            
            currentBookings.push({
                id: bookingKey,
                memberId: bookingData.memberId,
                roomId: bookingData.roomId,
                start: bookingData.start,
                end: bookingData.end
            });
            
            // Find room for the booking
            const room = rooms.find(room => room.id === bookingData.roomId);
            const roomName = room ? room.name : 'Unknown Room';
            
            // Add event to calendar
            calendar.addEvent({
                id: bookingKey,
                title: `ID: ${bookingData.memberId}`,
                start: bookingData.start,
                end: bookingData.end,
                resourceId: bookingData.roomId,
                extendedProps: {
                    memberId: bookingData.memberId
                }
            });
        });
    });
}

// Event handler for clicking an event
function handleEventClick(info) {
    if (!isAuthenticated()) return;
    
    const event = info.event;
    
    // Set modal title and fill form fields
    modalTitle.textContent = 'Edit Booking';
    document.getElementById('memberID').value = event.extendedProps.memberId;
    document.getElementById('roomSelect').value = event.getResources()[0].id;
    
    // Format dates for input fields (YYYY-MM-DD)
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    document.getElementById('startDate').value = formatDateForInput(startDate);
    document.getElementById('endDate').value = formatDateForInput(endDate);
    bookingId.value = event.id;
    
    // Show the modal
    bookingModal.style.display = 'block';
}

// Event handler for selecting dates
function handleDateSelect(info) {
    if (!isAuthenticated()) return;
    
    // Set modal title and clear form fields
    modalTitle.textContent = 'Add Booking';
    bookingForm.reset();
    
    // Set selected dates
    document.getElementById('startDate').value = formatDateForInput(info.start);
    document.getElementById('endDate').value = formatDateForInput(info.end);
    bookingId.value = '';
    
    // Show the modal
    bookingModal.style.display = 'block';
}

// Format date for input field
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize form handlers
function initFormHandlers() {
    // Booking form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const memberId = document.getElementById('memberID').value;
        const roomId = document.getElementById('roomSelect').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const bookingIdValue = bookingId.value;
        
        // Prepare booking data
        const bookingData = {
            memberId: memberId,
            roomId: roomId,
            start: startDate,
            end: endDate
        };
        
        if (bookingIdValue) {
            // Update existing booking
            const bookingRef = ref(database, `bookings/${bookingIdValue}`);
            update(bookingRef, bookingData);
        } else {
            // Add new booking
            const bookingsRef = ref(database, 'bookings');
            push(bookingsRef, bookingData);
        }
        
        // Close the modal
        bookingModal.style.display = 'none';
    });
    
    // Room form submission
    roomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const roomName = document.getElementById('roomName').value;
        const locationId = document.getElementById('roomLocation').value;
        
        // Add new room
        const roomsRef = ref(database, 'rooms');
        push(roomsRef, {
            name: roomName,
            locationId: locationId
        });
        
        // Reset form
        roomForm.reset();
    });
    
    // Location form submission
    locationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const locationName = document.getElementById('locationName').value;
        const locationAddress = document.getElementById('locationAddress').value;
        
        // Add new location
        const locationsRef = ref(database, 'locations');
        push(locationsRef, {
            name: locationName,
            address: locationAddress
        });
        
        // Reset form
        locationForm.reset();
    });
}

// Delete a room
function deleteRoom(roomId) {
    if (!isAuthenticated()) return;
    
    // Check if room has bookings
    const hasBookings = currentBookings.some(booking => booking.roomId === roomId);
    if (hasBookings) {
        alert('Cannot delete room with existing bookings');
        return;
    }
    
    // Delete room from Firebase
    const roomRef = ref(database, `rooms/${roomId}`);
    remove(roomRef);
}

// Delete a location
function deleteLocation(locationId) {
    if (!isAuthenticated()) return;
    
    // Check if location has rooms
    const hasRooms = rooms.some(room => room.locationId === locationId);
    if (hasRooms) {
        alert('Cannot delete location with existing rooms');
        return;
    }
    
    // Delete location from Firebase
    const locationRef = ref(database, `locations/${locationId}`);
    remove(locationRef);
}

// Export functions for use in other modules
export { showBookingModal, showRoomsModal, showLocationsModal };

// Show booking modal for adding a new booking
function showBookingModal() {
    modalTitle.textContent = 'Add Booking';
    bookingForm.reset();
    bookingId.value = '';
    bookingModal.style.display = 'block';
}

// Show rooms modal
function showRoomsModal() {
    roomsModal.style.display = 'block';
}

// Show locations modal
function showLocationsModal() {
    locationsModal.style.display = 'block';
}
