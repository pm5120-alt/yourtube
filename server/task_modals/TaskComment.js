import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  commentId: { type: String, required: true, unique: true, index: true },
  videoId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  location: { type: String, default: '' },
  text: { type: String, required: true, maxlength: 1000 },
  language: { type: String, default: 'English' },
  parentId: { type: String, default: null, index: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
}, { timestamps: true });

schema.index({ videoId: 1, createdAt: -1 });
export default mongoose.models.taskComment || mongoose.model('taskComment', schema);
