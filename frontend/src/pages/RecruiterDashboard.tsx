import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { 
  Users, Briefcase, ClipboardList, Calendar, TrendingUp, Clock, 
  CheckCircle2, ArrowUpRight, ArrowDownRight, UserCheck, 
  Bell, ChevronDown, CalendarDays, Filter, X, Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Job, Candidate, Interview, User, CandidateStatus } from '@/types';
import clsx from 'clsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Types ---

interface RawCandidate {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  position?: string;
  status?: string;
  phone?: string;
  contact?: string;
  experience?: string;
  totalExperience?: string;
  currentCompany?: string;
  client?: string;
  currentSalary?: string;
  ctc?: string;
  expectedSalary?: string;
  ectc?: string;
  skills?: string[] | string;
  createdAt?: string;
}

interface RawJob {
  _id?: string;
  id?: string;
  title?: string;
  client?: string;
  location?: string;
  jobCode?: string;
  createdAt?: string;
  primaryRecruiter?: string;
  secondaryRecruiter?: string;
  assignedRecruiter?: string;
  recruiterId?: string;
}

interface RawInterview {
  _id?: string;
  id?: string;
  candidateId?: string | { _id?: string; id?: string; name?: string; email?: string };
  candidateName?: string;
  candidateEmail?: string;
  position?: string;
  status?: string;
  interviewDate?: string;
  date?: string;
  type?: string;
  interviewType?: string;
  duration?: number;
  notes?: string;
  meetingLink?: string;
  feedback?: string;
  rating?: number;
  createdAt?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

// --- Components ---

// 1. Professional StatCard
interface ProfessionalStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  description?: string;
  onClick?: () => void;
  borderColor?: string;
  iconColor?: string;
}

function ProfessionalStatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend = 0, 
  description, 
  onClick,
  borderColor = "border-blue-200 dark:border-blue-800",
  iconColor = "text-blue-600 dark:text-blue-400"
}: ProfessionalStatCardProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-800 
        border ${borderColor} 
        rounded-xl p-3 md:p-4 
        shadow-sm hover:shadow-md 
        transition-all duration-300 
        cursor-pointer hover:scale-[1.02]
        group overflow-hidden
        h-28 md:h-32 flex flex-col justify-between
        ${onClick ? 'hover:border-2 hover:border-blue-400 dark:hover:border-blue-600 hover:border-solid' : ''}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/30 dark:to-gray-800/30 rounded-xl"></div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {title}
            </p>
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
              {value}
            </h3>
          </div>
          
          <div className={`
            p-1.5 md:p-2 rounded-lg ml-1 md:ml-2 flex-shrink-0
            bg-blue-50 dark:bg-blue-900/20 
            border border-blue-100 dark:border-blue-800/50
            group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30
            transition-colors
          `}>
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-1 md:space-x-2">
            {trend !== 0 && (
              <>
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : isNegative ? (
                  <ArrowDownRight className="w-3 h-3 text-red-500 flex-shrink-0" />
                ) : null}
                <span className={`text-xs font-medium ${
                  isPositive ? 'text-green-600' : 
                  isNegative ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              </>
            )}
            {description && !trend && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {description}
              </span>
            )}
          </div>
          
          {onClick && (
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Custom Date Input
const CustomDateInput = React.forwardRef<HTMLButtonElement, { 
  value?: string; 
  onClick?: () => void; 
  placeholder?: string;
  isMobile?: boolean;
}>(({ value, onClick, placeholder, isMobile = false }, ref) => (
  <button
    className={`
      flex items-center justify-between w-full 
      px-3 py-2 md:px-4 md:py-3 
      text-left 
      bg-white dark:bg-gray-800 
      border border-gray-300 dark:border-gray-600 
      rounded-xl hover:border-blue-500 focus:border-blue-500 
      focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-sm
      ${isMobile ? 'text-sm' : ''}
      relative z-10
    `}
    onClick={onClick}
    ref={ref}
    type="button"
  >
    <div className="flex items-center gap-2 md:gap-3">
      <CalendarDays className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <span className={`
        ${value ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}
        ${isMobile ? 'text-sm' : ''}
        truncate
      `}>
        {value || placeholder}
      </span>
    </div>
    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
  </button>
));

// --- Main Dashboard Component ---

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<DatePicker>(null);

  // Handle outside click for notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowDateFilter(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeader();

        const [candRes, jobRes, intRes] = await Promise.all([
          fetch(`${API_URL}/candidates`, { headers }),
          fetch(`${API_URL}/jobs`, { headers }),
          fetch(`${API_URL}/interviews`, { headers })
        ]);

        if (candRes.ok && jobRes.ok && intRes.ok) {
          const rawCandidates: RawCandidate[] = await candRes.json();
          const rawJobs: RawJob[] = await jobRes.json();
          const rawInterviews: RawInterview[] = await intRes.json();

          // Process Candidates (Filter by recruiter logic done in Backend usually, but checking here)
          const processedCandidates: Candidate[] = rawCandidates
            .filter(c => {
               // Assuming backend sends all, we filter for ownership if needed. 
               // For now, assuming endpoints return relevant data.
               return true; 
            })
            .map((c: RawCandidate): Candidate => ({
              id: c._id || c.id || '',
              name: c.name || 'Unknown Candidate',
              email: c.email || 'N/A',
              position: c.position || 'N/A',
              status: (c.status as CandidateStatus) || 'Submitted',
              phone: c.phone || c.contact || 'N/A',
              experience: c.experience || c.totalExperience || 'N/A',
              skills: Array.isArray(c.skills) ? c.skills : (c.skills ? c.skills.split(',') : []),
              createdAt: c.createdAt || new Date().toISOString(),
              recruiterId: '', 
              recruiterName: 'Unknown Recruiter',
              totalExperience: c.totalExperience || c.experience || 'N/A',
              ctc: c.ctc || c.currentSalary || 'N/A',
              ectc: c.ectc || c.expectedSalary || 'N/A',
              client: c.client || c.currentCompany || 'N/A',
            }));

          // Process Jobs
          const myJobs: Job[] = rawJobs
            .filter((j: RawJob) => {
              const recruiterId = user?.id || (user as User)?._id;
              return j.primaryRecruiter === user?.name ||
                    j.secondaryRecruiter === user?.name ||
                    j.assignedRecruiter === recruiterId ||
                    j.recruiterId === recruiterId;
            })
            .map((j: RawJob): Job => ({
              id: j._id || j.id || '',
              title: j.title || 'Untitled Job',
              client: j.client || 'Unknown Client',
              location: j.location || 'Remote',
              jobCode: j.jobCode || 'N/A',
              createdAt: j.createdAt || new Date().toISOString(),
              skills: '',
              salaryBudget: '',
              comments: '',
              primaryRecruiter: j.primaryRecruiter,
              secondaryRecruiter: j.secondaryRecruiter,
              assignedRecruiter: j.assignedRecruiter,
              recruiterId: j.recruiterId,
            }));

          // Process Interviews
          const processedInterviews: Interview[] = rawInterviews.map((i: RawInterview): Interview => {
             const candidateIdObj = typeof i.candidateId === 'object' && i.candidateId !== null ? i.candidateId : null;
             return {
               id: i._id || i.id || '',
               candidateId: candidateIdObj ? candidateIdObj._id || candidateIdObj.id || '' : i.candidateId as string || '',
               candidateName: candidateIdObj?.name || i.candidateName || 'Unknown Candidate',
               candidateEmail: candidateIdObj?.email || i.candidateEmail || 'N/A',
               position: i.position || 'N/A',
               status: (i.status === 'scheduled' || i.status === 'completed' || i.status === 'cancelled')
                 ? i.status as 'scheduled' | 'completed' | 'cancelled'
                 : (new Date(i.interviewDate || i.date || new Date()) < new Date() ? 'completed' : 'scheduled'),
               interviewDate: i.interviewDate || i.date || new Date().toISOString(),
               interviewType: (i.type || i.interviewType || 'virtual') as 'virtual' | 'in-person' | 'phone',
               duration: i.duration || 60,
               notes: i.notes || '',
               meetingLink: i.meetingLink || '',
               feedback: i.feedback || '',
               rating: i.rating || 0,
               createdAt: i.createdAt || new Date().toISOString()
             };
           });

          // Only keep interviews for candidates assigned to this recruiter or created by this recruiter
          // (Simplified logic: showing all fetched interviews assuming backend filters)
          setCandidates(processedCandidates);
          setJobs(myJobs);
          setInterviews(processedInterviews);

          setNotifications([
            { id: '1', title: 'System Ready', message: 'Dashboard loaded successfully', timestamp: new Date(), read: false, type: 'success' },
            { id: '2', title: 'Pipeline Update', message: `${processedCandidates.length} active candidates`, timestamp: new Date(), read: true, type: 'info' }
          ]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Filtering
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;
    if (startDate || endDate) {
      filtered = filtered.filter(c => {
        const date = new Date(c.createdAt);
        return (!startDate || date >= startDate) && (!endDate || date <= endDate);
      });
    }
    return filtered;
  }, [candidates, startDate, endDate]);

  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    if (startDate || endDate) {
      filtered = filtered.filter(j => {
        const date = new Date(j.createdAt || new Date());
        return (!startDate || date >= startDate) && (!endDate || date <= endDate);
      });
    }
    return filtered;
  }, [jobs, startDate, endDate]);

  const filteredInterviews = useMemo(() => {
    let filtered = interviews;
    if (startDate || endDate) {
      filtered = filtered.filter(i => {
        const date = new Date(i.interviewDate);
        return (!startDate || date >= startDate) && (!endDate || date <= endDate);
      });
    }
    return filtered.sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());
  }, [interviews, startDate, endDate]);

  // Stats Calculation
  const candidateStats = useMemo(() => {
    const total = filteredCandidates.length;
    const submitted = filteredCandidates.filter(c => c.status === 'Submitted').length;
    const interview = filteredCandidates.filter(c => c.status.includes('Interview')).length;
    const offer = filteredCandidates.filter(c => c.status === 'Offer').length;
    const joined = filteredCandidates.filter(c => c.status === 'Joined').length;
    const rejected = filteredCandidates.filter(c => c.status === 'Rejected').length;
    const successRate = total > 0 ? ((joined / total) * 100).toFixed(1) : '0';

    return { total, submitted, interview, offer, joined, rejected, successRate };
  }, [filteredCandidates]);

  const interviewStats = useMemo(() => {
    const totalInterviews = interviews.length;
    const todaysInterviews = interviews.filter(i => new Date(i.interviewDate).toDateString() === new Date().toDateString()).length;
    const upcomingInterviews = interviews.filter(i => {
      const d = new Date(i.interviewDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return d >= today && d <= nextWeek;
    }).length;
    const completedInterviews = interviews.filter(i => i.status === 'completed').length;
    const completionRate = totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0;

    return { totalInterviews, todaysInterviews, upcomingInterviews, completedInterviews, completionRate };
  }, [interviews]);

  const jobStats = useMemo(() => ({ totalAssignedJobs: filteredJobs.length }), [filteredJobs]);

  // Charts Data
  const pieData = useMemo(() => [
    { name: 'Submitted', value: candidateStats.submitted, color: '#3B82F6' },
    { name: 'Interview', value: candidateStats.interview, color: '#F59E0B' },
    { name: 'Offer', value: candidateStats.offer, color: '#8B5CF6' },
    { name: 'Joined', value: candidateStats.joined, color: '#10B981' },
    { name: 'Rejected', value: candidateStats.rejected, color: '#EF4444' },
  ].filter(d => d.value > 0), [candidateStats]);

  const pipelineData = useMemo(() => [{
    name: 'Pipeline',
    Submitted: candidateStats.submitted,
    Interview: candidateStats.interview,
    Offer: candidateStats.offer,
    Joined: candidateStats.joined,
    Rejected: candidateStats.rejected,
  }], [candidateStats]);

  // Navigation Handlers
  const handleNavigateToCandidates = () => navigate('/recruiter/candidates');
  const handleNavigateToAssignments = () => navigate('/recruiter/assignments');
  const handleNavigateToSchedules = () => navigate('/recruiter/schedules');
  const handleNavigateToMessages = () => navigate('/recruiter/messages');

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    if (isMobile) setShowDateFilter(false);
  };

  const getDateDisplayText = () => {
    if (!startDate && !endDate) return 'Select Date Range';
    if (startDate && endDate) return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    if (startDate) return `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    return 'Select Date Range';
  };

  const getUserGreeting = () => user?.name ? `Welcome back, ${user.name.split(' ')[0]}!` : "Welcome back!";
  const unreadCount = notifications.filter(n => !n.read).length;

  const PopperContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="z-[9999]">{children}</div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label || 'Data Point'}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-200">
                  Recruiter Dashboard
                </h1>
                <p className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-200 mt-1">
                  {getUserGreeting()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 z-[9998] max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200 font-semibold text-sm">Notifications</div>
                      {notifications.length === 0 ? <div className="p-4 text-center text-gray-500">No notifications</div> : notifications.map(n => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} className={clsx("p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50", !n.read && "bg-blue-50")}>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-gray-500">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isMobile && (
                  <button onClick={() => setShowDateFilter(!showDateFilter)} className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl shadow-sm border border-gray-200 text-sm font-medium">
                    <Filter className="w-4 h-4" /> {startDate || endDate ? getDateDisplayText() : 'Filter Dates'}
                  </button>
                )}
              </div>
            </div>

            {/* Date Filter */}
            {(!isMobile || showDateFilter) && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date Range</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                      <DatePicker selected={startDate} onChange={(d: Date | null) => setStartDate(d)} selectsStart startDate={startDate} endDate={endDate} placeholderText="Start Date" customInput={<CustomDateInput isMobile={isMobile} placeholder="Start Date" />} wrapperClassName="w-full" popperContainer={PopperContainer} popperClassName="!z-[9999]" isClearable />
                    </div>
                    <div className="relative flex-1 md:w-48">
                      <DatePicker selected={endDate} onChange={(d: Date | null) => setEndDate(d)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || undefined} placeholderText="End Date" customInput={<CustomDateInput isMobile={isMobile} placeholder="End Date" />} wrapperClassName="w-full" popperContainer={PopperContainer} popperClassName="!z-[9999]" isClearable />
                    </div>
                    {(startDate || endDate) && <button onClick={clearDateFilters} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /> Clear</button>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <ProfessionalStatCard title="Total Candidates" value={candidateStats.total} icon={Users} trend={5} onClick={handleNavigateToCandidates} borderColor="border-blue-200 dark:border-blue-800" iconColor="text-blue-600 dark:text-blue-400" />
            <ProfessionalStatCard title="Assigned Jobs" value={jobStats.totalAssignedJobs} icon={Briefcase} trend={2} onClick={handleNavigateToAssignments} borderColor="border-green-200 dark:border-green-800" iconColor="text-green-600 dark:text-green-400" />
            <ProfessionalStatCard title="Performance" value={`${candidateStats.successRate}%`} icon={TrendingUp} trend={parseFloat(candidateStats.successRate) > 0 ? 3 : 0} onClick={() => {}} borderColor="border-indigo-200 dark:border-indigo-800" iconColor="text-indigo-600 dark:text-indigo-400" />
            <ProfessionalStatCard title="Total Interviews" value={interviewStats.totalInterviews} icon={Calendar} trend={8} onClick={handleNavigateToSchedules} borderColor="border-purple-200 dark:border-purple-800" iconColor="text-purple-600 dark:text-purple-400" />
          </div>

          {/* Pipeline Breakdown */}
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <ProfessionalStatCard title="Submitted" value={candidateStats.submitted} icon={ClipboardList} onClick={handleNavigateToCandidates} borderColor="border-blue-200 dark:border-blue-800" iconColor="text-blue-600 dark:text-blue-400" />
            <ProfessionalStatCard title="Rejected" value={candidateStats.interview} icon={Calendar} onClick={handleNavigateToSchedules} borderColor="border-indigo-200 dark:border-indigo-800" iconColor="text-indigo-600 dark:text-indigo-400" />
            <ProfessionalStatCard title="Hold" value={candidateStats.offer} icon={Briefcase} onClick={handleNavigateToCandidates} borderColor="border-green-200 dark:border-green-800" iconColor="text-green-600 dark:text-green-400" />
            <ProfessionalStatCard title="Joined" value={candidateStats.joined} icon={UserCheck} onClick={handleNavigateToCandidates} borderColor="border-emerald-200 dark:border-emerald-800" iconColor="text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="p-4 md:p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">Candidate Pipeline</h3>
              <div className="h-64 md:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Submitted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Interview" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Offer" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Joined" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 md:p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">Status Distribution</h3>
              <div className="h-64 md:h-72 lg:h-80">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" label>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Access Tables */}
          <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Recent Candidates */}
            <Card className="p-4 md:p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Candidates</h3>
                <button onClick={handleNavigateToCandidates} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 font-medium">
                    <tr><th className="p-3">Name</th><th className="p-3">Position</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.slice(0, 5).map(c => (
                      <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{c.position}</td>
                        <td className="p-3">
                          <span className={clsx("px-2 py-1 rounded-full text-xs font-medium", 
                            c.status === 'Joined' ? "bg-green-100 text-green-800" : 
                            c.status === 'Rejected' ? "bg-red-100 text-red-800" : 
                            c.status === 'Offer' ? "bg-purple-100 text-purple-800" : 
                            c.status === 'Submitted' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          )}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredCandidates.length === 0 && <tr><td colSpan={3} className="p-4 text-center">No candidates found</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Upcoming Interviews */}
            <Card className="p-4 md:p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Upcoming Interviews</h3>
                <button onClick={handleNavigateToSchedules} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Calendar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 font-medium">
                    <tr><th className="p-3">Candidate</th><th className="p-3">Date</th><th className="p-3">Type</th></tr>
                  </thead>
                  <tbody>
                    {filteredInterviews.slice(0, 5).map(i => (
                      <tr key={i.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50">
                        <td className="p-3 font-medium">{i.candidateName}</td>
                        <td className="p-3">
                          <div className="font-medium">{new Date(i.interviewDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(i.interviewDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">{i.interviewType}</span></td>
                      </tr>
                    ))}
                    {filteredInterviews.length === 0 && <tr><td colSpan={3} className="p-4 text-center">No upcoming interviews</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
             <Button onClick={handleNavigateToCandidates} className="h-auto py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg flex flex-col items-center gap-3"><Users className="w-6 h-6"/><div className="text-center"><div className="font-semibold text-lg">My Candidates</div><div className="text-sm opacity-90">Manage pipeline</div></div></Button>
             <Button onClick={handleNavigateToAssignments} className="h-auto py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg flex flex-col items-center gap-3"><Briefcase className="w-6 h-6"/><div className="text-center"><div className="font-semibold text-lg">My Assignments</div><div className="text-sm opacity-90">View jobs</div></div></Button>
             <Button onClick={handleNavigateToSchedules} className="h-auto py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-lg flex flex-col items-center gap-3"><Calendar className="w-6 h-6"/><div className="text-center"><div className="font-semibold text-lg">My Schedule</div><div className="text-sm opacity-90">View calendar</div></div></Button>
             <Button onClick={handleNavigateToMessages} className="h-auto py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg flex flex-col items-center gap-3"><Mail className="w-6 h-6"/><div className="text-center"><div className="font-semibold text-lg">Messages</div><div className="text-sm opacity-90">Team chat</div></div></Button>
          </div>

        </div>
      </main>
    </div>
  );
}