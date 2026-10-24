import Location from '../models/Location.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── POST /api/locations/update ────────────────────────────────────────────────
export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, accuracy } = req.body;

  if (!req.user.group) {
     throw new ApiError(400, 'You must be in a group to update location');
  }

  // The actual geolocation boundary checks and socket emits are typically handled
  // via Socket.io handlers. This endpoint serves as a REST fallback.
  const location = await Location.create({
    user: req.user._id,
    group: req.user.group,
    lat,
    lng,
    accuracy
  });

  res.status(201).json(new ApiResponse(201, 'Location updated successfully', { location }));
});

// ─── GET /api/locations/history/:userId ───────────────────────────────────────
export const getLocationHistory = asyncHandler(async (req, res) => {
   const { userId } = req.params;
   
   if (!req.user.group) {
        throw new ApiError(400, 'You must be in a group to view location history');
   }

   const targetUser = await User.findById(userId);
   if (!targetUser || targetUser.group?.toString() !== req.user.group.toString()) {
        throw new ApiError(404, 'User not found in your group');
   }

   // Fetch history for the user (auto-purged after 7 days by TTL index)
   const history = await Location.find({ user: userId })
                                 .sort({ timestamp: -1 })
                                 .limit(100);

   res.status(200).json(new ApiResponse(200, 'Location history fetched', { history }));
});

// ─── GET /api/locations/latest ────────────────────────────────────────────────
export const getLatestLocations = asyncHandler(async (req, res) => {
   if (!req.user.group) {
       throw new ApiError(400, 'You must be in a group to view locations');
   }

   // Aggregate latest location per user in the group
   const latestLocations = await Location.aggregate([
       { $match: { group: req.user.group } },
       { $sort: { timestamp: -1 } },
       { 
           $group: { 
               _id: "$user", 
               location: { $first: "$$ROOT" } 
           } 
       },
       { $replaceRoot: { newRoot: "$location" } }
   ]);

   res.status(200).json(new ApiResponse(200, 'Latest locations fetched', { locations: latestLocations }));
});
