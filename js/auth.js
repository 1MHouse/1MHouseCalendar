// Authentication handling for 1M House
import { 
    auth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from './firebase.js';

// DOM Elements
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminPanel = document.getElementById('admin-panel');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const closeModalBtn = document.querySelector('.close');

// Event Listeners
adminLoginBtn.addEventListener('click', openLoginModal);
closeModalBtn.addEventListener('click', closeLoginModal);
loginForm.addEventListener('submit', handleLogin);

// Functions
function openLoginModal() {
    loginModal.style.display = 'block';
}

function closeLoginModal() {
    loginModal.style.display = 'none';
    loginForm.reset();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        closeLoginModal();
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error("Error signing in: ", error);
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

// Log out function
export async function logout() {
    try {
        await signOut(auth);
        showNotification('Logged out successfully!', 'success');
    } catch (error) {
        console.error("Error signing out: ", error);
        showNotification('Logout failed.', 'error');
    }
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        adminLoginBtn.textContent = 'Logout';
        adminLoginBtn.removeEventListener('click', openLoginModal);
        adminLoginBtn.addEventListener('click', logout);
        
        // Show admin panel
        adminPanel.style.display = 'block';
        
        // Dispatch event for admin state change
        document.dispatchEvent(new CustomEvent('adminStateChanged', { detail: { isAdmin: true } }));
    } else {
        // User is signed out
        adminLoginBtn.textContent = 'Admin Login';
        adminLoginBtn.removeEventListener('click', logout);
        adminLoginBtn.addEventListener('click', openLoginModal);
        
        // Hide admin panel
        adminPanel.style.display = 'none';
        
        // Dispatch event for admin state change
        document.dispatchEvent(new CustomEvent('adminStateChanged', { detail: { isAdmin: false } }));
    }
});

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                        type === 'error' ? '#F44336' : '#2196F3';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.minWidth = '200px';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.float = 'right';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = function() {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    };
    
    notification.appendChild(closeBtn);
    notificationContainer.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Export functions for use in other modules
export { showNotification };