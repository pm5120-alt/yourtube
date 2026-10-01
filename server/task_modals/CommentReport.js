import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  commentId: { type: String, required: true },
  reporterId: { type: String, required: true },
  reason: { type: String, enum: ['spam', 'harassment', 'offensive', 'other'], required: true },
  status: { type: String, enum: ['flagged', 'reviewed', 'dismissed'], default: 'flagged' },
  createdAt: { type: Date, default: Date.now, index: true },
});

schema.index({ commentId: 1, reporterId: 1 }, { unique: true });
export default mongoose.models.commentReport || mongoose.model('commentReport', schema);
