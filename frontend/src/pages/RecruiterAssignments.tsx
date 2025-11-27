import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseIcon, MapPinIcon, UserIcon, CurrencyDollarIcon, LinkIcon, ClipboardDocumentListIcon,
  ChevronUpDownIcon, XMarkIcon, CalendarDaysIcon, BuildingOfficeIcon, CodeBracketIcon, ClockIcon,
  EyeIcon, UserGroupIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Define Job Interface locally to ensure it matches backend response
interface Job {
  _id: string;
  id: string;
  jobCode: string;
  clientName: string;
  client?: string; // Handle potential mapping difference
  position: string;
  skills: string;
  salaryBudget: string;
  location: string;
  experience: string;
  gender: string;
  interviewMode: string;
  tatTime: string;
  jdLink: string;
  comments: string;
  date: string;
  primaryRecruiter: string;
  secondaryRecruiter: string;
  active: boolean;
}

// --- Helper Functions ---

const getTatBadge = (tatTime?: string) => {
  if (!tatTime) return <span className="px-2 py-1 bg-gray-100 rounded text-xs">N/A</span>;
  const today = new Date();
  const tatDate = new Date(tatTime);
  const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Expired</span>;
  if (diffDays <= 3) return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Due: {diffDays}d</span>;
  return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{diffDays} days left</span>;
};

const getPriorityBadge = (tatTime?: string) => {
  if (!tatTime) return null;
  const diffDays = Math.ceil((new Date(tatTime).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  if (diffDays < 0) return <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>;
  if (diffDays <= 3) return <span className="w-2 h-2 bg-yellow-500 rounded-full"/>;
  return <span className="w-2 h-2 bg-green-500 rounded-full"/>;
};

// --- Main Component ---

export default function RecruiterAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Jobs from Backend
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` };
        const response = await fetch(`${API_URL}/jobs`, { headers });
        
        if (response.ok) {
          const allJobs = await response.json();
          
          // --- CRITICAL: Filter Logic Here ---
          // Only keep jobs where the logged-in user is Primary OR Secondary Recruiter
          // Adjust 'user.name' comparison based on exactly how names are stored in your DB (e.g. match IDs if possible)
          const myAssignedJobs = allJobs.filter((job: any) => 
            job.primaryRecruiter === user?.name || 
            job.secondaryRecruiter === user?.name
          ).map((j: any) => ({ ...j, id: j._id, client: j.clientName })); // Map fields for consistency

          setJobs(myAssignedJobs);
        } else {
          throw new Error("Failed to fetch jobs");
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not load assignments", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchJobs();
  }, [user]);

  // Filtered Display List
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const query = searchQuery.toLowerCase();
      return (
        job.position?.toLowerCase().includes(query) ||
        job.clientName?.toLowerCase().includes(query) ||
        job.jobCode?.toLowerCase().includes(query)
      );
    });
  }, [jobs, searchQuery]);

  // Stats Calculation
  const stats = useMemo(() => {
    const total = jobs.length;
    const primary = jobs.filter(j => j.primaryRecruiter === user?.name).length;
    const secondary = jobs.filter(j => j.secondaryRecruiter === user?.name).length;
    const urgent = jobs.filter(j => {
      if(!j.tatTime) return false;
      const diff = Math.ceil((new Date(j.tatTime).getTime() - new Date().getTime()) / (86400000));
      return diff >= 0 && diff <= 3;
    }).length;
    
    return { total, primary, secondary, urgent };
  }, [jobs, user]);

  if (loading) return <div className="p-10 text-center">Loading assignments...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Assignments</h1>
              <p className="text-gray-500">Jobs assigned to you as Primary or Secondary recruiter</p>
            </div>
            {/* View Toggles */}
            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border shadow-sm">
               <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : ''}`}><Squares2X2Icon className="w-5 h-5"/></button>
               <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : ''}`}><ListBulletIcon className="w-5 h-5"/></button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                <div className="text-gray-500 text-sm">Total Assigned</div>
                <div className="text-2xl font-bold">{stats.total}</div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500">
                <div className="text-gray-500 text-sm">Primary</div>
                <div className="text-2xl font-bold">{stats.primary}</div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-500">
                <div className="text-gray-500 text-sm">Secondary</div>
                <div className="text-2xl font-bold">{stats.secondary}</div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-yellow-500">
                <div className="text-gray-500 text-sm">Urgent TAT</div>
                <div className="text-2xl font-bold">{stats.urgent}</div>
             </div>
          </div>

          {/* Search */}
          <div className="relative">
             <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400"/>
             <input 
               type="text" 
               placeholder="Search assignments..." 
               className="w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-800"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </div>

          {/* Content */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No assignments found.</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredJobs.map(job => (
                 <motion.div 
                   key={job.id}
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border hover:shadow-md transition-all"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <div className="flex items-center gap-2">
                             {getPriorityBadge(job.tatTime)}
                             <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{job.jobCode}</span>
                          </div>
                          <h3 className="text-lg font-bold mt-1">{job.position}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-1"><BuildingOfficeIcon className="w-4 h-4"/> {job.clientName}</div>
                       </div>
                       <span className={`text-xs px-2 py-1 rounded-full ${job.primaryRecruiter === user?.name ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {job.primaryRecruiter === user?.name ? 'Primary' : 'Secondary'}
                       </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                       <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4"/> {job.location}</div>
                       <div className="flex items-center gap-2"><BriefcaseIcon className="w-4 h-4"/> {job.experience}</div>
                       <div className="flex items-center gap-2"><CurrencyDollarIcon className="w-4 h-4"/> {job.salaryBudget}</div>
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center">
                       {getTatBadge(job.tatTime)}
                       <button 
                         onClick={() => setSelectedJob(job)}
                         className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                       >
                         <EyeIcon className="w-4 h-4"/> View
                       </button>
                    </div>
                 </motion.div>
               ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900 font-medium text-gray-500">
                     <tr>
                        <th className="p-4">Code</th>
                        <th className="p-4">Position</th>
                        <th className="p-4">Client</th>
                        <th className="p-4">My Role</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">TAT</th>
                        <th className="p-4">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                     {filteredJobs.map(job => (
                        <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                           <td className="p-4 font-mono text-xs">{job.jobCode}</td>
                           <td className="p-4 font-medium text-gray-900 dark:text-white">{job.position}</td>
                           <td className="p-4 text-gray-500">{job.clientName}</td>
                           <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${job.primaryRecruiter === user?.name ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {job.primaryRecruiter === user?.name ? 'Primary' : 'Secondary'}
                              </span>
                           </td>
                           <td className="p-4 text-gray-500">{job.location}</td>
                           <td className="p-4">{getTatBadge(job.tatTime)}</td>
                           <td className="p-4">
                              <button onClick={() => setSelectedJob(job)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600">
                                 <EyeIcon className="w-5 h-5"/>
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedJob && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
                   <div>
                      <h2 className="text-2xl font-bold">{selectedJob.position}</h2>
                      <p className="text-blue-100">{selectedJob.clientName} ({selectedJob.jobCode})</p>
                   </div>
                   <button onClick={() => setSelectedJob(null)}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <span className="text-xs text-gray-500 uppercase font-bold">Location</span>
                         <p>{selectedJob.location}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-xs text-gray-500 uppercase font-bold">Budget</span>
                         <p>{selectedJob.salaryBudget}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-xs text-gray-500 uppercase font-bold">Experience</span>
                         <p>{selectedJob.experience}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-xs text-gray-500 uppercase font-bold">TAT Deadline</span>
                         <p>{selectedJob.tatTime ? new Date(selectedJob.tatTime).toLocaleDateString() : 'N/A'}</p>
                      </div>
                   </div>
                   
                   <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">Required Skills</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                         {selectedJob.skills || "No specific skills listed."}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                         <span className="text-xs text-gray-500 block">Primary Recruiter</span>
                         <span className="font-medium">{selectedJob.primaryRecruiter || 'N/A'}</span>
                      </div>
                      <div>
                         <span className="text-xs text-gray-500 block">Secondary Recruiter</span>
                         <span className="font-medium">{selectedJob.secondaryRecruiter || 'N/A'}</span>
                      </div>
                   </div>

                   {selectedJob.jdLink && (
                      <a href={selectedJob.jdLink} target="_blank" className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-100">
                         View Job Description Document
                      </a>
                   )}
                </div>
             </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
}