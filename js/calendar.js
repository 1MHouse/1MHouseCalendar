import { BookingsAPI, RoomsAPI } from './firebase.js';
import { isAdmin } from './auth.js';

// DOM Elements
const calendarContainer = document.querySelector('.calendar-container');
const calendarHeader = document.querySelector('.calendar-header');
const calendarBody = document.querySelector('.calendar-body');
const currentMonthElement = document.getElementById('current-month');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');

// Calendar State
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let rooms = [];
let bookings = [];
let selectedStartCell = null;
let selectedEndCell = null;
let isSelecting = false;

// Initialize Calendar
export async function initCalendar() {
  try {
    // Fetch rooms and set up initial calendar
    rooms = await RoomsAPI.getAll();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render initial calendar
    await renderCalendar(currentYear, currentMonth);
  } catch (error) {
    console.error('Error initializing calendar:', error);
    showNotification('Failed to load calendar data', 'error');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Navigation buttons
  prevMonthButton.addEventListener('click', navigateToPreviousMonth);
  nextMonthButton.addEventListener('click', navigateToNextMonth);
  
  // Admin auth state change
  document.addEventListener('adminAuthStateChanged', handleAuthStateChanged);
}

// Handle authentication state changes
function handleAuthStateChanged(event) {
  const { isAdmin } = event.detail;
  
  // Refresh calendar with or without admin capabilities
  renderCalendar(currentYear, currentMonth);
}

// Navigate to previous month
async function navigateToPreviousMonth() {
  currentMonth--;
  
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  
  await renderCalendar(currentYear, currentMonth);
}

// Navigate to next month
async function navigateToNextMonth() {
  currentMonth++;
  
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  
  await renderCalendar(currentYear, currentMonth);
}

// Render calendar for specified month and year
async function renderCalendar(year, month) {
  try {
    // Update header display
    updateMonthDisplay(year, month);
    
    // Get the first day of the month and the number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Calculate start and end dates for bookings query
    // Include previous and next month days that might be shown
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - 7); // Go back a week to cover any overlap
    
    const endDate = new Date(year, month + 1, 0);
    endDate.setDate(endDate.getDate() + 7); // Go forward a week to cover any overlap
    
    // Fetch bookings for the date range
    bookings = await BookingsAPI.getBookingsByDateRange(startDate, endDate);
    
    // Generate calendar
    generateCalendarHeader(year, month);
    generateCalendarBody(year, month, daysInMonth, firstDay);
    
    // If admin, add selection capabilities
    if (isAdmin()) {
      setupAdminCalendarEvents();
    }
  } catch (error) {
    console.error('Error rendering calendar:', error);
    showNotification('Failed to render calendar', 'error');
  }
}

// Update month display in the header
function updateMonthDisplay(year, month) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  currentMonthElement.textContent = `${monthNames[month]} ${year}`;
}

// Generate calendar header (days of the week and dates)
function generateCalendarHeader(year, month) {
  // Clear existing header
  calendarHeader.innerHTML = '';
  
  // Add empty cell for room names column
  const emptyHeaderCell = document.createElement('div');
  emptyHeaderCell.className = 'calendar-header-cell';
  emptyHeaderCell.textContent = 'Rooms';
  calendarHeader.appendChild(emptyHeaderCell);
  
  // Get the current date for highlighting today
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  
  // Get days to display (7 days starting from current date)
  const startDate = new Date(year, month, 1);
  const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Adjust start date to show Sunday as the first day
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Add day of week headers and date headers
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dayOfWeek = currentDate.getDay();
    const date = currentDate.getDate();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = 
      isCurrentMonth && 
      date === today.getDate() && 
      currentDate.getMonth() === month;
    
    // Create day of week cell
    const dayOfWeekCell = document.createElement('div');
    dayOfWeekCell.className = `calendar-header-cell day-of-week ${isWeekend ? 'weekend' : ''}`;
    dayOfWeekCell.textContent = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    calendarHeader.appendChild(dayOfWeekCell);
    
    // Store date info as data attributes for reference
    dayOfWeekCell.dataset.date = currentDate.toISOString().split('T')[0];
    dayOfWeekCell.dataset.day = i;
  }
}

// Generate calendar body (rooms and availability)
function generateCalendarBody(year, month, daysInMonth, firstDay) {
  // Clear existing body
  calendarBody.innerHTML = '';
  
  // Get the current date
  const today = new Date();
  
  // Get the first day to display (adjust to start from Sunday)
  const startDate = new Date(year, month, 1);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Create a row for each room
  rooms.forEach(room => {
    const roomRow = document.createElement('div');
    roomRow.className = 'calendar-room-row';
    roomRow.dataset.roomId = room.id;
    
    // Add room name cell
    const roomNameCell = document.createElement('div');
    roomNameCell.className = 'calendar-room-name';
    roomNameCell.textContent = room.name;
    roomRow.appendChild(roomNameCell);
    
    // Add cells for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isCurrentMonth = currentDate.getMonth() === month;
      
      // Create cell for this day
      const cell = document.createElement('div');
      cell.className = `calendar-cell ${isWeekend ? 'weekend' : ''} ${isCurrentMonth ? '' : 'other-month'}`;
      
      // Store date info as data attributes for reference
      cell.dataset.date = currentDate.toISOString().split('T')[0];
      cell.dataset.roomId = room.id;
      cell.dataset.day = i;
      
      // Check for bookings on this date for this room
      const dateBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        // Set times to midnight for date comparison
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        return (
          booking.roomId === room.id &&
          currentDate >= bookingStart &&
          currentDate <= bookingEnd
        );
      });
      
      // If there's a booking, mark the cell accordingly
      if (dateBookings.length > 0) {
        const booking = dateBookings[0]; // Take the first booking if multiple
        
        // Add booking status class
        cell.classList.add(booking.status);
        
        // Add visual continuity for multi-day bookings
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        // Set times to midnight for date comparison
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        
        // Create a div for the booking that spans days
        const bookingElement = document.createElement('div');
        bookingElement.className = `continued-booking ${booking.status}`;
        
        // Mark start and end of booking
        if (currentDate.getTime() === bookingStart.getTime()) {
          bookingElement.classList.add('start');
        }
        
        if (currentDate.getTime() === bookingEnd.getTime()) {
          bookingElement.classList.add('end');
        }
        
        // Add booking name if available
        if (booking.guestName) {
          const nameElement = document.createElement('div');
          nameElement.className = `booking-name ${booking.status}`;
          nameElement.textContent = booking.guestName;
          
          // Only show name on first day of booking
          if (currentDate.getTime() === bookingStart.getTime()) {
            bookingElement.appendChild(nameElement);
          }
        }
        
        // Store booking ID for admin functionality
        bookingElement.dataset.bookingId = booking.id;
        
        cell.appendChild(bookingElement);
      } else {
        // Mark as available
        cell.classList.add('available');
      }
      
      // Add cell to row
      roomRow.appendChild(cell);
    }
    
    // Add row to calendar body
    calendarBody.appendChild(roomRow);
  });
}

// Set up admin calendar events for booking selection
function setupAdminCalendarEvents() {
  // Get all calendar cells
  const cells = calendarBody.querySelectorAll('.calendar-cell');
  
  // Add event listeners for cell selection
  cells.forEach(cell => {
    // Add admin-specific class for styling
    cell.classList.add('admin-booking-cell');
    
    // Handle cell click for selection
    cell.addEventListener('click', handleCellClick);
    
    // Handle mouseenter for range selection
    cell.addEventListener('mouseenter', handleCellMouseEnter);
  });
  
  // Add document-level event to handle mouse up (end selection)
  document.addEventListener('mouseup', handleDocumentMouseUp);
}

// Handle cell click (start selection or toggle selection)
function handleCellClick(event) {
  const cell = event.currentTarget;
  
  // If cell has a booking, open the booking for editing
  const bookingElement = cell.querySelector('.continued-booking');
  if (bookingElement) {
    const bookingId = bookingElement.dataset.bookingId;
    if (bookingId) {
      // Dispatch event to open booking in admin panel
      const bookingEvent = new CustomEvent('openBookingEdit', { 
        detail: { bookingId }
      });
      document.dispatchEvent(bookingEvent);
      return;
    }
  }
  
  // Start selection mode
  if (!isSelecting) {
    isSelecting = true;
    selectedStartCell = cell;
    selectedEndCell = cell;
    
    // Add selecting class to start cell
    cell.classList.add('selecting');
    
    // Dispatch event with selected date and room
    dispatchRangeSelectionEvent();
  }
}

// Handle cell mouse enter (update selection range)
function handleCellMouseEnter(event) {
  if (!isSelecting) return;
  
  const cell = event.currentTarget;
  const cellRoomId = cell.dataset.roomId;
  const startCellRoomId = selectedStartCell.dataset.roomId;
  
  // Only allow selection within the same room
  if (cellRoomId !== startCellRoomId) return;
  
  // Update end cell
  selectedEndCell = cell;
  
  // Clear previous selection
  const cells = calendarBody.querySelectorAll('.calendar-cell.selecting');
  cells.forEach(c => c.classList.remove('selecting'));
  
  // Get start and end dates
  const startDate = new Date(selectedStartCell.dataset.date);
  const endDate = new Date(selectedEndCell.dataset.date);
  
  // Ensure start date is before end date
  const isForward = startDate <= endDate;
  const minDate = isForward ? startDate : endDate;
  const maxDate = isForward ? endDate : startDate;
  
  // Highlight cells in the range
  const roomCells = calendarBody.querySelectorAll(`.calendar-cell[data-room-id="${cellRoomId}"]`);
  roomCells.forEach(roomCell => {
    const cellDate = new Date(roomCell.dataset.date);
    
    if (cellDate >= minDate && cellDate <= maxDate) {
      roomCell.classList.add('selecting');
    }
  });
  
  // Dispatch event with selected range
  dispatchRangeSelectionEvent();
}

// Handle document mouse up (end selection)
function handleDocumentMouseUp() {
  if (!isSelecting) return;
  
  // End selection mode
  isSelecting = false;
  
  // Get final selection
  const startDate = new Date(selectedStartCell.dataset.date);
  const endDate = new Date(selectedEndCell.dataset.date);
  const roomId = selectedStartCell.dataset.roomId;
  
  // Make sure start date is before end date
  const finalStartDate = startDate <= endDate ? startDate : endDate;
  const finalEndDate = startDate <= endDate ? endDate : startDate;
  
  // Check if there are existing bookings in the range
  const hasBookingsInRange = checkForBookingsInRange(roomId, finalStartDate, finalEndDate);
  
  if (hasBookingsInRange) {
    // Clear selection
    const cells = calendarBody.querySelectorAll('.calendar-cell.selecting');
    cells.forEach(c => c.classList.remove('selecting'));
    
    // Show error notification
    showNotification('Cannot create booking: Date range overlaps with existing booking', 'error');
    return;
  }
  
  // Dispatch event to create new booking
  const newBookingEvent = new CustomEvent('createNewBooking', { 
    detail: { 
      startDate: finalStartDate, 
      endDate: finalEndDate, 
      roomId 
    }
  });
  document.dispatchEvent(newBookingEvent);
  
  // Clear selection
  const cells = calendarBody.querySelectorAll('.calendar-cell.selecting');
  cells.forEach(c => c.classList.remove('selecting'));
}

// Check if there are existing bookings in the selected range
function checkForBookingsInRange(roomId, startDate, endDate) {
  // Set times to midnight for date comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  // Check each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Check if this date has a booking for this room
    const bookingForDate = bookings.find(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      // Set times to midnight for date comparison
      bookingStart.setHours(0, 0, 0, 0);
      bookingEnd.setHours(0, 0, 0, 0);
      
      return (
        booking.roomId === roomId &&
        currentDate >= bookingStart &&
        currentDate <= bookingEnd
      );
    });
    
    if (bookingForDate) {
      return true; // Found a booking in range
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return false; // No bookings in range
}

// Dispatch event with selected date range
function dispatchRangeSelectionEvent() {
  // Only dispatch if both cells are selected
  if (!selectedStartCell || !selectedEndCell) return;
  
  // Get start and end dates
  const startDate = new Date(selectedStartCell.dataset.date);
  const endDate = new Date(selectedEndCell.dataset.date);
  
  // Make sure start date is before end date
  const finalStartDate = startDate <= endDate ? startDate : endDate;
  const finalEndDate = startDate <= endDate ? endDate : startDate;
  
  // Create custom event with selection details
  const selectionEvent = new CustomEvent('calendarRangeSelected', {
    detail: {
      startDate: finalStartDate,
      endDate: finalEndDate,
      roomId: selectedStartCell.dataset.roomId
    }
  });
  
  // Dispatch event
  document.dispatchEvent(selectionEvent);
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
