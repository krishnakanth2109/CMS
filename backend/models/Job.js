import mongoose from 'mongoose';

const jobSchema = mongoose.Schema({
  jobCode: { type: String, required: true, unique: true },
  clientName: { type: String, required: true }, // Can be linked via ref if strictly relational
  position: { type: String, required: true },
  skills: { type: String },
  salaryBudget: { type: String },
  location: { type: String },
  experience: { type: String },
  gender: { type: String },
  interviewMode: { type: String },
  tatTime: { type: Date },
  jdLink: { type: String },
  comments: { type: String },
  
  primaryRecruiter: { type: String },
  secondaryRecruiter: { type: String },
  
  active: { type: Boolean, default: true },
  date: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const Job = mongoose.model('Job', jobSchema);
export default Job;