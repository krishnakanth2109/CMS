import mongoose from 'mongoose';

const interviewSchema = mongoose.Schema({
  interviewId: { type: String, unique: true }, // e.g., INT-001
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Optional
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Schedule Details
  interviewDate: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // Minutes
  type: { 
    type: String, 
    enum: ['Virtual', 'In-person', 'Phone'], 
    default: 'Virtual' 
  },
  location: { type: String, default: 'Remote' },
  meetingLink: { type: String },
  
  // Status & Outcome
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled'
  },
  round: {
    type: String,
    enum: ['L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview'],
    default: 'L1 Interview'
  },
  
  // Feedback
  notes: { type: String },
  feedback: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

}, {
  timestamps: true,
});

// Generate ID
interviewSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await mongoose.model('Interview').countDocuments();
  this.interviewId = `INT-${(count + 1).toString().padStart(4, '0')}`;
  next();
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;