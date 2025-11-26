import React, { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, MapPin, Plus, Trash2, User, Filter, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Types ---

interface Recruiter {
  _id: string;
  name: string;
  email: string;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  position: string;
}

interface Schedule {
  _id: string;
  interviewId: string;
  // Populated fields from backend
  candidateId: Candidate;
  recruiterId: Recruiter; 
  interviewDate: string;
  type: string;
  location: string;
  meetingLink?: string;
  round: string;
  priority: string;
  notes?: string;
}

export default function Schedules() {
  const { toast } = useToast();
  
  // Data State
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [recruiterFilter, setRecruiterFilter] = useState('all');

  // Form State
  const [form, setForm] = useState({
    candidateId: "",
    interviewDate: new Date().toISOString().split('T')[0],
    interviewTime: "10:00",
    type: "Virtual",
    location: "Google Meet",
    duration: "60",
    round: "L1 Interview",
    priority: "medium",
    meetingLink: "",
    notes: ""
  });

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // --- Fetch All Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Schedules, Candidates, AND Recruiters in parallel
      const [resSched, resCand, resRec] = await Promise.all([
        fetch(`${API_URL}/interviews`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/candidates`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() })
      ]);

      if (resSched.ok) setSchedules(await resSched.json());
      if (resCand.ok) setCandidates(await resCand.json());
      if (resRec.ok) setRecruiters(await resRec.json());

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateLink = () => {
    const link = `https://meet.google.com/${Math.random().toString(36).substring(7)}`;
    handleFormChange('meetingLink', link);
  };

  const handleCreateSchedule = async () => {
    if (!form.candidateId || !form.interviewDate || !form.interviewTime) {
      toast({ title: "Validation Error", description: "Candidate, Date and Time are required", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Failed to schedule');

      toast({ title: "Success", description: "Interview scheduled successfully" });
      setIsModalOpen(false);
      fetchData();
      
      // Reset Form (keep some defaults)
      setForm(prev => ({ 
        ...prev, 
        candidateId: "", 
        notes: "", 
        meetingLink: "",
        interviewDate: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      toast({ title: "Error", description: "Could not create schedule", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this interview?")) return;
    try {
      await fetch(`${API_URL}/interviews/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      toast({ title: "Cancelled", description: "Interview removed" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // --- Filtering Logic ---
  const filteredSchedules = useMemo(() => {
    const now = new Date();
    return schedules.filter(s => {
      const date = new Date(s.interviewDate);
      
      // Time Filter
      let matchesTime = true;
      if (timeFilter === 'upcoming') matchesTime = date >= now;
      if (timeFilter === 'past') matchesTime = date < now;
      if (timeFilter === 'today') matchesTime = date.toDateString() === now.toDateString();

      // Recruiter Filter
      let matchesRecruiter = true;
      if (recruiterFilter !== 'all') {
        // Check if recruiterId object exists and matches ID
        matchesRecruiter = s.recruiterId?._id === recruiterFilter;
      }

      return matchesTime && matchesRecruiter;
    }).sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());
  }, [schedules, timeFilter, recruiterFilter]);

  // --- UI Helpers ---
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Virtual': return <Video className="h-4 w-4 text-blue-500"/>;
      case 'Phone': return <Phone className="h-4 w-4 text-purple-500"/>;
      default: return <MapPin className="h-4 w-4 text-green-500"/>;
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Schedules</h1>
              <p className="text-gray-500">Manage and track upcoming interviews</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4"/> Schedule Interview
            </Button>
          </div>

          {/* Controls Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* Time Filters */}
              <div className="flex gap-2">
                {['all', 'upcoming', 'today', 'past'].map(f => (
                  <Button
                    key={f}
                    variant={timeFilter === f ? 'default' : 'outline'}
                    onClick={() => setTimeFilter(f)}
                    className="capitalize h-9"
                  >
                    {f}
                  </Button>
                ))}
              </div>

              {/* Recruiter Filter Dropdown (Dynamic) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Recruiter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recruiters</SelectItem>
                    {recruiters.map((rec) => (
                      // Use _id from backend for value
                      <SelectItem key={rec._id} value={rec._id}>
                        {rec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Schedule List */}
          {loading ? <div className="text-center p-10">Loading schedules...</div> : (
            <div className="space-y-4">
              {filteredSchedules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No interviews found for this filter.</div>
              ) : (
                filteredSchedules.map((s) => (
                  <motion.div 
                    key={s._id}
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Left: Date Box */}
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center min-w-[80px]">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                          {new Date(s.interviewDate).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Date(s.interviewDate).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(s.interviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>

                      {/* Middle: Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {s.candidateId?.name || "Unknown Candidate"}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${getPriorityColor(s.priority)}`}>
                            {s.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {s.candidateId?.position || 'N/A'} • {s.round}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">{getTypeIcon(s.type)} {s.type}</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3"/> Recruiter: {s.recruiterId?.name || 'N/A'}
                          </span>
                          {s.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {s.location}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      {s.meetingLink && (
                        <a href={s.meetingLink} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Video className="h-3 w-3"/> Join
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Schedule Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={form.interviewDate} onChange={e => handleFormChange('interviewDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input type="time" value={form.interviewTime} onChange={e => handleFormChange('interviewTime', e.target.value)} />
              </div>
            </div>

            {/* Candidate Selection (Dynamic) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Candidate</label>
              <Select value={form.candidateId} onValueChange={(val) => handleFormChange('candidateId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Candidate"/>
                </SelectTrigger>
                <SelectContent>
                  {candidates.map(c => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} ({c.position || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {candidates.length === 0 && <p className="text-xs text-red-500">No candidates found. Add candidates first.</p>}
            </div>

            {/* Round & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Round</label>
                <Select value={form.round} onValueChange={(val) => handleFormChange('round', val)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {['L1 Interview', 'L2 Interview', 'Technical', 'HR Round', 'Final'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={(val) => handleFormChange('priority', val)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Link</label>
              <div className="flex gap-2">
                <Input value={form.meetingLink} onChange={e => handleFormChange('meetingLink', e.target.value)} placeholder="https://..." />
                <Button variant="outline" onClick={generateLink}>Generate</Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={form.notes} onChange={e => handleFormChange('notes', e.target.value)} placeholder="Agenda, topics..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSchedule}>Confirm Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}