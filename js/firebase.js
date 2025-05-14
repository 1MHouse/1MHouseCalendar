// Firebase configuration and database operations
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAPKCAhWh0-qf_mMYv2TbRZT7v9hKyXJA",
    authDomain: "m-house-d8a6e.firebaseapp.com",
    projectId: "m-house-d8a6e",
    storageBucket: "m-house-d8a6e.firebasestorage.app",
    messagingSenderId: "61730899773",
    appId: "1:61730899773:web:1141a38e6356151ba32754",
    measurementId: "G-G5VF653QNR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Database operations
// Bookings
export const getBookings = async () => {
    try {
        const bookingsCollection = collection(db, "bookings");
        const bookingsSnapshot = await getDocs(bookingsCollection);
        const bookingsList = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate.toDate(),
            endDate: doc.data().endDate.toDate()
        }));
        return bookingsList;
    } catch (error) {
        console.error("Error getting bookings: ", error);
        return [];
    }
};

export const getBookingsByDateRange = async (startDate, endDate) => {
    try {
        const bookingsCollection = collection(db, "bookings");
        const q = query(
            bookingsCollection,
            where("startDate", "<=", endDate),
            where("endDate", ">=", startDate)
        );
        const bookingsSnapshot = await getDocs(q);
        const bookingsList = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate.toDate(),
            endDate: doc.data().endDate.toDate()
        }));
        return bookingsList;
    } catch (error) {
        console.error("Error getting bookings by date range: ", error);
        return [];
    }
};

export const addBooking = async (booking) => {
    try {
        const bookingsCollection = collection(db, "bookings");
        const docRef = await addDoc(bookingsCollection, {
            ...booking,
            startDate: Timestamp.fromDate(new Date(booking.startDate)),
            endDate: Timestamp.fromDate(new Date(booking.endDate)),
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding booking: ", error);
        throw error;
    }
};

export const updateBooking = async (id, booking) => {
    try {
        const bookingRef = doc(db, "bookings", id);
        await updateDoc(bookingRef, {
            ...booking,
            startDate: Timestamp.fromDate(new Date(booking.startDate)),
            endDate: Timestamp.fromDate(new Date(booking.endDate)),
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error("Error updating booking: ", error);
        throw error;
    }
};

export const deleteBooking = async (id) => {
    try {
        const bookingRef = doc(db, "bookings", id);
        await deleteDoc(bookingRef);
        return true;
    } catch (error) {
        console.error("Error deleting booking: ", error);
        throw error;
    }
};

// Rooms
export const getRooms = async () => {
    try {
        const roomsCollection = collection(db, "rooms");
        const q = query(roomsCollection, orderBy("name"));
        const roomsSnapshot = await getDocs(q);
        const roomsList = roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return roomsList;
    } catch (error) {
        console.error("Error getting rooms: ", error);
        return [];
    }
};

export const addRoom = async (room) => {
    try {
        const roomsCollection = collection(db, "rooms");
        const docRef = await addDoc(roomsCollection, {
            ...room,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding room: ", error);
        throw error;
    }
};

export const updateRoom = async (id, room) => {
    try {
        const roomRef = doc(db, "rooms", id);
        await updateDoc(roomRef, {
            ...room,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error("Error updating room: ", error);
        throw error;
    }
};

export const deleteRoom = async (id) => {
    try {
        // Check if there are any bookings for this room
        const bookingsCollection = collection(db, "bookings");
        const q = query(bookingsCollection, where("roomId", "==", id));
        const bookingsSnapshot = await getDocs(q);
        
        if (!bookingsSnapshot.empty) {
            throw new Error("Cannot delete room with existing bookings");
        }
        
        const roomRef = doc(db, "rooms", id);
        await deleteDoc(roomRef);
        return true;
    } catch (error) {
        console.error("Error deleting room: ", error);
        throw error;
    }
};

// Locations
export const getLocations = async () => {
    try {
        const locationsCollection = collection(db, "locations");
        const q = query(locationsCollection, orderBy("name"));
        const locationsSnapshot = await getDocs(q);
        const locationsList = locationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return locationsList;
    } catch (error) {
        console.error("Error getting locations: ", error);
        return [];
    }
};

export const addLocation = async (location) => {
    try {
        const locationsCollection = collection(db, "locations");
        const docRef = await addDoc(locationsCollection, {
            ...location,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding location: ", error);
        throw error;
    }
};

export const updateLocation = async (id, location) => {
    try {
        const locationRef = doc(db, "locations", id);
        await updateDoc(locationRef, {
            ...location,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error("Error updating location: ", error);
        throw error;
    }
};

export const deleteLocation = async (id) => {
    try {
        // Check if there are any rooms for this location
        const roomsCollection = collection(db, "rooms");
        const q = query(roomsCollection, where("locationId", "==", id));
        const roomsSnapshot = await getDocs(q);
        
        if (!roomsSnapshot.empty) {
            throw new Error("Cannot delete location with existing rooms");
        }
        
        const locationRef = doc(db, "locations", id);
        await deleteDoc(locationRef);
        return true;
    } catch (error) {
        console.error("Error deleting location: ", error);
        throw error;
    }
};

// Initialize default data if not exists
export const initializeDefaultData = async () => {
    try {
        // Check if locations exists
        const locationsCollection = collection(db, "locations");
        const locationsSnapshot = await getDocs(locationsCollection);
        
        if (locationsSnapshot.empty) {
            // Add default location
            const granadaLocation = await addLocation({
                name: "Granada House",
                address: "Calle Principal 123, Granada, Spain"
            });
            
            // Add default rooms
            const roomNames = ["Master Bedroom", "Guest Room 1", "Guest Room 2", "Guest Room 3", "Guest Room 4"];
            const roomColors = ["#4CAF50", "#2196F3", "#9C27B0", "#FF9800", "#E91E63"];
            
            for (let i = 0; i < roomNames.length; i++) {
                await addRoom({
                    name: roomNames[i],
                    locationId: granadaLocation,
                    capacity: i === 0 ? 2 : 1,
                    color: roomColors[i]
                });
            }
            
            console.log("Default data initialized");
        }
    } catch (error) {
        console.error("Error initializing default data: ", error);
    }
};

// Auth state
export const getCurrentUser = () => {
    return auth.currentUser;
};

export { auth, db };

// Initialize default data on load
document.addEventListener('DOMContentLoaded', initializeDefaultData);