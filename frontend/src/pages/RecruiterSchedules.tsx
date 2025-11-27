import React, { useState, useMemo, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useData } from "@/contexts/DataContext";
import { useJobs } from "@/contexts/JobsContext";
import { useClients } from "@/contexts/ClientsContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, User, Clock, MapPin, Video, Phone, Building, Filter, Search,
  Calendar as CalendarIcon, List, Grid, Eye, Mail, Plus, Download, MoreVertical,
  Star, AlertCircle, CheckCircle2, XCircle, Users, Target, BarChart3, Zap, PhoneCall, Briefcase, UserCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Recruiter, Job, Candidate } from "@/types"; 
import { Client } from "@/contexts/ClientsContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Types ---

// Handle MongoDB _id vs Frontend id
interface CandidateWithId extends Candidate {
  _id?: string;
}

interface RecruiterWithId extends Recruiter {
  _id?: string;
}

interface Interview {
  id: string;
  interviewId: string;
  serialNumber: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  position: string;
  status: string;
  interviewDate: string;
  interviewType: string;
  location?: string;
  duration: number;
  recruiterId: string;
  recruiterName: string;
  clientId: string;
  clientName: string;
  notes?: string;
  priority?: "high" | "medium" | "low";
  candidateImage?: string;
  meetingLink?: string;
  feedback?: string;
  rating?: number;
}

interface NewInterviewForm {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  position: string;
  status: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
  location: string;
  duration: string;
  recruiterId: string;
  notes: string;
  priority: "high" | "medium" | "low";
  meetingLink: string;
}

// --- Helpers ---
function getInterviewTypeIcon(type: string) {
  switch (type) {
    case "Virtual": return <Video className="h-5 w-5 text-blue-500" />;
    case "In-person": return <MapPin className="h-5 w-5 text-green-500" />;
    case "Phone": return <Phone className="h-5 w-5 text-purple-500" />;
    default: return <Calendar className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusBadge(status: string) {
  const baseClasses = "px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5";
  if(status.includes("L1")) return <span className={`${baseClasses} bg-blue-100 text-blue-800`}><Zap className="h-3 w-3" />{status}</span>;
  if(status.includes("L2")) return <span className={`${baseClasses} bg-purple-100 text-purple-800`}><Target className="h-3 w-3" />{status}</span>;
  if(status.includes("Final")) return <span className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle2 className="h-3 w-3" />{status}</span>;
  if(status.includes("HR")) return <span className={`${baseClasses} bg-pink-100 text-pink-800`}><Users className="h-3 w-3" />{status}</span>;
  return <span className={`${baseClasses} bg-gray-100 text-gray-800`}><Calendar className="h-3 w-3" />{status}</span>;
}

function getPriorityBadge(priority?: "high" | "medium" | "low") {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium capitalize";
  const colors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200"
  };
  return <span className={`${baseClasses} ${colors[priority || 'medium']} border`}>{priority} Priority</span>;
}

function getTimeStatus(interviewDate: string) {
  const now = new Date();
  const interviewTime = new Date(interviewDate);
  const diffMs = interviewTime.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) return { status: "completed", text: "Completed", color: "text-gray-500", bg: "bg-gray-100" };
  else if (diffHours <= 24) return { status: "urgent", text: "Within 24h", color: "text-red-600", bg: "bg-red-100" };
  else if (diffDays <= 3) return { status: "upcoming", text: "Upcoming", color: "text-orange-600", bg: "bg-orange-100" };
  else return { status: "scheduled", text: "Scheduled", color: "text-green-600", bg: "bg-green-100" };
}

const StatCard: React.FC<any> = ({ title, value, icon, gradient, onClick, description }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="cursor-pointer" onClick={onClick}>
    <Card className={`${gradient} text-white border-0 shadow-lg overflow-hidden relative`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-white/70 text-xs mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">{icon}</div>
        </div>
      </CardHeader>
    </Card>
  </motion.div>
);

export default function RecruiterSchedules() {
  // State
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<CandidateWithId[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterWithId[]>([]); // Fetched from API
  const [loading, setLoading] = useState(true);
  
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "grid">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [showNewInterviewForm, setShowNewInterviewForm] = useState(false);

  // Form State
  const [newInterviewForm, setNewInterviewForm] = useState<NewInterviewForm>({
    candidateId: "",
    candidateName: "", candidateEmail: "", candidatePhone: "", position: "", status: "L1 Interview",
    interviewDate: new Date().toISOString().split('T')[0], interviewTime: "10:00", interviewType: "Virtual",
    location: "Remote", duration: "60", recruiterId: "", notes: "", priority: "medium", meetingLink: ""
  });

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // Fetch Data (Interviews, Candidates, Recruiters)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resInterviews, resCandidates, resRecruiters] = await Promise.all([
        fetch(`${API_URL}/interviews`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/candidates`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() })
      ]);

      // Process Interviews
      if(resInterviews.ok) {
        const data = await resInterviews.json();
        const mappedData = data.map((item: any, index: number) => ({
          id: item._id,
          interviewId: item.interviewId,
          serialNumber: index + 1,
          candidateName: item.candidateId?.name || "Unknown",
          candidateEmail: item.candidateId?.email || "",
          candidatePhone: item.candidateId?.phone || "",
          position: item.candidateId?.position || "N/A",
          status: item.round || "Scheduled",
          interviewDate: item.interviewDate,
          interviewType: item.type,
          location: item.location,
          duration: item.duration,
          recruiterId: item.recruiterId?._id,
          recruiterName: item.recruiterId?.name || "Unknown",
          clientName: item.jobId?.clientName || "N/A",
          notes: item.notes,
          priority: item.priority,
          meetingLink: item.meetingLink,
          feedback: item.feedback,
          rating: item.rating,
          candidateImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.candidateId?.name || 'U')}&background=random`
        }));
        setInterviews(mappedData);
      }

      // Process Candidates
      if(resCandidates.ok) {
        const candData = await resCandidates.json();
        const mappedCandidates = candData.map((c: any) => ({
          ...c,
          _id: c._id, 
          id: c._id
        }));
        setCandidates(mappedCandidates);
      }

      // Process Recruiters
      if(resRecruiters.ok) {
        const recData = await resRecruiters.json();
        const mappedRecruiters = recData.map((r: any) => ({
          ...r,
          _id: r._id,
          id: r._id
        }));
        setRecruiters(mappedRecruiters);
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const filteredInterviews = useMemo(() => {
    let filtered = interviews;

    if (selectedRecruiterId) filtered = filtered.filter(i => i.recruiterId === selectedRecruiterId);
    if (statusFilter !== "all") filtered = filtered.filter(i => i.status === statusFilter);
    if (priorityFilter !== "all") filtered = filtered.filter(i => i.priority === priorityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.candidateName.toLowerCase().includes(q) || i.interviewId.toLowerCase().includes(q)
      );
    }

    const now = new Date();
    if (activeStatFilter === 'upcoming') filtered = filtered.filter(i => new Date(i.interviewDate) >= now);
    if (activeStatFilter === 'highPriority') filtered = filtered.filter(i => i.priority === 'high');
    if (activeStatFilter === 'completed') filtered = filtered.filter(i => new Date(i.interviewDate) < now);
    if (activeStatFilter === 'today') filtered = filtered.filter(i => new Date(i.interviewDate).toDateString() === now.toDateString());
    
    return filtered;
  }, [interviews, selectedRecruiterId, statusFilter, priorityFilter, searchQuery, activeStatFilter]);

  // Stats
  const interviewStats = useMemo(() => {
    const now = new Date();
    return {
      total: interviews.length,
      upcoming: interviews.filter(i => new Date(i.interviewDate) >= now).length,
      completed: interviews.filter(i => new Date(i.interviewDate) < now).length,
      highPriority: interviews.filter(i => i.priority === "high").length,
      today: interviews.filter(i => new Date(i.interviewDate).toDateString() === now.toDateString()).length,
      virtual: interviews.filter(i => i.interviewType === "Virtual").length
    };
  }, [interviews]);

  // Handlers
  const handleNewInterviewChange = (e: any) => {
    const { name, value } = e.target;
    setNewInterviewForm(prev => ({ ...prev, [name]: value }));
  };

  // Candidate Select Handler
  const handleCandidateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    // Handle both _id (MongoDB) and id (Frontend type)
    const candidate = candidates.find(c => c._id === selectedId || c.id === selectedId);
    
    if (candidate) {
      setNewInterviewForm(prev => ({
        ...prev,
        candidateId: selectedId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        candidatePhone: candidate.contact || candidate.phone || "",
        position: candidate.position,
        // Safely access recruiterId
        recruiterId: typeof candidate.recruiterId === 'object' ? (candidate.recruiterId as any)._id : candidate.recruiterId || prev.recruiterId
      }));
    } else {
        setNewInterviewForm(prev => ({
            ...prev,
            candidateId: "",
            candidateName: "",
            candidateEmail: "",
            candidatePhone: "",
            position: ""
        }));
    }
  };

  const generateMeetingLink = () => {
    const link = `https://meet.google.com/${Math.random().toString(36).substring(7)}`;
    setNewInterviewForm(prev => ({ ...prev, meetingLink: link }));
    toast.success("Meeting link generated");
  };

  const handleSubmitNewInterview = async () => {
    if(!newInterviewForm.candidateName || !newInterviewForm.recruiterId) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(newInterviewForm)
      });

      if(response.ok) {
        toast.success("Interview scheduled successfully");
        setShowNewInterviewForm(false);
        fetchData();
        setNewInterviewForm({
          candidateId: "", candidateName: "", candidateEmail: "", candidatePhone: "", position: "", status: "L1 Interview",
          interviewDate: new Date().toISOString().split('T')[0], interviewTime: "10:00", interviewType: "Virtual",
          location: "Remote", duration: "60", recruiterId: "", notes: "", priority: "medium", meetingLink: ""
        });
      } else {
        throw new Error('Failed to schedule');
      }
    } catch (error) {
      toast.error("Failed to schedule interview");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Schedules</h1>
              <p className="text-gray-500">Manage your hiring timeline</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm">
                <Download className="h-4 w-4" /> Export
              </button>
              <button 
                onClick={() => setShowNewInterviewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
              >
                <Plus className="h-4 w-4" /> New Interview
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard title="Total" value={interviewStats.total} icon={<Calendar/>} gradient="bg-purple-600" onClick={() => setActiveStatFilter('total')}/>
            <StatCard title="Upcoming" value={interviewStats.upcoming} icon={<Clock/>} gradient="bg-green-600" onClick={() => setActiveStatFilter('upcoming')}/>
            <StatCard title="High Priority" value={interviewStats.highPriority} icon={<AlertCircle/>} gradient="bg-red-600" onClick={() => setActiveStatFilter('highPriority')}/>
            <StatCard title="Completed" value={interviewStats.completed} icon={<CheckCircle2/>} gradient="bg-blue-600" onClick={() => setActiveStatFilter('completed')}/>
            <StatCard title="Today" value={interviewStats.today} icon={<CalendarIcon/>} gradient="bg-orange-600" onClick={() => setActiveStatFilter('today')}/>
            <StatCard title="Virtual" value={interviewStats.virtual} icon={<Video/>} gradient="bg-indigo-600" onClick={() => setActiveStatFilter('virtual')}/>
          </div>

          {/* Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                <Input 
                  placeholder="Search interviews..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3 items-center w-full md:w-auto">
                <select 
                  className="p-2 border rounded bg-white dark:bg-gray-800"
                  value={selectedRecruiterId}
                  onChange={(e) => setSelectedRecruiterId(e.target.value)}
                >
                  <option value="">All Recruiters</option>
                  {recruiters.map(r => <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>)}
                </select>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1">
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}><Grid className="h-4 w-4"/></button>
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><List className="h-4 w-4"/></button>
                </div>
              </div>
            </div>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="text-center py-10">Loading schedules...</div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredInterviews.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No interviews found matching your criteria.</div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredInterviews.map((interview, index) => (
                    <InterviewGridCard 
                      key={interview.id} 
                      interview={interview} 
                      onView={() => setSelectedInterview(interview)}
                    />
                  ))}
                </div>
              ) : (
                <InterviewListView 
                  interviews={filteredInterviews}
                  onView={setSelectedInterview}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Updated Modal with Candidate Dropdown */}
      {showNewInterviewForm && (
        <NewInterviewModal 
          form={newInterviewForm} 
          onChange={handleNewInterviewChange}
          onCandidateSelect={handleCandidateSelect}
          onGenerateMeetingLink={generateMeetingLink}
          onSubmit={handleSubmitNewInterview}
          onClose={() => setShowNewInterviewForm(false)}
          recruiters={recruiters}
          candidates={candidates}
        />
      )}

      <InterviewDetailModal 
        interview={selectedInterview} 
        onClose={() => setSelectedInterview(null)} 
      />
    </div>
  );
}

// --- Sub Components ---

function InterviewGridCard({ interview, onView }: { interview: Interview, onView: () => void }) {
  const timeStatus = getTimeStatus(interview.interviewDate);
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: timeStatus.status === 'urgent' ? 'red' : 'blue' }}>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{interview.candidateName}</h3>
            <p className="text-sm text-gray-500">{interview.position}</p>
          </div>
          {getStatusBadge(interview.status)}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400"/> {new Date(interview.interviewDate).toLocaleString()}</div>
          <div className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-gray-400"/> {interview.recruiterName}</div>
          <div className="flex items-center gap-2"><Building className="h-4 w-4 text-gray-400"/> {interview.clientName}</div>
        </div>

        <div className="pt-4 border-t flex justify-between items-center">
          {getPriorityBadge(interview.priority)}
          <Button size="sm" onClick={onView}>View Details</Button>
        </div>
      </div>
    </Card>
  );
}

function InterviewListView({ interviews, onView }: { interviews: Interview[], onView: (i: Interview) => void }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-4">Candidate</th>
              <th className="p-4">Position</th>
              <th className="p-4">Date</th>
              <th className="p-4">Recruiter</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map(i => (
              <tr key={i.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{i.candidateName}</td>
                <td className="p-4">{i.position}</td>
                <td className="p-4">{new Date(i.interviewDate).toLocaleDateString()}</td>
                <td className="p-4">{i.recruiterName}</td>
                <td className="p-4">{getStatusBadge(i.status)}</td>
                <td className="p-4"><Button size="sm" variant="ghost" onClick={() => onView(i)}><Eye className="h-4 w-4"/></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface NewInterviewModalProps {
  form: NewInterviewForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCandidateSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onGenerateMeetingLink: () => void;
  onSubmit: () => void;
  onClose: () => void;
  recruiters: RecruiterWithId[];
  candidates: CandidateWithId[];
}

function NewInterviewModal({ form, onChange, onCandidateSelect, onGenerateMeetingLink, onSubmit, onClose, recruiters, candidates }: NewInterviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
          <h2 className="text-xl font-bold">Schedule Interview</h2>
          <button onClick={onClose}><X className="h-6 w-6"/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Candidate Selection */}
          <div>
            <label className="text-sm font-medium block mb-1">Select Candidate *</label>
            <select 
              className="w-full p-2 border rounded bg-transparent"
              onChange={onCandidateSelect}
              value={form.candidateId}
            >
              <option value="">-- Choose a Candidate --</option>
              {candidates && candidates.map((c: any) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Read-only / Auto-filled Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Candidate Name</label>
              <Input name="candidateName" value={form.candidateName} onChange={onChange} disabled={!!form.candidateId}/>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input name="candidateEmail" value={form.candidateEmail} onChange={onChange} disabled={!!form.candidateId}/>
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input name="candidatePhone" value={form.candidatePhone} onChange={onChange} disabled={!!form.candidateId}/>
            </div>
            <div>
              <label className="text-sm font-medium">Position</label>
              <Input name="position" value={form.position} onChange={onChange} disabled={!!form.candidateId}/>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Date</label><Input type="date" name="interviewDate" value={form.interviewDate} onChange={onChange}/></div>
            <div><label className="text-sm font-medium">Time</label><Input type="time" name="interviewTime" value={form.interviewTime} onChange={onChange}/></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Recruiter *</label>
              <select name="recruiterId" value={form.recruiterId} onChange={onChange} className="w-full p-2 border rounded bg-transparent">
                <option value="">Select Recruiter</option>
                {recruiters.map((r: any) => <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Round</label>
              <select name="status" value={form.status} onChange={onChange} className="w-full p-2 border rounded bg-transparent">
                <option value="L1 Interview">L1 Interview</option>
                <option value="L2 Interview">L2 Interview</option>
                <option value="Final Interview">Final Interview</option>
                <option value="HR Interview">HR Interview</option>
              </select>
            </div>
          </div>

          <div>
             <label className="text-sm font-medium">Meeting Link</label>
             <div className="flex gap-2">
               <Input name="meetingLink" value={form.meetingLink} onChange={onChange} placeholder="https://meet.google.com..."/>
               <Button variant="outline" onClick={onGenerateMeetingLink}>Generate</Button>
             </div>
          </div>
          
          <div><label className="text-sm font-medium">Notes</label><Textarea name="notes" value={form.notes} onChange={onChange}/></div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">Schedule</Button>
        </div>
      </motion.div>
    </div>
  );
}

function InterviewDetailModal({ interview, onClose }: { interview: Interview | null, onClose: () => void }) {
  if (!interview) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl flex justify-between">
           <div>
             <h2 className="text-2xl font-bold">{interview.candidateName}</h2>
             <p className="opacity-90">{interview.position}</p>
           </div>
           <button onClick={onClose}><X className="h-6 w-6"/></button>
        </div>
        <div className="p-6 space-y-4">
           <div className="flex items-center gap-2"><Clock className="text-gray-400"/> {new Date(interview.interviewDate).toLocaleString()}</div>
           <div className="flex items-center gap-2"><UserCircle className="text-gray-400"/> Recruiter: {interview.recruiterName}</div>
           <div className="flex items-center gap-2"><Video className="text-gray-400"/> {interview.interviewType}</div>
           {interview.meetingLink && (
             <a href={interview.meetingLink} target="_blank" className="block p-3 bg-blue-50 text-blue-700 rounded text-center font-medium hover:bg-blue-100">Join Meeting</a>
           )}
           <div className="bg-gray-50 p-3 rounded">
             <h4 className="font-bold text-sm mb-1">Notes</h4>
             <p className="text-sm text-gray-600">{interview.notes || "No notes provided."}</p>
           </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
}