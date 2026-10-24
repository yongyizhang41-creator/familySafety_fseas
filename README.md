# FSEAS — Family Safety & Emergency Alert System

A web application for family groups to share locations, manage safe zones, and send SOS alerts.

Based on the [original FSEAS project](https://github.com/harsh-dhamaa/familySafety_fseas). This repository is independently maintained.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, Zustand 4 |
| Styling | Tailwind CSS 3, React Hot Toast |
| Maps | Leaflet 1.9, React Leaflet 4, OpenStreetMap tiles |
| API client and real-time communication | Axios, Socket.io Client 4 |
| Backend | Node.js, Express 4, Socket.io 4 |
| Database | MongoDB with Mongoose 8 |
| Authentication | JSON Web Tokens, bcryptjs, HTTP-only refresh cookies |
| Notifications | Firebase JavaScript SDK 10, Firebase Admin SDK 12, service worker |
| Server utilities | Helmet, CORS, express-validator, node-cron |
| Deployment | Render Node web service; Node.js 22.23.3 in `render.yaml` |

The live map uses OpenStreetMap tiles and does not require a Google Maps API key. The Google Maps wrapper remains in the dependency list but is not used by the live map.

## Architecture

The repository contains a React client in `client/` and an Express server in `server/`.

```text
Browser: React UI, Zustand, Leaflet, Geolocation API
    | REST requests (/api/*) and Socket.io events
    v
Node.js: Express API + Socket.io server
    |-- MongoDB: users, groups, locations, safe zones, SOS alerts, notifications
    |-- Geofence checks: distance calculation and in-memory boundary state
    |-- Scheduled job: delete expired location records
    `-- Firebase Admin: push delivery when configured
```

- **Development:** Vite serves the frontend on port `5173`; Express and Socket.io run on port `5000` by default.
- **Production:** Express serves the built React application from `client/dist`, the REST API, and Socket.io through the same Render service and HTTPS origin.
- **Authentication:** Access tokens are kept in Zustand memory. Refresh tokens use HTTP-only cookies with `SameSite=Strict` and the `Secure` flag in production. Protected API routes enforce authentication and role or group permissions.
- **Location updates:** The browser watches the user's position while the user is authenticated, belongs to a group, and has location sharing enabled. Updates are throttled to at most one every 10 seconds and sent through Socket.io. The server stores locations, broadcasts updates to the group, and checks safe-zone boundaries. A REST location-update endpoint is also available.
- **Geofencing:** The server uses the Haversine formula to compare reported coordinates with circular safe zones. Entry/exit state is held in memory and resets on restart; the first update establishes a baseline without generating a crossing alert.
- **Retention:** Location records have a seven-day MongoDB TTL index, with a daily cleanup job as a second mechanism. The history endpoint returns up to the latest 100 records per requested group member.

Location tracking depends on browser permissions and continued browser location updates. Closing the application or browser background restrictions can interrupt tracking and geofence detection.

## Features

- **Accounts and sessions:** Register, log in, refresh sessions, log out, and update profile or location-sharing preferences.
- **Family groups:** Create or join a group using an invite code, view members, and manage membership through owner controls.
- **Live map:** Display group-member locations and safe zones using Leaflet and OpenStreetMap, with a control to center the map on the user's location.
- **Location history:** View stored location records for members of the same group, subject to the seven-day retention policy and the endpoint's 100-record limit.
- **SOS alerts:** Send an SOS alert with location information, notify group members in real time, resolve active alerts, and view alert history.
- **Safe zones:** Group owners can create, edit, and delete circular safe zones. Reported boundary crossings generate group socket events and stored notifications.
- **Notifications:** View in-app notifications. Firebase Cloud Messaging supports push delivery when server credentials, frontend Firebase settings, a VAPID key, and browser notification permission are configured.
- **Administration:** Accounts with the `admin` role can view users and groups and delete users. Registration does not provide a public admin-role selector.
- **Health endpoint:** `GET /health` returns a JSON response for service health checks.

Firebase push delivery is optional and is not enabled by the default Render blueprint alone. The most recently verified deployment started without a Firebase service account, so push delivery requires additional configuration.

## Setup Instructions

### Prerequisites

- Node.js 22.23.3 to match the Render configuration, with npm.
- A MongoDB database reachable from your local machine or Render service.
- A browser with geolocation support and location permission. Use localhost for local development and HTTPS for a hosted deployment.
- Optional: a Firebase project with Cloud Messaging, a service account, and a Web Push VAPID public key.

### Local Development

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/yongyizhang41-creator/familySafety_fseas.git
   cd familySafety_fseas
   npm run install-all
   ```

2. Create the environment files:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. Edit `server/.env`:

   - Set `MONGODB_URI` to your MongoDB connection string.
   - Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET` to separate random values. Generate each value with `openssl rand -hex 32`.
   - Keep `NODE_ENV=development`, `PORT=5000`, and `CLIENT_ORIGIN=http://localhost:5173` for the default local setup.
   - Keep the sample token lifetimes (`15m` and `7d`) or adjust them as needed.
   - Leave `FIREBASE_SERVICE_ACCOUNT_KEY` empty unless configuring push notifications.

4. In `client/.env`, keep the default local endpoints:

   ```dotenv
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

   Firebase settings can remain empty for the core application. `VITE_GOOGLE_MAPS_API_KEY` is not required for the Leaflet map.

5. Start the frontend and backend from the repository root:

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173`. Check the backend at `http://localhost:5000/health`. Register an account, create or join a group, and allow location access to use location sharing.

### Optional Firebase Push Notifications

1. Set `FIREBASE_SERVICE_ACCOUNT_KEY` on the server to a valid service-account JSON string. Keep this value on the server only.
2. Fill in the `VITE_FIREBASE_*` values from `client/.env.example`, including `VITE_FIREBASE_VAPID_KEY`, using the same Firebase project.
3. Restart local development, or rebuild and redeploy production after changing frontend variables. Vite embeds these values during the build; never place service-account credentials in a `VITE_*` variable.
4. Allow notifications in a browser that supports Firebase Cloud Messaging. The frontend registers `client/public/firebase-messaging-sw.js` for background notifications.

### Render Deployment

The repository includes `render.yaml` for a single free Node web service.

1. Connect the GitHub repository to Render and create a Blueprint using `render.yaml`.
2. Supply `MONGODB_URI` and allow the Render service to connect to your database. The blueprint generates the JWT and cookie secrets automatically.
3. Render uses these commands from the repository root:

   ```bash
   # Build
   npm ci --prefix client --include=dev && npm ci --prefix server --omit=dev && npm run build

   # Start
   npm start
   ```

4. Keep `NODE_ENV=production` and `VITE_API_URL=/api`. Leave `VITE_SOCKET_URL` unset to use the page's origin. The server uses Render's `RENDER_EXTERNAL_URL` as the client origin unless `CLIENT_ORIGIN` is explicitly set.
5. Add the optional Firebase environment variables before building if push notifications are needed.
6. Deploy and verify `/health`. Render's health-check path is already set to `/health` in the blueprint. Free instances can spin down during inactivity and take time to wake up.
