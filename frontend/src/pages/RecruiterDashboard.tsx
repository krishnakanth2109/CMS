import { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StatCard } from '@/components/StatCard';
import { Users, Briefcase, ClipboardList, Calendar, TrendingUp, Clock, Video, MapPin, Phone, CheckCircle2, AlertCircle, Eye, Edit, Trash2, Plus, Mail, BookOpen, Star, Target, GraduationCap, MapPinIcon, PhoneIcon } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { Job } from '@/types';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Enhanced Interview interface matching backend response structure
interface Interview {
  id: string;
  _id?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  interviewDate: string;
  interviewType: 'virtual' | 'in-person' | 'phone';
  location?: string;
  duration: number;
  recruiterId: string;
  notes?: string;
  meetingLink?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
}

// Enhanced Candidate interface
interface EnhancedCandidate {
  id: string;
  _id?: string;
  name: string;
  email: string;
  position: string;
  status: string;
  recruiterId: string;
  createdAt: string;
  // Extended fields
  phone?: string;
  experience?: string;
  skills?: string[];
  education?: string;
  currentCompany?: string;
  noticePeriod?: string;
  currentSalary?: string;
  expectedSalary?: string;
  resumeLink?: string;
  source?: string;
  lastContact?: string;
  nextFollowUp?: string;
  interviewRounds?: number;
  totalExperience?: string;
  preferredLocation?: string;
  contact?: string; // Backend uses contact
  client?: string; // Backend uses client
  ctc?: string;
  ectc?: string;
  notes?: string;
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data State
  const [candidates, setCandidates] = useState<EnhancedCandidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & UI State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'candidates' | 'jobs' | 'interviews' | 'schedules'>('candidates');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<EnhancedCandidate | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  // Statuses list
  const statuses = [
    'Submitted',
    'Pending',
    'L1 Interview',
    'L2 Interview',
    'Final Interview',
    'Technical Interview',
    'HR Interview',
    'Interview',
    'Offer',
    'Joined',
    'Rejected',
  ];

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` };

        const [candRes, jobRes, intRes] = await Promise.all([
          fetch(`${API_URL}/candidates`, { headers }),
          fetch(`${API_URL}/jobs`, { headers }),
          fetch(`${API_URL}/interviews`, { headers })
        ]);

        if (candRes.ok && jobRes.ok && intRes.ok) {
          const rawCandidates = await candRes.json();
          const rawJobs = await jobRes.json();
          const rawInterviews = await intRes.json();

          // Process Candidates
          const processedCandidates = rawCandidates.map((c: any) => ({
            ...c,
            id: c._id,
            phone: c.contact || 'N/A',
            experience: c.totalExperience ? `${c.totalExperience} years` : 'N/A',
            skills: Array.isArray(c.skills) ? c.skills : (c.skills ? c.skills.split(',') : []),
            education: 'Not Specified', 
            currentCompany: c.client || 'N/A',
            currentSalary: c.ctc ? `${c.ctc} LPA` : 'N/A',
            expectedSalary: c.ectc ? `${c.ectc} LPA` : 'N/A',
            preferredLocation: 'Remote',
            lastContact: c.updatedAt,
            nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            interviewRounds: 1
          }));

          // Process Jobs
          const myJobs = rawJobs.filter((j: any) => 
            j.primaryRecruiter === user?.name || j.secondaryRecruiter === user?.name || j.assignedRecruiter === user?.id
          ).map((j: any) => ({ ...j, id: j._id }));

          // Process Interviews
          const processedInterviews = rawInterviews.map((i: any) => ({
            id: i._id,
            ...i,
            candidateName: i.candidateId?.name || 'Unknown Candidate',
            candidateEmail: i.candidateId?.email || 'N/A',
            position: i.candidateId?.position || 'N/A',
            interviewType: i.type || 'virtual',
            status: i.status || (new Date(i.interviewDate) < new Date() ? 'completed' : 'scheduled')
          }));

          setCandidates(processedCandidates);
          setJobs(myJobs);
          setInterviews(processedInterviews);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --- 2. Derived State & Filters ---

  const filteredInterviews = useMemo(() => {
    let filtered = interviews;
    if (interviewStatusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === interviewStatusFilter);
    }
    if (startDate) filtered = filtered.filter(i => new Date(i.interviewDate) >= startDate);
    if (endDate) filtered = filtered.filter(i => new Date(i.interviewDate) <= endDate);

    return filtered.sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());
  }, [interviews, interviewStatusFilter, startDate, endDate]);

  const todaysInterviews = useMemo(() => {
    const today = new Date().toDateString();
    return interviews.filter(interview => 
      new Date(interview.interviewDate).toDateString() === today
    );
  }, [interviews]);

  const upcomingInterviews = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.interviewDate);
      return interviewDate >= today && interviewDate <= nextWeek;
    });
  }, [interviews]);

  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        const date = new Date(c.createdAt);
        const afterStart = startDate ? date >= startDate : true;
        const beforeEnd = endDate ? date <= endDate : true;
        return afterStart && beforeEnd;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [candidates, startDate, endDate]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.createdAt || new Date());
      const afterStart = startDate ? jobDate >= startDate : true;
      const beforeEnd = endDate ? jobDate <= endDate : true;
      return afterStart && beforeEnd;
    });
  }, [jobs, startDate, endDate]);

  // --- 3. Statistics Calculation ---

  const jobStats = useMemo(() => ({
    totalAssignedJobs: filteredJobs.length,
  }), [filteredJobs]);

  const interviewStats = useMemo(() => {
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.status === 'completed').length;
    const scheduledInterviews = interviews.filter(i => i.status === 'scheduled').length;
    const cancelledInterviews = interviews.filter(i => i.status === 'cancelled').length;
    
    const completionRate = totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0;

    return {
      totalInterviews,
      completedInterviews,
      scheduledInterviews,
      cancelledInterviews,
      completionRate: Math.round(completionRate)
    };
  }, [interviews]);

  const statusCounts: Record<string, number> = {};
  statuses.forEach((status) => {
    statusCounts[status] = filteredCandidates.filter((c) => c.status === status).length;
  });

  const candidateStats = useMemo(() => {
    const totalCandidates = filteredCandidates.length;
    const submitted = statusCounts['Submitted'] || 0;
    const interview = filteredCandidates.filter(c => c.status.includes('Interview')).length;
    const offer = statusCounts['Offer'] || 0;
    const joined = statusCounts['Joined'] || 0;
    
    const successRate = totalCandidates > 0 ? ((joined / totalCandidates) * 100).toFixed(1) : '0';

    return {
      total: totalCandidates,
      submitted,
      interview,
      offer,
      joined,
      successRate
    };
  }, [filteredCandidates, statusCounts]);

  // --- 4. Charts Data ---
  const pipelineData = [
    {
      name: 'Pipeline',
      Submitted: candidateStats.submitted,
      Interview: candidateStats.interview,
      Offer: candidateStats.offer,
      Joined: candidateStats.joined,
      Rejected: statusCounts['Rejected'] || 0,
    },
  ];

  const pieData = [
    { name: 'Submitted', value: candidateStats.submitted, color: '#3B82F6' },
    { name: 'Interview', value: candidateStats.interview, color: '#F59E0B' },
    { name: 'Offer', value: candidateStats.offer, color: '#8B5CF6' },
    { name: 'Joined', value: candidateStats.joined, color: '#10B981' },
    { name: 'Rejected', value: statusCounts['Rejected'] || 0, color: '#EF4444' },
  ];

  // --- 5. Modal Logic ---
  const getFilteredData = () => {
    let data: any[] = [];
    switch (modalType) {
      case 'candidates':
        data = activeFilter 
          ? filteredCandidates.filter((c) => c.status === activeFilter)
          : filteredCandidates;
        break;
      case 'jobs':
        data = filteredJobs;
        break;
      case 'interviews':
        data = filteredInterviews;
        break;
      default:
        data = [];
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return data.filter(item => 
        (item.name?.toLowerCase().includes(lowerSearch)) ||
        (item.position?.toLowerCase().includes(lowerSearch)) ||
        (item.email?.toLowerCase().includes(lowerSearch)) ||
        (item.candidateName?.toLowerCase().includes(lowerSearch)) ||
        (item.title?.toLowerCase().includes(lowerSearch))
      );
    }
    return data;
  };

  const currentFilteredData = getFilteredData();
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
  const currentData = currentFilteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- 6. Handlers ---
  const handleCardClick = (type: 'candidates' | 'jobs' | 'interviews' | 'schedules', filter?: string) => {
    setModalType(type);
    setActiveFilter(filter || null);
    setSearchTerm('');
    setCurrentPage(1);
    setModalOpen(true);
  };

  const handleView = (candidate: EnhancedCandidate) => {
    setSelectedCandidate(candidate);
    setViewModalOpen(true);
  };

  const handleViewInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setViewModalOpen(true);
  };

  const handleJoinMeeting = (meetingLink: string) => {
    window.open(meetingLink, '_blank');
  };

  const handleNavigateToCandidates = () => navigate('/recruiter/candidates');
  const handleNavigateToAssignments = () => navigate('/recruiter/assignments');

  const getModalTitle = () => {
    switch (modalType) {
      case 'candidates': return activeFilter ? `${activeFilter} Candidates` : 'All Candidates';
      case 'jobs': return 'My Assigned Jobs';
      case 'interviews': return 'Interview Schedule';
      default: return 'Details';
    }
  };

  // --- 7. UI Helpers (Badges/Icons) ---
  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual': return <Video className="h-4 w-4 text-blue-500" />;
      case 'in-person': return <MapPin className="h-4 w-4 text-green-500" />;
      case 'phone': return <Phone className="h-4 w-4 text-purple-500" />;
      default: return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInterviewStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'scheduled': return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>Scheduled</span>;
      case 'completed': return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Completed</span>;
      case 'cancelled': return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>Cancelled</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`}>Pending</span>;
    }
  };

  const getCandidateStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    if(status === 'Joined') return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200`}>Joined</span>;
    if(status === 'Rejected') return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200`}>Rejected</span>;
    if(status === 'Offer') return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200`}>Offer</span>;
    if(status === 'Submitted') return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200`}>Submitted</span>;
    return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200`}>{status}</span>;
  };

  if(loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-200">
                Recruiter Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back, {user?.name}! Here's your recruiting overview.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleNavigateToCandidates}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                My Candidates
              </Button>

              <Button
                onClick={handleNavigateToAssignments}
                variant="outline"
                className="font-medium px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Briefcase className="w-5 h-5" />
                My Assignments
              </Button>

              {/* Date Filters */}
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <input
                  type="date"
                  className="border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1 text-sm w-32"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setStartDate(e.target.value ? new Date(e.target.value) : null)
                  }
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  className="border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1 text-sm w-32"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEndDate(e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
            </div>
          </div>

          {/* First Row - Core Metrics */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Candidates"
              value={candidateStats.total}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              onClick={() => handleCardClick('candidates')}
            />
            
            <StatCard
              title="Assigned Jobs"
              value={jobStats.totalAssignedJobs}
              icon={Briefcase}
              gradient="from-blue-500 to-blue-600"
              onClick={() => handleCardClick('jobs')}
            />
            
            <StatCard
              title="Success Rate"
              value={`${candidateStats.successRate}%`}
              icon={TrendingUp}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => handleCardClick('candidates', 'Joined')}
            />
            
            <StatCard
              title="Interviews"
              value={interviewStats.totalInterviews}
              icon={Calendar}
              gradient="from-purple-500 to-purple-600"
              onClick={() => handleCardClick('interviews')}
            />
            
            <StatCard
              title="Completion Rate"
              value={`${interviewStats.completionRate}%`}
              icon={CheckCircle2}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => handleCardClick('interviews')}
            />
          </div>

          {/* Second Row - Status Metrics (3 Colors Only) */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Submitted"
              value={candidateStats.submitted}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              onClick={() => handleCardClick('candidates', 'Submitted')}
            />
            
            <StatCard
              title="Interview"
              value={candidateStats.interview}
              icon={Users}
              gradient="from-purple-500 to-purple-600"
              onClick={() => handleCardClick('candidates')}
            />
            
            <StatCard
              title="Offers"
              value={candidateStats.offer}
              icon={Users}
              gradient="from-purple-500 to-purple-600"
              onClick={() => handleCardClick('candidates', 'Offer')}
            />
            
            <StatCard
              title="Joined"
              value={candidateStats.joined}
              icon={Users}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => handleCardClick('candidates', 'Joined')}
            />
          </div>

          {/* Third Row - Interview & Schedule Metrics (3 Colors Only) */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Today's Interviews"
              value={todaysInterviews.length}
              icon={Clock}
              gradient="from-blue-500 to-blue-600"
              onClick={() => handleCardClick('interviews')}
            />
            
            <StatCard
              title="Upcoming (7 days)"
              value={upcomingInterviews.length}
              icon={Calendar}
              gradient="from-purple-500 to-purple-600"
              onClick={() => handleCardClick('interviews')}
            />
            
            <StatCard
              title="Completed"
              value={interviewStats.completedInterviews}
              icon={CheckCircle2}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => handleCardClick('interviews')}
            />
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Candidate Pipeline Bar Chart */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Candidate Pipeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Submitted" name="Submitted" fill="url(#colorSubmitted)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Interview" name="Interview" fill="url(#colorInterview)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Offer" name="Offer" fill="url(#colorOffer)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Joined" name="Joined" fill="url(#colorJoined)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Rejected" name="Rejected" fill="url(#colorRejected)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorOffer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorJoined" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Schedules & Interviews Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Today's Schedule */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Schedule</h3>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    {todaysInterviews.length} interviews
                  </span>
                  <button 
                    onClick={() => handleCardClick('interviews')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {todaysInterviews.length > 0 ? (
                  todaysInterviews.map((interview, index) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleViewInterview(interview)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                          {getInterviewTypeIcon(interview.interviewType)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{interview.candidateName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{interview.position}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(interview.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getInterviewStatusBadge(interview.status)}
                        {interview.meetingLink && interview.status === 'scheduled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinMeeting(interview.meetingLink!);
                            }}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            title="Join Meeting"
                          >
                            <Video className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No interviews scheduled for today</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Upcoming Interviews */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Upcoming Interviews</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={interviewStatusFilter}
                    onChange={(e) => setInterviewStatusFilter(e.target.value as 'all' | 'scheduled' | 'completed' | 'cancelled')}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button 
                    onClick={() => handleCardClick('interviews')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {upcomingInterviews.slice(0, 5).map((interview, index) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors cursor-pointer"
                    onClick={() => handleViewInterview(interview)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                        {getInterviewTypeIcon(interview.interviewType)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{interview.candidateName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{interview.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(interview.interviewDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(interview.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {upcomingInterviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming interviews</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Candidates */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Candidates</h3>
                <button 
                  onClick={() => handleCardClick('candidates')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {filteredCandidates.slice(0, 5).map((candidate) => (
                  <div 
                    key={candidate.id}
                    className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors cursor-pointer"
                    onClick={() => handleView(candidate)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{candidate.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.position || 'No position'}</p>
                      </div>
                    </div>
                    {getCandidateStatusBadge(candidate.status)}
                  </div>
                ))}
              </div>
            </Card>

            {/* Assigned Jobs */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">My Assigned Jobs</h3>
                <button 
                  onClick={() => handleCardClick('jobs')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {filteredJobs.slice(0, 5).map((job) => (
                  <div 
                    key={job.id}
                    className="p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors cursor-pointer"
                    onClick={() => handleCardClick('jobs')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.client}</p>
                      </div>
                      <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {job.jobCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{job.location || 'Remote'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 🔹 Unified Modal */}
          <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <DialogTitle className="text-xl font-bold">
                    {getModalTitle()} ({currentFilteredData.length})
                  </DialogTitle>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="overflow-auto max-h-[calc(85vh-180px)]">
                  {modalType === 'candidates' && (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Date Added</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentData as EnhancedCandidate[]).map((candidate: EnhancedCandidate, i: number) => (
                          <tr
                            key={candidate.id}
                            className={clsx(
                              'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                              i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                            )}
                          >
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">{candidate.name}</td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">{candidate.position || '-'}</td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              {getCandidateStatusBadge(candidate.status)}
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">{candidate.email}</td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              {new Date(candidate.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              <Button size="sm" variant="ghost" onClick={() => handleView(candidate)}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {modalType === 'jobs' && (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Job Code</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Client</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentData as Job[]).map((job: Job, i: number) => (
                          <tr
                            key={job.id}
                            className={clsx(
                              'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                              i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                            )}
                          >
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-mono text-sm">
                              {job.jobCode || 'N/A'}
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                              {job.client || 'N/A'}
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              {job.title || 'N/A'}
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              {job.location || 'Remote'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {modalType === 'interviews' && (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Candidate</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentData as Interview[]).map((interview: Interview, i: number) => (
                          <tr
                            key={interview.id}
                            className={clsx(
                              'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                              i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                            )}
                          >
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              <div className="font-medium">{interview.candidateName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{interview.candidateEmail}</div>
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">{interview.position}</td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                {getInterviewTypeIcon(interview.interviewType)}
                                <span className="capitalize">{interview.interviewType}</span>
                              </div>
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              <div>{new Date(interview.interviewDate).toLocaleDateString()}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(interview.interviewDate).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              {getInterviewStatusBadge(interview.status)}
                            </td>
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleViewInterview(interview)}>
                                View
                              </Button>
                              {interview.meetingLink && interview.status === 'scheduled' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleJoinMeeting(interview.meetingLink!)}
                                >
                                  Join
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {currentPage} of {totalPages || 1} ({currentFilteredData.length} items)
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage((p) => p - 1)}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button 
                        size="sm" 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage((p) => p + 1)}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          {/* 🔹 Enhanced Candidate View Modal */}
          {selectedCandidate && (
            <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} className="relative z-50">
              <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <DialogTitle className="text-2xl font-bold">Candidate Details</DialogTitle>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="overflow-auto max-h-[calc(90vh-120px)]">
                    <div className="p-6 space-y-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                            {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCandidate.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">{selectedCandidate.position}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {getCandidateStatusBadge(selectedCandidate.status)}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Added {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Personal & Contact Info */}
                        <div className="space-y-6">
                          {/* Contact Information */}
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                              <Users className="w-5 h-5 text-blue-600" />
                              Contact Information
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.email}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <PhoneIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.phone}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPinIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.preferredLocation}</span>
                              </div>
                            </div>
                          </Card>

                          {/* Professional Details */}
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-green-600" />
                              Professional Details
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Experience</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.experience}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Current Company</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.currentCompany}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Notice Period</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.noticePeriod}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Current Salary</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.currentSalary}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Expected Salary</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.expectedSalary}</span>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Right Column - Skills & Education */}
                        <div className="space-y-6">
                          {/* Skills */}
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                              <Star className="w-5 h-5 text-purple-600" />
                              Skills & Expertise
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedCandidate.skills?.map((skill, index) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                                >
                                  {skill}
                                </span>
                              ))}
                              {(!selectedCandidate.skills || selectedCandidate.skills.length === 0) && (
                                <span className="text-gray-500">No skills listed</span>
                              )}
                            </div>
                          </Card>

                          {/* Education */}
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                              <GraduationCap className="w-5 h-5 text-orange-600" />
                              Education
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.education}</span>
                              </div>
                            </div>
                          </Card>

                          {/* Recruitment Details */}
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                              <Target className="w-5 h-5 text-red-600" />
                              Recruitment Details
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Source</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.source}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Last Contact</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {new Date(selectedCandidate.lastContact!).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {selectedCandidate.notes && (
                        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/10">
                          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-gray-600" />
                            Additional Notes
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedCandidate.notes}
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Candidate ID: {selectedCandidate.id}</span>
                        <span>•</span>
                        <span>Created: {new Date(selectedCandidate.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          )}

          {/* 🔹 Interview View Modal */}
          {selectedInterview && (
            <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} className="relative z-50">
              <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <DialogTitle className="text-xl font-bold">Interview Details</DialogTitle>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Candidate</p>
                        <p className="font-medium">{selectedInterview.candidateName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium">{selectedInterview.candidateEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                        <p className="font-medium">{selectedInterview.position}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        {getInterviewStatusBadge(selectedInterview.status)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                        <div className="flex items-center gap-2">
                          {getInterviewTypeIcon(selectedInterview.interviewType)}
                          <span className="font-medium capitalize">{selectedInterview.interviewType}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium">{selectedInterview.duration} minutes</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                      <p className="font-medium">{new Date(selectedInterview.interviewDate).toLocaleString()}</p>
                    </div>
                    {selectedInterview.notes && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                        <p className="font-medium">{selectedInterview.notes}</p>
                      </div>
                    )}
                    {selectedInterview.feedback && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Feedback</p>
                        <p className="font-medium">{selectedInterview.feedback}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-end gap-2">
                      {selectedInterview.meetingLink && selectedInterview.status === 'scheduled' && (
                        <Button onClick={() => handleJoinMeeting(selectedInterview.meetingLink!)}>
                          Join Meeting
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}