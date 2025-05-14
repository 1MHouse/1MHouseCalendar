# 1M House - Availability Calendar

A prototype website for "1M House", a members club that provides access to a house in Granada, Spain. This web application displays room availability and includes admin functionality to manage bookings, rooms, and locations.

## Features

- **Calendar View**: Shows room availability with days as columns and rooms as rows
- **Color-Coded Bookings**: Easy visual identification of booked dates
- **Navigation**: Buttons to navigate forward or backward in time
- **Admin Features**:
  - Secure login for administrators
  - Add, edit, and remove bookings
  - Manage rooms and their properties
  - Manage locations

## Project Structure

```
├── index.html         # Main page
├── css/               # Stylesheets
│   ├── styles.css     # Main styles
│   └── calendar.css   # Calendar-specific styles
├── js/
│   ├── app.js         # Main application logic
│   ├── auth.js        # Authentication handling
│   ├── calendar.js    # Calendar setup and operations
│   └── firebase.js    # Firebase configuration
└── README.md          # Documentation
```

## Setup and Deployment

### Prerequisites

- A Firebase account
- Git and GitHub account

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/your-username/1m-house.git
   cd 1m-house
   ```

2. Open `index.html` in your browser to view the application locally.

### Firebase Setup

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Set up Firebase Authentication with Email/Password provider
3. Create a Firestore database
4. Replace the Firebase configuration in `js/firebase.js` with your own

### GitHub Pages Deployment

1. Push the code to your GitHub repository
2. Enable GitHub Pages for the repository
3. Access the deployed site via the GitHub Pages URL

## Database Structure

The application uses Firebase Firestore with the following collections:

- **bookings**: Stores booking information
  - roomId: Reference to the room
  - startDate: Check-in date
  - endDate: Check-out date
  - memberName: Name of the member
  - notes: Additional booking notes

- **rooms**: Stores room information
  - name: Room name
  - locationId: Reference to the location
  - capacity: Number of people the room can accommodate
  - color: Color used in the calendar for this room

- **locations**: Stores location information
  - name: Location name
  - address: Full address of the location

## Admin Access

To access admin features, you need to create a user in Firebase Authentication. Once created, you can log in using the "Admin Login" button on the website.

## License

This project is licensed under the MIT License.