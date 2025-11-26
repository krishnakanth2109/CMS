import React, { useState, useMemo, forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StatCard } from '@/components/StatCard';
import { Users, UserCheck, Calendar, TrendingUp, ClipboardList, Briefcase, X, ChevronDown, Clock, AlertTriangle, AlertCircle, Building, Globe, Search, Filter, Download, Eye, Bell, CheckCheck } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useJobs, Job } from '@/contexts/JobsContext';
import { useClients, Client } from '@/contexts/ClientsContext';
import { Card } from '@/components/ui/card';
import { Candidate } from '@/types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

type ModalData = Candidate | RecruiterStat | Job | Client;
type DetailedModalData = Candidate | Job | Client;

interface RecruiterStat {
  id: string;
  name: string;
  fullName: string;
  submissions: number;
  offers: number;
  joined: number;
  rejected: number;
  pending: number;
  successRate: string;
}

interface FilterState {
  search: string;
  status: string;
  recruiter: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface DetailedViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DetailedModalData | null;
  type: 'candidate' | 'job' | 'client';
}

// Notification types
interface Notification {
  id: string;
  type: 'candidate_added' | 'candidate_updated' | 'job_added' | 'job_updated' | 'interview_scheduled' | 'status_changed' | 'urgent_tat' | 'expired_tat';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  recruiterId?: string;
  recruiterName?: string;
  candidateId?: string;
  candidateName?: string;
  jobId?: string;
  jobCode?: string;
  clientName?: string;
  oldStatus?: string;
  newStatus?: string;
  interviewDate?: Date;
}

// Notification context or hook (we'll implement as a hook for now)
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('admin-notifications');
    if (!saved) return [];
    const parsed = JSON.parse(saved) as (Omit<Notification, 'timestamp' | 'interviewDate'> & { timestamp: string; interviewDate?: string })[];
    return parsed.map((n) => ({
      ...n,
      timestamp: new Date(n.timestamp),
      interviewDate: n.interviewDate ? new Date(n.interviewDate) : undefined
    }));
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('admin-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Simulate real-time notifications (in real app, this would come from WebSocket or API)
  useEffect(() => {
    const simulateActivities = () => {
      const activities = [
        {
          type: 'candidate_added' as const,
          title: 'New Candidate Submitted',
          message: 'A new candidate has been added to the system',
        },
        {
          type: 'status_changed' as const,
          title: 'Status Updated',
          message: 'Candidate status changed from Screening to Interview',
        },
        {
          type: 'interview_scheduled' as const,
          title: 'Interview Scheduled',
          message: 'L1 interview has been scheduled',
        },
        {
          type: 'job_added' as const,
          title: 'New Requirement',
          message: 'New job requirement has been posted',
        }
      ];

      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      
      // Only add occasional notifications (10% chance every 30 seconds)
      if (Math.random() < 0.1) {
        addNotification({
          ...randomActivity,
          recruiterName: 'John Doe',
          candidateName: 'Jane Smith',
          jobCode: 'TECH-2024-001',
          clientName: 'Tech Corp'
        });
      }
    };

    const interval = setInterval(simulateActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    unreadCount
  };
};

export default function AdminDashboard() {
  const { candidates, recruiters } = useData();
  const { jobs } = useJobs();
  const { clients } = useClients();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'candidates' | 'recruiters' | 'jobs' | 'interviews' | 'unassigned' | 'urgent' | 'expired' | 'clients' | 'recruiterCandidates'>('candidates');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [detailedViewOpen, setDetailedViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DetailedModalData | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'candidate' | 'job' | 'client' | ''>('');
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterStat | null>(null);
  const [selectedRecruiterMetric, setSelectedRecruiterMetric] = useState<string>('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Notification system
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    unreadCount
  } = useNotifications();

  // Filter states for each modal type
  const [candidateFilters, setCandidateFilters] = useState<FilterState>({
    search: '',
    status: '',
    recruiter: '',
    dateRange: { start: null, end: null }
  });

  const [jobFilters, setJobFilters] = useState({
    search: '',
    status: '',
    client: '',
    recruiter: '',
    dateRange: { start: null, end: null }
  });

  const [clientFilters, setClientFilters] = useState({
    search: '',
    industry: '',
    location: '',
    dateRange: { start: null, end: null }
  });

  const statuses = [
    'Submitted',
    'Pending',
    'Offer',
    'Joined',
    'Rejected',
  ];

  const interviewStatuses = useMemo(() => [
    'L1 Interview',
    'L2 Interview',
    'Interview'
  ], []);

  interface LabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }

  // Filter candidates by date
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const candidateDate = new Date(c.createdAt);
      const afterStart = startDate ? candidateDate >= startDate : true;
      const beforeEnd = endDate ? candidateDate <= endDate : true;
      return afterStart && beforeEnd;
    });
  }, [candidates, startDate, endDate]);

  // Filter jobs by date
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.date || job.createdAt || new Date());
      const afterStart = startDate ? jobDate >= startDate : true;
      const beforeEnd = endDate ? jobDate <= endDate : true;
      return afterStart && beforeEnd;
    });
  }, [jobs, startDate, endDate]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const clientDate = new Date(client.dateAdded);
      const afterStart = startDate ? clientDate >= startDate : true;
      const beforeEnd = endDate ? clientDate <= endDate : true;
      return afterStart && beforeEnd;
    });
  }, [clients, startDate, endDate]);

  // Client Statistics
  const clientStats = useMemo(() => {
    const totalClients = filteredClients.length;
    const clientsWithWebsite = filteredClients.filter(client => client.website).length;
    const clientsWithLocation = filteredClients.filter(client => client.address).length;
    
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const clientsThisMonth = filteredClients.filter(client => {
      const clientDate = new Date(client.dateAdded);
      return clientDate.getMonth() === thisMonth && clientDate.getFullYear() === thisYear;
    }).length;

    return {
      totalClients,
      clientsWithWebsite,
      clientsWithLocation,
      clientsThisMonth,
      clientsList: filteredClients
    };
  }, [filteredClients]);

  // Job Statistics
  const jobStats = useMemo(() => {
    const totalRequirements = filteredJobs.length;
    const assignedJobs = filteredJobs.filter(job => 
      job.primaryRecruiter || job.secondaryRecruiter
    ).length;
    const unassignedJobs = totalRequirements - assignedJobs;
    
    const urgentJobs = filteredJobs.filter(job => {
      if (!job.tatTime) return false;
      const today = new Date();
      const tatDate = new Date(job.tatTime);
      const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });

    const expiredJobs = filteredJobs.filter(job => {
      if (!job.tatTime) return false;
      const today = new Date();
      const tatDate = new Date(job.tatTime);
      const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diffDays < 0;
    });

    return {
      totalRequirements,
      assignedJobs,
      unassignedJobs: unassignedJobs,
      urgentJobs: urgentJobs.length,
      expiredJobs: expiredJobs.length,
      urgentJobsList: urgentJobs,
      expiredJobsList: expiredJobs,
      unassignedJobsList: filteredJobs.filter(job => !job.primaryRecruiter && !job.secondaryRecruiter)
    };
  }, [filteredJobs]);

  // Status Counts
  const statusCounts: Record<string, number> = {};
  statuses.forEach((status) => {
    statusCounts[status] = filteredCandidates.filter((c) => c.status === status).length;
  });

  // Interview Counts
  const interviewCandidates = useMemo(() => {
    return filteredCandidates.filter((c) =>
      interviewStatuses.includes(c.status)
    );
  }, [filteredCandidates, interviewStatuses]);

  const totalCandidates = filteredCandidates.length;
  const totalInterviews = interviewCandidates.length;
  const successRate =
    totalCandidates > 0
      ? ((statusCounts['Joined'] / totalCandidates) * 100).toFixed(2)
      : '0';

  // Enhanced Recruiter Stats with actual recruiter IDs
  const recruiterStats: RecruiterStat[] = useMemo(() => {
    return recruiters.map((rec) => {
      const recCandidates = filteredCandidates.filter((c) => c.recruiterId === rec.id);

      return {
        id: rec.id,
        name: rec.name.split(' ')[0],
        fullName: rec.name,
        submissions: recCandidates.length,
        offers: recCandidates.filter((c) => c.status === 'Offer').length,
        joined: recCandidates.filter((c) => c.status === 'Joined').length,
        rejected: recCandidates.filter((c) => c.status === 'Rejected').length,
        pending: recCandidates.filter((c) => c.status === 'Pending').length,
        successRate: recCandidates.length > 0
          ? ((recCandidates.filter(c => c.status === 'Joined').length / recCandidates.length) * 100).toFixed(1)
          : '0'
      };
    });
  }, [filteredCandidates, recruiters]);

  // Get candidates by recruiter and status
  const getCandidatesByRecruiterAndStatus = (recruiterId: string, metric: string) => {
    let statusFilter = '';
    switch (metric) {
      case 'submissions':
        return filteredCandidates.filter(c => c.recruiterId === recruiterId);
      case 'offers':
        statusFilter = 'Offer';
        break;
      case 'joined':
        statusFilter = 'Joined';
        break;
      case 'rejected':
        statusFilter = 'Rejected';
        break;
      case 'pending':
        statusFilter = 'Pending';
        break;
      default:
        return filteredCandidates.filter(c => c.recruiterId === recruiterId);
    }
    
    return filteredCandidates.filter(c => 
      c.recruiterId === recruiterId && c.status === statusFilter
    );
  };

  const statusData = statuses.map((status, index) => ({
    name: status,
    value: statusCounts[status],
    color: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  // Enhanced filtering with search and additional filters
  const getFilteredData = (): ModalData[] => {
    let data: ModalData[] = [];

    switch (modalType) {
      case 'candidates':
        data = activeFilter
          ? filteredCandidates.filter((c) => c.status === activeFilter)
          : filteredCandidates;

        // Apply candidate filters
        if (candidateFilters.search) {
          data = (data as Candidate[]).filter(candidate =>
            candidate.name.toLowerCase().includes(candidateFilters.search.toLowerCase()) ||
            candidate.email?.toLowerCase().includes(candidateFilters.search.toLowerCase()) ||
            candidate.position?.toLowerCase().includes(candidateFilters.search.toLowerCase())
          );
        }
        if (candidateFilters.status) {
          data = (data as Candidate[]).filter(candidate => candidate.status === candidateFilters.status);
        }
        if (candidateFilters.recruiter) {
          data = (data as Candidate[]).filter(candidate => {
            const recruiter = recruiters.find(r => r.id === candidate.recruiterId);
            return recruiter?.name === candidateFilters.recruiter;
          });
        }
        if (candidateFilters.dateRange.start) {
          data = (data as Candidate[]).filter(candidate =>
            new Date(candidate.createdAt) >= candidateFilters.dateRange.start!
          );
        }
        if (candidateFilters.dateRange.end) {
          data = (data as Candidate[]).filter(candidate =>
            new Date(candidate.createdAt) <= candidateFilters.dateRange.end!
          );
        }
        break;

      case 'recruiterCandidates':
        if (selectedRecruiter && selectedRecruiterMetric) {
          data = getCandidatesByRecruiterAndStatus(selectedRecruiter.id, selectedRecruiterMetric);
        }
        break;

      case 'jobs':
        data = activeFilter === 'assigned'
          ? filteredJobs.filter(job => job.primaryRecruiter || job.secondaryRecruiter)
          : filteredJobs;

        // Apply job filters
        if (jobFilters.search) {
          data = (data as Job[]).filter(job =>
            job.position?.toLowerCase().includes(jobFilters.search.toLowerCase()) ||
            job.clientName?.toLowerCase().includes(jobFilters.search.toLowerCase()) ||
            job.jobCode?.toLowerCase().includes(jobFilters.search.toLowerCase())
          );
        }
        if (jobFilters.client) {
          data = (data as Job[]).filter(job => job.clientName === jobFilters.client);
        }
        if (jobFilters.recruiter) {
          data = (data as Job[]).filter(job =>
            job.primaryRecruiter === jobFilters.recruiter ||
            job.secondaryRecruiter === jobFilters.recruiter
          );
        }
        break;

      case 'interviews':
        data = interviewCandidates;
        break;

      case 'unassigned':
        data = jobStats.unassignedJobsList;
        break;

      case 'urgent':
        data = jobStats.urgentJobsList;
        break;

      case 'expired':
        data = jobStats.expiredJobsList;
        break;

      case 'clients':
        data = clientStats.clientsList;

        // Apply client filters
        if (clientFilters.search) {
          data = (data as Client[]).filter(client =>
            client.companyName.toLowerCase().includes(clientFilters.search.toLowerCase()) ||
            client.contactPerson?.toLowerCase().includes(clientFilters.search.toLowerCase()) ||
            client.industry?.toLowerCase().includes(clientFilters.search.toLowerCase())
          );
        }
        if (clientFilters.industry) {
          data = (data as Client[]).filter(client => client.industry === clientFilters.industry);
        }
        break;

      case 'recruiters':
        data = recruiterStats;
        break;

      default:
        data = [];
    }

    return data;
  };

  const filteredData = getFilteredData();

  // Enhanced card click handler
  const handleCardClick = (type: 'candidates' | 'recruiters' | 'jobs' | 'interviews' | 'unassigned' | 'urgent' | 'expired' | 'clients' | 'recruiterCandidates', filter?: string) => {
    setModalType(type);
    setActiveFilter(filter || null);

    // Reset filters when opening modal
    if (type === 'candidates') {
      setCandidateFilters({
        search: '',
        status: filter || '',
        recruiter: '',
        dateRange: { start: null, end: null }
      });
    } else if (type === 'jobs') {
      setJobFilters({
        search: '',
        status: '',
        client: '',
        recruiter: '',
        dateRange: { start: null, end: null }
      });
    } else if (type === 'clients') {
      setClientFilters({
        search: '',
        industry: '',
        location: '',
        dateRange: { start: null, end: null }
      });
    }

    setModalOpen(true);
  };

  // Handle recruiter metric click
  const handleRecruiterMetricClick = (recruiter: RecruiterStat, metric: string) => {
    setSelectedRecruiter(recruiter);
    setSelectedRecruiterMetric(metric);
    setModalType('recruiterCandidates');
    setModalOpen(true);
  };

  // Open detailed view
  const handleOpenDetailedView = (item: DetailedModalData, type: 'candidate' | 'job' | 'client') => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setDetailedViewOpen(true);
  };

  // Export data
  const handleExportData = () => {
    const headers = getExportHeaders();
    const csvData = filteredData.map(item => getExportRow(item));
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modalType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getExportHeaders = (): string[] => {
    switch (modalType) {
      case 'candidates':
      case 'recruiterCandidates':
        return ['Name', 'Email', 'Phone', 'Position', 'Status', 'Recruiter', 'Experience', 'Current CTC', 'Expected CTC', 'Notice Period', 'Created Date'];
      case 'jobs':
        return ['Job Code', 'Client', 'Position', 'Location', 'Primary Recruiter', 'Secondary Recruiter', 'TAT', 'Status', 'Requirements'];
      case 'clients':
        return ['Company Name', 'Contact Person', 'Email', 'Phone', 'Industry', 'Website', 'Address', 'Date Added'];
      default:
        return ['Data'];
    }
  };

  const getExportRow = (item: ModalData): string[] => {
    switch (modalType) {
      case 'candidates':
      case 'recruiterCandidates': {
        const candidate = item as Candidate;
        const recruiter = recruiters.find(r => r.id === candidate.recruiterId);
        return [
          candidate.name,
          candidate.email || '',
          candidate.phone || '',
          candidate.position || '',
          candidate.status,
          recruiter?.name || '',
          candidate.experience || '',
          candidate.currentCtc || '',
          candidate.expectedCtc || '',
          candidate.noticePeriod || '',
          new Date(candidate.createdAt).toLocaleDateString()
        ];
      }
      case 'jobs': {
        const job = item as Job;
        return [
          job.jobCode || '',
          job.clientName || '',
          job.position || '',
          job.location || '',
          job.primaryRecruiter || '',
          job.secondaryRecruiter || '',
          job.tatTime ? new Date(job.tatTime).toLocaleDateString() : '',
          job.status || '',
          job.requirements || ''
        ];
      }
      case 'clients': {
        const client = item as Client;
        return [
          client.companyName,
          client.contactPerson,
          client.email,
          client.phone || '',
          client.industry || '',
          client.website || '',
          client.address || '',
          new Date(client.dateAdded).toLocaleDateString()
        ];
      }
      default:
        return [JSON.stringify(item)];
    }
  };

  // Get modal title
  const getModalTitle = () => {
    switch (modalType) {
      case 'candidates':
        return activeFilter ? `${activeFilter} Candidates` : 'All Candidates';
      case 'recruiters':
        return 'Recruiter Details';
      case 'jobs':
        return activeFilter === 'assigned' ? 'Assigned Jobs' : 'All Job Requirements';
      case 'interviews':
        return 'Interview Candidates';
      case 'unassigned':
        return 'Unassigned Jobs';
      case 'urgent':
        return 'Urgent TAT Jobs';
      case 'expired':
        return 'Expired TAT Jobs';
      case 'clients':
        return 'All Clients';
      case 'recruiterCandidates':
        if (selectedRecruiter && selectedRecruiterMetric) {
          const metricTitles: { [key: string]: string } = {
            'submissions': 'All Submissions',
            'offers': 'Offers',
            'joined': 'Joined',
            'rejected': 'Rejected',
            'pending': 'Pending'
          };
          return `${selectedRecruiter.fullName}'s ${metricTitles[selectedRecruiterMetric] || selectedRecruiterMetric} Candidates`;
        }
        return 'Recruiter Candidates';
      default:
        return 'Details';
    }
  };

  // Render filter controls based on modal type
  const renderFilterControls = () => {
    switch (modalType) {
      case 'candidates':
      case 'recruiterCandidates':
        return (
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Candidates
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, position..."
                  value={candidateFilters.search}
                  onChange={(e) => setCandidateFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={candidateFilters.status}
                onChange={(e) => setCandidateFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            {modalType === 'candidates' && (
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recruiter
                </label>
                <select
                  value={candidateFilters.recruiter}
                  onChange={(e) => setCandidateFilters(prev => ({ ...prev, recruiter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Recruiters</option>
                  {recruiters.map(recruiter => (
                    <option key={recruiter.id} value={recruiter.name}>{recruiter.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 'jobs':
        return (
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Jobs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by position, client, job code..."
                  value={jobFilters.search}
                  onChange={(e) => setJobFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client
              </label>
              <select
                value={jobFilters.client}
                onChange={(e) => setJobFilters(prev => ({ ...prev, client: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Clients</option>
                {Array.from(new Set(jobs.map(job => job.clientName))).map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Clients
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by company, contact person, industry..."
                  value={clientFilters.search}
                  onChange={(e) => setClientFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Industry
              </label>
              <select
                value={clientFilters.industry}
                onChange={(e) => setClientFilters(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Industries</option>
                {Array.from(new Set(clients.map(client => client.industry))).map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Notification Bell Component
  const NotificationBell = () => {
    return (
      <div className="relative">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={clsx(
                      'p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                      !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={clsx(
                            'w-2 h-2 rounded-full',
                            !notification.read && 'bg-blue-500',
                            notification.read && 'bg-gray-300'
                          )} />
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {notification.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {notification.recruiterName && `By ${notification.recruiterName} • `}
                            {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{notification.timestamp.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Detailed View Modal Component
  const DetailedViewModal = ({ isOpen, onClose, data, type }: DetailedViewModalProps) => {
    if (!data) return null;

    const renderCandidateDetails = () => {
      const candidate = data as Candidate;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{candidate.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                candidate.status === 'Joined' ? 'bg-green-100 text-green-800' :
                candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                candidate.status === 'Offer' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {candidate.status}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.position || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.experience || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current CTC</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.currentCtc || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected CTC</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.expectedCtc || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notice Period</label>
              <p className="text-lg text-gray-900 dark:text-white">{candidate.noticePeriod || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Recruiter</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {recruiters.find(r => r.id === candidate.recruiterId)?.name || 'N/A'}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Notes</label>
            <p className="text-gray-900 dark:text-white mt-1">{candidate.notes || 'No additional notes'}</p>
          </div>
        </div>
      );
    };

    const renderJobDetails = () => {
      const job = data as Job;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Code</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{job.jobCode || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</label>
              <p className="text-lg text-gray-900 dark:text-white">{job.clientName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
              <p className="text-lg text-gray-900 dark:text-white">{job.position || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
              <p className="text-lg text-gray-900 dark:text-white">{job.location || 'Remote'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Recruiter</label>
              <p className="text-lg text-gray-900 dark:text-white">{job.primaryRecruiter || 'Not assigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Secondary Recruiter</label>
              <p className="text-lg text-gray-900 dark:text-white">{job.secondaryRecruiter || 'Not assigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">TAT Date</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {job.tatTime ? new Date(job.tatTime).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                job.status === 'Active' ? 'bg-green-100 text-green-800' :
                job.status === 'Closed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {job.status || 'Active'}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Requirements</label>
            <p className="text-gray-900 dark:text-white mt-1">{job.requirements || 'No specific requirements'}</p>
          </div>
        </div>
      );
    };

    const renderClientDetails = () => {
      const client = data as Client;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</label>
              <p className="text-lg text-gray-900 dark:text-white">{client.contactPerson}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-lg text-gray-900 dark:text-white">{client.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="text-lg text-gray-900 dark:text-white">{client.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</label>
              <p className="text-lg text-gray-900 dark:text-white">{client.industry || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {client.website ? (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {client.website}
                  </a>
                ) : 'N/A'}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
              <p className="text-lg text-gray-900 dark:text-white">{client.address || 'N/A'}</p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white shrink-0">
              <DialogTitle className="text-xl font-bold">
                {type === 'candidate' ? 'Candidate Details' : 
                 type === 'job' ? 'Job Details' : 
                 type === 'client' ? 'Client Details' : 'Details'}
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {type === 'candidate' && renderCandidateDetails()}
              {type === 'job' && renderJobDetails()}
              {type === 'client' && renderClientDetails()}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    );
  };

  // Donut Chart Labels
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: LabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(1);

    if (percentage === '0.0') return null;
    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs md:text-sm font-semibold"
      >
        {`${name} ${percentage}%`}
      </text>
    );
  };

  // Custom Date Input Component
  const CustomDateInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
    ({ value, onClick, placeholder }, ref) => (
    <button
      className="flex items-center justify-between w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors"
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <span className={value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
        {value || placeholder}
      </span>
      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    </button>
  ));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-200">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive overview of recruiting operations and job requirements
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Date Filters */}
              <div className="relative z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Filter by Date:
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-40">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Start Date
                      </label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date: Date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Select start date"
                        customInput={<CustomDateInput placeholder="Start date" />}
                        popperClassName="z-[100]"
                        wrapperClassName="w-full"
                      />
                    </div>
                    
                    <div className="w-full sm:w-40">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        End Date
                      </label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date: Date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="Select end date"
                        customInput={<CustomDateInput placeholder="End date" />}
                        popperClassName="z-[100]"
                        wrapperClassName="w-full"
                      />
                    </div>

                    {(startDate || endDate) && (
                      <button
                        onClick={() => {
                          setStartDate(null);
                          setEndDate(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors whitespace-nowrap mt-6 sm:mt-0"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* First Row - Core Metrics */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Candidates"
              value={totalCandidates}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              onClick={() => handleCardClick('candidates')}
            />
            
            <StatCard 
              title="Active Recruiters" 
              value={recruiters.length} 
              icon={UserCheck}
              gradient="from-green-500 to-green-600"
              onClick={() => handleCardClick('recruiters')}
            />
            
            <StatCard 
              title="Interviews" 
              value={totalInterviews} 
              icon={Calendar}
              gradient="from-purple-500 to-purple-600"
              onClick={() => handleCardClick('interviews')}
            />
            
            <StatCard 
              title="Total Requirements" 
              value={jobStats.totalRequirements} 
              icon={ClipboardList}
              gradient="from-orange-500 to-orange-600"
              onClick={() => handleCardClick('jobs')}
            />
            
            <StatCard 
              title="Assigned Jobs" 
              value={jobStats.assignedJobs} 
              icon={Briefcase}
              gradient="from-teal-500 to-teal-600"
              onClick={() => handleCardClick('jobs', 'assigned')}
            />
          </div>

          {/* Second Row - Status Metrics */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={TrendingUp}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => handleCardClick('candidates', 'Joined')}
            />
            
            <StatCard
              title="Pending"
              value={statusCounts['Pending']}
              icon={Users}
              gradient="from-yellow-500 to-yellow-600"
              onClick={() => handleCardClick('candidates', 'Pending')}
            />
            
            <StatCard
              title="Submitted"
              value={statusCounts['Submitted']}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              onClick={() => handleCardClick('candidates', 'Submitted')}
            />
            
            <StatCard
              title="Offers"
              value={statusCounts['Offer']}
              icon={Users}
              gradient="from-indigo-500 to-indigo-600"
              onClick={() => handleCardClick('candidates', 'Offer')}
            />
            
            <StatCard
              title="Joined"
              value={statusCounts['Joined']}
              icon={Users}
              gradient="from-green-500 to-green-600"
              onClick={() => handleCardClick('candidates', 'Joined')}
            />
          </div>

          {/* Third Row - Additional Metrics */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Rejected"
              value={statusCounts['Rejected']}
              icon={Users}
              gradient="from-red-500 to-red-600"
              onClick={() => handleCardClick('candidates', 'Rejected')}
            />
            
            <StatCard 
              title="Unassigned Jobs" 
              value={jobStats.unassignedJobs} 
              icon={Briefcase}
              gradient="from-gray-500 to-gray-600"
              onClick={() => handleCardClick('unassigned')}
            />
            
            <StatCard 
              title="Urgent TAT" 
              value={jobStats.urgentJobs} 
              icon={AlertTriangle}
              gradient="from-red-500 to-orange-500"
              onClick={() => handleCardClick('urgent')}
            />
            
            <StatCard 
              title="Expired TAT" 
              value={jobStats.expiredJobs} 
              icon={AlertCircle}
              gradient="from-red-700 to-red-800"
              onClick={() => handleCardClick('expired')}
            />
          </div>

          {/* Fourth Row - Client Metrics */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Clients"
              value={clientStats.totalClients}
              icon={Building}
              gradient="from-purple-500 to-purple-600"
              onClick={() => handleCardClick('clients')}
            />
            
            <StatCard
              title="Clients with Website"
              value={clientStats.clientsWithWebsite}
              icon={Globe}
              gradient="from-indigo-500 to-indigo-600"
              onClick={() => handleCardClick('clients')}
            />
            
            <StatCard
              title="Clients with Location"
              value={clientStats.clientsWithLocation}
              icon={Building}
              gradient="from-violet-500 to-violet-600"
              onClick={() => handleCardClick('clients')}
            />
            
            <StatCard
              title="New This Month"
              value={clientStats.clientsThisMonth}
              icon={TrendingUp}
              gradient="from-pink-500 to-pink-600"
              onClick={() => handleCardClick('clients')}
            />
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recruiter Performance Bar Chart */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recruiter Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recruiterStats}>
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
                  <Bar dataKey="submissions" name="Submissions" fill="url(#colorSubmissions)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="joined" name="Joined" fill="url(#colorJoined)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="offers" name="Offers" fill="url(#colorOffers)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorJoined" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Candidate Status Donut Chart */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-white">
                Candidate Status Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    onMouseEnter={(data) => setHoveredSlice(data.name)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                        style={{
                          filter:
                            hoveredSlice === entry.name
                              ? 'brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
                              : 'brightness(1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      />
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recruiter Table */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recruiter Performance Details</h3>
              <button 
                onClick={() => handleCardClick('recruiters')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                View All Recruiters
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Recruiter</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Submissions</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Offers</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Rejected</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Pending</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiterStats.slice(0, 5).map((stat, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{stat.fullName}</td>
                      <td 
                        className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:dark:text-blue-400 cursor-pointer transition-colors"
                        onClick={() => handleRecruiterMetricClick(stat, 'submissions')}
                      >
                        {stat.submissions}
                      </td>
                      <td 
                        className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:dark:text-blue-400 cursor-pointer transition-colors"
                        onClick={() => handleRecruiterMetricClick(stat, 'offers')}
                      >
                        {stat.offers}
                      </td>
                      <td 
                        className="text-right py-3 px-4 text-green-600 font-semibold hover:text-green-700 hover:dark:text-green-400 cursor-pointer transition-colors"
                        onClick={() => handleRecruiterMetricClick(stat, 'joined')}
                      >
                        {stat.joined}
                      </td>
                      <td 
                        className="text-right py-3 px-4 text-red-600 font-semibold hover:text-red-700 hover:dark:text-red-400 cursor-pointer transition-colors"
                        onClick={() => handleRecruiterMetricClick(stat, 'rejected')}
                      >
                        {stat.rejected}
                      </td>
                      <td 
                        className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:dark:text-blue-400 cursor-pointer transition-colors"
                        onClick={() => handleRecruiterMetricClick(stat, 'pending')}
                      >
                        {stat.pending}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-semibold ${
                          parseFloat(stat.successRate) > 50 ? 'text-green-600' : 
                          parseFloat(stat.successRate) > 30 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stat.successRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Main Modal */}
          <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white shrink-0">
                  <DialogTitle className="text-xl font-bold">
                    {getModalTitle()} ({filteredData.length})
                  </DialogTitle>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Filter Controls */}
                {renderFilterControls()}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto p-1">
                  {(modalType === 'candidates' || modalType === 'interviews' || modalType === 'recruiterCandidates') && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Recruiter</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Experience</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((item, i: number) => {
                            const c = item as Candidate;
                            return (
                              <tr
                                key={i}
                                className={clsx(
                                  'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                )}
                              >
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium">{c.name}</td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{c.email || 'N/A'}</td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{c.phone || 'N/A'}</td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{c.position || 'N/A'}</td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {recruiters.find((u) => u.id === c.recruiterId)?.name || 'N/A'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    c.status === 'Joined' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    c.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                    c.status === 'Offer' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                    c.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    interviewStatuses.includes(c.status) ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{c.experience || 'N/A'}</td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleOpenDetailedView(c, 'candidate')}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {modalType === 'recruiters' && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Recruiter</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Submissions</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Offers</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Rejected</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Pending</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Success Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((recruiter, i: number) => {
                            const r = recruiter as RecruiterStat;
                            return (
                              <tr
                                key={i}
                                className={clsx(
                                  'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                )}
                              >
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                                  {r.fullName}
                                </td>
                                <td 
                                  className="text-right py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:dark:text-blue-400 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedRecruiter(r);
                                    setSelectedRecruiterMetric('submissions');
                                    setModalType('recruiterCandidates');
                                  }}
                                >
                                  {r.submissions}
                                </td>
                                <td 
                                  className="text-right py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:dark:text-blue-400 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedRecruiter(r);
                                    setSelectedRecruiterMetric('offers');
                                    setModalType('recruiterCandidates');
                                  }}
                                >
                                  {r.offers}
                                </td>
                                <td 
                                  className="text-right py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-green-600 font-semibold hover:text-green-700 hover:dark:text-green-400 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedRecruiter(r);
                                    setSelectedRecruiterMetric('joined');
                                    setModalType('recruiterCandidates');
                                  }}
                                >
                                  {r.joined}
                                </td>
                                <td 
                                  className="text-right py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-red-600 font-semibold hover:text-red-700 hover:dark:text-red-400 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedRecruiter(r);
                                    setSelectedRecruiterMetric('rejected');
                                    setModalType('recruiterCandidates');
                                  }}
                                >
                                  {r.rejected}
                                </td>
                                <td 
                                  className="text-right py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:dark:text-blue-400 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedRecruiter(r);
                                    setSelectedRecruiterMetric('pending');
                                    setModalType('recruiterCandidates');
                                  }}
                                >
                                  {r.pending}
                                </td>
                                <td className="text-right py-3 px-4 border-b border-gray-200 dark:border-gray-700">
                                  <span className={`font-semibold ${
                                    parseFloat(r.successRate) > 50 ? 'text-green-600' :
                                    parseFloat(r.successRate) > 30 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {r.successRate}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(modalType === 'jobs' || modalType === 'unassigned' || modalType === 'urgent' || modalType === 'expired') && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Job Code</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Client</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Location</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Primary Recruiter</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">TAT Status</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((job, i: number) => {
                            const j = job as Job;
                            return (
                              <tr
                                key={i}
                                className={clsx(
                                  'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                )}
                              >
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-mono text-sm">
                                  {j.jobCode || 'N/A'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                                  {j.clientName || 'N/A'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {j.position || 'N/A'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {j.location || 'Remote'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {j.primaryRecruiter ? (
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                                      {j.primaryRecruiter}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Not assigned</span>
                                  )}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {!j.tatTime ? (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                      N/A
                                    </span>
                                  ) : (
                                    (() => {
                                      const today = new Date();
                                      const tatDate = new Date(j.tatTime);
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
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleOpenDetailedView(j, 'job')}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Clients Table in Modal */}
                  {modalType === 'clients' && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Company Name</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Contact Person</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Industry</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Date Added</th>
                            <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((client, i: number) => {
                            const c = client as Client;
                            return (
                              <tr
                                key={i}
                                className={clsx(
                                  'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                )}
                              >
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                                  {c.companyName}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {c.contactPerson}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {c.email}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {c.phone || 'N/A'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {c.industry || 'N/A'}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  {new Date(c.dateAdded).toLocaleDateString()}
                                </td>
                                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleOpenDetailedView(c, 'client')}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {filteredData.length} items
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModalOpen(false)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          {/* Detailed View Modal */}
          <DetailedViewModal
            isOpen={detailedViewOpen}
            onClose={() => setDetailedViewOpen(false)}
            data={selectedItem}
            type={selectedItemType as 'candidate' | 'job' | 'client'}
          />
        </div>
      </main>
    </div>
  );
}