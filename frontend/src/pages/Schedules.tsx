import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Calendar, Clock, User, Trash2, Loader2, Plus, 
  Briefcase, CheckCircle2, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types matching Backend Data
interface Candidate {
  _id: string;
  name: string;
  email: string;
  position: string;
  recruiterId: string;
}

interface Interview {
  _id: string;
  interviewId: string;
  candidateId: {
    _id: string;
    name: string;
    email: string;
    position?: string;
  } | null; 
  recruiterId: {
    _id: string;
    name: string;
  } | null;
  interviewDate: string; // ISO String
  round: string;
  type: string;
}

export default function Schedules() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [schedules, setSchedules] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [interviewDate, setInterviewDate] = useState<Date | null>(new Date());
  const [roundType, setRoundType] = useState("L1 Interview");
  const [interviewMode, setInterviewMode] = useState("Virtual");

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCandidates, resInterviews] = await Promise.all([
        fetch(`${API_URL}/candidates`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/interviews`, { headers: getAuthHeader() })
      ]);

      if (resCandidates.ok) {
        const data = await resCandidates.json();
        setCandidates(data);
      }

      if (resInterviews.ok) {
        const data = await resInterviews.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handle Schedule Creation
  const handleSchedule = async () => {
    if (!selectedCandidateId || !interviewDate) {
      toast({ title: "Validation Error", description: "Select candidate and time.", variant: "destructive" });
      return;
    }

    const candidateObj = candidates.find((c) => c._id === selectedCandidateId);
    if (!candidateObj) return;

    try {
      const dateStr = interviewDate.toISOString().split('T')[0];
      const timeStr = interviewDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      const payload = {
        candidateId: selectedCandidateId,
        candidateName: candidateObj.name,
        candidateEmail: candidateObj.email,
        recruiterId: user?.id || user?._id,
        interviewDate: dateStr,
        interviewTime: timeStr,
        type: interviewMode,
        round: roundType,
        priority: "medium",
        duration: 60
      };

      const response = await fetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to schedule");

      toast({ title: "Success", description: "Interview Scheduled!" });
      fetchData();
      setSelectedCandidateId("");
      setInterviewDate(new Date());
    } catch (error) {
      toast({ title: "Error", description: "Could not schedule interview.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await fetch(`${API_URL}/interviews/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      setSchedules(prev => prev.filter(s => s._id !== id));
      toast({ title: "Deleted", description: "Schedule removed." });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // Notification Logic
  useEffect(() => {
    if (Notification.permission !== "granted") Notification.requestPermission();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      schedules.forEach((s) => {
        const interviewTime = new Date(s.interviewDate).getTime();
        const diffMinutes = (interviewTime - now) / (1000 * 60);
        if (diffMinutes > 29 && diffMinutes < 31) {
          new Notification("Interview Reminder", {
            body: `Interview with ${s.candidateId?.name || 'Candidate'} in 30 mins.`,
            icon: "/vite.svg"
          });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [schedules]);

  const visibleSchedules = [...schedules].sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Interview Calendar</h1>
              <p className="text-slate-500 mt-1">Manage and track your interview schedules efficiently.</p>
            </div>
            <div className="flex gap-2">
               <Badge variant="outline" className="px-3 py-1 text-sm bg-white dark:bg-slate-900">
                  Total Scheduled: {schedules.length}
               </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left Column: Scheduling Form */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-6">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl p-6">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="w-5 h-5" /> Schedule New
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  
                  {/* Candidate Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Candidate</label>
                    <div className="relative">
                       <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                       <select 
                         value={selectedCandidateId}
                         onChange={(e) => setSelectedCandidateId(e.target.value)}
                         className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                       >
                         <option value="">Select Candidate...</option>
                         {candidates.map(c => <option key={c._id} value={c._id}>{c.name} - {c.position}</option>)}
                       </select>
                    </div>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date & Time</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                       <DatePicker
                          selected={interviewDate}
                          onChange={(date) => setInterviewDate(date)}
                          showTimeSelect
                          timeIntervals={30}
                          dateFormat="MMM d, yyyy h:mm aa"
                          minDate={new Date()}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full block"
                          wrapperClassName="w-full"
                       />
                    </div>
                  </div>

                  {/* Round & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Round</label>
                       <select 
                          value={roundType} onChange={(e) => setRoundType(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                       >
                         <option>L1 Interview</option>
                         <option>Technical</option>
                         <option>Managerial</option>
                         <option>HR Round</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode</label>
                       <select 
                          value={interviewMode} onChange={(e) => setInterviewMode(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                       >
                         <option>Virtual</option>
                         <option>In-Person</option>
                         <option>Phone</option>
                       </select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSchedule} 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl shadow-md transition-all mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Schedule"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: List of Interviews */}
            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Interviews
                  </h2>

                  {loading ? (
                    <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>
                  ) : visibleSchedules.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                       <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                       <h3 className="text-slate-900 dark:text-white font-medium">No interviews scheduled</h3>
                       <p className="text-slate-500 text-sm mt-1">Your calendar is clear for now.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <AnimatePresence>
                         {visibleSchedules.map((schedule, idx) => (
                           <motion.div 
                             key={schedule._id}
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             transition={{ delay: idx * 0.05 }}
                             className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300"
                           >
                              <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full" />
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-3">
                                 {/* Time Badge */}
                                 <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg p-3 w-20 text-center shrink-0">
                                    <span className="text-xs font-semibold text-slate-400 uppercase">{new Date(schedule.interviewDate).toLocaleString('en-US', { month: 'short' })}</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">{new Date(schedule.interviewDate).getDate()}</span>
                                    <span className="text-xs font-medium text-indigo-600">{new Date(schedule.interviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 </div>

                                 {/* Details */}
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                       <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{schedule.candidateId?.name || "Unknown"}</h3>
                                       <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800">
                                          {schedule.type}
                                       </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                       <div className="flex items-center gap-1.5">
                                          <Briefcase className="w-3.5 h-3.5" />
                                          <span className="truncate">{schedule.candidateId?.position || "Role N/A"}</span>
                                       </div>
                                       <div className="flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5" />
                                          <span className="truncate">Recruiter: {schedule.recruiterId?.name || "N/A"}</span>
                                       </div>
                                       <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                                          <AlertCircle className="w-3.5 h-3.5" />
                                          <span>{schedule.round}</span>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Actions */}
                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full">
                                       <Bell className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                       size="icon" 
                                       variant="ghost" 
                                       onClick={() => handleDelete(schedule._id)}
                                       className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </div>
                           </motion.div>
                         ))}
                       </AnimatePresence>
                    </div>
                  )}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}