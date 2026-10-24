import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
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
    accuracy: {
      type: Number,
      default: null,
    },
    /**
     * TTL index field — MongoDB auto-deletes documents 7 days after this timestamp.
     */
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index: auto-purge location docs after 7 days (604800 seconds)
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

// Compound index for efficient history queries
locationSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model('Location', locationSchema);
