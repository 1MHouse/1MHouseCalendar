import { initAuth } from './auth.js';
import { initCalendar } from './calendar.js';
import { 
  initializeDefaultData, 
  LocationsAPI, 
  RoomsAPI, 
  BookingsAPI 
} from './firebase.js';

// DOM Elements - Admin Panel
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Booking Form Elements
const addBookingBtn = document.getElementById('add-booking-btn');
const bookingForm = document.getElementById('booking-form');
const bookingFormElement = document.getElementById('booking-form-element');
const cancelBookingBtn = document.getElementById('cancel-booking-btn');
const bookingsTable = document.getElementById('bookings-table');
const roomSelect = document.getElementById('room-select');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

// Room Form Elements
const addRoomBtn = document.getElementById('add-room-btn');
const roomForm = document.getElementById('room-form');
const roomFormElement = document.getElementById('room-form-element');
const cancelRoomBtn = document.getElementById('cancel-room-btn');
const roomsTable = document.getElementById('rooms-table');
const roomLocationSelect = document.getElementById('room-location');

// Location Form Elements
const addLocationBtn = document.getElementById('add-location-btn');
const locationForm = document.getElementById('location-form');
const locationFormElement = document.getElementById('location-form-element');
const cancelLocationBtn = document.getElementById('cancel-location-btn');
const locationsTable = document.getElementById('locations-table');

// Initialize Application
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Initialize Firebase if needed (default data)
    await initializeDefaultData();
    
    // Initialize Auth State
    initAuth();
    
    // Initialize Calendar
    initCalendar();
    
    // Set up admin UI event listeners
    setupAdminUI();
    
    // Listen for calendar events
    setupCalendarEventListeners();
  } catch (error) {
    console.error('Error initializing application:', error);
    showNotification('Failed to initialize application', 'error');
  }
}

// Setup Admin UI
function setupAdminUI() {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and hide all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(tab => tab.style.display = 'none');
      
      // Add active class to clicked button and show corresponding tab
      button.classList.add('active');
      const tabId = button.dataset.tab;
      document.getElementById(`${tabId}-tab`).style.display = 'block';
      
      // Load data for the active tab
      loadTabData(tabId);
    });
  });
  
  // Admin auth state change listener
  document.addEventListener('adminAuthStateChanged', handleAuthStateChanged);
  
  // Bookings form events
  if (addBookingBtn) addBookingBtn.addEventListener('click', showBookingForm);
  if (cancelBookingBtn) cancelBookingBtn.addEventListener('click', hideBookingForm);
  if (bookingFormElement) bookingFormElement.addEventListener('submit', handleBookingSubmit);
  
  // Rooms form events
  if (addRoomBtn) addRoomBtn.addEventListener('click', showRoomForm);
  if (cancelRoomBtn) cancelRoomBtn.addEventListener('click', hideRoomForm);
  if (roomFormElement) roomFormElement.addEventListener('submit', handleRoomSubmit);
  
  // Locations form events
  if (addLocationBtn) addLocationBtn.addEventListener('click', showLocationForm);
  if (cancelLocationBtn) cancelLocationBtn.addEventListener('click', hideLocationForm);
  if (locationFormElement) locationFormElement.addEventListener('submit', handleLocationSubmit);
}

// Setup Calendar Event Listeners
function setupCalendarEventListeners() {
  // Listen for calendar range selection
  document.addEventListener('calendarRangeSelected', handleCalendarRangeSelected);
  
  // Listen for create new booking from calendar
  document.addEventListener('createNewBooking', handleCreateNewBooking);
  
  // Listen for edit booking from calendar
  document.addEventListener('openBookingEdit', handleOpenBookingEdit);
}

// Handle authentication state changes
function handleAuthStateChanged(event) {
  const { isAdmin } = event.detail;
  
  if (isAdmin) {
    // Load initial tab data
    loadTabData('bookings');
  }
}

// Load data for the active tab
async function loadTabData(tabId) {
  try {
    switch (tabId) {
      case 'bookings':
        await loadBookings();
        break;
      case 'rooms':
        await loadRooms();
        await loadLocationsForRoomForm();
        break;
      case 'locations':
        await loadLocations();
        break;
    }
  } catch (error) {
    console.error(`Error loading ${tabId} data:`, error);
    showNotification(`Failed to load ${tabId} data`, 'error');
  }
}

// Calendar selection handler
function handleCalendarRangeSelected(event) {
  const { startDate, endDate, roomId } = event.detail;
  
  // Format dates for display
  const formattedStartDate = formatDateForInput(startDate);
  const formattedEndDate = formatDateForInput(endDate);
  
  // Update form if it's visible
  if (bookingForm && bookingForm.style.display !== 'none') {
    // Set room selection
    if (roomSelect) roomSelect.value = roomId;
    
    // Set date inputs
    if (startDateInput) startDateInput.value = formattedStartDate;
    if (endDateInput) endDateInput.value = formattedEndDate;
  }
}

// Create new booking from calendar
function handleCreateNewBooking(event) {
  const { startDate, endDate, roomId } = event.detail;
  
  // Show booking form
  showBookingForm();
  
  // Set form values
  document.getElementById('booking-id').value = '';
  document.getElementById('room-select').value = roomId;
  document.getElementById('start-date').value = formatDateForInput(startDate);
  document.getElementById('end-date').value = formatDateForInput(endDate);
  document.getElementById('status').value = 'booked';
  document.getElementById('guest-name').value = '';
  document.getElementById('guest-email').value = '';
  
  // Switch to bookings tab
  const bookingsTabBtn = document.querySelector('.tab-btn[data-tab="bookings"]');
  if (bookingsTabBtn) bookingsTabBtn.click();
}

// Open booking edit from calendar
async function handleOpenBookingEdit(event) {
  const { bookingId } = event.detail;
  
  try {
    // Fetch booking data
    const booking = await BookingsAPI.getById(bookingId);
    
    if (booking) {
      // Show booking form
      showBookingForm();
      
      // Set form values
      document.getElementById('booking-id').value = booking.id;
      document.getElementById('room-select').value = booking.roomId;
      document.getElementById('start-date').value = formatDateForInput(booking.startDate);
      document.getElementById('end-date').value = formatDateForInput(booking.endDate);
      document.getElementById('status').value = booking.status || 'booked';
      document.getElementById('guest-name').value = booking.guestName || '';
      document.getElementById('guest-email').value = booking.guestEmail || '';
      
      // Switch to bookings tab
      const bookingsTabBtn = document.querySelector('.tab-btn[data-tab="bookings"]');
      if (bookingsTabBtn) bookingsTabBtn.click();
    }
  } catch (error) {
    console.error('Error opening booking for edit:', error);
    showNotification('Failed to load booking details', 'error');
  }
}

// ----- BOOKINGS MANAGEMENT -----

// Load and display bookings
async function loadBookings() {
  try {
    // Fetch bookings from API
    const bookings = await BookingsAPI.getAll();
    
    // Fetch rooms for dropdown
    await loadRoomsForBookingForm();
    
    // Render bookings in table
    renderBookingsTable(bookings);
  } catch (error) {
    console.error('Error loading bookings:', error);
    showNotification('Failed to load bookings', 'error');
  }
}

// Load rooms for booking form dropdown
async function loadRoomsForBookingForm() {
  try {
    if (!roomSelect) return;
    
    // Clear existing options
    roomSelect.innerHTML = '';
    
    // Fetch rooms
    const rooms = await RoomsAPI.getAll();
    
    // Create default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a room';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    roomSelect.appendChild(defaultOption);
    
    // Add room options
    rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading rooms for booking form:', error);
    throw error;
  }
}

// Render bookings table
function renderBookingsTable(bookings) {
  if (!bookingsTable) return;
  
  // Get table body
  const tableBody = bookingsTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  // Add bookings to table
  bookings.forEach(booking => {
    const row = document.createElement('tr');
    
    // Get room name
    let roomName = 'Unknown Room';
    const roomOption = roomSelect ? roomSelect.querySelector(`option[value="${booking.roomId}"]`) : null;
    if (roomOption) {
      roomName = roomOption.textContent;
    }
    
    // Format dates
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const formattedStartDate = startDate.toLocaleDateString();
    const formattedEndDate = endDate.toLocaleDateString();
    
    // Create row cells
    row.innerHTML = `
      <td>${roomName}</td>
      <td>${formattedStartDate}</td>
      <td>${formattedEndDate}</td>
      <td>
        <span class="status-badge ${booking.status || 'booked'}">
          ${booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Booked'}
        </span>
      </td>
      <td>${booking.guestName || '-'}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${booking.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${booking.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Add event listeners for edit and delete buttons
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editBooking(booking.id));
    deleteBtn.addEventListener('click', () => deleteBooking(booking.id));
    
    // Add row to table
    tableBody.appendChild(row);
  });
  
  // Add CSS for status badges if not already added
  addStatusBadgeStyles();
}

// Show booking form
function showBookingForm() {
  if (bookingForm) {
    bookingForm.style.display = 'block';
    addBookingBtn.style.display = 'none';
  }
}

// Hide booking form
function hideBookingForm() {
  if (bookingForm) {
    bookingForm.style.display = 'none';
    addBookingBtn.style.display = 'block';
    bookingFormElement.reset();
    document.getElementById('booking-id').value = '';
  }
}

// Handle booking form submission
async function handleBookingSubmit(event) {
  event.preventDefault();
  
  try {
    // Get form values
    const bookingId = document.getElementById('booking-id').value;
    const roomId = document.getElementById('room-select').value;
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    const status = document.getElementById('status').value;
    const guestName = document.getElementById('guest-name').value;
    const guestEmail = document.getElementById('guest-email').value;
    
    // Validate dates
    if (endDate < startDate) {
      showNotification('End date cannot be before start date', 'error');
      return;
    }
    
    // Create booking data object
    const bookingData = {
      roomId,
      startDate,
      endDate,
      status,
      guestName,
      guestEmail
    };
    
    // Submit to API (create or update)
    if (bookingId) {
      await BookingsAPI.update(bookingId, bookingData);
      showNotification('Booking updated successfully', 'success');
    } else {
      await BookingsAPI.create(bookingData);
      showNotification('Booking created successfully', 'success');
    }
    
    // Reset form and hide
    hideBookingForm();
    
    // Reload bookings
    await loadBookings();
    
    // Refresh calendar
    document.dispatchEvent(new Event('refreshCalendar'));
  } catch (error) {
    console.error('Error submitting booking:', error);
    showNotification(`Failed to save booking: ${error.message}`, 'error');
  }
}

// Edit booking
async function editBooking(bookingId) {
  try {
    // Fetch booking data
    const booking = await BookingsAPI.getById(bookingId);
    
    if (booking) {
      // Show booking form
      showBookingForm();
      
      // Set form values
      document.getElementById('booking-id').value = booking.id;
      document.getElementById('room-select').value = booking.roomId;
      document.getElementById('start-date').value = formatDateForInput(booking.startDate);
      document.getElementById('end-date').value = formatDateForInput(booking.endDate);
      document.getElementById('status').value = booking.status || 'booked';
      document.getElementById('guest-name').value = booking.guestName || '';
      document.getElementById('guest-email').value = booking.guestEmail || '';
    }
  } catch (error) {
    console.error('Error editing booking:', error);
    showNotification('Failed to load booking details', 'error');
  }
}

// Delete booking
async function deleteBooking(bookingId) {
  try {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }
    
    // Delete booking
    await BookingsAPI.delete(bookingId);
    
    // Show success notification
    showNotification('Booking deleted successfully', 'success');
    
    // Reload bookings
    await loadBookings();
    
    // Refresh calendar
    document.dispatchEvent(new Event('refreshCalendar'));
  } catch (error) {
    console.error('Error deleting booking:', error);
    showNotification('Failed to delete booking', 'error');
  }
}

// ----- ROOMS MANAGEMENT -----

// Load and display rooms
async function loadRooms() {
  try {
    // Fetch rooms from API
    const rooms = await RoomsAPI.getAll();
    
    // Render rooms in table
    renderRoomsTable(rooms);
  } catch (error) {
    console.error('Error loading rooms:', error);
    showNotification('Failed to load rooms', 'error');
  }
}

// Load locations for room form dropdown
async function loadLocationsForRoomForm() {
  try {
    if (!roomLocationSelect) return;
    
    // Clear existing options
    roomLocationSelect.innerHTML = '';
    
    // Fetch locations
    const locations = await LocationsAPI.getAll();
    
    // Create default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a location';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    roomLocationSelect.appendChild(defaultOption);
    
    // Add location options
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.id;
      option.textContent = location.name;
      roomLocationSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading locations for room form:', error);
    throw error;
  }
}

// Render rooms table
function renderRoomsTable(rooms) {
  if (!roomsTable) return;
  
  // Get table body
  const tableBody = roomsTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  // Add rooms to table
  rooms.forEach(room => {
    const row = document.createElement('tr');
    
    // Get location name
    let locationName = 'Unknown Location';
    const locationOption = roomLocationSelect ? roomLocationSelect.querySelector(`option[value="${room.locationId}"]`) : null;
    if (locationOption) {
      locationName = locationOption.textContent;
    }
    
    // Create row cells
    row.innerHTML = `
      <td>${room.name}</td>
      <td>${locationName}</td>
      <td>${room.capacity}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${room.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${room.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Add event listeners for edit and delete buttons
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editRoom(room.id));
    deleteBtn.addEventListener('click', () => deleteRoom(room.id));
    
    // Add row to table
    tableBody.appendChild(row);
  });
}

// Show room form
function showRoomForm() {
  if (roomForm) {
    roomForm.style.display = 'block';
    addRoomBtn.style.display = 'none';
  }
}

// Hide room form
function hideRoomForm() {
  if (roomForm) {
    roomForm.style.display = 'none';
    addRoomBtn.style.display = 'block';
    roomFormElement.reset();
    document.getElementById('room-id').value = '';
  }
}

// Handle room form submission
async function handleRoomSubmit(event) {
  event.preventDefault();
  
  try {
    // Get form values
    const roomId = document.getElementById('room-id').value;
    const name = document.getElementById('room-name').value;
    const locationId = document.getElementById('room-location').value;
    const capacity = parseInt(document.getElementById('room-capacity').value);
    const description = document.getElementById('room-description').value;
    
    // Create room data object
    const roomData = {
      name,
      locationId,
      capacity,
      description
    };
    
    // Submit to API (create or update)
    if (roomId) {
      await RoomsAPI.update(roomId, roomData);
      showNotification('Room updated successfully', 'success');
    } else {
      await RoomsAPI.create(roomData);
      showNotification('Room created successfully', 'success');
    }
    
    // Reset form and hide
    hideRoomForm();
    
    // Reload rooms
    await loadRooms();
    
    // Refresh calendar
    document.dispatchEvent(new Event('refreshCalendar'));
  } catch (error) {
    console.error('Error submitting room:', error);
    showNotification(`Failed to save room: ${error.message}`, 'error');
  }
}

// Edit room
async function editRoom(roomId) {
  try {
    // Fetch room data
    const room = await RoomsAPI.getById(roomId);
    
    if (room) {
      // Show room form
      showRoomForm();
      
      // Set form values
      document.getElementById('room-id').value = room.id;
      document.getElementById('room-name').value = room.name;
      document.getElementById('room-location').value = room.locationId;
      document.getElementById('room-capacity').value = room.capacity;
      document.getElementById('room-description').value = room.description || '';
    }
  } catch (error) {
    console.error('Error editing room:', error);
    showNotification('Failed to load room details', 'error');
  }
}

// Delete room
async function deleteRoom(roomId) {
  try {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }
    
    // Delete room
    await RoomsAPI.delete(roomId);
    
    // Show success notification
    showNotification('Room deleted successfully', 'success');
    
    // Reload rooms
    await loadRooms();
    
    // Refresh calendar
    document.dispatchEvent(new Event('refreshCalendar'));
  } catch (error) {
    console.error('Error deleting room:', error);
    showNotification(`Failed to delete room: ${error.message}`, 'error');
  }
}

// ----- LOCATIONS MANAGEMENT -----

// Load and display locations
async function loadLocations() {
  try {
    // Fetch locations from API
    const locations = await LocationsAPI.getAll();
    
    // Render locations in table
    renderLocationsTable(locations);
  } catch (error) {
    console.error('Error loading locations:', error);
    showNotification('Failed to load locations', 'error');
  }
}

// Render locations table
function renderLocationsTable(locations) {
  if (!locationsTable) return;
  
  // Get table body
  const tableBody = locationsTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  // Add locations to table
  locations.forEach(location => {
    const row = document.createElement('tr');
    
    // Create row cells
    row.innerHTML = `
      <td>${location.name}</td>
      <td>${location.city}</td>
      <td>${location.country}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${location.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${location.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Add event listeners for edit and delete buttons
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editLocation(location.id));
    deleteBtn.addEventListener('click', () => deleteLocation(location.id));
    
    // Add row to table
    tableBody.appendChild(row);
  });
}

// Show location form
function showLocationForm() {
  if (locationForm) {
    locationForm.style.display = 'block';
    addLocationBtn.style.display = 'none';
  }
}

// Hide location form
function hideLocationForm() {
  if (locationForm) {
    locationForm.style.display = 'none';
    addLocationBtn.style.display = 'block';
    locationFormElement.reset();
    document.getElementById('location-id').value = '';
  }
}

// Handle location form submission
async function handleLocationSubmit(event) {
  event.preventDefault();
  
  try {
    // Get form values
    const locationId = document.getElementById('location-id').value;
    const name = document.getElementById('location-name').value;
    const address = document.getElementById('location-address').value;
    const city = document.getElementById('location-city').value;
    const country = document.getElementById('location-country').value;
    
    // Create location data object
    const locationData = {
      name,
      address,
      city,
      country
    };
    
    // Submit to API (create or update)
    if (locationId) {
      await LocationsAPI.update(locationId, locationData);
      showNotification('Location updated successfully', 'success');
    } else {
      await LocationsAPI.create(locationData);
      showNotification('Location created successfully', 'success');
    }
    
    // Reset form and hide
    hideLocationForm();
    
    // Reload locations
    await loadLocations();
    
    // Reload locations in room form dropdown
    await loadLocationsForRoomForm();
  } catch (error) {
    console.error('Error submitting location:', error);
    showNotification(`Failed to save location: ${error.message}`, 'error');
  }
}

// Edit location
async function editLocation(locationId) {
  try {
    // Fetch location data
    const location = await LocationsAPI.getById(locationId);
    
    if (location) {
      // Show location form
      showLocationForm();
      
      // Set form values
      document.getElementById('location-id').value = location.id;
      document.getElementById('location-name').value = location.name;
      document.getElementById('location-address').value = location.address || '';
      document.getElementById('location-city').value = location.city || '';
      document.getElementById('location-country').value = location.country || '';
    }
  } catch (error) {
    console.error('Error editing location:', error);
    showNotification('Failed to load location details', 'error');
  }
}

// Delete location
async function deleteLocation(locationId) {
  try {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }
    
    // Delete location
    await LocationsAPI.delete(locationId);
    
    // Show success notification
    showNotification('Location deleted successfully', 'success');
    
    // Reload locations
    await loadLocations();
    
    // Reload locations in room form dropdown
    await loadLocationsForRoomForm();
  } catch (error) {
    console.error('Error deleting location:', error);
    showNotification(`Failed to delete location: ${error.message}`, 'error');
  }
}

// ----- UTILITY FUNCTIONS -----

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
  const d = new Date(date);
  
  // Get year, month, and day
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  
  // Pad month and day with leading zeros if needed
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  
  // Return formatted date
  return [year, month, day].join('-');
}

// Show notification message
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.querySelector('.notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Set notification content and style
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  // Show notification
  notification.style.display = 'block';
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Add CSS for status badges
function addStatusBadgeStyles() {
  // Check if styles already exist
  if (document.getElementById('status-badge-styles')) return;
  
  // Create style element
  const style = document.createElement('style');
  style.id = 'status-badge-styles';
  style.textContent = `
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-badge.booked {
      background-color: #fed7d7;
      color: #9b2c2c;
    }
    
    .status-badge.maintenance {
      background-color: #feebc8;
      color: #744210;
    }
    
    .status-badge.available {
      background-color: #c6f6d5;
      color: #22543d;
    }
  `;
  
  // Add styles to document head
  document.head.appendChild(style);
}
