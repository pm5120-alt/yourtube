import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: String, default: '' },
  commentId: { type: String, default: '' },
  action: { type: String, required: true },
  reason: { type: String, default: '' },
  textPreview: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.moderationLog || mongoose.model('moderationLog', schema);
