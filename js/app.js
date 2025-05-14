// Main application script for 1M House
import { initAuth } from './auth.js';
import { initCalendar, showBookingModal, showRoomsModal, showLocationsModal } from './calendar.js';

// DOM Elements
const addBookingBtn = document.getElementById('addBookingBtn');
const manageRoomsBtn = document.getElementById('manageRoomsBtn');
const manageLocationsBtn = document.getElementById('manageLocationsBtn');

// When DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('1M House Calendar Application Initialized');
    
    // Initialize authentication
    initAuth();
    
    // Initialize calendar
    initCalendar();
    
    // Add event listeners for admin buttons
    addBookingBtn.addEventListener('click', showBookingModal);
    manageRoomsBtn.addEventListener('click', showRoomsModal);
    manageLocationsBtn.addEventListener('click', showLocationsModal);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const bookingModal = document.getElementById('bookingModal');
        const roomsModal = document.getElementById('roomsModal');
        const locationsModal = document.getElementById('locationsModal');
        
        if (event.target === bookingModal) {
            bookingModal.style.display = 'none';
        } else if (event.target === roomsModal) {
            roomsModal.style.display = 'none';
        } else if (event.target === locationsModal) {
            locationsModal.style.display = 'none';
        }
    });
});
