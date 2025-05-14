// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services
export { 
  app, 
  analytics, 
  auth, 
  db, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy
};

// Create default data (to be called once)
export async function initializeDefaultData() {
  try {
    // Check if the default location exists
    const locationsRef = collection(db, "locations");
    const locationsSnapshot = await getDocs(locationsRef);
    
    if (locationsSnapshot.empty) {
      // Add default location
      const defaultLocation = {
        name: "1M House Granada",
        address: "Calle Principal 123",
        city: "Granada",
        country: "Spain",
        isDefault: true
      };
      
      const newLocationRef = await addDoc(locationsRef, defaultLocation);
      const locationId = newLocationRef.id;
      
      // Add default rooms
      const roomsRef = collection(db, "rooms");
      const defaultRooms = [
        { name: "Master Suite", locationId, capacity: 2, description: "Luxurious master bedroom with en-suite bathroom" },
        { name: "Garden View", locationId, capacity: 2, description: "Bedroom with beautiful garden views" },
        { name: "Mountain View", locationId, capacity: 2, description: "Bedroom with stunning mountain views" },
        { name: "Courtyard Room", locationId, capacity: 1, description: "Cozy room facing the inner courtyard" },
        { name: "Alhambra View", locationId, capacity: 2, description: "Room with views of the Alhambra palace" }
      ];
      
      for (const room of defaultRooms) {
        await addDoc(roomsRef, room);
      }
      
      console.log("Default data initialized successfully");
      return true;
    }
    
    return false; // Default data already exists
  } catch (error) {
    console.error("Error initializing default data:", error);
    return false;
  }
}

// CRUD Functions for Locations
export const LocationsAPI = {
  async getAll() {
    try {
      const locationsRef = collection(db, "locations");
      const locationsSnapshot = await getDocs(query(locationsRef, orderBy("name")));
      
      const locations = [];
      locationsSnapshot.forEach((doc) => {
        locations.push({ id: doc.id, ...doc.data() });
      });
      
      return locations;
    } catch (error) {
      console.error("Error getting locations:", error);
      throw error;
    }
  },
  
  async getById(id) {
    try {
      const locationRef = doc(db, "locations", id);
      const locationSnapshot = await getDoc(locationRef);
      
      if (locationSnapshot.exists()) {
        return { id: locationSnapshot.id, ...locationSnapshot.data() };
      } else {
        console.error("Location not found");
        return null;
      }
    } catch (error) {
      console.error("Error getting location:", error);
      throw error;
    }
  },
  
  async create(locationData) {
    try {
      const locationsRef = collection(db, "locations");
      const newLocationRef = await addDoc(locationsRef, locationData);
      
      return { id: newLocationRef.id, ...locationData };
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  },
  
  async update(id, locationData) {
    try {
      const locationRef = doc(db, "locations", id);
      await updateDoc(locationRef, locationData);
      
      return { id, ...locationData };
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },
  
  async delete(id) {
    try {
      // Check if this location has rooms
      const roomsRef = collection(db, "rooms");
      const roomsQuery = query(roomsRef, where("locationId", "==", id));
      const roomsSnapshot = await getDocs(roomsQuery);
      
      if (!roomsSnapshot.empty) {
        throw new Error("Cannot delete location with associated rooms");
      }
      
      // If no rooms, delete location
      const locationRef = doc(db, "locations", id);
      await deleteDoc(locationRef);
      
      return true;
    } catch (error) {
      console.error("Error deleting location:", error);
      throw error;
    }
  }
};

// CRUD Functions for Rooms
export const RoomsAPI = {
  async getAll() {
    try {
      const roomsRef = collection(db, "rooms");
      const roomsSnapshot = await getDocs(query(roomsRef, orderBy("name")));
      
      const rooms = [];
      roomsSnapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() });
      });
      
      return rooms;
    } catch (error) {
      console.error("Error getting rooms:", error);
      throw error;
    }
  },
  
  async getByLocationId(locationId) {
    try {
      const roomsRef = collection(db, "rooms");
      const roomsQuery = query(roomsRef, where("locationId", "==", locationId), orderBy("name"));
      const roomsSnapshot = await getDocs(roomsQuery);
      
      const rooms = [];
      roomsSnapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() });
      });
      
      return rooms;
    } catch (error) {
      console.error("Error getting rooms by location:", error);
      throw error;
    }
  },
  
  async getById(id) {
    try {
      const roomRef = doc(db, "rooms", id);
      const roomSnapshot = await getDoc(roomRef);
      
      if (roomSnapshot.exists()) {
        return { id: roomSnapshot.id, ...roomSnapshot.data() };
      } else {
        console.error("Room not found");
        return null;
      }
    } catch (error) {
      console.error("Error getting room:", error);
      throw error;
    }
  },
  
  async create(roomData) {
    try {
      const roomsRef = collection(db, "rooms");
      const newRoomRef = await addDoc(roomsRef, roomData);
      
      return { id: newRoomRef.id, ...roomData };
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  },
  
  async update(id, roomData) {
    try {
      const roomRef = doc(db, "rooms", id);
      await updateDoc(roomRef, roomData);
      
      return { id, ...roomData };
    } catch (error) {
      console.error("Error updating room:", error);
      throw error;
    }
  },
  
  async delete(id) {
    try {
      // Check if this room has bookings
      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(bookingsRef, where("roomId", "==", id));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      if (!bookingsSnapshot.empty) {
        throw new Error("Cannot delete room with associated bookings");
      }
      
      // If no bookings, delete room
      const roomRef = doc(db, "rooms", id);
      await deleteDoc(roomRef);
      
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  }
};

// CRUD Functions for Bookings
export const BookingsAPI = {
  async getAll() {
    try {
      const bookingsRef = collection(db, "bookings");
      const bookingsSnapshot = await getDocs(query(bookingsRef, orderBy("startDate", "desc")));
      
      const bookings = [];
      bookingsSnapshot.forEach((doc) => {
        const bookingData = doc.data();
        
        // Convert Firebase Timestamps to Date objects
        if (bookingData.startDate && bookingData.startDate.toDate) {
          bookingData.startDate = bookingData.startDate.toDate();
        }
        if (bookingData.endDate && bookingData.endDate.toDate) {
          bookingData.endDate = bookingData.endDate.toDate();
        }
        
        bookings.push({ id: doc.id, ...bookingData });
      });
      
      return bookings;
    } catch (error) {
      console.error("Error getting bookings:", error);
      throw error;
    }
  },
  
  async getBookingsByDateRange(startDate, endDate) {
    try {
      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(
        bookingsRef,
        where("startDate", "<=", endDate),
        where("endDate", ">=", startDate)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      const bookings = [];
      bookingsSnapshot.forEach((doc) => {
        const bookingData = doc.data();
        
        // Convert Firebase Timestamps to Date objects
        if (bookingData.startDate && bookingData.startDate.toDate) {
          bookingData.startDate = bookingData.startDate.toDate();
        }
        if (bookingData.endDate && bookingData.endDate.toDate) {
          bookingData.endDate = bookingData.endDate.toDate();
        }
        
        bookings.push({ id: doc.id, ...bookingData });
      });
      
      return bookings;
    } catch (error) {
      console.error("Error getting bookings by date range:", error);
      throw error;
    }
  },
  
  async getById(id) {
    try {
      const bookingRef = doc(db, "bookings", id);
      const bookingSnapshot = await getDoc(bookingRef);
      
      if (bookingSnapshot.exists()) {
        const bookingData = bookingSnapshot.data();
        
        // Convert Firebase Timestamps to Date objects
        if (bookingData.startDate && bookingData.startDate.toDate) {
          bookingData.startDate = bookingData.startDate.toDate();
        }
        if (bookingData.endDate && bookingData.endDate.toDate) {
          bookingData.endDate = bookingData.endDate.toDate();
        }
        
        return { id: bookingSnapshot.id, ...bookingData };
      } else {
        console.error("Booking not found");
        return null;
      }
    } catch (error) {
      console.error("Error getting booking:", error);
      throw error;
    }
  },
  
  async create(bookingData) {
    try {
      // Check for overlapping bookings
      const existingBookings = await this.getBookingsByDateRange(
        bookingData.startDate,
        bookingData.endDate
      );
      
      const overlappingBooking = existingBookings.find(
        booking => booking.roomId === bookingData.roomId
      );
      
      if (overlappingBooking) {
        throw new Error("This room is already booked for the selected dates");
      }
      
      const bookingsRef = collection(db, "bookings");
      const newBookingRef = await addDoc(bookingsRef, bookingData);
      
      return { id: newBookingRef.id, ...bookingData };
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },
  
  async update(id, bookingData) {
    try {
      // Get current booking
      const currentBooking = await this.getById(id);
      
      // Check for overlapping bookings (excluding this booking)
      const existingBookings = await this.getBookingsByDateRange(
        bookingData.startDate,
        bookingData.endDate
      );
      
      const overlappingBooking = existingBookings.find(
        booking => booking.roomId === bookingData.roomId && booking.id !== id
      );
      
      if (overlappingBooking) {
        throw new Error("This room is already booked for the selected dates");
      }
      
      const bookingRef = doc(db, "bookings", id);
      await updateDoc(bookingRef, bookingData);
      
      return { id, ...bookingData };
    } catch (error) {
      console.error("Error updating booking:", error);
      throw error;
    }
  },
  
  async delete(id) {
    try {
      const bookingRef = doc(db, "bookings", id);
      await deleteDoc(bookingRef);
      
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw error;
    }
  }
};
