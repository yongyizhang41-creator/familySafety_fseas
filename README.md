# FSEAS — Family Safety & Emergency Alert System

Based on the [original FSEAS project](https://github.com/harsh-dhamaa/familySafety_fseas). This repository is independently maintained.

FSEAS is a modern, real-time web application designed to keep families safe through live location tracking, smart safe zones (geofences), and instant SOS alerts.

## Tech Stack

**Frontend:**
- React 18 / Vite
- Zustand (State Management)
- Tailwind CSS (Styling)
- Socket.io-client (Real-time updates)
- Firebase JS SDK (Push Notifications)
- Google Maps React Wrapper

**Backend:**
- Node.js 20 LTS / Express 4
- MongoDB Atlas / Mongoose 8
- Socket.io 4 (Real-time events)
- Firebase Admin SDK (Push Notifications)
- JWT (Access & Refresh tokens)
- node-cron (Automated data purging)

## Features

1. **Authentication & Authorization**
   - Secure login & registration with JWT access tokens (in-memory) and refresh tokens (HTTP-only cookies).
   - Groups system with alphanumeric invite codes.
   - Admin panel to oversee and manage all users and groups.

2. **Live Location Tracking**
   - High-accuracy GPS tracking using HTML5 Geolocation API.
   - Pushed directly to group members via WebSockets.
   - Privacy-focused: Location sharing can be toggled on/off at any time.
   - View historical location trails up to 7 days.

3. **SOS Alerts**
   - One-tap SOS button that pulses and requires confirmation.
   - Broadcasts immediate full-screen alerts to all group members.
   - Includes Google Maps integration with exact trigger coordinates.
   - Resolved alerts are stored securely for historical review.

4. **Smart Safe Zones (Geofencing)**
   - Group owners can define circular boundaries around key locations (e.g., Home, School).
   - In-memory geospatial state tracking using Haversine algorithm.
   - Instant notifications (Sockets & Push) when a user enters or exits a safe zone.

5. **Cross-platform Push Notifications**
   - Fully integrated with Firebase Cloud Messaging (FCM).
   - Works in Web environments utilizing Service Workers.

## Setup Instructions

### Pre-requisites
- Node.js v20+
- MongoDB Atlas cluster URL
- Firebase service account JSON
- Google Maps API Key
- VAPID keys for Firebase Web Push

### Backend Setup
1. Navigate to `server/`
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in all variables.
4. Run `npm run dev` (starts on port 5000)

### Frontend Setup
1. Navigate to `client/`
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in all variables.
4. Run `npm run dev` (starts on port 5173)

## Architecture Notes

- **Geofencing:** Handled server-side to prevent battery drain on client devices and ensure alerts trigger even if the app minimizes.
- **Token Security:** XSS-protected by keeping Access Tokens entirely in Zustand memory. CSRF-protected by utilizing HTTP-only strict cookies strictly for Refresh Tokens.
- **Data Pruning:** Uses a two-tier approach for deleting old locations. MongoDB TTL Indexes (7 days) + a daily cron job backup.
