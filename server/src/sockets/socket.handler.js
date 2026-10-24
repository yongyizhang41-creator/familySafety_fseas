import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Location from '../models/Location.model.js';
import Notification from '../models/Notification.model.js';
import { checkGeofences } from '../services/geofence.service.js';

export default function initSocketHandlers(io) {
  // ─── Socket Middleware: JWT Verification ────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: Token missing'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('name group isLocationSharingOn');

      if (!user) return next(new Error('Authentication error: User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── Socket Event Handlers ──────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // On connect: server joins socket to room `group:<groupId>`
    // and a personal room `user:<userId>` for directed events/evictions
    socket.join(`user:${socket.user._id.toString()}`);
    if (socket.user.group) {
        socket.join(`group:${socket.user.group}`);
    }

    // Client: location:update
    socket.on('location:update', async (payload) => {
      // payload: { lat, lng, accuracy? }
      if (!socket.user.group || !socket.user.isLocationSharingOn) return;

      const { lat, lng, accuracy } = payload;
      const timestamp = new Date().toISOString();

      try {
        // Save to DB
        await Location.create({
          user: socket.user._id,
          group: socket.user.group,
          lat,
          lng,
          accuracy
        });

        // Run geofence check
        await checkGeofences({
          userId: socket.user._id.toString(),
          userName: socket.user.name,
          groupId: socket.user.group.toString(),
          lat,
          lng,
          io
        });

        // Broadcast to group room
        io.to(`group:${socket.user.group}`).emit('location:update', {
          userId: socket.user._id.toString(),
          name: socket.user.name,
          lat,
          lng,
          timestamp,
        });
      } catch (error) {
        console.error('Socket location:update error:', error.message);
      }
    });

    // Client: location:sharing:toggle
    socket.on('location:sharing:toggle', async (payload) => {
       // payload: { isOn: Boolean }
       if (!socket.user.group) return;

       const { isOn } = payload;

       try {
           socket.user.isLocationSharingOn = isOn;
           await User.findByIdAndUpdate(socket.user._id, { isLocationSharingOn: isOn });

           io.to(`group:${socket.user.group}`).emit('sharing:changed', {
               userId: socket.user._id.toString(),
               isLocationSharingOn: isOn
           });
       } catch (error) {
           console.error('Socket location:sharing:toggle error:', error.message);
       }
    });

    // Client: checkin:send
    socket.on('checkin:send', async () => {
        if (!socket.user.group) return;
        
        const timestamp = new Date().toISOString();

        // Broadcast check-in received
        io.to(`group:${socket.user.group}`).emit('checkin:received', {
            userId: socket.user._id.toString(),
            userName: socket.user.name,
            timestamp
        });

        // Create db notification for history
        try {
            const groupMembers = await User.find({ group: socket.user.group }).select('_id');
            const notificationDocs = groupMembers
                .filter(m => m._id.toString() !== socket.user._id.toString())
                .map(m => ({
                    recipient: m._id,
                    group: socket.user.group,
                    type: 'checkin',
                    title: 'Check-In',
                    body: `${socket.user.name} checked in safely.`,
                    data: { userId: socket.user._id }
                }));

            if (notificationDocs.length > 0) {
                await Notification.insertMany(notificationDocs);
            }
        } catch (error) {
            console.error('Socket checkin:send error:', error.message);
        }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
}
