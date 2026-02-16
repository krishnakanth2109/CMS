import { useState, useEffect, useMemo } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus, Search, Edit, Download, Phone, Mail,
  Building, Briefcase, Loader2, Ban, List, LayoutGrid,
  Calendar, GraduationCap, Award, UserCircle, Star, Target,
  MessageSquare, Linkedin, MessageCircle, Eye, IndianRupee, Upload, FileUp, FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Candidate, Job } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Interfaces ---
interface BackendCandidate extends Candidate {
  _id: string;
  candidateId?: string;
  dateOfBirth?: string;
  gender?: string;
  linkedin?: string;
  currentLocation?: string;
  preferredLocation?: string;
  industry?: string;
  currentCompany?: string;
  noticePeriod?: string;
  education?: string;
  source?: string;
  rating?: number;
  assignedJobId?: string;
  active?: boolean;
  dateAdded?: string;
  remarks?: string;
  notes?: string;
  rejectionReason?: string;
  recruiterId?: string | { _id: string, name: string };
  recruiterName?: string;
  offersInHand?: boolean;
  offerPackage?: string;
  servingNoticePeriod?: boolean;
  noticePeriodDays?: string;
}

interface BackendJob extends Job {
  _id: string;
  deadline?: string;
  position: string;
  clientName: string;
}

interface BackendClient {
  _id: string;
  companyName: string;
}

interface CandidateFormData {
  name: string; email: string; contact: string; dateOfBirth: string; gender: string; linkedin: string;
  currentLocation: string; preferredLocation: string;
  position: string; client: string; industry: string; currentCompany: string; skills: string;
  totalExperience: string; relevantExperience: string;
  education: string;
  ctc: string; ectc: string;
  noticePeriod: string;
  servingNoticePeriod: string;
  noticePeriodDays: string;
  offersInHand: string;
  offerPackage: string;
  source: string; status: string; rating: string; assignedJobId: string; dateAdded: string;
  notes: string; remarks: string;
  active: boolean;
}

export default function RecruiterCandidates() {
  const { user } = useAuth();
  const { toast } = useToast();

  // --- State Management ---
  const [candidates, setCandidates] = useState<BackendCandidate[]>([]);
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [clients, setClients] = useState<BackendClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCandidate, setViewingCandidate] = useState<BackendCandidate | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const standardSources = ['Portal', 'LinkedIn', 'Referral', 'Direct', 'Agency'];

  // --- UPDATED STATUS LIST ---
  const allStatuses = [
    'Shared Profiles',
    'Yet to attend',
    'Turnups',
    'No Show',
    'Selected',
    'Joined',
    'Rejected',
    'Hold',
    'Backout'
  ];

  const [isCustomSource, setIsCustomSource] = useState(false);

  const initialFormState: CandidateFormData = {
    name: '', email: '', contact: '', dateOfBirth: '', gender: '', linkedin: '',
    currentLocation: '', preferredLocation: '',
    position: '', client: '', industry: '', currentCompany: '', skills: '',
    totalExperience: '', relevantExperience: '',
    education: '',
    ctc: '', ectc: '',
    noticePeriod: '',
    servingNoticePeriod: 'false',
    noticePeriodDays: '',
    offersInHand: 'false',
    offerPackage: '',
    source: 'Portal', status: 'Submitted', rating: '0', assignedJobId: '',
    dateAdded: new Date().toISOString().split('T')[0],
    notes: '', remarks: '',
    active: true
  };

  const [formData, setFormData] = useState<CandidateFormData>(initialFormState);

  // --- Resume Upload Handler ---
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid File Type', description: 'Please upload a PDF or DOC/DOCX file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Resume must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsParsingResume(true);
    toast({ title: "Parsing Resume", description: "Extracting data with advanced AI..." });

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('resume', file);

      // Use the MAIN advanced parsing endpoint
      const response = await fetch(`${API_URL}/resume/parse`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` },
        body: uploadFormData
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || result.error || 'Failed to parse resume');

      // Map the advanced extraction results to form data
      const extractedData = result;

      // Helper to format date
      const formatDate = (d: string) => {
        if (!d) return '';
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert dd-mm-yyyy to yyyy-mm-dd
        return '';
      };

      setFormData(prev => ({
        ...prev,
        name: extractedData.fullName || prev.name,
        email: extractedData.email || prev.email,
        contact: extractedData.phone || prev.contact,
        skills: extractedData.skills || prev.skills, // Now mapped from advanced parser
        currentLocation: extractedData.currentLocation || prev.currentLocation,
        dateOfBirth: formatDate(extractedData.dob) || prev.dateOfBirth,
        gender: extractedData.gender || prev.gender,
        linkedin: extractedData.linkedin || prev.linkedin,
        education: extractedData.education || prev.education, // Map highest qualification

        // Retain existing form values if parser didn't find anything
        currentCompany: prev.currentCompany,
      }));

      toast({ title: 'Success', description: 'Resume parsed! Name, Education, Skills & Gender auto-filled.', duration: 3000 });

    } catch (error: any) {
      console.error('Resume parsing error:', error);
      toast({ title: 'Parsing Failed', description: error.message || 'Could not extract data', variant: 'destructive' });
    } finally {
      setIsParsingResume(false);
      event.target.value = '';
    }
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` };

      const [candRes, jobRes, clientRes] = await Promise.all([
        fetch(`${API_URL}/candidates`, { headers }),
        fetch(`${API_URL}/jobs`, { headers }),
        fetch(`${API_URL}/clients`, { headers })
      ]);

      if (candRes.ok && jobRes.ok && clientRes.ok) {
        const allCandidates = await candRes.json();
        const allJobs = await jobRes.json();
        const allClients = await clientRes.json();

        // Filter for specific recruiter candidates
        const myCandidates = allCandidates.filter((c: BackendCandidate) =>
          (c.recruiterId === user?.id || (typeof c.recruiterId === 'object' && (c.recruiterId as any)._id === user?.id))
        );

        myCandidates.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setCandidates(myCandidates);
        setJobs(allJobs);
        setClients(allClients);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniquePositions = useMemo(() => {
    const positions = jobs.map(j => j.position).filter(Boolean);
    return Array.from(new Set(positions));
  }, [jobs]);

  // --- Form Handling ---
  const handleInputChange = (key: string, value: string) => {
    let newValue = value;
    if (key === 'contact') {
      newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) return;
    }
    if (['totalExperience', 'relevantExperience', 'ctc', 'ectc'].includes(key)) {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }
    setFormData(prev => ({ ...prev, [key]: newValue }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const data = formData;
    if (!data.name.trim()) newErrors.name = "Name is required";
    else if (!/^[A-Z][a-zA-Z\s]*$/.test(data.name)) newErrors.name = "Name must start with Uppercase";

    if (!data.email.trim()) newErrors.email = "Email is required";

    if (!data.contact.trim()) newErrors.contact = "Phone is required";
    else if (data.contact.length !== 10) newErrors.contact = "Phone must be exactly 10 digits";

    if (!data.position.trim()) newErrors.position = "Position is required";
    if (!data.client.trim()) newErrors.client = "Client is required";
    if (!data.skills.toString().trim()) newErrors.skills = "Skills are required";

    if (isCustomSource && !data.source.trim()) newErrors.source = "Please specify source";

    if (data.servingNoticePeriod === 'true' && !data.noticePeriodDays.trim()) newErrors.noticePeriodDays = "Please specify days";
    if (data.offersInHand === 'true' && !data.offerPackage.trim()) newErrors.offerPackage = "Please specify package amount";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 1. UPDATED: Stats Calculation Logic ---
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      turnups: candidates.filter(c => c.status === 'Turnups').length,
      noShow: candidates.filter(c => c.status === 'No Show').length,
      yetToAttend: candidates.filter(c => c.status === 'Yet to attend').length,
      selected: candidates.filter(c => c.status === 'Selected').length,
      rejected: candidates.filter(c => c.status === 'Rejected').length,
      hold: candidates.filter(c => c.status === 'Hold').length,
      joinings: candidates.filter(c => c.status === 'Joinings').length,
      backout: candidates.filter(c => c.status === 'Backout').length,
      sharedProfiles: candidates.filter(c => c.status === 'Shared Profiles').length,
    };
  }, [candidates]);

  // --- 2. UPDATED: Filter Logic ---
  const getFilteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const searchMatch =
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.candidateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(c.skills) && c.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));

      // Dropdown status filter
      const statusDropdownMatch = statusFilter === 'all' || c.status === statusFilter;

      // Card click filter (overrides standard status grouping)
      let statCardMatch = true;
      if (activeStatFilter) {
        // Strict match based on the status clicked in the card
        statCardMatch = c.status === activeStatFilter;
      }

      return searchMatch && statusDropdownMatch && statCardMatch;
    });
  }, [candidates, searchTerm, statusFilter, activeStatFilter]);

  // --- Exports & Utils ---
  const handleExport = () => {
    if (getFilteredCandidates.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Candidate ID", "Name", "Email", "Phone", "Client", "Position", "Status", "Total Exp", "Current CTC", "Expected CTC", "Skills", "Date Added"];
    const escapeCsv = (str: string | undefined | null) => str ? `"${String(str).replace(/"/g, '""')}"` : '""';
    const rows = getFilteredCandidates.map(c => [
      escapeCsv(getCandidateId(c)), escapeCsv(c.name), escapeCsv(c.email), escapeCsv(c.contact),
      escapeCsv(c.client), escapeCsv(c.position), escapeCsv(c.status), escapeCsv(c.totalExperience),
      escapeCsv(c.ctc), escapeCsv(c.ectc), escapeCsv(Array.isArray(c.skills) ? c.skills.join(', ') : c.skills),
      escapeCsv(new Date(c.dateAdded || c.createdAt || new Date()).toLocaleDateString())
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (status === 'Joinings' || status === 'Selected') return 'default'; // Greenish usually
    if (status === 'Rejected' || status === 'Backout' || status === 'No Show') return 'destructive';
    if (status === 'Hold' || status === 'Yet to attend' || status === 'Turnups') return 'secondary';
    return 'outline';
  };

  const getInitials = (n: string) => n.split(' ').map(i => i[0]).join('').toUpperCase().substring(0, 2);
  const getCandidateId = (c: BackendCandidate) => c.candidateId || c._id.substring(c._id.length - 6).toUpperCase();
  const formatSkills = (skills: string | string[] | undefined) => !skills ? 'N/A' : Array.isArray(skills) ? skills.slice(0, 3).join(', ') + (skills.length > 3 ? '...' : '') : skills.length > 50 ? skills.substring(0, 50) + '...' : skills;
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  const toggleSelectCandidate = (id: string) => setSelectedCandidates(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  const selectAllCandidates = () => setSelectedCandidates(selectedCandidates.length === getFilteredCandidates.length ? [] : getFilteredCandidates.map(c => c._id));
  const getAssignedJobTitle = (jobId?: string) => {
    if (!jobId) return 'Not Assigned';
    const job = jobs.find(j => j._id === jobId);
    return job ? `${job.position} (${job.clientName})` : jobId;
  };

  // --- Dialog Handlers ---
  const openViewDialog = (c: BackendCandidate) => {
    setViewingCandidate(c);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (c: BackendCandidate) => {
    setErrors({});
    setSelectedCandidateId(c._id);
    const isStandard = standardSources.includes(c.source || 'Portal');
    setIsCustomSource(!isStandard);

    setFormData({
      name: c.name || '', email: c.email || '', contact: c.contact || '',
      dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().split('T')[0] : '',
      gender: c.gender || '', linkedin: c.linkedin || '',
      currentLocation: c.currentLocation || '', preferredLocation: c.preferredLocation || '',
      position: c.position || '', client: c.client || '', industry: c.industry || '',
      currentCompany: c.currentCompany || '', skills: Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || '',
      totalExperience: c.totalExperience ? String(c.totalExperience) : '',
      relevantExperience: c.relevantExperience ? String(c.relevantExperience) : '',
      education: c.education || '',
      ctc: c.ctc ? String(c.ctc) : '',
      ectc: c.ectc ? String(c.ectc) : '',
      noticePeriod: c.noticePeriod ? String(c.noticePeriod) : '',
      servingNoticePeriod: c.servingNoticePeriod ? 'true' : 'false',
      noticePeriodDays: c.noticePeriodDays || '',
      offersInHand: c.offersInHand ? 'true' : 'false',
      offerPackage: c.offerPackage || '',
      source: c.source || 'Portal', status: c.status || 'Submitted', rating: c.rating?.toString() || '0',
      assignedJobId: typeof c.assignedJobId === 'object' ? (c.assignedJobId as any)._id : c.assignedJobId || '',
      dateAdded: c.dateAdded ? new Date(c.dateAdded).toISOString().split('T')[0] : '',
      notes: c.notes || '', remarks: c.remarks || '', active: c.active !== false
    });
    setIsEditDialogOpen(true);
  };

  // --- API Handlers ---
  const handleSave = async (isEdit: boolean) => {
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fix form errors", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`, 'Content-Type': 'application/json' };

      const payload = {
        ...formData,
        assignedJobId: typeof formData.assignedJobId === 'object' ? formData.assignedJobId._id : formData.assignedJobId,
        recruiterId: user?.id,
        recruiterName: user?.name,
        skills: formData.skills.split(',').map((s: string) => s.trim()),
        rating: parseInt(formData.rating) || 0
      };

      const url = isEdit ? `${API_URL}/candidates/${selectedCandidateId}` : `${API_URL}/candidates`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });

      if (res.ok) {
        toast({ title: "Success", description: `Candidate ${isEdit ? 'updated' : 'added'} successfully` });
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        fetchData();
        setFormData(initialFormState);
      } else { throw new Error(); }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Operation failed" });
    } finally { setIsSubmitting(false); }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'}?`)) return;
    try {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`, 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/candidates/${id}`, { method: 'PUT', headers, body: JSON.stringify({ active: !currentStatus }) });
      toast({ title: "Status Updated" });
      fetchData();
    } catch (error) { toast({ variant: "destructive", title: "Error" }); }
  };

  const handleWhatsApp = (c: BackendCandidate) => {
    if (!c.contact) return;
    let phone = c.contact.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const firstName = c.name.split(' ')[0];
    const message = `Hi ${firstName}, this is regarding your job application for the ${c.position} position at ${c.client}. Are you available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h1 className="text-3xl font-bold">My Candidates</h1><p className="text-slate-500">Manage pipeline</p></div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
              <Button className="bg-blue-600" onClick={() => { setFormData(initialFormState); setErrors({}); setIsAddDialogOpen(true); setIsCustomSource(false); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Candidate
              </Button>
            </div>
          </div>

          {/* --- 3. UPDATED: Stats Grid with Correct Data Mapping --- */}
<<<<<<< HEAD
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <StatCard
              title="Total Submitted"
              value={stats.total}
              color="blue"
              active={activeStatFilter === null}
              onClick={() => setActiveStatFilter(null)}
            />
            <StatCard
              title="Turnups"
              value={stats.turnups}
              color="indigo"
              active={activeStatFilter === 'Turnups'}
              onClick={() => setActiveStatFilter('Turnups')}
=======
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
              title="Total Submitted" 
              value={stats.total} 
              color="blue" 
              active={activeStatFilter === null} 
              onClick={() => setActiveStatFilter(null)} 
            />
            <StatCard 
              title="Turnups" 
              value={stats.turnups} 
              color="black" 
              active={activeStatFilter === 'Turnups'} 
              onClick={() => setActiveStatFilter('Turnups')} 
>>>>>>> 621aaafdf76a72121c56885d99dae77597366a4a
            />
            <StatCard
              title="No Show"
              value={stats.noShow}
              color="red"
              active={activeStatFilter === 'No Show'}
              onClick={() => setActiveStatFilter('No Show')}
            />
            <StatCard
              title="Yet to attend"
              value={stats.yetToAttend}
              color="purple"
              active={activeStatFilter === 'Yet to attend'}
              onClick={() => setActiveStatFilter('Yet to attend')}
            />
            <StatCard
              title="Selected"
              value={stats.selected}
              color="green"
              active={activeStatFilter === 'Selected'}
              onClick={() => setActiveStatFilter('Selected')}
            />
<<<<<<< HEAD
            <StatCard
              title="Rejected"
              value={stats.rejected}
              color="rose"
              active={activeStatFilter === 'Rejected'}
              onClick={() => setActiveStatFilter('Rejected')}
=======
            <StatCard 
              title="Rejected" 
              value={stats.rejected} 
              color="red" 
              active={activeStatFilter === 'Rejected'} 
              onClick={() => setActiveStatFilter('Rejected')} 
>>>>>>> 621aaafdf76a72121c56885d99dae77597366a4a
            />
            <StatCard
              title="Hold"
              value={stats.hold}
              color="orange"
              active={activeStatFilter === 'Hold'}
              onClick={() => setActiveStatFilter('Hold')}
            />
<<<<<<< HEAD
            <StatCard
              title="Joinings"
              value={stats.joinings}
              color="emerald"
              active={activeStatFilter === 'Joinings'}
              onClick={() => setActiveStatFilter('Joinings')}
            />
            <StatCard
              title="Backout"
              value={stats.backout}
              color="slate"
              active={activeStatFilter === 'Backout'}
              onClick={() => setActiveStatFilter('Backout')}
=======
            <StatCard 
              title="Joined" 
              value={stats.joined} 
              color="green" 
              active={activeStatFilter === 'Joined'} 
              onClick={() => setActiveStatFilter('Joined')} 
            />
            <StatCard 
              title="Backout" 
              value={stats.backout} 
              color="red" 
              active={activeStatFilter === 'Backout'} 
              onClick={() => setActiveStatFilter('Backout')} 
>>>>>>> 621aaafdf76a72121c56885d99dae77597366a4a
            />
            <StatCard
              title="Shared Profiles"
              value={stats.sharedProfiles}
              color="cyan"
              active={activeStatFilter === 'Shared Profiles'}
              onClick={() => setActiveStatFilter('Shared Profiles')}
            />
          </div>


          <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search name, ID or skills..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {allStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <Button variant="ghost" size="sm" className={viewMode === 'table' ? 'bg-white shadow' : ''} onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className={viewMode === 'grid' ? 'bg-white shadow' : ''} onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </Card>

          {/* ... [Table/Grid Views] ... */}
          {viewMode === 'table' ? (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="p-4 w-12"><input type="checkbox" onChange={selectAllCandidates} className="h-4 w-4 rounded border-slate-300" /></th>
                      <th className="p-3">S.No</th>
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Skills</th>
                      <th className="p-3">Date Added</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">CTC / ECTC</th>
                      <th className="p-3">Notice</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getFilteredCandidates.map((c, index) => (
                      <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 pl-4"><input type="checkbox" checked={selectedCandidates.includes(c._id)} onChange={() => toggleSelectCandidate(c._id)} className="h-4 w-4 rounded" /></td>
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3 font-mono text-xs text-blue-600 font-bold cursor-pointer" onClick={() => { navigator.clipboard.writeText(getCandidateId(c)); toast({ title: "Copied ID" }); }}>{getCandidateId(c)}</td>
                        <td className="p-3"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar><span className="font-semibold">{c.name}</span></div></td>
                        <td className="p-3 text-sm text-slate-600"><div className="flex items-center gap-2">{c.contact} <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-green-600" onClick={() => handleWhatsApp(c)}><MessageCircle className="h-3.5 w-3.5" /></Button></div></td>
                        <td className="p-3 text-sm text-slate-600"><span className="truncate max-w-[150px] block" title={c.email}>{c.email}</span></td>
                        <td className="p-3 text-slate-600">{c.client}</td>
                        <td className="p-3 text-xs text-slate-600 max-w-[150px] truncate" title={Array.isArray(c.skills) ? c.skills.join(', ') : c.skills}>{formatSkills(c.skills)}</td>
                        <td className="p-3 text-sm text-slate-600">{formatDate(c.dateAdded)}</td>
                        <td className="p-3 text-sm">{c.totalExperience} Yrs</td>
                        <td className="p-3 text-xs"><div>{c.ctc || '-'}</div><div className="text-green-600">{c.ectc || '-'}</div></td>
                        <td className="p-3 text-sm"><Badge variant="outline">{c.noticePeriod || '-'}</Badge></td>
                        <td className="p-3"><Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge></td>
                        <td className="p-3 text-xs text-slate-500 truncate max-w-[100px]">{c.remarks}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openViewDialog(c)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(c)}><Edit className="h-3.5 w-3.5 text-blue-600" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleActiveStatus(c._id, c.active !== false)}><Ban className="h-3.5 w-3.5 text-red-600" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredCandidates.map(c => (
                <Card key={c._id} className="hover:shadow-lg transition-all group">
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <div className="flex gap-3">
                        <Avatar><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                        <div>
                          <h3 className="font-bold">{c.name}</h3>
                          <p className="text-sm text-blue-600 font-mono">{getCandidateId(c)}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {c.client}</div>
                      <div className="flex items-center gap-2"><Award className="h-4 w-4" /> {formatSkills(c.skills)}</div>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {c.email}</div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {c.contact}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setViewingCandidate(c)}>View</Button>
                      <Button variant="outline" className="flex-1" onClick={() => openEditDialog(c)}>Edit</Button>
                      <Button variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => handleWhatsApp(c)}><MessageCircle className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Candidate Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsAddDialogOpen(false); setIsEditDialogOpen(false); } }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
          </DialogHeader>
          {/* ... [Resume Upload Section same as before] ... */}
          {!isEditDialogOpen && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900/50 mb-4">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full"><FileUp className="h-6 w-6 text-blue-600" /></div>
                <div className="text-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Upload Resume to Auto-Fill</h3>
                  <p className="text-sm text-slate-500 mb-3">Upload PDF or DOC/DOCX file (max 5MB)</p>
                </div>
                <label htmlFor="resume-upload-recruiter">
                  <input id="resume-upload-recruiter" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" disabled={isParsingResume} />
                  <Button type="button" variant="outline" disabled={isParsingResume} onClick={() => document.getElementById('resume-upload-recruiter')?.click()}>
                    {isParsingResume ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing...</> : <><Upload className="mr-2 h-4 w-4" />Choose File</>}
                  </Button>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">

            <div className="md:col-span-3 font-semibold border-b pb-1 text-slate-500 flex items-center gap-2"><UserCircle className="h-4 w-4" /> Personal Information</div>

            <div className="space-y-2">
              <Label className={errors.name ? "text-red-500" : ""}>Full Name *</Label>
              <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} className={errors.name ? "border-red-500" : ""} placeholder="Starts with Uppercase" />
              {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
            </div>
            <div className="space-y-2">
              <Label className={errors.email ? "text-red-500" : ""}>Email *</Label>
              <Input value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className={errors.email ? "border-red-500" : ""} placeholder="user@domain.com" />
              {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>
            <div className="space-y-2">
              <Label className={errors.contact ? "text-red-500" : ""}>Phone *</Label>
              <Input value={formData.contact} onChange={e => handleInputChange('contact', e.target.value)} className={errors.contact ? "border-red-500" : ""} placeholder="10 Digits Only" />
              {errors.contact && <span className="text-xs text-red-500">{errors.contact}</span>}
            </div>

            <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={formData.dateOfBirth} onChange={e => handleInputChange('dateOfBirth', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={val => handleInputChange('gender', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <div className="relative"><Linkedin className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-8" value={formData.linkedin} onChange={e => handleInputChange('linkedin', e.target.value)} placeholder="Profile URL" /></div>
            </div>
            <div className="space-y-2"><Label>Current Location</Label><Input value={formData.currentLocation} onChange={e => handleInputChange('currentLocation', e.target.value)} /></div>
            <div className="space-y-2"><Label>Preferred Location</Label><Input value={formData.preferredLocation} onChange={e => handleInputChange('preferredLocation', e.target.value)} /></div>

            <div className="md:col-span-3 font-semibold border-b pb-1 text-slate-500 mt-4 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Professional Information</div>

            <div className="space-y-2">
              <Label className={errors.position ? "text-red-500" : ""}>Position *</Label>
              <Select value={formData.position} onValueChange={(val) => handleInputChange('position', val)}>
                <SelectTrigger className={errors.position ? "border-red-500" : ""}><SelectValue placeholder="Select Position" /></SelectTrigger>
                <SelectContent>{uniquePositions.map((pos) => (<SelectItem key={pos} value={pos}>{pos}</SelectItem>))}</SelectContent>
              </Select>
              {errors.position && <span className="text-xs text-red-500">{errors.position}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.client ? "text-red-500" : ""}>Client *</Label>
              <Select value={formData.client} onValueChange={(val) => handleInputChange('client', val)}>
                <SelectTrigger className={errors.client ? "border-red-500" : ""}><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent>{clients.map((client) => (<SelectItem key={client._id} value={client.companyName}>{client.companyName}</SelectItem>))}</SelectContent>
              </Select>
              {errors.client && <span className="text-xs text-red-500">{errors.client}</span>}
            </div>

            <div className="space-y-2"><Label>Current Company</Label><Input value={formData.currentCompany} onChange={e => handleInputChange('currentCompany', e.target.value)} /></div>
            <div className="space-y-2"><Label>Industry</Label><Input value={formData.industry} onChange={e => handleInputChange('industry', e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2">
              <Label className={errors.skills ? "text-red-500" : ""}>Skills (comma separated) *</Label>
              <Input value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} className={errors.skills ? "border-red-500" : ""} />
              {errors.skills && <span className="text-xs text-red-500">{errors.skills}</span>}
            </div>

            {/* ... [Education, Experience, Pay sections same as before] ... */}
            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</div>
            <div className="md:col-span-3 space-y-1"><Label>Qualification</Label><Input value={formData.education} onChange={e => handleInputChange('education', e.target.value)} placeholder="e.g. B.Tech from IIT Delhi" /></div>

            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Experience & Pay</div>
            <div className="space-y-2"><Label>Total Exp (Yrs)</Label><Input value={formData.totalExperience} onChange={e => handleInputChange('totalExperience', e.target.value)} placeholder="Numbers only" /></div>
            <div className="space-y-2"><Label>Relevant Exp (Yrs)</Label><Input value={formData.relevantExperience} onChange={e => handleInputChange('relevantExperience', e.target.value)} placeholder="Numbers only" /></div>

            <div className="space-y-2">
              <Label>Serving Notice?</Label>
              <Select value={formData.servingNoticePeriod} onValueChange={(val) => handleInputChange('servingNoticePeriod', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
              </Select>
            </div>

            {formData.servingNoticePeriod === 'true' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95">
                <Label className={errors.noticePeriodDays ? "text-red-500" : ""}>Days Remaining *</Label>
                <Input value={formData.noticePeriodDays} onChange={e => handleInputChange('noticePeriodDays', e.target.value)} placeholder="e.g. 30" />
                {errors.noticePeriodDays && <span className="text-xs text-red-500">{errors.noticePeriodDays}</span>}
              </div>
            )}

            <div className="space-y-2"><Label>Current CTC</Label><Input value={formData.ctc} onChange={e => handleInputChange('ctc', e.target.value)} placeholder="Numbers only" /></div>
            <div className="space-y-2"><Label>Expected CTC</Label><Input value={formData.ectc} onChange={e => handleInputChange('ectc', e.target.value)} placeholder="Numbers only" /></div>

            <div className="space-y-2">
              <Label>Offers in Hand?</Label>
              <Select value={formData.offersInHand} onValueChange={(val) => handleInputChange('offersInHand', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
              </Select>
            </div>

            {formData.offersInHand === 'true' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95">
                <Label className={errors.offerPackage ? "text-red-500" : ""}>Package Amount *</Label>
                <Input value={formData.offerPackage} onChange={e => handleInputChange('offerPackage', e.target.value)} placeholder="e.g. 15 LPA" />
                {errors.offerPackage && <span className="text-xs text-red-500">{errors.offerPackage}</span>}
              </div>
            )}

            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2"><Target className="h-4 w-4" /> Recruitment Details</div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={isCustomSource ? 'Other' : formData.source} onValueChange={v => { if (v === 'Other') { setIsCustomSource(true); handleInputChange('source', '') } else { setIsCustomSource(false); handleInputChange('source', v) } }}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>{standardSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
              {isCustomSource && <Input className="mt-1" value={formData.source} onChange={e => handleInputChange('source', e.target.value)} placeholder="Enter Source" />}
            </div>
            <div className="space-y-2">
              <Label>Assigned Job</Label>
              <Select value={typeof formData.assignedJobId === 'object' ? (formData.assignedJobId as any)._id : formData.assignedJobId || ''} onValueChange={val => handleInputChange('assignedJobId', val)}>
                <SelectTrigger><SelectValue placeholder="Select Job" /></SelectTrigger>
                <SelectContent>{jobs.map(j => <SelectItem key={j._id} value={j._id}>{j.position} - {j.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* --- 4. UPDATED: Status Dropdown in Form --- */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => handleInputChange('status', v)}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  {allStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2"><Label>Rating</Label><Select value={formData.rating} onValueChange={v => handleInputChange('rating', v)}><SelectTrigger><SelectValue placeholder="Rate" /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={r.toString()}>{r} Stars</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Date Added</Label><Input type="date" value={formData.dateAdded} onChange={e => handleInputChange('dateAdded', e.target.value)} /></div>

            <div className="md:col-span-3 space-y-2 mt-2"><Label>Remarks</Label><Textarea value={formData.remarks} onChange={e => handleInputChange('remarks', e.target.value)} /></div>
            <div className="md:col-span-3 space-y-2"><Label>Internal Notes</Label><Textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>Cancel</Button>
            <Button onClick={() => handleSave(isEditDialogOpen)} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {isEditDialogOpen ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog Logic remains same... */}
      {viewingCandidate && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* ... [Same content as original View Dialog] ... */}
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600 text-white">{getInitials(viewingCandidate.name)}</AvatarFallback></Avatar>
                {viewingCandidate.name}
                <Badge variant={getStatusBadgeVariant(viewingCandidate.status)} className="ml-auto">{viewingCandidate.status}</Badge>
              </DialogTitle>
              <DialogDescription className="font-mono text-blue-600 text-sm">ID: {getCandidateId(viewingCandidate)}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2"><UserCircle className="h-4 w-4" /> Personal Information</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div><Label className="text-xs text-slate-500">Email</Label><div>{viewingCandidate.email}</div></div>
                  <div>
                    <Label className="text-xs text-slate-500">Phone</Label>
                    <div className="flex items-center gap-2">
                      <div>{viewingCandidate.contact}</div>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-green-600" onClick={() => handleWhatsApp(viewingCandidate)}><MessageCircle className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div><Label className="text-xs text-slate-500">Date of Birth</Label><div>{formatDate(viewingCandidate.dateOfBirth)}</div></div>
                  <div><Label className="text-xs text-slate-500">Gender</Label><div>{viewingCandidate.gender || '-'}</div></div>
                  <div className="col-span-2"><Label className="text-xs text-slate-500">LinkedIn</Label><div>{viewingCandidate.linkedin ? <a href={viewingCandidate.linkedin} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1"><Linkedin className="h-3 w-3" /> {viewingCandidate.linkedin}</a> : '-'}</div></div>
                  <div><Label className="text-xs text-slate-500">Current Location</Label><div>{viewingCandidate.currentLocation || '-'}</div></div>
                  <div><Label className="text-xs text-slate-500">Preferred Location</Label><div>{viewingCandidate.preferredLocation || '-'}</div></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Professional Details</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div><Label className="text-xs text-slate-500">Position</Label><div>{viewingCandidate.position}</div></div>
                  <div><Label className="text-xs text-slate-500">Client</Label><div>{viewingCandidate.client}</div></div>
                  <div><Label className="text-xs text-slate-500">Industry</Label><div>{viewingCandidate.industry || '-'}</div></div>
                  <div><Label className="text-xs text-slate-500">Current Company</Label><div>{viewingCandidate.currentCompany || '-'}</div></div>
                  <div className="col-span-2"><Label className="text-xs text-slate-500">Skills</Label><div className="flex flex-wrap gap-1 mt-1">{Array.isArray(viewingCandidate.skills) ? viewingCandidate.skills.map(s => <Badge key={s} variant="outline" className="bg-white">{s}</Badge>) : viewingCandidate.skills}</div></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Experience & Compensation</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div><Label className="text-xs text-slate-500">Total Exp</Label><div>{viewingCandidate.totalExperience} Years</div></div>
                  <div><Label className="text-xs text-slate-500">Relevant Exp</Label><div>{viewingCandidate.relevantExperience} Years</div></div>
                  <div><Label className="text-xs text-slate-500">Current CTC</Label><div>{viewingCandidate.ctc}</div></div>
                  <div><Label className="text-xs text-slate-500">Expected CTC</Label><div>{viewingCandidate.ectc}</div></div>

                  {viewingCandidate.servingNoticePeriod && (
                    <div><Label className="text-xs text-slate-500">Notice Period</Label><div className="text-amber-600 font-medium">Serving ({viewingCandidate.noticePeriodDays} days left)</div></div>
                  )}

                  {viewingCandidate.offersInHand && (
                    <div><Label className="text-xs text-slate-500">Offers</Label><div className="text-green-600 font-medium">Yes ({viewingCandidate.offerPackage})</div></div>
                  )}
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Recruitment Metadata</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 text-sm">
                  <div><Label className="text-xs text-slate-500">Source</Label><div>{viewingCandidate.source}</div></div>
                  <div><Label className="text-xs text-slate-500">Assigned Job</Label><div>{getAssignedJobTitle(viewingCandidate.assignedJobId)}</div></div>
                  <div><Label className="text-xs text-slate-500">Recruiter</Label><div>{viewingCandidate.recruiterName || 'Self'}</div></div>
                  <div><Label className="text-xs text-slate-500">Date Added</Label><div>{formatDate(viewingCandidate.dateAdded)}</div></div>
                  <div><Label className="text-xs text-slate-500">Rating</Label><div className="flex items-center gap-1">{viewingCandidate.rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /></div></div>
                  {viewingCandidate.status === 'Rejected' && <div className="col-span-2 text-red-600"><Label className="text-xs text-red-400">Rejection Reason</Label><div>{viewingCandidate.rejectionReason}</div></div>}
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <Label className="text-xs font-semibold text-yellow-700 flex items-center gap-2 mb-2"><FileText className="h-3 w-3" /> Internal Notes</Label>
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap">{viewingCandidate.notes || 'No internal notes.'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <Label className="text-xs font-semibold text-blue-700 flex items-center gap-2 mb-2"><MessageSquare className="h-3 w-3" /> Remarks</Label>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{viewingCandidate.remarks || 'No remarks.'}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              <Button onClick={() => { setIsViewDialogOpen(false); openEditDialog(viewingCandidate); }}>Edit Candidate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const StatCard = ({ title, value, color, active, onClick }: any) => (
  <div onClick={onClick} className={`p-4 rounded-lg shadow-sm border border-l-4 border-l-${color}-500 bg-white ${active ? 'ring-2 ring-blue-500' : ''} cursor-pointer hover:bg-slate-50 transition-colors`}>
    <div className="flex justify-between items-center">
      <div><h3 className="text-2xl font-bold">{value}</h3><p className="text-sm text-slate-500">{title}</p></div>
    </div>
  </div>
);