import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  videoId: { type: String, required: true, index: true },
  downloadTimestamp: { type: Date, default: Date.now, index: true },
  ipAddress: String,
  deviceInfo: String,
  browser: String,
  subscriptionPlan: String,
  status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started' },
  fileSize: String,
  quotaRemaining: Number,
});

schema.index({ userId: 1, videoId: 1, downloadTimestamp: 1 });
export default mongoose.models.download || mongoose.model('download', schema);
