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
    type: [String],
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
  source: { type: String, default: 'Portal' },
  rating: { type: Number, default: 0 },
  
  // --- Experience & Pay ---
  totalExperience: { type: String },
  relevantExperience: { type: String },
  ctc: { type: String },
  ectc: { type: String },
  
  currentTakeHome: { type: String }, 
  expectedTakeHome: { type: String }, 

  // --- Offers ---
  offersInHand: { type: Boolean, default: false },
  offerPackage: { type: String }, 

  // --- Notice Period ---
  noticePeriod: { type: String }, 
  servingNoticePeriod: { type: Boolean, default: false }, 
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
  dateAdded: { type: Date, default: Date.now },
  
  // --- Files ---
  resumeUrl: { type: String },
  resumeOriginalName: { type: String }
}, {
  timestamps: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto-generate Candidate ID
//
// ★ KEY FIX: If candidateId is ALREADY set (e.g. by bulkImportController),
//   skip generation entirely. This prevents the parallel-save race condition
//   where all 10 rows read the same "last" candidate and get the same number.
// ─────────────────────────────────────────────────────────────────────────────
candidateSchema.pre('save', async function (next) {
  // Not a new document — nothing to do
  if (!this.isNew) return next();

  // candidateId already assigned externally (bulk import) — skip generation
  if (this.candidateId) return next();

  try {
    // Find the highest CAND-XXXX number currently in DB
    const last = await mongoose.model('Candidate')
      .findOne(
        { candidateId: { $regex: /^CAND-\d+$/ } },
        { candidateId: 1 }
      )
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