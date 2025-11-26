import React, { useState, useMemo, useRef, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// FIXED: Imported useToast hook instead of direct toast function
import { useToast } from "@/hooks/use-toast"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseIcon, ClipboardDocumentListIcon, UserIcon, MapPinIcon, CurrencyDollarIcon, LinkIcon, MagnifyingGlassIcon, XMarkIcon, BuildingOfficeIcon, CodeBracketIcon, CalendarDaysIcon, EyeIcon, PencilIcon, PlusIcon, UsersIcon, CheckCircleIcon, NoSymbolIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Type Definitions
interface Job {
  _id: string;
  id: string;
  jobCode: string;
  clientName: string;
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

interface Recruiter {
  id: string;
  name: string;
  email: string;
}

interface Client {
  id: string;
  companyName: string;
}

// Job Detail Modal
const JobDetailCard: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-blue-600 text-white p-6 flex justify-between items-start">
             <div>
                <h2 className="text-2xl font-bold">{job.position}</h2>
                <div className="text-blue-100">{job.clientName} ({job.jobCode})</div>
             </div>
             <button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
             <div>
                <h3 className="font-bold mb-2">Requirements</h3>
                <p>Skills: {job.skills}</p>
                <p>Exp: {job.experience}</p>
                <p>Budget: {job.salaryBudget}</p>
                <p>Loc: {job.location}</p>
             </div>
             <div>
                <h3 className="font-bold mb-2">Recruiters</h3>
                <p>Pri: {job.primaryRecruiter || 'N/A'}</p>
                <p>Sec: {job.secondaryRecruiter || 'N/A'}</p>
                <p>TAT: {job.tatTime ? new Date(job.tatTime).toLocaleDateString() : 'N/A'}</p>
             </div>
             <div className="col-span-2 bg-gray-50 p-3 rounded">
                <h4 className="font-bold text-sm">Link</h4>
                <a href={job.jdLink} target="_blank" className="text-blue-600 break-all">{job.jdLink}</a>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const AdminRequirements: React.FC = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState<Partial<Job>>({
    jobCode: "", clientName: "", position: "", skills: "", salaryBudget: "", location: "",
    experience: "", gender: "", interviewMode: "", tatTime: "", jdLink: "", comments: "",
    primaryRecruiter: "", secondaryRecruiter: "", active: true,
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, clientsRes, recRes] = await Promise.all([
        fetch(`${API_URL}/jobs`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/clients`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() })
      ]);

      if(jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.map((j: any) => ({ ...j, id: j._id })));
      }
      if(clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.map((c: any) => ({ id: c._id, companyName: c.companyName })));
      }
      if(recRes.ok) {
        const data = await recRes.json();
        setRecruiters(data.map((r: any) => ({ id: r._id, name: r.name, email: r.email })));
      }
    } catch (error) {
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });
  };

  const handleSubmit = async () => {
    if (!form.clientName || !form.position || !form.jobCode) {
      toast({ title: "Validation Error", description: "Required fields missing", variant: "destructive" });
      return;
    }

    try {
      const url = editingJob ? `${API_URL}/jobs/${editingJob.id}` : `${API_URL}/jobs`;
      const method = editingJob ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Failed to save job');

      toast({ title: "Success", description: "Job requirement saved" });
      setShowForm(false);
      setEditingJob(null);
      setForm({
        jobCode: "", clientName: "", position: "", skills: "", salaryBudget: "", location: "",
        experience: "", gender: "", interviewMode: "", tatTime: "", jdLink: "", comments: "",
        primaryRecruiter: "", secondaryRecruiter: "", active: true,
      });
      fetchData();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setForm({
      ...job,
      tatTime: job.tatTime ? new Date(job.tatTime).toISOString().split('T')[0] : ""
    });
    setShowForm(true);
  };

  const handleToggleActive = async (job: Job) => {
    try {
      await fetch(`${API_URL}/jobs/${job.id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ active: !job.active })
      });
      fetchData();
      toast({ title: "Status Updated" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const filteredJobs = jobs.filter(j => j.position.toLowerCase().includes(searchTerm.toLowerCase()) || j.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 text-gray-900 dark:text-gray-100">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Job Requirements</h1>
            <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" /> {showForm ? "Cancel" : "Add Requirement"}
            </Button>
          </div>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="mb-6">
                  <CardHeader><CardTitle>{editingJob ? "Edit" : "Add"} Requirement</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input name="jobCode" placeholder="Job Code *" value={form.jobCode} onChange={handleChange} />
                      <select name="clientName" value={form.clientName} onChange={handleChange} className="border rounded p-2">
                        <option value="">Select Client *</option>
                        {clients.map(c => <option key={c.id} value={c.companyName}>{c.companyName}</option>)}
                      </select>
                      <Input name="position" placeholder="Position *" value={form.position} onChange={handleChange} />
                      <Input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
                      <Input name="experience" placeholder="Experience" value={form.experience} onChange={handleChange} />
                      <Input name="salaryBudget" placeholder="Budget" value={form.salaryBudget} onChange={handleChange} />
                      <Input name="tatTime" type="date" placeholder="TAT" value={form.tatTime} onChange={handleChange} />
                      <select name="primaryRecruiter" value={form.primaryRecruiter} onChange={handleChange} className="border rounded p-2">
                        <option value="">Primary Recruiter</option>
                        {recruiters.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                      <select name="secondaryRecruiter" value={form.secondaryRecruiter} onChange={handleChange} className="border rounded p-2">
                        <option value="">Secondary Recruiter</option>
                        {recruiters.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                      <Input name="skills" placeholder="Skills" className="col-span-3" value={form.skills} onChange={handleChange} />
                      <Input name="jdLink" placeholder="JD Link" className="col-span-3" value={form.jdLink} onChange={handleChange} />
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleSubmit}>{editingJob ? "Update" : "Save"}</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {loading ? <div className="text-center p-10">Loading...</div> : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Client/Position</th>
                      <th className="px-4 py-3">Recruiters</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map(job => (
                      <tr key={job.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs"><Badge variant="secondary">{job.jobCode}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{job.position}</div>
                          <div className="text-xs text-gray-500">{job.clientName} | {job.location}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {job.primaryRecruiter && <Badge className="bg-blue-100 text-blue-800 mr-1">{job.primaryRecruiter}</Badge>}
                          {job.secondaryRecruiter && <Badge className="bg-green-100 text-green-800">{job.secondaryRecruiter}</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={job.active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {job.active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)}><EyeIcon className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditJob(job)}><PencilIcon className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(job)}>
                            {job.active !== false ? <NoSymbolIcon className="w-4 h-4 text-red-500" /> : <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {selectedJob && <JobDetailCard job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
};

export default AdminRequirements;