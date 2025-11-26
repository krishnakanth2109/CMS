import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// 🧩 Job Interface — includes all properties used across components
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
  experience?: string; // ✅ Added
  gender?: string;
  interviewMode?: string;
  deadline?: string;    // ✅ Added (Target Achievement Time)
  tatTime?: string;     // Alias for deadline
  jdLink?: string;     // ✅ Added (JD document link)
  date?: string;
  createdAt?: string;
  primaryRecruiter?: string;
  secondaryRecruiter?: string;
  active?: boolean;
}

// 🎯 Context Interface
interface JobsContextType {
  jobs: Job[];
  addJob: (jobData: Omit<Job, "id">) => void;
  assignRecruiter: (jobId: string, primaryRecruiter: string, secondaryRecruiter?: string) => void;
  updateJob: (jobId: string, jobData: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;
  getRecruiterJobs: (recruiterName: string) => Job[];
  clearJobs: () => void;
}

// 🚀 Create Context
const JobsContext = createContext<JobsContextType | undefined>(undefined);

// 🧱 Provider Component
export const JobsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🧩 Load Jobs from Local Storage
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const stored = localStorage.getItem("jobs");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error parsing jobs from localStorage:", error);
      return [];
    }
  });

  // 💾 Persist Jobs to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("jobs", JSON.stringify(jobs));
    } catch (error) {
      console.error("Error saving jobs to localStorage:", error);
    }
  }, [jobs]);

  // ➕ Add a New Job
  const addJob = (jobData: Omit<Job, "id">) => {
    const newJob: Job = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      ...jobData,
    };
    setJobs((prev) => [...prev, newJob]);
  };

  // 👤 Assign a Recruiter to a Job
  const assignRecruiter = (jobId: string, primaryRecruiter: string, secondaryRecruiter?: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, primaryRecruiter, secondaryRecruiter } : job
      )
    );
  };

  // ✏️ Update a Job
  const updateJob = (jobId: string, jobData: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, ...jobData } : job
      )
    );
  };

  // 🗑️ Delete a Job
  const deleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  // 🔍 Get All Jobs Assigned to a Recruiter
  const getRecruiterJobs = (recruiterName: string) => {
    if (!recruiterName) return [];
    return jobs.filter(
      (job) => job.primaryRecruiter?.toLowerCase() === recruiterName.toLowerCase() ||
               job.secondaryRecruiter?.toLowerCase() === recruiterName.toLowerCase()
    );
  };

  // 🧹 Clear Jobs (for admin reset/testing)
  const clearJobs = () => {
    setJobs([]);
    localStorage.removeItem("jobs");
  };

  return (
    <JobsContext.Provider
      value={{ jobs, addJob, assignRecruiter, updateJob, deleteJob, getRecruiterJobs, clearJobs }}
    >
      {children}
    </JobsContext.Provider>
  );
};

// ⚡ Custom Hook to Use Context
export const useJobs = (): JobsContextType => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
};
