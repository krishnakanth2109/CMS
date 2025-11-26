export type UserRole = 'admin' | 'recruiter';

export type CandidateStatus = 'Submitted' | 'Pending' | 'L1 Interview' | 'L2 Interview' | 'Final Interview' | 'Technical Interview' | 'HR Interview' | 'Interview' | 'Offer' | 'Joined' | 'Rejected';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Job {
  id: string;
  jobCode: string;
  client: string;
  clientName?: string; // Alias for client
  title: string;
  position?: string; // Alias for title
  skills: string;
  salaryBudget: string;
  location: string;
  comments: string;
  requirements?: string; // Alias for comments
  status?: string;
  assignedRecruiter?: string;
  experience?: string;
  gender?: string;
  interviewMode?: string;
  deadline?: string;
  tatTime?: string; // Alias for deadline
  jdLink?: string;
  date?: string;
  createdAt?: string;
  primaryRecruiter?: string;
  secondaryRecruiter?: string;
}

export interface Candidate {
  id: string;
  name: string;
  position?: string;
  skills?: string[] | string;
  client?: string;
  contact?: string;
  phone?: string;
  email?: string;
  status: CandidateStatus;
  recruiterId: string;
  recruiterName: string;
  createdAt: string;
  dateAdded?: string;
  interviewDate?: string;
  joiningDate?: string;
  notes?: string;
  feedback?: string;
  totalExperience?: string;
  experience?: string; // Alias for totalExperience
  relevantExperience?: string;
  ctc?: string;
  currentCtc?: string; // Alias for ctc
  ectc?: string;
  expectedCtc?: string; // Alias for ectc
  noticePeriod?: string;
  assignedJobId?: string;
  candidateId?: string;
  active?: boolean;
}

export interface Recruiter {
  id: string;
  recruiterId: string;
  name: string;
  email: string;
  phone: string;
  username?: string;
  password?: string;
  role?: string;
  active?: boolean;
  profilePicture?: string;
  specialization?: string;
  experience?: string;
  bio?: string;
  location?: string;
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  stats?: {
    totalSubmissions: number;
    interviews: number;
    offers: number;
    joined: number;
  };
}

export interface RecruiterStats {
  recruiterId: string;
  recruiterName: string;
  totalSubmissions: number;
  interviews: number;
  offers: number;
  joined: number;
}
