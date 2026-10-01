import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  plan: { type: String, enum: ['Free', 'Bronze', 'Silver', 'Gold'], default: 'Free' },
  billing: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  paymentId: String,
  orderId: String,
  invoiceNumber: String,
  status: { type: String, default: 'pending' },
  startDate: Date,
  expiryDate: Date,
  renewal: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ userId: 1, createdAt: -1 });
export default mongoose.models.subscription || mongoose.model('subscription', schema);
