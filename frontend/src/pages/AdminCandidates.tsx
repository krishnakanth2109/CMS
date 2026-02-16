import { useState, useEffect, useMemo, useRef } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search, Filter, Download, User, Phone, Mail, Building,
  Check, Plus, Edit, Eye, LayoutGrid, List,
  FileText, Trash2, MessageSquare, IndianRupee, UserCircle,
  Loader2, Ban, Award, Calendar, X, MessageCircle
} from 'lucide-react';
import { CandidateStatus, Candidate, Recruiter } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Env var
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

interface BackendCandidate extends Candidate {
  _id: string;
  active?: boolean;
  dateAdded?: string;
  recruiterName?: string;
  candidateId?: string;
  notes?: string;
  resumeUrl?: string;
  resumeOriginalName?: string;

  // New Fields Interface
  offersInHand?: boolean;
  offerPackage?: string;
  servingNoticePeriod?: boolean;
  noticePeriodDays?: string;

  // Resume Parsing Fields
  currentLocation?: string;
  preferredLocation?: string;
  dateOfBirth?: string;
  gender?: string;
  linkedin?: string;
}

export default function AdminCandidates() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [candidates, setCandidates] = useState<BackendCandidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Filter/View State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recruiterFilter, setRecruiterFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [viewCandidate, setViewCandidate] = useState<BackendCandidate | null>(null);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    position: '',
    skills: '',
    client: '',
    status: 'Submitted' as CandidateStatus,
    recruiterId: '',
    assignedJobId: '',
    totalExperience: '',
    relevantExperience: '',
    ctc: '',
    ectc: '',

    // NEW FIELDS
    servingNoticePeriod: 'false', // stored as string for Select, converted later
    noticePeriodDays: '',
    offersInHand: 'false',        // stored as string for Select
    offerPackage: '',

    notes: '',
    dateAdded: new Date().toISOString().split('T')[0],

    // Resume Parsing Fields
    currentLocation: '',
    preferredLocation: '',
    dateOfBirth: '',
    gender: '',
    linkedin: '',
  });

  // --- API Calls ---

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCand, resRec] = await Promise.all([
        fetch(`${API_URL}/candidates`, { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } }),
        fetch(`${API_URL}/recruiters`, { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } })
      ]);

      if (resCand.ok) {
        const data = await resCand.json();
        const mappedCandidates = data.map((c: any) => ({ ...c, id: c._id }));
        mappedCandidates.sort((a: any, b: any) => new Date(b.createdAt || b.dateAdded).getTime() - new Date(a.createdAt || a.dateAdded).getTime());
        setCandidates(mappedCandidates);
      }

      if (resRec.ok) {
        const data = await resRec.json();
        setRecruiters(data.map((r: any) => ({ ...r, id: r._id })));
      }

    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const data = formData;

    // 1. Name validation (First Letter Uppercase)
    if (!data.name.trim()) {
      newErrors.name = "Full Name is required";
    } else if (!/^[A-Z][a-zA-Z\s]*$/.test(data.name)) {
      newErrors.name = "Name must start with an Uppercase letter and contain only alphabets";
    }

    // 2. Email Validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(data.email)) {
      newErrors.email = "Invalid email format";
    }

    // 3. Contact Validation
    if (!data.contact.trim()) {
      newErrors.contact = "Phone number is required";
    } else if (data.contact.length !== 10) {
      newErrors.contact = "Phone number must be exactly 10 digits";
    }

    if (!data.position.trim()) newErrors.position = "Position is required";
    if (!data.client.trim()) newErrors.client = "Client is required";
    if (!data.skills.trim()) newErrors.skills = "Skills are required";
    if (!data.recruiterId) newErrors.recruiterId = "Please assign a recruiter";

    // Conditional Validation (Optional, but good for UX)
    if (data.servingNoticePeriod === 'true' && !data.noticePeriodDays) {
      newErrors.noticePeriodDays = "Please specify days";
    }
    if (data.offersInHand === 'true' && !data.offerPackage) {
      newErrors.offerPackage = "Please specify package amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Filtering ---
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.candidateId && c.candidateId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.client?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      const cRecruiterId = (c.recruiterId && typeof c.recruiterId === 'object')
        ? (c.recruiterId as any)._id
        : c.recruiterId;

      const matchesRecruiter = recruiterFilter === 'all' || cRecruiterId === recruiterFilter;

      let statCardMatch = true;
      if (activeStatFilter) {
        if (activeStatFilter === 'submitted') statCardMatch = c.status === 'Submitted';
        if (activeStatFilter === 'interview') statCardMatch = c.status.includes('Interview');
        if (activeStatFilter === 'offer') statCardMatch = c.status === 'Offer';
        if (activeStatFilter === 'active') statCardMatch = c.active !== false;
      }

      return matchesSearch && matchesStatus && matchesRecruiter && statCardMatch;
    });
  }, [candidates, searchTerm, statusFilter, recruiterFilter, activeStatFilter]);

  // --- Handlers ---

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      setIsParsing(true);
      toast({ title: "Parsing Resume", description: "Extracting data, please wait..." });

      const uploadData = new FormData();
      uploadData.append('resume', file);

      try {
        const response = await fetch(`${API_URL}/resume/parse`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: uploadData
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || result.error || 'Parsing failed');

        const extractedData = result; // Response is directly the data object

        // Helper to convert dd-mm-yyyy to yyyy-mm-dd
        const formatDate = (d: string) => {
          if (!d) return '';
          const parts = d.split('-');
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return '';
        };

        // Auto-fill
        setFormData(prev => ({
          ...prev,
          name: extractedData.fullName || prev.name,
          email: extractedData.email || prev.email,
          contact: extractedData.phone || prev.contact,
          currentLocation: extractedData.currentLocation || prev.currentLocation,
          dateOfBirth: formatDate(extractedData.dob) || prev.dateOfBirth,
          gender: extractedData.gender || prev.gender,
          linkedin: extractedData.linkedin || prev.linkedin,
          skills: extractedData.skills || prev.skills, // Auto-fill skills
          // Do NOT auto-fill Preferred Location

          notes: prev.notes ? prev.notes : "Auto-extracted from resume."
        }));

        toast({ title: "Success", description: "Form fields populated from resume!" });
      } catch (error: any) {
        console.error(error);
        toast({
          title: "Parsing Error",
          description: error.message || "Could not auto-fill form.",
          variant: "destructive"
        });
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let newValue = value;

    // 1. Contact: Numbers only, limit to 10
    if (field === 'contact') {
      newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) return;
    }

    // 2. Experience & CTC
    if (field === 'totalExperience' || field === 'relevantExperience' || field === 'ctc' || field === 'ectc') {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }

    setFormData(prev => ({ ...prev, [field]: newValue }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', contact: '', position: '', skills: '', client: '',
      status: 'Submitted', recruiterId: '', assignedJobId: '',
      totalExperience: '', relevantExperience: '', ctc: '', ectc: '',

      servingNoticePeriod: 'false',
      noticePeriodDays: '',
      offersInHand: 'false',
      offerPackage: '',

      notes: '', dateAdded: new Date().toISOString().split('T')[0],
      currentLocation: '', preferredLocation: '', dateOfBirth: '', gender: '', linkedin: ''
    });
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setErrors({});
    setIsEditMode(false);
    setSelectedCandidateId(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (c: BackendCandidate) => {
    setErrors({});
    setIsEditMode(true);
    setSelectedCandidateId(c._id || c.id);
    setResumeFile(null);
    setFormData({
      name: c.name,
      email: c.email || '',
      contact: c.contact || '',
      position: c.position || '',
      skills: Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || '',
      client: c.client || '',
      status: c.status,
      recruiterId: typeof c.recruiterId === 'object' ? (c.recruiterId as any)._id : c.recruiterId || '',
      assignedJobId: c.assignedJobId || '',
      totalExperience: c.totalExperience ? String(c.totalExperience) : '',
      relevantExperience: c.relevantExperience ? String(c.relevantExperience) : '',
      ctc: c.ctc ? String(c.ctc) : '',
      ectc: c.ectc ? String(c.ectc) : '',

      // Map New Fields
      servingNoticePeriod: c.servingNoticePeriod ? 'true' : 'false',
      noticePeriodDays: c.noticePeriodDays || '',
      offersInHand: c.offersInHand ? 'true' : 'false',
      offerPackage: c.offerPackage || '',

      notes: c.notes || '',
      dateAdded: c.dateAdded ? new Date(c.dateAdded).toISOString().split('T')[0] : '',

      currentLocation: c.currentLocation || '',
      preferredLocation: c.preferredLocation || '',
      dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().split('T')[0] : '',
      gender: c.gender || '',
      linkedin: c.linkedin || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors highlighted in red.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `${API_URL}/candidates/${selectedCandidateId}`
        : `${API_URL}/candidates`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Operation failed');

      toast({ title: "Success", description: `Candidate ${isEditMode ? 'Updated' : 'Added'} Successfully` });
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not save candidate", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Helpers ---
  const handleWhatsApp = (c: BackendCandidate) => {
    if (!c.contact) return;
    let phone = c.contact.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const firstName = c.name.split(' ')[0];
    const message = `Hi ${firstName}, this is regarding your job application for the ${c.position} position at ${c.client}. Are you available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyCandidateId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "Copied ID", description: id });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredCandidates.map(c => c._id || c.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'Joined' || status === 'Offer') return 'default';
    if (status === 'Rejected') return 'destructive';
    if (status.includes('Interview')) return 'secondary';
    return 'outline';
  };

  const getInitials = (n: string) => n ? n.split(' ').map(i => i[0]).join('').toUpperCase().substring(0, 2) : 'CN';
  const getCandidateId = (c: BackendCandidate | null) => c?.candidateId || '...';
  const getSkillsText = (skills: string | string[] | undefined) => !skills ? 'N/A' : Array.isArray(skills) ? skills.join(', ') : skills;

  const stats = useMemo(() => ({
    total: candidates.length,
    active: candidates.filter(c => c.active !== false).length,
    submitted: candidates.filter(c => c.status === 'Submitted').length,
    interview: candidates.filter(c => c.status.includes('Interview')).length,
    offer: candidates.filter(c => c.status === 'Offer').length,
    joined: candidates.filter(c => c.status === 'Joined').length,
    rejected: candidates.filter(c => c.status === 'Rejected').length
  }), [candidates]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Candidate Database</h1>
              <p className="text-slate-500">View and manage candidates across all recruiters</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleOpenAddDialog} className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Add Candidate</Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <StatCard title="Total" value={stats.total} color="blue" active={activeStatFilter === null} onClick={() => setActiveStatFilter(null)} />
            <StatCard title="Active" value={stats.active} color="green" active={activeStatFilter === 'active'} onClick={() => setActiveStatFilter('active')} />
            <StatCard title="Submitted" value={stats.submitted} color="slate" active={activeStatFilter === 'submitted'} onClick={() => setActiveStatFilter('submitted')} />
            <StatCard title="Interview" value={stats.interview} color="orange" active={activeStatFilter === 'interview'} onClick={() => setActiveStatFilter('interview')} />
            <StatCard title="Offer" value={stats.offer} color="purple" active={activeStatFilter === 'offer'} onClick={() => setActiveStatFilter('offer')} />
            <StatCard title="Joined" value={stats.joined} color="teal" />
            <StatCard title="Rejected" value={stats.rejected} color="red" />
          </div>

          {/* Controls */}
          <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search candidates by name, ID, email..."
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 items-center w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Joined">Joined</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
                  <SelectTrigger className="w-[160px]"><User className="mr-2 h-4 w-4" /><SelectValue placeholder="Recruiter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recruiters</SelectItem>
                    {recruiters.map(r => (
                      // @ts-ignore
                      <SelectItem key={r.id || r._id} value={r.id || r._id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <Button variant="ghost" size="sm" className={viewMode === 'table' ? 'bg-white shadow-sm dark:bg-slate-700' : ''} onClick={() => setViewMode('table')}>
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className={viewMode === 'grid' ? 'bg-white shadow-sm dark:bg-slate-700' : ''} onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : viewMode === 'table' ? (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                    <tr>
                      <th className="p-4 w-12">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={selectedIds.length > 0 && selectedIds.length === filteredCandidates.length} onChange={(e) => handleSelectAll(e.target.checked)} />
                      </th>
                      <th className="p-3 min-w-[50px]">S.No</th>
                      <th className="p-3 min-w-[100px]">Candidate ID</th>
                      <th className="p-3 min-w-[200px]">Name</th>
                      <th className="p-3 min-w-[150px]">Phone Number</th>
                      <th className="p-3 min-w-[200px]">Email</th>
                      <th className="p-3 min-w-[150px]">Client</th>
                      <th className="p-3 min-w-[100px]">Experience</th>
                      <th className="p-3 min-w-[150px]">Skills</th>
                      <th className="p-3 min-w-[120px]">CTC / ECTC</th>
                      <th className="p-3 min-w-[120px]">Status</th>
                      <th className="p-3 min-w-[150px]">Remarks</th>
                      <th className="p-3 text-right sticky right-0 bg-slate-50 dark:bg-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCandidates.map((c, index) => (
                      <tr key={c._id || c.id} className={c.active === false ? "bg-slate-50 dark:bg-slate-900/50" : "hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"}>
                        <td className="p-3 pl-4">
                          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={selectedIds.includes(c._id || c.id)} onChange={(e) => handleSelectOne(c._id || c.id, e.target.checked)} />
                        </td>
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3 font-mono text-xs font-bold text-blue-600 cursor-pointer" onClick={() => copyCandidateId(getCandidateId(c))}>
                          {getCandidateId(c)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{getInitials(c.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className={`font-semibold text-slate-900 dark:text-white ${c.active === false ? 'line-through text-slate-500' : ''}`}>{c.name}</span>
                              {c.resumeUrl && <span className="text-[10px] text-green-600 flex items-center gap-0.5"><FileText className="h-2 w-2" /> Resume attached</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{c.contact}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={() => handleWhatsApp(c)}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[180px] block" title={c.email}>{c.email}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col">
                            <span>{c.client}</span>
                            <span className="text-[10px] text-muted-foreground">{c.recruiterName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {c.totalExperience ? `${c.totalExperience} Yrs` : '-'}
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[150px] block" title={getSkillsText(c.skills)}>
                            {getSkillsText(c.skills)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {c.ctc || 'N/A'} / {c.ectc || 'N/A'}
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[150px] block" title={c.notes}>{c.notes || '-'}</span>
                        </td>
                        <td className="p-3 text-right sticky right-0 bg-white dark:bg-slate-950 shadow-l">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setViewCandidate(c); setIsViewDialogOpen(true); }}><Eye className="h-3.5 w-3.5 text-slate-600" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleOpenEditDialog(c)}><Edit className="h-3.5 w-3.5 text-blue-600" /></Button>
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
              {filteredCandidates.map((c) => (
                <Card key={c._id || c.id} className="hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">{getInitials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{c.name}</h3>
                          <p className="text-sm text-blue-600 font-mono font-bold">{getCandidateId(c)}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> <span className="truncate">{c.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> <span>{c.contact}</span></div>
                      <div className="flex items-center gap-2"><Building className="h-3.5 w-3.5" /> <span>{c.client}</span></div>
                      <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5" /> <span>{c.totalExperience} Yrs Exp</span></div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setViewCandidate(c); setIsViewDialogOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(c)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleWhatsApp(c)}><MessageCircle className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewCandidate?.name}
              {viewCandidate?.resumeUrl && (
                <a href={`${BASE_URL}${viewCandidate.resumeUrl}`} target="_blank" rel="noopener noreferrer" className="ml-auto">
                  <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Resume</Button>
                </a>
              )}
            </DialogTitle>
            <DialogDescription className="font-mono text-blue-600">ID: {getCandidateId(viewCandidate)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Email</Label>
              <div className="font-medium">{viewCandidate?.email}</div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Contact</Label>
              <div className="font-medium">{viewCandidate?.contact}</div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Skills</Label>
              <div className="font-medium">{getSkillsText(viewCandidate?.skills)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Total Experience</Label>
              <div className="font-medium">{viewCandidate?.totalExperience} Yrs</div>
            </div>

            {/* New Detail Fields */}
            {viewCandidate?.servingNoticePeriod && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Notice Period</Label>
                <div className="font-medium text-amber-600">Serving ({viewCandidate.noticePeriodDays} days left)</div>
              </div>
            )}
            {viewCandidate?.offersInHand && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Offer in Hand</Label>
                <div className="font-medium text-green-600">Yes ({viewCandidate.offerPackage})</div>
              </div>
            )}

            <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-800">
              <Label className="text-xs text-slate-500 block mb-1">Remarks</Label>
              <p className="text-sm text-gray-600 dark:text-gray-300">{viewCandidate?.notes || 'No remarks.'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">

            {/* Resume Upload - Only visible in Add Mode */}
            {!isEditMode && (
              <div className="col-span-1 md:col-span-2 space-y-2 p-4 border border-dashed border-blue-200 bg-blue-50/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-blue-900 font-semibold">Auto-Fill from Resume</Label>
                  {isParsing && <span className="text-xs text-blue-600 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Extracting Data...</span>}
                </div>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="bg-white"
                  disabled={isParsing}
                />
                <p className="text-[10px] text-slate-500">Upload a resume to automatically extract Name, Email, Phone, Skills and Experience. The file will not be saved.</p>
              </div>
            )}

            {/* Existing Fields */}
            <div className="space-y-2">
              <Label className={errors.name ? "text-red-500" : ""}>Full Name *</Label>
              <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} className={errors.name ? "border-red-500" : ""} />
              {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.email ? "text-red-500" : ""}>Email *</Label>
              <Input value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className={errors.email ? "border-red-500" : ""} placeholder="user@example.com" />
              {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>

            {/* New Parsing Fields */}
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={formData.dateOfBirth} onChange={e => handleInputChange('dateOfBirth', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(val) => handleInputChange('gender', val)}>
                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={formData.linkedin} onChange={e => handleInputChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>

            <div className="space-y-2">
              <Label>Current Location</Label>
              <Input value={formData.currentLocation} onChange={e => handleInputChange('currentLocation', e.target.value)} placeholder="e.g. Bangalore" />
            </div>

            <div className="space-y-2">
              <Label>Preferred Location</Label>
              <Input value={formData.preferredLocation} onChange={e => handleInputChange('preferredLocation', e.target.value)} placeholder="e.g. Pune / Remote" />
            </div>

            <div className="space-y-2">
              <Label className={errors.contact ? "text-red-500" : ""}>Phone *</Label>
              <Input value={formData.contact} onChange={e => handleInputChange('contact', e.target.value)} className={errors.contact ? "border-red-500" : ""} placeholder="10 digit number" />
              {errors.contact && <span className="text-xs text-red-500">{errors.contact}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.position ? "text-red-500" : ""}>Position *</Label>
              <Input value={formData.position} onChange={e => handleInputChange('position', e.target.value)} className={errors.position ? "border-red-500" : ""} />
              {errors.position && <span className="text-xs text-red-500">{errors.position}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.client ? "text-red-500" : ""}>Client *</Label>
              <Input value={formData.client} onChange={e => handleInputChange('client', e.target.value)} className={errors.client ? "border-red-500" : ""} />
              {errors.client && <span className="text-xs text-red-500">{errors.client}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.skills ? "text-red-500" : ""}>Skills *</Label>
              <Input value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} className={errors.skills ? "border-red-500" : ""} placeholder="e.g. Java, React, Python" />
              {errors.skills && <span className="text-xs text-red-500">{errors.skills}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.recruiterId ? "text-red-500" : ""}>Assign Recruiter *</Label>
              <Select value={formData.recruiterId} onValueChange={(val) => handleInputChange('recruiterId', val)}>
                <SelectTrigger className={errors.recruiterId ? "border-red-500" : ""}><SelectValue placeholder="Select Recruiter" /></SelectTrigger>
                <SelectContent>
                  {recruiters.map(r => (
                    // @ts-ignore
                    <SelectItem key={r.id || r._id} value={r.id || r._id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.recruiterId && <span className="text-xs text-red-500">{errors.recruiterId}</span>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Joined">Joined</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exp & CTC */}
            <div className="space-y-2">
              <Label>Total Exp (Yrs)</Label>
              <Input value={formData.totalExperience} onChange={e => handleInputChange('totalExperience', e.target.value)} placeholder="e.g. 5 or 5.5" />
            </div>
            <div className="space-y-2">
              <Label>Current CTC</Label>
              <Input value={formData.ctc} onChange={e => handleInputChange('ctc', e.target.value)} placeholder="Numbers only" />
            </div>
            <div className="space-y-2">
              <Label>Expected CTC</Label>
              <Input value={formData.ectc} onChange={e => handleInputChange('ectc', e.target.value)} placeholder="Numbers only" />
            </div>

            {/* New Conditional Fields */}
            <div className="space-y-2">
              <Label>Serving Notice Period?</Label>
              <Select value={formData.servingNoticePeriod} onValueChange={(val) => handleInputChange('servingNoticePeriod', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Days only if Yes */}
            {formData.servingNoticePeriod === 'true' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label className={errors.noticePeriodDays ? "text-red-500" : ""}>Notice Period (Days)</Label>
                <Input value={formData.noticePeriodDays} onChange={e => handleInputChange('noticePeriodDays', e.target.value)} placeholder="e.g. 60 or 45" />
                {errors.noticePeriodDays && <span className="text-xs text-red-500">{errors.noticePeriodDays}</span>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Offers in Hand?</Label>
              <Select value={formData.offersInHand} onValueChange={(val) => handleInputChange('offersInHand', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Package only if Yes */}
            {formData.offersInHand === 'true' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label className={errors.offerPackage ? "text-red-500" : ""}>Package Amount</Label>
                <Input value={formData.offerPackage} onChange={e => handleInputChange('offerPackage', e.target.value)} placeholder="e.g. 15 LPA" />
                {errors.offerPackage && <span className="text-xs text-red-500">{errors.offerPackage}</span>}
              </div>
            )}

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label>Remarks / Notes</Label>
              <Textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for StatCard
interface StatCardProps {
  title: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}

const StatCard = ({ title, value, color, active, onClick }: StatCardProps) => {
  const colors: Record<string, string> = {
    blue: 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900',
    green: 'border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-slate-900',
    slate: 'border-l-slate-500 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/20 dark:to-slate-900',
    orange: 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900',
    purple: 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900',
    teal: 'border-l-teal-500 bg-gradient-to-r from-teal-50 to-white dark:from-teal-900/20 dark:to-slate-900',
    red: 'border-l-red-500 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-slate-900'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 ${colors[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${active ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
    >
      <div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      </div>
    </div>
  );
};