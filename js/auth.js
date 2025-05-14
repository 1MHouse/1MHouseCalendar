import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from './firebase.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');

// Admin Authentication State
let currentUser = null;

// Initialize Auth State
export function initAuth() {
  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      currentUser = user;
      showAdminPanel();
      
      // Trigger event for other modules to respond to auth state
      const authEvent = new CustomEvent('adminAuthStateChanged', { 
        detail: { 
          isAdmin: true, 
          user: user 
        } 
      });
      document.dispatchEvent(authEvent);
    } else {
      // User is signed out
      currentUser = null;
      hideAdminPanel();
      
      // Trigger event for other modules to respond to auth state
      const authEvent = new CustomEvent('adminAuthStateChanged', { 
        detail: { 
          isAdmin: false, 
          user: null 
        } 
      });
      document.dispatchEvent(authEvent);
    }
  });
  
  // Add event listeners
  setupEventListeners();
}

// Set up event listeners for auth actions
function setupEventListeners() {
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Logout button click
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    // Start loading indicator
    toggleLoginLoading(true);
    
    // Sign in with email and password
    await signInWithEmailAndPassword(auth, email, password);
    
    // Clear form
    loginForm.reset();
    
    // Success notification
    showNotification('Logged in successfully', 'success');
  } catch (error) {
    console.error('Error logging in:', error);
    showNotification(`Login failed: ${error.message}`, 'error');
  } finally {
    // Stop loading indicator
    toggleLoginLoading(false);
  }
}

// Handle logout button click
async function handleLogout() {
  try {
    await signOut(auth);
    showNotification('Logged out successfully', 'success');
  } catch (error) {
    console.error('Error logging out:', error);
    showNotification(`Logout failed: ${error.message}`, 'error');
  }
}

// Toggle loading state for login form
function toggleLoginLoading(isLoading) {
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  
  if (isLoading) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
  } else {
    submitBtn.innerHTML = 'Login';
    submitBtn.disabled = false;
  }
}

// Show the admin panel, hide login form
function showAdminPanel() {
  if (adminLoginForm && adminPanel) {
    adminLoginForm.style.display = 'none';
    adminPanel.style.display = 'block';
  }
}

// Hide the admin panel, show login form
function hideAdminPanel() {
  if (adminLoginForm && adminPanel) {
    adminLoginForm.style.display = 'block';
    adminPanel.style.display = 'none';
  }
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

// Check if user is admin
export function isAdmin() {
  return currentUser !== null;
}

// Get current user
export function getCurrentUser() {
  return currentUser;
}

// Add notification CSS to document
function addNotificationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      display: none;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s forwards;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    .notification.success {
      background-color: #48bb78;
    }
    
    .notification.error {
      background-color: #f56565;
    }
    
    .notification.info {
      background-color: #4299e1;
    }
  `;
  
  document.head.appendChild(style);
}

// Add notification styles when the module loads
addNotificationStyles();
