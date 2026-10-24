import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    /**
     * Auto-generated 8-char alphanumeric invite code used to join the group.
     */
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(4).toString('hex'),
    },
  },
  { timestamps: true }
);

export default mongoose.model('Group', groupSchema);
