import React, { useState, useMemo, forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StatCard } from '@/components/StatCard';
import { Users, UserCheck, Calendar, TrendingUp, ClipboardList, Briefcase, X, ChevronDown, Building, Bell, Globe, Eye, PencilIcon, NoSymbolIcon, CheckCircleIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Candidate, Recruiter, Job } from '@/types'; 
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
interface Client {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  industry?: string;
  website?: string;
  address?: string;
  dateAdded: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Recruiter Stats Interface
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // 1. Fetch All Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resCand, resRec, resJob, resClient] = await Promise.all([
          fetch(`${API_URL}/candidates`, { headers: getAuthHeader() }),
          fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() }),
          fetch(`${API_URL}/jobs`, { headers: getAuthHeader() }),
          fetch(`${API_URL}/clients`, { headers: getAuthHeader() })
        ]);

        if (resCand.ok) setCandidates(await resCand.json());
        if (resRec.ok) setRecruiters(await resRec.json());
        if (resJob.ok) setJobs(await resJob.json());
        if (resClient.ok) setClients(await resClient.json());

        // Mock Notifications
        const mockNotifications: Notification[] = [
          { id: '1', title: 'System Ready', message: 'Dashboard loaded successfully', timestamp: new Date(), read: false, type: 'success' },
          { id: '2', title: 'New Candidates', message: 'Check recent submissions', timestamp: new Date(Date.now() - 10000000), read: true, type: 'info' }
        ];
        setNotifications(mockNotifications);

      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Filter Logic
  const dateFilteredCandidates = useMemo(() => {
    if (!startDate && !endDate) return candidates;
    return candidates.filter(c => {
      const d = new Date(c.createdAt);
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });
  }, [candidates, startDate, endDate]);

  const dateFilteredJobs = useMemo(() => {
    if (!startDate && !endDate) return jobs;
    return jobs.filter(j => {
      const d = new Date(j.date || j.createdAt);
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });
  }, [jobs, startDate, endDate]);

  // 3. Statistics Calculation
  const stats = useMemo(() => {
    const totalCandidates = dateFilteredCandidates.length;
    const activeRecruiters = recruiters.filter(r => r.active !== false).length;
    const totalJobs = dateFilteredJobs.length;
    const totalClients = clients.length;

    const submitted = dateFilteredCandidates.filter(c => c.status === 'Submitted').length;
    const interview = dateFilteredCandidates.filter(c => c.status.includes('Interview')).length;
    const offer = dateFilteredCandidates.filter(c => c.status === 'Offer').length;
    const joined = dateFilteredCandidates.filter(c => c.status === 'Joined').length;

    const successRate = totalCandidates > 0 
      ? ((joined / totalCandidates) * 100).toFixed(1) 
      : '0';

    // Client Specific Stats
    const clientsWithWebsite = clients.filter(c => c.website).length;
    const clientsWithLocation = clients.filter(c => c.address).length;
    const clientsThisMonth = clients.filter(c => {
      const d = new Date(c.dateAdded);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalCandidates, activeRecruiters, totalJobs, totalClients,
      submitted, interview, offer, joined, successRate,
      clientsWithWebsite, clientsWithLocation, clientsThisMonth
    };
  }, [dateFilteredCandidates, recruiters, dateFilteredJobs, clients]);

  // 4. Recruiter Performance Stats Table Data
  const recruiterStats: RecruiterStat[] = useMemo(() => {
    return recruiters.map((rec) => {
      // Filter candidates for this recruiter AND within date range
      const recCandidates = dateFilteredCandidates.filter((c) => 
        c.recruiterId === rec.id || (typeof c.recruiterId === 'object' && (c.recruiterId as any)._id === rec.id)
      );

      const joinedCount = recCandidates.filter((c) => c.status === 'Joined').length;
      const totalCount = recCandidates.length;

      return {
        id: rec.id,
        name: rec.name.split(' ')[0],
        fullName: rec.name,
        submissions: totalCount,
        offers: recCandidates.filter((c) => c.status === 'Offer').length,
        joined: joinedCount,
        rejected: recCandidates.filter((c) => c.status === 'Rejected').length,
        pending: recCandidates.filter((c) => c.status === 'Pending' || c.status === 'Submitted').length,
        successRate: totalCount > 0
          ? ((joinedCount / totalCount) * 100).toFixed(1)
          : '0'
      };
    }).sort((a, b) => b.submissions - a.submissions); // Sort by top performers
  }, [dateFilteredCandidates, recruiters]);

  // 5. Chart Data
  const pieData = [
    { name: 'Submitted', value: stats.submitted, color: '#3B82F6' },
    { name: 'Interview', value: stats.interview, color: '#8B5CF6' },
    { name: 'Offer', value: stats.offer, color: '#10B981' },
    { name: 'Joined', value: stats.joined, color: '#059669' },
  ].filter(d => d.value > 0);

  const barData = recruiterStats.slice(0, 10).map(r => ({
    name: r.name,
    candidates: r.submissions
  }));

  const CustomDateInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
    ({ value, onClick, placeholder }, ref) => (
    <button
      className="flex items-center justify-between w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <span className={value ? "text-gray-900 dark:text-white" : "text-gray-500"}>{value || placeholder}</span>
      <ChevronDown className="w-4 h-4 text-gray-500" />
    </button>
  ));

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-200">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of recruitment performance</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)}
                          className={clsx("p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700", !n.read && "bg-blue-50 dark:bg-blue-900/10")}
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-gray-500">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 flex gap-2 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-28">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start"
                    customInput={<CustomDateInput placeholder="Start" />}
                  />
                </div>
                <div className="w-28">
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="End"
                    customInput={<CustomDateInput placeholder="End" />}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- ROW 1: Core Metrics --- */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Candidates"
              value={stats.totalCandidates}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              onClick={() => navigate('/admin/candidates')}
            />
            <StatCard 
              title="Active Recruiters" 
              value={stats.activeRecruiters} 
              icon={UserCheck}
              gradient="from-green-500 to-green-600"
              onClick={() => navigate('/admin/recruiters')}
            />
            <StatCard 
              title="Total Jobs" 
              value={stats.totalJobs} 
              icon={Briefcase}
              gradient="from-indigo-500 to-indigo-600"
              onClick={() => navigate('/admin/requirements')}
            />
            <StatCard
              title="Active Clients"
              value={stats.totalClients}
              icon={Building}
              gradient="from-purple-500 to-purple-600"
              onClick={() => navigate('/admin/clients')}
            />
          </div>

          {/* --- ROW 2: Pipeline Breakdown --- */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Submitted"
              value={stats.submitted}
              icon={ClipboardList}
              gradient="from-blue-400 to-blue-500"
              onClick={() => navigate('/admin/candidates')}
            />
            <StatCard
              title="Interviews"
              value={stats.interview}
              icon={Calendar}
              gradient="from-indigo-400 to-indigo-500"
              onClick={() => navigate('/admin/candidates')}
            />
            <StatCard
              title="Offers"
              value={stats.offer}
              icon={Briefcase}
              gradient="from-green-400 to-green-500"
              onClick={() => navigate('/admin/candidates')}
            />
            <StatCard
              title="Joined"
              value={stats.joined}
              icon={UserCheck}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => navigate('/admin/candidates')}
            />
          </div>

          {/* --- ROW 3: Performance & Clients --- */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              icon={TrendingUp}
              gradient="from-teal-500 to-teal-600"
            />
            <StatCard
              title="New Clients (Mo)"
              value={stats.clientsThisMonth}
              icon={TrendingUp}
              gradient="from-pink-500 to-pink-600"
              onClick={() => navigate('/admin/clients')}
            />
            <StatCard
              title="Clients w/ Website"
              value={stats.clientsWithWebsite}
              icon={Globe}
              gradient="from-cyan-500 to-cyan-600"
              onClick={() => navigate('/admin/clients')}
            />
            <StatCard
              title="Clients w/ Location"
              value={stats.clientsWithLocation}
              icon={Building}
              gradient="from-violet-500 to-violet-600"
              onClick={() => navigate('/admin/clients')}
            />
          </div>

          {/* --- ROW 4: Charts --- */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recruiter Performance Chart */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Top Recruiters (Candidates Added)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="candidates" name="Candidates" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Candidate Status Chart */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-white">
                Pipeline Breakdown
              </h3>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* --- ROW 5: Recruiter Performance Table --- */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recruiter Performance Details</h3>
              <button 
                onClick={() => navigate('/admin/recruiters')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                View All Recruiters
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="p-3">Recruiter</th>
                    <th className="p-3 text-center">Submissions</th>
                    <th className="p-3 text-center">Offers</th>
                    <th className="p-3 text-center">Joined</th>
                    <th className="p-3 text-center">Rejected</th>
                    <th className="p-3 text-center">Pending</th>
                    <th className="p-3 text-right">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recruiterStats.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{r.fullName}</td>
                      <td className="p-3 text-center text-blue-600 font-medium">{r.submissions}</td>
                      <td className="p-3 text-center text-purple-600 font-medium">{r.offers}</td>
                      <td className="p-3 text-center text-green-600 font-bold">{r.joined}</td>
                      <td className="p-3 text-center text-red-600 font-medium">{r.rejected}</td>
                      <td className="p-3 text-center text-gray-500 font-medium">{r.pending}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={
                          parseFloat(r.successRate) > 50 ? 'text-green-600' : 
                          parseFloat(r.successRate) > 20 ? 'text-yellow-600' : 'text-red-600'
                        }>
                          {r.successRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recruiterStats.length === 0 && (
                     <tr><td colSpan={7} className="p-4 text-center text-gray-500">No recruiter data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}