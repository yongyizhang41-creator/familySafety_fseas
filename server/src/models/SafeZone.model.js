import mongoose from 'mongoose';

const safeZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Safe zone name is required'],
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    /**
     * Radius in meters. Min 50m, max 5000m as per PRD validation rules.
     */
    radius: {
      type: Number,
      required: true,
      min: 50,
      max: 5000,
    },
  },
  { timestamps: true }
);

export default mongoose.model('SafeZone', safeZoneSchema);
