import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  commentId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  action: { type: String, enum: ['created', 'edited', 'deleted', 'moderated'], required: true },
  before: { type: String, default: '' },
  after: { type: String, default: '' },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.commentHistory || mongoose.model('commentHistory', schema);
