import SafeZone from '../models/SafeZone.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── POST /api/safezones/create [protected, owner only] ────────────────────────
export const createSafeZone = asyncHandler(async (req, res) => {
   const { name, lat, lng, radius } = req.body;

   // req.group is populated by requireGroupOwner middleware
   const safeZone = await SafeZone.create({
       name,
       lat,
       lng,
       radius,
       group: req.group._id,
       createdBy: req.user._id
   });

   res.status(201).json(new ApiResponse(201, 'Safe zone created successfully', { safeZone }));
});

// ─── GET /api/safezones [protected] ────────────────────────────────────────────
export const getSafeZones = asyncHandler(async (req, res) => {
    if (!req.user.group) {
        throw new ApiError(400, 'You must be in a group to view safe zones');
    }

    const safeZones = await SafeZone.find({ group: req.user.group });

    res.status(200).json(new ApiResponse(200, 'Safe zones fetched', { safeZones }));
});

// ─── PATCH /api/safezones/:zoneId [protected, owner only] ──────────────────────
export const updateSafeZone = asyncHandler(async (req, res) => {
    const { zoneId } = req.params;
    const { name, lat, lng, radius } = req.body;

    // The middleware already ensures the user is the owner of req.group
    const safeZone = await SafeZone.findOneAndUpdate(
        { _id: zoneId, group: req.group._id },
        { name, lat, lng, radius },
        { new: true, runValidators: true }
    );

    if (!safeZone) {
        throw new ApiError(404, 'Safe zone not found');
    }

    res.status(200).json(new ApiResponse(200, 'Safe zone updated', { safeZone }));
});

// ─── DELETE /api/safezones/:zoneId [protected, owner only] ─────────────────────
export const deleteSafeZone = asyncHandler(async (req, res) => {
    const { zoneId } = req.params;

    const safeZone = await SafeZone.findOneAndDelete({ _id: zoneId, group: req.group._id });

    if (!safeZone) {
        throw new ApiError(404, 'Safe zone not found');
    }

    res.status(200).json(new ApiResponse(200, 'Safe zone deleted successfully'));
});
