import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
  from: { type: String, required: true }, // 'admin' or recruiter username/id
  to: { type: String, required: true },   // 'admin', 'all', or recruiter username/id
  subject: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, {
  timestamps: true // automatically adds createdAt
});

const Message = mongoose.model('Message', messageSchema);
export default Message;