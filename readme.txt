# 1M House - Members Club Calendar

A prototype website for "1M House" - a members club that gives access to a house in Granada, Spain. This application provides a calendar system to manage room bookings across different locations.

## Features

- Calendar view of room bookings
- Admin access with passcode protection
- Add, edit, and remove bookings
- Manage rooms and locations
- Hosted on GitHub Pages with Firebase backend

## Project Structure

```
/
├── index.html         # Main page
├── css/               # Stylesheets
│   └── styles.css     # Main styles
├── js/                # JavaScript files
│   ├── app.js         # Main application logic
│   ├── auth.js        # Authentication handling
│   ├── calendar.js    # Calendar functionality
│   └── firebase-config.js # Firebase configuration
└── README.md          # This file
```

## Setup Instructions

### Prerequisites

- GitHub account
- Firebase account
- Basic knowledge of HTML, CSS, and JavaScript

### Firebase Setup

1. Create a Firebase account at [firebase.google.com](https://firebase.google.com/)
2. Create a new project named "1M-House" (or your preferred name)
3. Enable Authentication with Email/Password provider
4. Create a Realtime Database in test mode
5. Add a web app to your Firebase project and copy the configuration

### Local Development

1. Clone this repository to your local machine
2. Update the Firebase configuration in `js/firebase-config.js` with your own credentials
3. Set up directory structure as shown above
4. Open `index.html` in your browser to test locally

### Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push your code to the repository
3. Go to repository Settings > Pages
4. Select main branch as source and click Save
5. Your site will be published at `https://[username].github.io/[repository-name]/`

## User Management

As this is a prototype, you'll need to manually create admin users in the Firebase Authentication console:

1. Go to your Firebase project
2. Navigate to Authentication > Users
3. Click "Add User"
4. Enter an email and password for the admin
5. Share these credentials with authorized personnel

## Customization

- Update the title, logo, and branding in `index.html`
- Modify the CSS in `styles.css` to match your preferred color scheme
- Add additional fields to the booking form in `index.html` and `calendar.js` as needed

## Future Enhancements

- Member profiles and management
- Payment integration
- Email notifications for bookings
- Mobile application
- Advanced reporting and analytics

## License

This project is licensed under the MIT License.
