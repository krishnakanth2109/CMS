import mongoose from 'mongoose';

const candidateSchema = mongoose.Schema({
  candidateId: { type: String, unique: true }, // Auto-generated ID (e.g., CAND-001)
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  position: { type: String, required: true },
  skills: { type: [String], required: true }, // Array of strings
  client: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Submitted', 'Pending', 'L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview', 'Interview', 'Offer', 'Joined', 'Rejected'],
    default: 'Submitted'
  },
  
  // Experience & Pay
  totalExperience: { type: String },
  relevantExperience: { type: String },
  ctc: { type: String },
  ectc: { type: String },
  noticePeriod: { type: String },
  
  // Relationships
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterName: { type: String },
  assignedJobId: { type: String },
  
  notes: { type: String },
  active: { type: Boolean, default: true },
  dateAdded: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// FIXED: Removed 'next' parameter because this is an async function
candidateSchema.pre('save', async function () {
  if (!this.isNew) return;
  
  try {
    const count = await mongoose.model('Candidate').countDocuments();
    this.candidateId = `CAND-${(count + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    // If generation fails, we can fallback or throw
    console.error("Error generating Candidate ID:", error);
    throw error; 
  }
});

const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;