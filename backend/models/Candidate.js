import mongoose from 'mongoose';

const candidateSchema = mongoose.Schema({
  candidateId: { type: String, unique: true }, 
  
  // --- Personal Info ---
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String },
  linkedin: { type: String },
  
  // --- Professional Info ---
  position: { type: String, required: true },
  skills: { type: [String], required: true }, 
  client: { type: String, required: true },
  currentCompany: { type: String },
  currentLocation: { type: String },
  preferredLocation: { type: String },
  industry: { type: String },
  
  // --- Education ---
  education: { type: String },
  
  // --- Status & Recruitment ---
  status: { 
    type: String, 
    enum: [
      'Submitted', 'Pending', 'L1 Interview', 'L2 Interview', 
      'Final Interview', 'Technical Interview', 'HR Interview', 
      'Interview', 'Offer', 'Joined', 'Rejected'
    ],
    default: 'Submitted'
  },
  source: { type: String, default: 'Portal' },
  rating: { type: Number, default: 0 },
  
  // --- Experience & Pay ---
  totalExperience: { type: String },
  relevantExperience: { type: String },
  ctc: { type: String },
  ectc: { type: String },
  takeHomeSalary: { type: String },

  // --- NEW FIELDS: Offers ---
  offersInHand: { type: Boolean, default: false },
  offerPackage: { type: String }, // Only used if offersInHand is true

  // --- NEW FIELDS: Notice Period ---
  // We keep 'noticePeriod' for legacy text (e.g., "Immediate") if needed,
  // but add specific fields for the "If Yes -> Days" logic.
  noticePeriod: { type: String }, 
  servingNoticePeriod: { type: Boolean, default: false }, // "If yes"
  noticePeriodDays: { type: String }, // "Days"
  
  // --- Relationships ---
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterName: { type: String },
  assignedJobId: { type: String },
  
  // --- Remarks & Reasons ---
  reasonForChange: { type: String },
  remarks: { type: String },
  rejectionReason: { type: String },
  
  // --- System ---
  active: { type: Boolean, default: true },
  tags: { type: [String] },
  dateAdded: { type: Date, default: Date.now },
  
  // --- Files ---
  resumeUrl: { type: String },
  resumeOriginalName: { type: String }
}, {
  timestamps: true,
});

// Auto-generate Candidate ID
candidateSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  
  try {
    const lastCandidate = await mongoose.model('Candidate')
      .findOne({}, { candidateId: 1 })
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastCandidate && lastCandidate.candidateId) {
      const parts = lastCandidate.candidateId.split('-');
      if (parts.length === 2) {
        const lastNumber = parseInt(parts[1], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    this.candidateId = `CAND-${nextNumber.toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    console.error("Error generating Candidate ID:", error);
    next(error);
  }
});

const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;