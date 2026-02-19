import mongoose from 'mongoose';

const candidateSchema = mongoose.Schema({
  candidateId: { type: String, unique: true }, 
  
  // --- Personal Info ---
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, required: true }, // Required
  linkedin: { type: String },
  
  // --- Professional Info ---
  position: { type: String, required: false }, // Not Required
  skills: { type: [String], required: true }, 
  client: { type: String, required: false },   // Not Required
  currentCompany: { type: String },
  currentLocation: { type: String, required: true }, // Required
  preferredLocation: { type: String },
  industry: { type: String },
  
  // --- Education ---
  education: { type: String, required: true }, // Required (Qualification)
  
  // --- Status & Recruitment ---
  status: { 
    type: [String],
    required: true, // Required
    enum: [
      'Submitted',
      'Shared Profiles',
      'Yet to attend',
      'Turnups',
      'No Show',
      'Selected',
      'Joined',
      'Rejected',
      'Pipeline',
      'Hold',
      'Backout'
    ],
    default: ['Submitted']
  },
  source: { type: String, required: true, default: 'Portal' }, // Required
  rating: { type: Number, default: 0 },
  
  // --- Experience & Pay ---
  totalExperience: { type: String },
  relevantExperience: { type: String },
  ctc: { type: String }, // Not Required
  ectc: { type: String }, // Not Required
  
  currentTakeHome: { type: String, required: true }, // Required
  expectedTakeHome: { type: String, required: true }, // Required

  // --- Offers ---
  offersInHand: { type: Boolean, default: false },
  offerPackage: { type: String }, 

  // --- Notice Period Logic ---
  noticePeriod: { type: String }, 
  servingNoticePeriod: { type: Boolean, required: true, default: false }, // Required
  isNegotiable: { type: String, default: 'No' }, // Added for conditional logic
  noticePeriodDays: { type: String }, 
  
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
  dateAdded: { type: Date, required: true, default: Date.now }, // Required
  
  // --- Files ---
  resumeUrl: { type: String },
  resumeOriginalName: { type: String }
}, {
  timestamps: true,
});

// Auto-generate Candidate ID
candidateSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (this.candidateId) return next();

  try {
    const last = await mongoose.model('Candidate')
      .findOne({ candidateId: { $regex: /^CAND-\d+$/ } }, { candidateId: 1 })
      .sort({ candidateId: -1 });

    let nextNumber = 1;
    if (last && last.candidateId) {
      const parts = last.candidateId.split('-');
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