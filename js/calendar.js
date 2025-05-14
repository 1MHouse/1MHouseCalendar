// Calendar setup and operations for 1M House
import { 
    getBookingsByDateRange, 
    getRooms, 
    getLocations,
    addBooking,
    updateBooking,
    deleteBooking
} from './firebase.js';
import { showNotification } from './auth.js';

// DOM Elements
const calendarContainer = document.getElementById('availability-calendar');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const currentMonthElement = document.getElementById('current-month');
const bookingForm = document.getElementById('booking-form');
const bookingRoomSelect = document.getElementById('booking-room');
const bookingStartInput = document.getElementById('booking-start');
const bookingEndInput = document.getElementById('booking-end');
const bookingNameInput = document.getElementById('booking-name');
const bookingNotesInput = document.getElementById('booking-notes');
const bookingIdInput = document.getElementById('booking-id');
const deleteBookingBtn = document.getElementById('delete-booking');
const cancelEditBtn = document.getElementById('cancel-edit');

// State variables
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let rooms = [];
let bookings = [];
let isAdmin = false;
let editingBookingId = null;

// Initialize calendar
export async function initCalendar() {
    try {
        // Fetch rooms
        rooms = await getRooms();
        
        // Set up event listeners
        prevMonthBtn.addEventListener('click', goToPrevMonth);
        nextMonthBtn.addEventListener('click', goToNextMonth);
        
        bookingForm.addEventListener('submit', handleBookingSubmit);
        deleteBookingBtn.addEventListener('click', handleDeleteBooking);
        cancelEditBtn.addEventListener('click', resetBookingForm);
        
        // Observe admin state changes
        document.addEventListener('adminStateChanged', (e) => {
            isAdmin = e.detail.isAdmin;
            generateCalendar(currentYear, currentMonth);
        });
        
        // Initialize the calendar
        await generateCalendar(currentYear, currentMonth);
        
        // Set default values for booking form date inputs
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        bookingStartInput.valueAsDate = today;
        bookingEndInput.valueAsDate = tomorrow;
        
        // Populate room select in booking form
        populateRoomSelect();
    } catch (error) {
        console.error('Error initializing calendar:', error);
        showNotification('Error loading calendar. Please try again.', 'error');
    }
}

// Function to populate room select
async function populateRoomSelect() {
    bookingRoomSelect.innerHTML = '';
    
    // Fetch fresh rooms data
    rooms = await getRooms();
    
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = room.name;
        bookingRoomSelect.appendChild(option);
    });
}

// Generate the calendar for a specific month
async function generateCalendar(year, month) {
    try {
        // Update current month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        
        // Calculate start and end date for the view
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Fetch bookings for this month
        bookings = await getBookingsByDateRange(firstDay, lastDay);
        
        // Create calendar table
        let calendarHTML = '<table class="calendar">';
        
        // Add month header row
        calendarHTML += `<tr><th class="room-name header">Room</th>`;
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
            calendarHTML += `<th>${day}</th>`;
        }
        
        calendarHTML += '</tr>';
        
        // Add day of week row
        calendarHTML += `<tr><th class="room-name"></th>`;
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            calendarHTML += `<th>${dayName}</th>`;
        }
        
        calendarHTML += '</tr>';
        
        // Add room rows
        for (const room of rooms) {
            calendarHTML += `<tr>`;
            calendarHTML += `<td class="room-name">${room.name}</td>`;
            
            // For each day in the month
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(year, month, day);
                const dateStr = date.toISOString().split('T')[0];
                
                // Check if this cell has a booking
                const booking = findBookingForRoomAndDate(room.id, date);
                
                // Determine cell classes
                let cellClasses = [];
                
                // Is it today?
                const today = new Date();
                if (date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear()) {
                    cellClasses.push('today');
                }
                
                // Is it a weekend?
                if (date.getDay() === 0 || date.getDay() === 6) {
                    cellClasses.push('weekend');
                }
                
                // Is it booked?
                if (booking) {
                    cellClasses.push('booked');
                    cellClasses.push(`room-${rooms.findIndex(r => r.id === room.id) + 1}`);
                    
                    // Is it the start or end of a booking?
                    const bookingStart = new Date(booking.startDate);
                    const bookingEnd = new Date(booking.endDate);
                    
                    if (date.getDate() === bookingStart.getDate() && 
                        date.getMonth() === bookingStart.getMonth() && 
                        date.getFullYear() === bookingStart.getFullYear()) {
                        cellClasses.push('booked-start');
                    }
                    
                    if (date.getDate() === bookingEnd.getDate() && 
                        date.getMonth() === bookingEnd.getMonth() && 
                        date.getFullYear() === bookingEnd.getFullYear()) {
                        cellClasses.push('booked-end');
                    }
                    
                    if (date > bookingStart && date < bookingEnd) {
                        cellClasses.push('booked-middle');
                    }
                    
                    // Add cell with booking info
                    calendarHTML += `<td class="${cellClasses.join(' ')}" data-date="${dateStr}" data-room-id="${room.id}" data-booking-id="${booking.id}">
                        <div class="booking-tooltip">
                            <strong>${booking.memberName}</strong><br>
                            ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}
                        </div>
                    </td>`;
                } else {
                    // Available cell
                    cellClasses.push('available');
                    calendarHTML += `<td class="${cellClasses.join(' ')}" data-date="${dateStr}" data-room-id="${room.id}"></td>`;
                }
            }
            
            calendarHTML += `</tr>`;
        }
        
        calendarHTML += '</table>';
        
        // Add legend
        calendarHTML += `
        <div class="calendar-legend">
            <div class="legend-item">
                <div class="legend-color legend-available"></div>
                <span>Available</span>
            </div>
            <div class="legend-item">
                <div class="legend-color legend-booked"></div>
                <span>Booked</span>
            </div>
            <div class="legend-item">
                <div class="legend-color legend-today"></div>
                <span>Today</span>
            </div>
            ${rooms.map((room, index) => `
                <div class="legend-item">
                    <div class="legend-color legend-room-${index + 1}"></div>
                    <span>${room.name}</span>
                </div>
            `).join('')}
        </div>`;
        
        // Update calendar container
        calendarContainer.innerHTML = calendarHTML;
        
        // Add event listeners for cells if admin
        if (isAdmin) {
            const cells = document.querySelectorAll('.calendar td');
            cells.forEach(cell => {
                cell.addEventListener('click', handleCellClick);
            });
        }
    } catch (error) {
        console.error('Error generating calendar:', error);
        calendarContainer.innerHTML = '<div class="error">Error loading calendar. Please try again.</div>';
    }
}

// Helper function to find a booking for a specific room and date
function findBookingForRoomAndDate(roomId, date) {
    return bookings.find(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        // Reset hours to compare dates only
        date.setHours(0, 0, 0, 0);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        
        return booking.roomId === roomId && 
               date >= bookingStart && 
               date <= bookingEnd;
    });
}

// Navigate to previous month
function goToPrevMonth() {
    currentMonth--;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    generateCalendar(currentYear, currentMonth);
}

// Navigate to next month
function goToNextMonth() {
    currentMonth++;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    generateCalendar(currentYear, currentMonth);
}

// Handle cell click for admin
function handleCellClick(e) {
    const cell = e.currentTarget;
    const date = cell.dataset.date;
    const roomId = cell.dataset.roomId;
    const bookingId = cell.dataset.bookingId;
    
    if (bookingId) {
        // Editing existing booking
        editBooking(bookingId);
    } else {
        // Creating new booking
        resetBookingForm();
        bookingStartInput.value = date;
        bookingEndInput.value = date;
        bookingRoomSelect.value = roomId;
    }
}

// Edit booking
async function editBooking(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            throw new Error('Booking not found');
        }
        
        // Populate form
        bookingRoomSelect.value = booking.roomId;
        bookingStartInput.value = booking.startDate.toISOString().split('T')[0];
        bookingEndInput.value = booking.endDate.toISOString().split('T')[0];
        bookingNameInput.value = booking.memberName;
        bookingNotesInput.value = booking.notes || '';
        bookingIdInput.value = booking.id;
        
        // Show delete button
        deleteBookingBtn.style.display = 'block';
        
        // Set editing state
        editingBookingId = booking.id;
        
        // Scroll to form
        document.getElementById('bookings-tab').scrollIntoView({ behavior: 'smooth' });
        
        // Make sure the bookings tab is active
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.style.display = 'none');
        
        document.querySelector(`.tab-btn[data-tab="bookings"]`).classList.add('active');
        document.getElementById('bookings-tab').style.display = 'block';
        
    } catch (error) {
        console.error('Error editing booking:', error);
        showNotification('Error loading booking details', 'error');
    }
}

// Reset booking form
function resetBookingForm() {
    bookingForm.reset();
    bookingIdInput.value = '';
    deleteBookingBtn.style.display = 'none';
    editingBookingId = null;
    
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    bookingStartInput.valueAsDate = today;
    bookingEndInput.valueAsDate = tomorrow;
}

// Handle booking form submit
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    try {
        const bookingData = {
            roomId: bookingRoomSelect.value,
            startDate: bookingStartInput.value,
            endDate: bookingEndInput.value,
            memberName: bookingNameInput.value,
            notes: bookingNotesInput.value
        };
        
        // Validate dates
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);
        
        if (endDate < startDate) {
            throw new Error('Check-out date must be after check-in date');
        }
        
        // Check for overlapping bookings
        const overlappingBooking = bookings.find(booking => {
            // Skip the booking we're editing
            if (editingBookingId && booking.id === editingBookingId) {
                return false;
            }
            
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            
            return booking.roomId === bookingData.roomId && 
                   ((startDate >= bookingStart && startDate <= bookingEnd) || 
                    (endDate >= bookingStart && endDate <= bookingEnd) ||
                    (startDate <= bookingStart && endDate >= bookingEnd));
        });
        
        if (overlappingBooking) {
            throw new Error('This room is already booked for the selected dates');
        }
        
        if (editingBookingId) {
            // Update existing booking
            await updateBooking(editingBookingId, bookingData);
            showNotification('Booking updated successfully', 'success');
        } else {
            // Add new booking
            await addBooking(bookingData);
            showNotification('Booking added successfully', 'success');
        }
        
        // Reset form and refresh calendar
        resetBookingForm();
        await generateCalendar(currentYear, currentMonth);
        
    } catch (error) {
        console.error('Error saving booking:', error);
        showNotification(error.message || 'Error saving booking', 'error');
    }
}

// Handle delete booking
async function handleDeleteBooking() {
    if (!editingBookingId) {
        return;
    }
    
    if (!confirm('Are you sure you want to delete this booking?')) {
        return;
    }
    
    try {
        await deleteBooking(editingBookingId);
        showNotification('Booking deleted successfully', 'success');
        
        // Reset form and refresh calendar
        resetBookingForm();
        await generateCalendar(currentYear, currentMonth);
        
    } catch (error) {
        console.error('Error deleting booking:', error);
        showNotification('Error deleting booking', 'error');
    }
}

// Initialize tabs
export function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.style.display = content.id === `${tabId}-tab` ? 'block' : 'none';
            });
        });
    });
}