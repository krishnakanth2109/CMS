import { useState, useMemo, ChangeEvent } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StatCard } from '@/components/StatCard';
import { Users, Award, Briefcase, ClipboardList, Calendar, TrendingUp, Clock, Video, MapPin, Phone, Play, Pause, CheckCircle2, XCircle, AlertCircle, MoreVertical, Eye, Edit, Trash2, Plus, Mail, Building, User, MapPinIcon, PhoneIcon, GraduationCap, BookOpen, Star, Target, UserPlus } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/contexts/JobsContext';
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
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { CandidateStatus, Candidate } from '@/types';
import { Job } from '@/contexts/JobsContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Interview interface
interface Interview {
  id: string;
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
  stage: string;
  notes?: string;
  meetingLink?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
}

// Enhanced Candidate interface with additional fields
interface EnhancedCandidate extends Candidate {
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
}

export default function RecruiterDashboard() {
  const { candidates } = useData();
  const { user } = useAuth();
  const { jobs } = useJobs();
  const navigate = useNavigate();

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
  const [scheduleView, setScheduleView] = useState<'calendar' | 'list'>('list');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  // Updated statuses matching RecruiterCandidates
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

  // 🔹 Recruiter's candidates with enhanced data
  const myCandidates = useMemo((): EnhancedCandidate[] => {
    return candidates
      .filter((c) => c.recruiterId === user?.id)
      .map(candidate => ({
        ...candidate,
        phone: candidate.contact || '+1 (555) 123-4567',
        experience: candidate.totalExperience || '5 years',
        skills: Array.isArray(candidate.skills) ? candidate.skills : (candidate.skills ? [candidate.skills] : ['React', 'TypeScript', 'Node.js']),
        education: 'Bachelor of Engineering',
        currentCompany: candidate.client || 'Tech Corp Inc',
        noticePeriod: candidate.noticePeriod || '30 days',
        currentSalary: candidate.ctc ? `₹${candidate.ctc} LPA` : '₹15 LPA',
        expectedSalary: candidate.ectc ? `₹${candidate.ectc} LPA` : '₹20 LPA',
        resumeLink: '#',
        source: 'LinkedIn',
        lastContact: new Date().toISOString(),
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interviewRounds: 2,
        totalExperience: candidate.totalExperience || '5 years',
        preferredLocation: 'Remote'
      }));
  }, [candidates, user?.id]);

  // 🔹 Recruiter's assigned jobs
  const myJobs = useMemo(() => {
    return jobs.filter(job => job.assignedRecruiter === user?.id);
  }, [jobs, user?.id]);

  // Helper function to get job TAT status
  const getJobTatStatus = (job: Job): 'normal' | 'urgent' | 'expired' => {
    if (!job.deadline) return 'normal';
    
    const today = new Date();
    const deadline = new Date(job.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) return 'expired';
    if (daysUntilDeadline <= 3) return 'urgent';
    return 'normal';
  };

  // Get jobs by TAT status
  const urgentTatJobs = myJobs.filter(job => getJobTatStatus(job) === 'urgent');
  const expiredTatJobs = myJobs.filter(job => getJobTatStatus(job) === 'expired');

  // Get candidates for specific job TAT status
  const getCandidatesByJobTat = (tatStatus: 'urgent' | 'expired') => {
    const targetJobs = tatStatus === 'urgent' ? urgentTatJobs : expiredTatJobs;
    const jobIds = targetJobs.map(job => job.id);
    
    return myCandidates.filter(candidate => 
      candidate.assignedJobId && jobIds.includes(candidate.assignedJobId)
    );
  };

  // 🔹 Mock interviews data
  const interviews: Interview[] = useMemo(() => {
    return myCandidates
      .filter(c => ['L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview', 'Interview'].includes(c.status))
      .map((c, index) => {
        const interviewDate = new Date();
        interviewDate.setDate(interviewDate.getDate() + index);
        
        return {
          id: `interview-${c.id}`,
          candidateId: c.id,
          candidateName: c.name,
          candidateEmail: c.email || '',
          position: c.position || 'Not specified',
          status: index % 4 === 0 ? 'completed' : index % 4 === 1 ? 'cancelled' : 'scheduled',
          interviewDate: interviewDate.toISOString(),
          interviewType: index % 3 === 0 ? 'virtual' : index % 3 === 1 ? 'in-person' : 'phone',
          location: 'Conference Room A',
          duration: 60,
          recruiterId: c.recruiterId,
          stage: c.status,
          notes: 'Technical skills assessment required',
          meetingLink: index % 3 === 0 ? 'https://meet.google.com/abc-def-ghi' : undefined,
          feedback: index % 4 === 0 ? 'Strong technical skills, good cultural fit' : undefined,
          rating: index % 4 === 0 ? 4 : undefined,
          createdAt: new Date().toISOString()
        };
      });
  }, [myCandidates]);

  // 🔹 Filter interviews by status
  const filteredInterviews = useMemo(() => {
    if (interviewStatusFilter === 'all') return interviews;
    return interviews.filter(interview => interview.status === interviewStatusFilter);
  }, [interviews, interviewStatusFilter]);

  // 🔹 Today's interviews
  const todaysInterviews = useMemo(() => {
    const today = new Date().toDateString();
    return interviews.filter(interview => 
      new Date(interview.interviewDate).toDateString() === today
    );
  }, [interviews]);

  // 🔹 Upcoming interviews (next 7 days)
  const upcomingInterviews = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.interviewDate);
      return interviewDate >= today && interviewDate <= nextWeek;
    });
  }, [interviews]);

  // 🔹 Apply date filter to candidates
  const filteredCandidates = useMemo(() => {
    return myCandidates
      .filter((c) => {
        const date = new Date(c.createdAt);
        const afterStart = startDate ? date >= startDate : true;
        const beforeEnd = endDate ? date <= endDate : true;
        return afterStart && beforeEnd;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myCandidates, startDate, endDate]);

  // 🔹 Apply date filter to jobs
  const filteredJobs = useMemo(() => {
    return myJobs.filter((job) => {
      const jobDate = new Date(job.date || job.createdAt || new Date());
      const afterStart = startDate ? jobDate >= startDate : true;
      const beforeEnd = endDate ? jobDate <= endDate : true;
      return afterStart && beforeEnd;
    });
  }, [myJobs, startDate, endDate]);

  // 🔹 Job Statistics
  const jobStats = useMemo(() => {
    const totalAssignedJobs = filteredJobs.length;
    
    // TAT Status for assigned jobs
    const urgentJobs = filteredJobs.filter(job => {
      if (!job.deadline) return false;
      const today = new Date();
      const tatDate = new Date(job.deadline);
      const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }).length;

    const expiredJobs = filteredJobs.filter(job => {
      if (!job.deadline) return false;
      const today = new Date();
      const tatDate = new Date(job.deadline);
      const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diffDays < 0;
    }).length;

    return {
      totalAssignedJobs,
      urgentJobs,
      expiredJobs,
    };
  }, [filteredJobs]);

  // 🔹 Interview Statistics
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

  // 🔹 Status counts for candidates (matching RecruiterCandidates)
  const statusCounts: Record<string, number> = {};
  statuses.forEach((status) => {
    statusCounts[status] = filteredCandidates.filter((c) => c.status === status).length;
  });

  // 🔹 Additional stats matching RecruiterCandidates
  const candidateStats = useMemo(() => {
    const totalCandidates = filteredCandidates.length;
    const submitted = statusCounts['Submitted'] || 0;
    const interview = [
      'L1 Interview', 'L2 Interview', 'Final Interview', 
      'Technical Interview', 'HR Interview', 'Interview'
    ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);
    const offer = statusCounts['Offer'] || 0;
    const joined = statusCounts['Joined'] || 0;
    const urgentTat = getCandidatesByJobTat('urgent').length;
    const expiredTat = getCandidatesByJobTat('expired').length;

    const successRate = totalCandidates > 0 ? ((joined / totalCandidates) * 100).toFixed(1) : '0';

    return {
      total: totalCandidates,
      submitted,
      interview,
      offer,
      joined,
      urgentTat,
      expiredTat,
      successRate
    };
  }, [filteredCandidates, statusCounts]);

  // 🔹 Charts data
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

  const interviewTrendData = [
    { name: 'Mon', scheduled: 4, completed: 3 },
    { name: 'Tue', scheduled: 2, completed: 4 },
    { name: 'Wed', scheduled: 5, completed: 2 },
    { name: 'Thu', scheduled: 3, completed: 3 },
    { name: 'Fri', scheduled: 6, completed: 5 },
    { name: 'Sat', scheduled: 1, completed: 1 },
    { name: 'Sun', scheduled: 2, completed: 2 },
  ];

  const pieData = [
    { name: 'Submitted', value: candidateStats.submitted, color: '#3B82F6' },
    { name: 'Interview', value: candidateStats.interview, color: '#F59E0B' },
    { name: 'Offer', value: candidateStats.offer, color: '#8B5CF6' },
    { name: 'Joined', value: candidateStats.joined, color: '#10B981' },
    { name: 'Rejected', value: statusCounts['Rejected'] || 0, color: '#EF4444' },
  ];

  // 🔹 Filter data for modal
  const getFilteredData = () => {
    switch (modalType) {
      case 'candidates':
        return activeFilter 
          ? filteredCandidates.filter((c) => c.status === activeFilter)
          : filteredCandidates;
      case 'jobs':
        return filteredJobs;
      case 'interviews':
        return filteredInterviews;
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  // 🔹 Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔹 Handle card clicks
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

  // 🔹 Navigate to pages
  const handleNavigateToCandidates = () => {
    navigate('/recruiter/candidates');
  };

  const handleNavigateToAssignments = () => {
    navigate('/recruiter/assignments');
  };

  // 🔹 Get modal title
  const getModalTitle = () => {
    switch (modalType) {
      case 'candidates':
        return activeFilter ? `${activeFilter} Candidates` : 'All Candidates';
      case 'jobs':
        return 'My Assigned Jobs';
      case 'interviews':
        return 'Interview Schedule';
      default:
        return 'Details';
    }
  };

  // 🔹 Get interview type icon
  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'in-person':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-purple-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  // 🔹 Get status badge
  const getInterviewStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'scheduled':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>Scheduled</span>;
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Completed</span>;
      case 'cancelled':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>Cancelled</span>;
      case 'no-show':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300`}>No Show</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`}>Pending</span>;
    }
  };

  // 🔹 Get candidate status badge
  const getCandidateStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'Joined':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800`}>Joined</span>;
      case 'Rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800`}>Rejected</span>;
      case 'Offer':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800`}>Offer</span>;
      case 'Pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800`}>Pending</span>;
      case 'Submitted':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800`}>Submitted</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-700`}>{status}</span>;
    }
  };

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
              gradient="from-teal-500 to-teal-600"
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
              gradient="from-green-500 to-green-600"
              onClick={() => handleCardClick('interviews')}
            />
          </div>

          {/* Second Row - Status Metrics (Matching RecruiterCandidates) */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-6">
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
              gradient="from-orange-500 to-orange-600"
              onClick={() => handleCardClick('candidates')}
            />
            
            <StatCard
              title="Offers"
              value={candidateStats.offer}
              icon={Users}
              gradient="from-indigo-500 to-indigo-600"
              onClick={() => handleCardClick('candidates', 'Offer')}
            />
            
            <StatCard
              title="Joined"
              value={candidateStats.joined}
              icon={Users}
              gradient="from-green-500 to-green-600"
              onClick={() => handleCardClick('candidates', 'Joined')}
            />
            
            <StatCard
              title="Urgent TAT"
              value={candidateStats.urgentTat}
              icon={AlertCircle}
              gradient="from-red-500 to-red-600"
              onClick={() => handleCardClick('candidates')}
            />
            
            <StatCard
              title="Expired TAT"
              value={candidateStats.expiredTat}
              icon={Clock}
              gradient="from-yellow-500 to-yellow-600"
              onClick={() => handleCardClick('candidates')}
            />
          </div>

          {/* Third Row - Interview & Schedule Metrics */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Today's Interviews"
              value={todaysInterviews.length}
              icon={Clock}
              gradient="from-orange-500 to-orange-600"
              onClick={() => handleCardClick('interviews')}
            />
            
            <StatCard
              title="Upcoming (7 days)"
              value={upcomingInterviews.length}
              icon={Calendar}
              gradient="from-blue-500 to-blue-600"
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
                {filteredCandidates.slice(0, 5).map((candidate, index) => (
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
                {filteredJobs.slice(0, 5).map((job, index) => (
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
                      {job.deadline && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (() => {
                            const today = new Date();
                            const tatDate = new Date(job.deadline);
                            const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                            if (diffDays < 0) {
                              return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                            } else if (diffDays <= 3) {
                              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                            } else {
                              return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                            }
                          })()
                        }`}>
                          {(() => {
                            const today = new Date();
                            const tatDate = new Date(job.deadline);
                            const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                            if (diffDays < 0) {
                              return `Expired ${Math.abs(diffDays)}d`;
                            } else if (diffDays <= 3) {
                              return `Due in ${diffDays}d`;
                            } else {
                              return `${diffDays}d left`;
                            }
                          })()}
                        </span>
                      )}
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
                    {getModalTitle()} ({filteredData.length})
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
                    placeholder={
                      modalType === 'candidates' ? "Search candidates by name, email, or position..." :
                      modalType === 'jobs' ? "Search jobs by position, client, or location..." :
                      "Search interviews by candidate name or position..."
                    }
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
                          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">TAT Status</th>
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
                            <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                              {!job.deadline ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                  N/A
                                </span>
                              ) : (
                                (() => {
                                  const today = new Date();
                                  const tatDate = new Date(job.deadline);
                                  const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                                  if (diffDays < 0) {
                                    return (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                        Expired ({Math.abs(diffDays)}d)
                                      </span>
                                    );
                                  } else if (diffDays <= 3) {
                                    return (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                        Due in {diffDays}d
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                        {diffDays} days left
                                      </span>
                                    );
                                  }
                                })()
                              )}
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
                      Page {currentPage} of {totalPages || 1} ({filteredData.length} items)
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
                              <User className="w-5 h-5 text-blue-600" />
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
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.totalExperience}</span>
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
                                <span className="text-gray-600 dark:text-gray-400">Interview Rounds</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.interviewRounds}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Last Contact</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {new Date(selectedCandidate.lastContact!).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Next Follow-up</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {new Date(selectedCandidate.nextFollowUp!).toLocaleDateString()}
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