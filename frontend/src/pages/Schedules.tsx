import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import { Bell, CalendarDays, Clock, UserRound, UsersRound, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";

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
  } | null; // Populated field
  recruiterId: {
    _id: string;
    name: string;
  } | null; // Populated field
  interviewDate: string; // ISO String
  round: string;
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

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // ✅ Fetch Data from Backend
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Candidates and Interviews in parallel
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
      toast({ 
        title: "Error", 
        description: "Failed to load schedules or candidates.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Handle Schedule Creation (POST to Backend)
  const handleSchedule = async () => {
    if (!selectedCandidateId || !interviewDate) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a candidate and interview time.", 
        variant: "destructive" 
      });
      return;
    }

    const candidateObj = candidates.find((c) => c._id === selectedCandidateId);
    if (!candidateObj) return;

    try {
      // Construct payload matching Interview Model
      // Note: We split date and time for the generic createInterview controller or send as ISO if controller supports it.
      // Assuming controller takes interviewDate and interviewTime
      const dateStr = interviewDate.toISOString().split('T')[0];
      const timeStr = interviewDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      const payload = {
        candidateId: selectedCandidateId,
        candidateName: candidateObj.name,
        candidateEmail: candidateObj.email,
        recruiterId: user?.id || user?._id, // Fallback to auth user
        interviewDate: dateStr,
        interviewTime: timeStr,
        type: "Virtual", // Default
        round: "L1 Interview", // Default
        priority: "medium",
        duration: 60
      };

      const response = await fetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to schedule interview");
      }

      toast({ title: "Success", description: "Interview scheduled successfully." });
      
      // Refresh data
      fetchData();
      setSelectedCandidateId("");
      setInterviewDate(new Date());

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not schedule interview.", variant: "destructive" });
    }
  };

  // ✅ Handle Delete (DELETE to Backend)
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const response = await fetch(`${API_URL}/interviews/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (response.ok) {
        toast({ title: "Deleted", description: "Schedule removed." });
        // Optimistic update or refetch
        setSchedules(prev => prev.filter(s => s._id !== id));
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not delete schedule.", variant: "destructive" });
    }
  };

  // ✅ Notification Logic (Client Side Check on fetched data)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      schedules.forEach((s) => {
        const interviewTime = new Date(s.interviewDate).getTime();
        const diffMinutes = (interviewTime - now) / (1000 * 60);
        if (diffMinutes > 29 && diffMinutes < 31) {
          new Notification("Interview Reminder", {
            body: `Interview with ${s.candidateId?.name || 'Candidate'} in 30 minutes.`,
          });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [schedules]);

  // ✅ Ask for Notification permission
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // ✅ Sort Schedules
  const visibleSchedules = [...schedules].sort((a, b) => 
    new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime()
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-all">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <CalendarDays className="w-9 h-9 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {user?.role === "admin"
                  ? "Admin - Interview Schedules"
                  : "Recruiter - Interview Schedules"}
              </h1>
            </div>
          </div>

          {/* Schedule Form */}
          {/* Allow Recruiter AND Admin to schedule if needed, or limit to Recruiter based on requirements */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6 mb-10"
          >
            {/* Candidate Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300">
                Select Candidate
              </label>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                  disabled={loading}
                >
                  <option value="">-- Choose Candidate --</option>
                  {candidates.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.position})
                    </option>
                  ))}
                </select>
              </div>
              {candidates.length === 0 && !loading && (
                <p className="text-xs text-red-500">No candidates found. Add candidates first.</p>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300">
                Select Interview Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-gray-400" />
                <DatePicker
                  selected={interviewDate}
                  onChange={(date: Date | null) => setInterviewDate(date)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={handleSchedule}
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-300"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule Interview"}
              </Button>
            </div>
          </motion.div>

          {/* Upcoming Interviews */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Upcoming Interviews</span>
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : visibleSchedules.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center py-6">
                No upcoming interviews.
              </p>
            ) : (
              <div className="space-y-4">
                {visibleSchedules.map((s, index) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center justify-between shadow-md hover:shadow-lg transition-all"
                  >
                    <div>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {s.candidateId?.name || "Unknown Candidate"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(s.interviewDate).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <UsersRound className="w-4 h-4 text-blue-400" />
                        {s.recruiterId?.name || "Unknown Recruiter"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <Trash2
                        onClick={() => handleDelete(s._id)}
                        className="w-5 h-5 text-red-500 hover:text-red-600 cursor-pointer"
                      />
                    </div>

                    <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-xl"></span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}