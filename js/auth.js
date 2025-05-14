// Authentication handling for 1M House
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const userPanel = document.getElementById('userPanel');
const adminControls = document.getElementById('adminControls');
const userEmail = document.getElementById('userEmail');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');
const email = document.getElementById('email');
const password = document.getElementById('password');
const adminLoginToggle = document.getElementById('adminLoginToggle');

// Initialize authentication state listener
export function initAuth() {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            loginForm.style.display = 'none';
            userPanel.style.display = 'flex';
            adminControls.style.display = 'block';
            userEmail.textContent = user.email;
            console.log('User logged in:', user.email);
            
            // Update admin login toggle button
            adminLoginToggle.textContent = 'Admin Panel';
        } else {
            // User is signed out
            loginForm.style.display = 'block';
            userPanel.style.display = 'none';
            adminControls.style.display = 'none';
            console.log('User logged out');
            
            // Update admin login toggle button
            adminLoginToggle.textContent = 'Admin Login';
        }
    });

    // Login functionality
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const emailValue = email.value;
        const passwordValue = password.value;
        
        // Validate inputs
        if (!emailValue || !passwordValue) {
            authMessage.textContent = 'Please enter both email and passcode';
            return;
        }

        // Sign in with email and password
        signInWithEmailAndPassword(auth, emailValue, passwordValue)
            .then((userCredential) => {
                // Clear form and any error messages
                email.value = '';
                password.value = '';
                authMessage.textContent = '';
            })
            .catch((error) => {
                // Handle errors
                console.error('Login error:', error);
                authMessage.textContent = 'Invalid email or passcode';
            });
    });

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                // Sign-out successful
                console.log('Signed out successfully');
            })
            .catch((error) => {
                // An error happened during sign out
                console.error('Sign out error:', error);
            });
    });
}

// Export check for authentication
export function isAuthenticated() {
    return auth.currentUser !== null;
}

// Export function to get current user
export function getCurrentUser() {
    return auth.currentUser;
}
