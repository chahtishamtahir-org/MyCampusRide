<div align="center">

# 🚌 MyCampusRide

### A Full-Stack Campus Transport Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)


*Real-time bus tracking, fleet management, and student transport coordination — all in one platform.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Role-Based Access](#-role-based-access)
- [Real-Time Features](#-real-time-features)
- [Contributing](#-contributing)


---

## 🌟 Overview

**MyCampusRide** is a full-stack web application built to modernize campus transport management. It provides a centralized platform where **administrators** can manage the entire fleet, **drivers** can share their live location and manage trips, and **students** can track their bus in real time and view their transport details.

The system is designed specifically for educational institutions looking to replace manual, paper-based transport coordination with a digital, real-time solution.

---

## ✨ Key Features

### 👨‍💼 Admin Panel
| Feature | Description |
|---|---|
| 📊 Dashboard Overview | Live statistics — total users, buses, routes, and active trips |
| 👥 User Management | Full CRUD for students and drivers, with role-based approval workflows |
| 🚌 Fleet Management | Register buses, track status (available / on trip / maintenance), and assign drivers |
| 🗺️ Route Management | Define routes with named stops, GPS coordinates, pickup times, and per-stop fees |
| 💳 Fee Management | Track and update student fee statuses (paid / partially paid / pending / defaulter) with audit logs |
| 📡 Live Tracking | Real-time map view of all active buses via Socket.IO |
| 🔔 Notifications | Broadcast announcements to students and drivers |
| 📋 Bus Assignments | Assign buses and routes to students; handle displaced student cases |

### 🚗 Driver Dashboard
| Feature | Description |
|---|---|
| 📍 Live Location Sharing | Broadcast GPS location to the server in real time |
| 🚦 Trip Management | Start/end trips with automatic notifications to students and admins |
| 👥 Passenger View | View the list of students assigned to their route |
| 📅 Schedule View | Access daily route schedule and stop sequence |
| 🔔 Notifications | Receive real-time alerts from admin |

### 🎓 Student Dashboard
| Feature | Description |
|---|---|
| 🗺️ Live Bus Tracking | Real-time map showing their assigned bus's current location |
| 🪪 Virtual Transport Card | Digital ID card displaying student transport details |
| 📅 Schedule & Stops | View route stops, pickup times, and fees |
| 👤 Profile Management | Update personal details, emergency contact, and profile photo |
| 💰 Fee Status | View current fee status and payment history |

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Real-Time:** Socket.IO (WebSockets)
- **Authentication:** JWT (JSON Web Tokens) via HTTP-only cookies
- **File Uploads:** Multer (profile pictures, driving licence documents)
- **Security:** bcryptjs (password hashing), CORS, cookie-parser

### Frontend
- **Framework:** React 19 with Vite
- **UI Library:** Material UI (MUI) v5
- **Routing:** React Router DOM v6
- **Real-Time:** Socket.IO Client
- **Maps:** Leaflet + React Leaflet
- **HTTP Client:** Axios
- **PDF Export:** jsPDF + html2canvas
- **Notifications:** React Toastify

---

## 🏗️ Architecture

```
MyCampusRide/
├── backend/          # Node.js + Express REST API + Socket.IO server
│   ├── controllers/      # Business logic (auth, users, buses, routes, tracking, notifications)
│   ├── middleware/       # Auth guard, role guard, file upload, error handler
│   ├── models/           # Mongoose schemas (User, Bus, Route, Notification)
│   ├── routes/           # Express route definitions
│   ├── services/         # Socket.IO service layer
│   └── server.js         # Application entry point
│
└── frontend/         # React + Vite SPA
    ├── src/
    │   ├── pages/
    │   │   ├── AdminDashboard/    # Admin views & components
    │   │   ├── DriverDashboard/   # Driver views & components
    │   │   ├── StudentDashboard/  # Student views & components
    │   │   ├── LandingPage/
    │   │   ├── LoginPage/
    │   │   └── RegisterPage/
    │   ├── components/   # Shared components (Navbar, Footer, ProtectedRoute)
    │   ├── context/      # React Context (AuthContext)
    │   ├── services/     # API service layer (Axios)
    │   └── utils/        # Utility helpers
    └── vite.config.js
```

### Data Flow

```
Client (React) ──HTTP──► Express REST API ──► MongoDB
       │                        │
       └──── WebSocket ────────► Socket.IO
              (real-time location, trip events, notifications)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [MongoDB](https://www.mongodb.com/) (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/chahtishamtahir/MyCampusRide.git
cd MyCampusRide
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

### Environment Variables

#### Backend (`backend/.env`)

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/mycampusride

# Authentication
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
```

### Running the Application

**Start the backend server** (from `backend/`)
```bash
npm run dev
```
The API will be available at `http://localhost:5000`

**Start the frontend dev server** (from `frontend/`)
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

**Health Check**

Once the backend is running, verify it's working:
```
GET http://localhost:5000/api/health
```

---

## 📁 Project Structure

### Backend — Key Files

| Path | Purpose |
|---|---|
| `server.js` | Express app setup, Socket.IO config, DB connection |
| `controllers/authController.js` | Registration, login, logout, JWT management |
| `controllers/userController.js` | User CRUD, profile management, fee updates |
| `controllers/busController.js` | Bus registration, status updates, assignments |
| `controllers/routeController.js` | Route & stop management |
| `controllers/trackingController.js` | Location persistence, trip state |
| `controllers/notificationController.js` | Notification broadcast and management |
| `models/User.js` | User schema (students, drivers, admins) |
| `models/Bus.js` | Bus schema with live location & trip state |
| `models/Route.js` | Route schema with nested stop sub-documents |
| `models/Notification.js` | Notification schema |
| `middleware/authMiddleware.js` | JWT verification, cookie extraction |
| `middleware/roleMiddleware.js` | Role-based access control |
| `middleware/fileUpload.js` | Multer config for profile pics & documents |
| `services/socketService.js` | Socket.IO event handlers (location, trips) |

### Frontend — Key Pages

| Page | Route | Access |
|---|---|---|
| Landing Page | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Admin Dashboard | `/admin/*` | Admin only |
| Driver Dashboard | `/driver/*` | Driver only |
| Student Dashboard | `/student/*` | Student only |

---

## 📡 API Reference

All API endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT cookie | Public |
| `POST` | `/api/auth/logout` | Clear auth cookie | Protected |
| `GET` | `/api/auth/me` | Get current authenticated user | Protected |

### Users

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/users` | List all users | Admin |
| `GET` | `/api/users/:id` | Get a specific user | Admin |
| `PUT` | `/api/users/:id` | Update user details | Admin / Self |
| `DELETE` | `/api/users/:id` | Delete a user | Admin |
| `PATCH` | `/api/users/:id/fee-status` | Update student fee status | Admin |

### Buses

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/buses` | List all buses | Admin |
| `POST` | `/api/buses` | Register a new bus | Admin |
| `PUT` | `/api/buses/:id` | Update bus details | Admin |
| `DELETE` | `/api/buses/:id` | Remove a bus | Admin |

### Routes

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/routes` | List all routes | All |
| `POST` | `/api/routes` | Create a new route | Admin |
| `PUT` | `/api/routes/:id` | Update a route | Admin |
| `DELETE` | `/api/routes/:id` | Delete a route | Admin |

### Tracking

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/tracking/location` | Update bus location | Driver |
| `GET` | `/api/tracking/buses` | Get all bus locations | Admin |
| `POST` | `/api/tracking/trip/start` | Start a trip | Driver |
| `POST` | `/api/tracking/trip/end` | End a trip | Driver |

### Notifications

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/notifications` | Get notifications for current user | All |
| `POST` | `/api/notifications` | Send a notification | Admin |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read | All |

---

## 🔐 Role-Based Access

MyCampusRide implements three user roles with distinct access levels:

```
┌─────────────┬──────────────────────────────────────────────────────────┐
│    Role     │  Permissions                                             │
├─────────────┼──────────────────────────────────────────────────────────┤
│   Admin     │  Full access to all features. Manages users, buses,      │
│             │  routes, fees, notifications, and live tracking.          │
├─────────────┼──────────────────────────────────────────────────────────┤
│   Driver    │  Can share live GPS location, start/end trips, view      │
│             │  assigned route, view passenger list, receive alerts.     │
├─────────────┼──────────────────────────────────────────────────────────┤
│   Student   │  Can view assigned bus location, transport card,          │
│             │  route schedule, fee status, and manage their profile.    │
└─────────────┴──────────────────────────────────────────────────────────┘
```

- New **driver** accounts start in `pending` status and must be approved by an admin.
- New **student** accounts are `active` immediately upon registration.
- Routes are protected on both the frontend (`ProtectedRoute` component) and backend (JWT + role middleware).

---

## ⚡ Real-Time Features

MyCampusRide uses **Socket.IO** for all real-time communication. Users join role-specific and resource-specific rooms on connection.

### Socket Events

| Event (Client → Server) | Description |
|---|---|
| `join-room` | Join role room (`admin-room`, `driver-room`) and user-specific room |
| `location-update` | Driver broadcasts GPS coordinates |
| `trip-started` | Driver signals trip has begun |
| `trip-ended` | Driver signals trip is complete |

| Event (Server → Client) | Description |
|---|---|
| `bus-location-update` | Live bus position sent to admins and students on that route |
| `trip-notification` | Trip start/end alerts sent to relevant students and admins |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**

Please make sure your code follows the existing patterns and that all existing functionality continues to work before submitting a PR.

---



---

<div align="center">

Built with ❤️ for campus communities

</div>
