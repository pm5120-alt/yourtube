import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: String, index: true },
  publicIp: String,
  browser: String,
  operatingSystem: String,
  deviceType: String,
  deviceModel: String,
  loginTimestamp: { type: Date, default: Date.now, index: true },
  city: String,
  state: String,
  country: String,
  approximateLocation: String,
  otpRequired: Boolean,
  otpVerified: Boolean,
  trustedDeviceId: String,
  otpAttempts: { type: Number, default: 0 },
  success: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.loginLog || mongoose.model('loginLog', schema);
