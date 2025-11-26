import { User, Candidate, Recruiter } from '@/types';

// -----------------------------
// Define Client type
// -----------------------------
interface Client {
  id: string;
  companyName: string;
  position: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

// -----------------------------
// Define Recruiter type for stats
// -----------------------------
interface RecruiterSample extends Omit<Recruiter, 'stats'> {
  stats: {
    totalSubmissions: number;
    interviews: number;
    offers: number;
    joined: number;
  };
}

// -----------------------------
// Users Data
// -----------------------------
export const users: User[] = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { id: 'rec-1', username: 'sandeep', password: 'pass123', role: 'recruiter', name: 'Sandeep Kumar' },
  { id: 'rec-2', username: 'alice', password: 'pass123', role: 'recruiter', name: 'Alice Johnson' },
  { id: 'rec-3', username: 'lisa', password: 'pass123', role: 'recruiter', name: 'Lisa Chen' },
  { id: 'rec-4', username: 'john', password: 'pass123', role: 'recruiter', name: 'John Smith' },
  { id: 'rec-5', username: 'rahul', password: 'pass123', role: 'recruiter', name: 'Rahul Sharma' },
  { id: 'rec-6', username: 'priya', password: 'pass123', role: 'recruiter', name: 'Priya Patel' },
  { id: 'rec-7', username: 'mohan', password: 'pass123', role: 'recruiter', name: 'Mohan Das' },
  { id: 'rec-8', username: 'anita', password: 'pass123', role: 'recruiter', name: 'Anita Roy' },
  { id: 'rec-9', username: 'rohit', password: 'pass123', role: 'recruiter', name: 'Rohit Verma' },
  { id: 'rec-10', username: 'kavya', password: 'pass123', role: 'recruiter', name: 'Kavya Menon' },
];

// -----------------------------
// Clients Data (typed)
// -----------------------------
export const client: Client[] = [
  { id: 'client-1', companyName: 'TechNova Solutions', position: 'Java Developer', contactName: 'Arjun Mehta', contactEmail: 'arjun@technova.com', contactPhone: '+91 9876543210' },
  { id: 'client-2', companyName: 'PixelCraft Studios', position: 'UI/UX Designer', contactName: 'Meera Kapoor', contactEmail: 'meera@pixelcraft.com', contactPhone: '+91 9123456780' },
  { id: 'client-3', companyName: 'DataMinds Analytics', position: 'Data Analyst', contactName: 'Ravi Iyer', contactEmail: 'ravi@dataminds.com', contactPhone: '+91 9988776655' },
  { id: 'client-4', companyName: 'CloudSphere Ltd.', position: 'DevOps Engineer', contactName: 'Neha Reddy', contactEmail: 'neha@cloudsphere.com', contactPhone: '+91 9090909090' },
  { id: 'client-5', companyName: 'InnoSoft Global', position: 'Full Stack Developer', contactName: 'Vikas Singh', contactEmail: 'vikas@innosoft.com', contactPhone: '+91 9345678912' },
  { id: 'client-6', companyName: 'BrightEdge Systems', position: 'QA Engineer', contactName: 'Sonia Das', contactEmail: 'sonia@brightedge.com', contactPhone: '+91 9012345678' },
  { id: 'client-7', companyName: 'FinTrack Corp.', position: 'Business Analyst', contactName: 'Kunal Sharma', contactEmail: 'kunal@fintrack.com', contactPhone: '+91 9321456789' },
  { id: 'client-8', companyName: 'AlphaWorks Pvt Ltd.', position: 'Backend Developer', contactName: 'Ananya Gupta', contactEmail: 'ananya@alphaworks.com', contactPhone: '+91 9567890123' },
  { id: 'client-9', companyName: 'NextGen Products', position: 'Product Manager', contactName: 'Rohit Nair', contactEmail: 'rohit@nextgen.com', contactPhone: '+91 9876123456' },
  { id: 'client-10', companyName: 'Visionary Labs', position: 'Frontend Developer', contactName: 'Sneha Kulkarni', contactEmail: 'sneha@visionarylabs.com', contactPhone: '+91 9234567890' },
];

// -----------------------------
// Skill Sets / Random Data
// -----------------------------
const skillSets = [
  ['Java', 'Spring Boot', 'MySQL'],
  ['React', 'TypeScript', 'CSS'],
  ['Python', 'SQL', 'Tableau'],
  ['Figma', 'Adobe XD', 'Sketch'],
  ['Node.js', 'Express', 'MongoDB'],
  ['React', 'Node.js', 'PostgreSQL'],
  ['Docker', 'Kubernetes', 'AWS'],
  ['Selenium', 'Jest', 'Cypress'],
  ['Agile', 'Jira', 'Product Strategy'],
  ['SQL', 'Excel', 'Business Intelligence'],
  ['Angular', 'RxJS', 'NgRx'],
  ['Vue.js', 'Vuex', 'Nuxt'],
  ['Python', 'Django', 'PostgreSQL'],
];

const firstNames = ['John', 'Alice', 'Michael', 'Emma', 'David', 'Sarah', 'James', 'Lisa', 'Robert', 'Maria', 'William', 'Jennifer', 'Richard', 'Linda', 'Thomas'];
const lastNames = ['Doe', 'Brown', 'Smith', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];

const statuses: Array<'Submitted' | 'Pending' | 'L1 Interview' | 'L2 Interview' | 'Final Interview' | 'Technical Interview' | 'HR Interview' | 'Interview' | 'Offer' | 'Joined' | 'Rejected'> = [
  'Submitted', 'Pending', 'L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview', 'Interview', 'Offer', 'Joined', 'Rejected'
];

// Generate unique contact numbers and emails
const usedContacts = new Set<string>();
const usedEmails = new Set<string>();

const generateUniqueContact = (): string => {
  let contact: string;
  do {
    contact = `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`;
  } while (usedContacts.has(contact));
  usedContacts.add(contact);
  return contact;
};

const generateUniqueEmail = (firstName: string, lastName: string): string => {
  let email: string;
  let attempts = 0;
  do {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomNum = attempts > 0 ? Math.floor(Math.random() * 1000) : '';
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
    attempts++;
  } while (usedEmails.has(email) && attempts < 10);
  usedEmails.add(email);
  return email;
};

// -----------------------------
// Candidate Generator
// -----------------------------
function generateCandidatesForRecruiter(recruiterId: string, recruiterName: string, count: number, startId: number): Candidate[] {
  const candidates: Candidate[] = [];
  let clientIndex = 0;

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const clientData = client[clientIndex];
    clientIndex = (clientIndex + 1) % client.length;

    const skills = skillSets[Math.floor(Math.random() * skillSets.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));

    const interviewDate =
      status === 'Interview' || status === 'Offer' || status === 'Joined'
        ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;

    const candidate: Candidate = {
      id: `cand-${startId + i}`,
      candidateId: `CAND${String(startId + i).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      position: clientData.position,
      client: clientData.companyName,
      skills,
      status,
      recruiterId,
      recruiterName,
      contact: generateUniqueContact(),
      email: generateUniqueEmail(firstName, lastName),
      createdAt: date.toISOString().split('T')[0],
      interviewDate,
      notes: 'Strong candidate with relevant experience',
      totalExperience: (Math.random() * 15 + 2).toFixed(1),
      relevantExperience: (Math.random() * 10 + 1).toFixed(1),
      ctc: (Math.random() * 20 + 5).toFixed(1),
      ectc: (Math.random() * 25 + 8).toFixed(1),
      noticePeriod: Math.random() > 0.5 ? '30 days' : 'Immediate',
    };

    candidates.push(candidate);
  }

  return candidates;
}

// -----------------------------
// Initial Candidates
// -----------------------------
export const initialCandidates: Candidate[] = [
  ...generateCandidatesForRecruiter('rec-1', 'Sandeep Kumar', 13, 1),
  ...generateCandidatesForRecruiter('rec-2', 'Alice Johnson', 12, 14),
  ...generateCandidatesForRecruiter('rec-3', 'Lisa Chen', 13, 26),
  ...generateCandidatesForRecruiter('rec-4', 'John Smith', 12, 39),
  ...generateCandidatesForRecruiter('rec-5', 'Rahul Sharma', 13, 51),
  ...generateCandidatesForRecruiter('rec-6', 'Priya Patel', 12, 64),
  ...generateCandidatesForRecruiter('rec-7', 'Mohan Das', 13, 76),
  ...generateCandidatesForRecruiter('rec-8', 'Anita Roy', 12, 89),
  ...generateCandidatesForRecruiter('rec-9', 'Rohit Verma', 13, 101),
  ...generateCandidatesForRecruiter('rec-10', 'Kavya Menon', 12, 114),
];

// -----------------------------
// Recruiter Stats
// -----------------------------
export const sampleRecruiters: Recruiter[] = users
  .filter((u) => u.role === 'recruiter')
  .map((u, index) => {
    const userCandidates = initialCandidates.filter((c) => c.recruiterId === u.id);
    const stats = {
      totalSubmissions: userCandidates.length,
      interviews: userCandidates.filter((c) => 
        ['L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview', 'Interview'].includes(c.status)
      ).length,
      offers: userCandidates.filter((c) => c.status === 'Offer').length,
      joined: userCandidates.filter((c) => c.status === 'Joined').length,
    };

    return {
      id: u.id,
      recruiterId: `REC${(index + 1).toString().padStart(3, '0')}`,
      username: u.username,
      name: u.name,
      email: `${u.username}@recruiterhub.com`,
      phone: generateUniqueContact(),
      password: u.password,
      role: u.role,
      active: true,
      stats,
    };
  });