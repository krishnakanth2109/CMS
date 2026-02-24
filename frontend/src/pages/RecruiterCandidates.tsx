import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus, Search, Edit, Download, Phone, Mail,
  Building, Briefcase, Loader2, Ban, List, LayoutGrid,
  Calendar, GraduationCap, Award, UserCircle, Star, Target,
  MessageSquare, Linkedin, MessageCircle, Eye, IndianRupee, Upload, FileUp, FileText, X, CheckSquare,
  Trash2, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Interfaces ---
interface BackendCandidate {
  _id: string;
  candidateId?: string;
  name: string;
  email: string;
  contact: string;
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
  status?: string[] | string;
  rating?: number;
  assignedJobId?: string | { _id: string, name: string, position?: string, clientName?: string };
  active?: boolean;
  dateAdded?: string;
  createdAt?: string;
  remarks?: string;
  notes?: string;
  rejectionReason?: string;
  recruiterId?: string | { _id: string, name: string };
  recruiterName?: string;
  offersInHand?: boolean;
  offerPackage?: string;
  servingNoticePeriod?: boolean;
  isNegotiable?: string;
  noticePeriodDays?: string;
  ctc?: string;
  ectc?: string;
  takeHomeSalary?: string;
  skills?: string[] | string;
  position?: string;
  client?: string;
  relevantExperience?: string | number;
  totalExperience?: string | number;
  currentTakeHome?: string;
  expectedTakeHome?: string;
}

interface BackendJob {
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
  name: string;
  email: string;
  contact: string;
  dateOfBirth: string;
  gender: string;
  linkedin: string;
  currentLocation: string;
  preferredLocation: string;
  position: string;
  client: string;
  industry: string;
  currentCompany: string;
  skills: string;
  totalExperience: string;
  relevantExperience: string;
  education: string;
  ctc: string;
  ectc: string;
  takeHomeSalary: string;
  currentTakeHome: string;
  expectedTakeHome: string;
  noticePeriod: string;
  servingNoticePeriod: string;
  isNegotiable: string;
  noticePeriodDays: string;
  offersInHand: string;
  offerPackage: string;
  source: string;
  status: string[];
  rating: string;
  assignedJobId: string;
  dateAdded: string;
  notes: string;
  remarks: string;
  active: boolean;
}

export default function RecruiterCandidates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // --- State Management ---
  const [candidates, setCandidates] = useState<BackendCandidate[]>([]);
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [clients, setClients] = useState<BackendClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCandidate, setViewingCandidate] = useState<BackendCandidate | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import Excel State
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const standardSources = ['Portal', 'LinkedIn', 'Referral', 'Direct', 'Agency'];
  const allStatuses = [
    'Shared Profiles', 'Yet to attend', 'Turnups', 'No Show', 'Selected',
    'Joined', 'Rejected', 'Pipeline', 'Hold', 'Backout'
  ];
  const [isCustomSource, setIsCustomSource] = useState(false);

  const initialFormState: CandidateFormData = {
    name: '', email: '', contact: '', dateOfBirth: '', gender: '',
    linkedin: '', currentLocation: '', preferredLocation: '',
    position: '', client: '', industry: '', currentCompany: '',
    skills: '', totalExperience: '', relevantExperience: '',
    education: '', ctc: '', ectc: '', takeHomeSalary: '',
    currentTakeHome: '', expectedTakeHome: '',
    noticePeriod: '', servingNoticePeriod: 'false', isNegotiable: 'No',
    noticePeriodDays: '', offersInHand: 'false', offerPackage: '',
    source: 'Portal', status: ['Submitted'], rating: '0',
    assignedJobId: '', dateAdded: new Date().toISOString().split('T')[0],
    notes: '', remarks: '', active: true
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
    setIsParsingResume(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('resume', file);
      const response = await fetch(`${API_URL}/candidates/parse-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` },
        body: uploadFormData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to parse resume');
      if (result.success && result.data) {
        const cleanContact = result.data.contact ? result.data.contact.replace(/\D/g, '').slice(0, 10) : '';
        const cleanTotalExp = result.data.totalExperience ? String(result.data.totalExperience).replace(/[^0-9.]/g, '') : '';
        setFormData(prev => ({
          ...prev,
          name: result.data.name || prev.name,
          email: result.data.email || prev.email,
          contact: cleanContact || prev.contact,
          skills: result.data.skills || prev.skills,
          totalExperience: cleanTotalExp || prev.totalExperience,
          education: result.data.education || prev.education,
          currentLocation: result.data.currentLocation || prev.currentLocation,
          currentCompany: result.data.currentCompany || prev.currentCompany,
        }));
        toast({ title: 'Resume Parsed Successfully', description: 'Form fields have been auto-filled.', duration: 5000 });
      }
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
        const myCandidates = allCandidates.filter((c: BackendCandidate) =>
          (c.recruiterId === user?.id || (typeof c.recruiterId === 'object' && (c.recruiterId as any)._id === user?.id))
        );
        myCandidates.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const fixedCandidates = myCandidates.map((c: any) => ({
          ...c,
          status: Array.isArray(c.status) ? c.status : [c.status || 'Submitted']
        }));
        setCandidates(fixedCandidates);
        setJobs(allJobs);
        setClients(allClients);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setActiveStatFilter(status);
      setStatusFilter('all');
    }
  }, [searchParams]);

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
    if (['totalExperience', 'relevantExperience', 'ctc', 'ectc', 'currentTakeHome', 'expectedTakeHome'].includes(key)) {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }
    setFormData(prev => {
      const updated = { ...prev, [key]: newValue };
      if (key === 'servingNoticePeriod' && newValue === 'false') {
        updated.isNegotiable = 'No';
        updated.noticePeriodDays = '';
      }
      if (key === 'isNegotiable' && newValue === 'No') {
        updated.noticePeriodDays = '';
      }
      return updated;
    });
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const addStatus = (newStatus: string) => {
    if (newStatus === 'SELECT_ALL') {
      setFormData(prev => ({ ...prev, status: [...allStatuses] }));
    } else {
      if (!formData.status.includes(newStatus)) {
        setFormData(prev => ({ ...prev, status: [...prev.status, newStatus] }));
      }
    }
  };

  const removeStatus = (statusToRemove: string) => {
    setFormData(prev => ({ ...prev, status: prev.status.filter(s => s !== statusToRemove) }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const data = formData;
    if (!data.name.trim()) newErrors.name = "Name is required";
    else if (!/^[A-Z][a-zA-Z\s]*$/.test(data.name)) newErrors.name = "Name must start with Uppercase";
    if (!data.email.trim()) newErrors.email = "Email is required";
    if (!data.contact.trim()) newErrors.contact = "Phone is required";
    else if (data.contact.length !== 10) newErrors.contact = "Phone must be exactly 10 digits";
    if (!data.skills.toString().trim()) newErrors.skills = "Skills are required";
    if (isCustomSource && !data.source.trim()) newErrors.source = "Please specify source";
    if (!data.currentTakeHome.trim()) newErrors.currentTakeHome = "Required";
    if (!data.expectedTakeHome.trim()) newErrors.expectedTakeHome = "Required";
    if (!data.education.trim()) newErrors.education = "Qualification is required";
    if (!data.source.trim()) newErrors.source = "Source is required";
    if (data.status.length === 0) newErrors.status = "Status is required";
    if (!data.dateAdded) newErrors.dateAdded = "Date Added is required";
    if (!data.gender) newErrors.gender = "Gender is required";
    if (!data.currentLocation.trim()) newErrors.currentLocation = "Location is required";
    if (!data.servingNoticePeriod) newErrors.servingNoticePeriod = "Notice Status required";
    if (data.servingNoticePeriod === 'true' && data.isNegotiable === 'Yes' && !data.noticePeriodDays.trim()) {
      newErrors.noticePeriodDays = "Days required";
    }
    if (data.offersInHand === 'true' && !data.offerPackage.trim()) newErrors.offerPackage = "Please specify package amount";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const countStatus = (s: string) => candidates.filter(c =>
      Array.isArray(c.status) ? c.status.includes(s) : c.status === s
    ).length;
    return {
      total: candidates.length,
      turnups: countStatus('Turnups'),
      noShow: countStatus('No Show'),
      yetToAttend: countStatus('Yet to attend'),
      selected: countStatus('Selected'),
      rejected: countStatus('Rejected'),
      hold: countStatus('Hold'),
      joined: countStatus('Joined'),
      pipeline: countStatus('Pipeline'),
      backout: countStatus('Backout'),
      sharedProfiles: countStatus('Shared Profiles'),
    };
  }, [candidates]);

  // --- Filter Logic ---
  const getFilteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const searchMatch =
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.candidateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(c.skills) && c.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));
      const currentStatusArr = Array.isArray(c.status) ? c.status : [c.status || ''];
      let statCardMatch = true;
      if (activeStatFilter) { statCardMatch = currentStatusArr.includes(activeStatFilter); }
      const statusDropdownMatch = statusFilter === 'all' || currentStatusArr.includes(statusFilter);
      return searchMatch && statusDropdownMatch && statCardMatch;
    });
  }, [candidates, searchTerm, statusFilter, activeStatFilter]);

  // --- Export ---
  const handleExport = () => {
    if (getFilteredCandidates.length === 0) { toast({ title: "No data to export", variant: "destructive" }); return; }
    const headers = ["Candidate ID", "Name", "Email", "Phone", "Client", "Position", "Status", "Total Exp", "Current CTC", "Expected CTC", "Take Home", "Skills", "Date Added"];
    const escapeCsv = (str: string | undefined | number | null) => str ? `"${String(str).replace(/"/g, '""')}"` : '""';
    const rows = getFilteredCandidates.map(c => [
      escapeCsv(getCandidateId(c)), escapeCsv(c.name), escapeCsv(c.email), escapeCsv(c.contact),
      escapeCsv(c.client), escapeCsv(c.position),
      escapeCsv(Array.isArray(c.status) ? c.status.join(' | ') : c.status),
      escapeCsv(c.totalExperience), escapeCsv(c.ctc), escapeCsv(c.ectc), escapeCsv(c.takeHomeSalary),
      escapeCsv(Array.isArray(c.skills) ? c.skills.join(', ') : c.skills),
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
    if (status === 'Joined' || status === 'Selected') return 'default';
    if (status === 'Rejected' || status === 'Backout' || status === 'No Show') return 'destructive';
    if (status === 'Hold' || status === 'Yet to attend' || status === 'Turnups') return 'secondary';
    return 'outline';
  };

  const getInitials = (n: string) => n.split(' ').map(i => i[0]).join('').toUpperCase().substring(0, 2);
  const getCandidateId = (c: BackendCandidate) => c.candidateId || c._id.substring(c._id.length - 6).toUpperCase();
  const formatSkills = (skills: string | string[] | undefined) =>
    !skills ? 'N/A' :
    Array.isArray(skills) ? skills.slice(0, 3).join(', ') + (skills.length > 3 ? '...' : '') :
    skills.length > 50 ? skills.substring(0, 50) + '...' : skills;
  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  const toggleSelectCandidate = (id: string) =>
    setSelectedCandidates(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  const selectAllCandidates = () =>
    setSelectedCandidates(selectedCandidates.length === getFilteredCandidates.length ? [] : getFilteredCandidates.map(c => c._id));

  const getAssignedJobTitle = (jobId?: string | { _id: string, name: string, position?: string, clientName?: string }) => {
    if (!jobId) return 'Not Assigned';
    if (typeof jobId === 'object') return `${jobId.position} (${jobId.clientName})`;
    const job = jobs.find(j => j._id === jobId);
    return job ? `${job.position} (${job.clientName})` : jobId;
  };

  // --- Dialog Handlers ---
  const openViewDialog = (c: BackendCandidate) => { setViewingCandidate(c); setIsViewDialogOpen(true); };

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
      position: c.position || '', client: c.client || '',
      industry: c.industry || '', currentCompany: c.currentCompany || '',
      skills: Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || '',
      totalExperience: c.totalExperience ? String(c.totalExperience) : '',
      relevantExperience: c.relevantExperience ? String(c.relevantExperience) : '',
      education: c.education || '',
      ctc: c.ctc ? String(c.ctc) : '', ectc: c.ectc ? String(c.ectc) : '',
      takeHomeSalary: c.takeHomeSalary ? String(c.takeHomeSalary) : '',
      currentTakeHome: '', expectedTakeHome: '',
      noticePeriod: c.noticePeriod ? String(c.noticePeriod) : '',
      servingNoticePeriod: c.servingNoticePeriod ? 'true' : 'false',
      isNegotiable: c.isNegotiable || 'No',
      noticePeriodDays: c.noticePeriodDays || '',
      offersInHand: c.offersInHand ? 'true' : 'false',
      offerPackage: c.offerPackage || '',
      source: c.source || 'Portal',
      status: Array.isArray(c.status) ? c.status : [c.status || 'Submitted'],
      rating: c.rating?.toString() || '0',
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
      const headers = {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      };
      const payload = {
        ...formData,
        assignedJobId: typeof formData.assignedJobId === 'object' ? (formData.assignedJobId as any)._id : formData.assignedJobId,
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
    } finally {
      setIsSubmitting(false);
    }
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

  const handleBulkDelete = async () => {
    if (selectedCandidates.length === 0) return;
    setIsDeleting(true);
    try {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` };
      const deletePromises = selectedCandidates.map(id =>
        fetch(`${API_URL}/candidates/${id}`, { method: 'DELETE', headers })
      );
      await Promise.all(deletePromises);
      toast({ title: "Deleted", description: `${selectedCandidates.length} candidate(s) deleted successfully` });
      setSelectedCandidates([]);
      fetchData();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Delete error", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete one or more candidates" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      toast({ title: 'No file selected', description: 'Please select an Excel file to import', variant: 'destructive' });
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const response = await fetch(`${API_URL}/candidates/bulk-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` },
        body: fd,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Import failed');
      const successCount = result.imported ?? 0;
      const createdCount = result.created ?? successCount;
      const updatedCount = result.updated ?? 0;
      const failCount = Math.max(0, (result.total ?? 0) - successCount);
      const errorMessages = (result.errors || []).map((e: any) =>
        typeof e === 'string' ? e : `Row ${e.row} (${e.candidate}): ${e.error}`
      );
      setImportResult({ success: successCount, failed: failCount, errors: errorMessages });
      if (successCount > 0) {
        const parts = [];
        if (createdCount > 0) parts.push(`${createdCount} new added`);
        if (updatedCount > 0) parts.push(`${updatedCount} existing updated`);
        toast({ title: 'Import Successful', description: parts.join(', ') + '.' });
        fetchData();
      } else {
        toast({ title: 'Nothing Imported', description: result.message || 'No candidates were added.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleWhatsApp = (c: BackendCandidate) => {
    if (!c.contact) return;
    let phone = c.contact.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const firstName = c.name.split(' ')[0];
    const message = `Hi ${firstName}, this is regarding your job application for the ${c.position} position at ${c.client}. Are you available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Candidates</h1>
              <p className="text-sm text-slate-500">Manage pipeline</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCandidates.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirmOpen(true)} className="animate-in fade-in zoom-in-95">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedCandidates.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export</Button>
              <Button variant="outline" size="sm" onClick={() => { setIsImportDialogOpen(true); setImportFile(null); setImportResult(null); }}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Import Excel
              </Button>
              <Button size="sm" onClick={() => { setFormData(initialFormState); setErrors({}); setIsAddDialogOpen(true); setIsCustomSource(false); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Candidate
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard title="Total" value={stats.total} color="blue" active={activeStatFilter === null} onClick={() => { setActiveStatFilter(null); setStatusFilter('all'); }} />
            <StatCard title="Turnups" value={stats.turnups} color="cyan" active={activeStatFilter === 'Turnups'} onClick={() => { setActiveStatFilter('Turnups'); setStatusFilter('all'); }} />
            <StatCard title="No Show" value={stats.noShow} color="red" active={activeStatFilter === 'No Show'} onClick={() => { setActiveStatFilter('No Show'); setStatusFilter('all'); }} />
            <StatCard title="Yet to Attend" value={stats.yetToAttend} color="indigo" active={activeStatFilter === 'Yet to attend'} onClick={() => { setActiveStatFilter('Yet to attend'); setStatusFilter('all'); }} />
            <StatCard title="Selected" value={stats.selected} color="green" active={activeStatFilter === 'Selected'} onClick={() => { setActiveStatFilter('Selected'); setStatusFilter('all'); }} />
            <StatCard title="Rejected" value={stats.rejected} color="rose" active={activeStatFilter === 'Rejected'} onClick={() => { setActiveStatFilter('Rejected'); setStatusFilter('all'); }} />
            <StatCard title="Hold" value={stats.hold} color="amber" active={activeStatFilter === 'Hold'} onClick={() => { setActiveStatFilter('Hold'); setStatusFilter('all'); }} />
            <StatCard title="Pipeline" value={stats.pipeline} color="purple" active={activeStatFilter === 'Pipeline'} onClick={() => setActiveStatFilter('Pipeline')} />
            <StatCard title="Joined" value={stats.joined} color="emerald" active={activeStatFilter === 'Joined'} onClick={() => setActiveStatFilter('Joined')} />
            <StatCard title="Backout" value={stats.backout} color="orange" active={activeStatFilter === 'Backout'} onClick={() => { setActiveStatFilter('Backout'); setStatusFilter('all'); }} />
            <StatCard title="Shared Profiles" value={stats.sharedProfiles} color="indigo" active={activeStatFilter === 'Shared Profiles'} onClick={() => { setActiveStatFilter('Shared Profiles'); setStatusFilter('all'); }} />
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by name, email, ID, skills..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setActiveStatFilter(null); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {allStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-1">
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700 border-b">
                    <tr>
                      <th className="p-3 text-left w-8">
                        <input type="checkbox" checked={getFilteredCandidates.length > 0 && selectedCandidates.length === getFilteredCandidates.length} onChange={selectAllCandidates} className="h-4 w-4 rounded border-slate-300" />
                      </th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">S.No</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">ID</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Phone</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Skills</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Date Added</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Experience</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">CTC / ECTC</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Notice</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Remarks</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {getFilteredCandidates.map((c, index) => (
                      <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedCandidates.includes(c._id)} onChange={() => toggleSelectCandidate(c._id)} className="h-4 w-4 rounded" />
                        </td>
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3">
                          <span className="font-mono text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => { navigator.clipboard.writeText(getCandidateId(c)); toast({ title: "Copied ID" }); }}>
                            {getCandidateId(c)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{getInitials(c.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span>{c.contact}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-green-600" onClick={() => handleWhatsApp(c)}>
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[160px] truncate">{c.email}</td>
                        <td className="p-3 text-slate-600">{c.client}</td>
                        <td className="p-3 text-slate-600 max-w-[140px] truncate">{formatSkills(c.skills)}</td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">{formatDate(c.dateAdded)}</td>
                        <td className="p-3 text-slate-600">{c.totalExperience} Yrs</td>
                        <td className="p-3">
                          <div className="text-xs">
                            <div className="text-slate-600">{c.ctc || '-'}</div>
                            <div className="text-slate-400">{c.ectc || '-'}</div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{c.noticePeriod || '-'}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(c.status)
                              ? c.status.map(s => (<Badge key={s} variant={getStatusBadgeVariant(s)} className="text-xs">{s}</Badge>))
                              : <Badge variant={getStatusBadgeVariant(c.status as string)} className="text-xs">{c.status}</Badge>
                            }
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[120px] truncate">{c.remarks}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openViewDialog(c)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(c)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActiveStatus(c._id, c.active !== false)}>
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getFilteredCandidates.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No candidates found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredCandidates.map(c => (
                <Card key={c._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">{getInitials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{c.name}</h3>
                          <p className="text-xs text-slate-400 font-mono">{getCandidateId(c)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Array.isArray(c.status) ? c.status.slice(0, 2).map(s => (
                        <Badge key={s} variant={getStatusBadgeVariant(s)} className="text-xs">{s}</Badge>
                      )) : <Badge variant={getStatusBadgeVariant(c.status as string)} className="text-xs">{c.status}</Badge>}
                      {Array.isArray(c.status) && c.status.length > 2 && <Badge variant="outline" className="text-xs">+{c.status.length - 2}</Badge>}
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 mb-3">
                      <div className="flex items-center gap-1"><Building className="h-3 w-3" />{c.client}</div>
                      <div className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{formatSkills(c.skills)}</div>
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</div>
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.contact}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setViewingCandidate(c)}>View</Button>
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => openEditDialog(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => handleWhatsApp(c)}>
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getFilteredCandidates.length === 0 && (
                <div className="col-span-full text-center py-16 text-slate-400">
                  <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No candidates found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCandidates.length} selected candidate(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Candidate Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={open => { if (!open) { setIsAddDialogOpen(false); setIsEditDialogOpen(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
          </DialogHeader>

          {!isEditDialogOpen && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-blue-800 text-sm">Upload Resume to Auto-Fill</p>
                  <p className="text-xs text-blue-600 mt-0.5">Upload PDF or DOC/DOCX file (max 5MB)</p>
                </div>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700" onClick={() => document.getElementById('resume-upload-recruiter')?.click()}>
                  {isParsingResume ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Parsing...</> : <><FileUp className="mr-2 h-3 w-3" />Choose File</>}
                </Button>
                <input id="resume-upload-recruiter" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            {/* Section Header */}
            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Personal Information
            </div>

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

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={formData.dateOfBirth} onChange={e => handleInputChange('dateOfBirth', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className={errors.gender ? "text-red-500" : ""}>Gender *</Label>
              <Select value={formData.gender} onValueChange={val => handleInputChange('gender', val)}>
                <SelectTrigger className={errors.gender ? "border-red-500" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={formData.linkedin} onChange={e => handleInputChange('linkedin', e.target.value)} placeholder="Profile URL" />
            </div>

            <div className="space-y-2">
              <Label className={errors.currentLocation ? "text-red-500" : ""}>Current Location *</Label>
              <Input value={formData.currentLocation} onChange={e => handleInputChange('currentLocation', e.target.value)} className={errors.currentLocation ? "border-red-500" : ""} />
            </div>

            <div className="space-y-2">
              <Label>Preferred Location</Label>
              <Input value={formData.preferredLocation} onChange={e => handleInputChange('preferredLocation', e.target.value)} />
            </div>

            {/* Professional */}
            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Professional Information
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={formData.position} onValueChange={val => handleInputChange('position', val)}>
                <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                <SelectContent>{uniquePositions.map(pos => (<SelectItem key={pos} value={pos}>{pos}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={formData.client} onValueChange={val => handleInputChange('client', val)}>
                <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent>{clients.map(client => (<SelectItem key={client._id} value={client.companyName}>{client.companyName}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Current Company</Label>
              <Input value={formData.currentCompany} onChange={e => handleInputChange('currentCompany', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={formData.industry} onChange={e => handleInputChange('industry', e.target.value)} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className={errors.skills ? "text-red-500" : ""}>Skills (comma separated) *</Label>
              <Input value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} className={errors.skills ? "border-red-500" : ""} />
              {errors.skills && <span className="text-xs text-red-500">{errors.skills}</span>}
            </div>

            {/* Education */}
            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Education
            </div>

            <div className="md:col-span-3 space-y-2">
              <Label className={errors.education ? "text-red-500" : ""}>Qualification *</Label>
              <Input value={formData.education} onChange={e => handleInputChange('education', e.target.value)} className={errors.education ? "border-red-500" : ""} placeholder="e.g. B.Tech from IIT Delhi" />
            </div>

            {/* Experience & Pay */}
            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Experience & Pay
            </div>

            <div className="space-y-2">
              <Label>Total Exp (Yrs)</Label>
              <Input value={formData.totalExperience} onChange={e => handleInputChange('totalExperience', e.target.value)} placeholder="Numbers only" />
            </div>

            <div className="space-y-2">
              <Label>Relevant Exp (Yrs)</Label>
              <Input value={formData.relevantExperience} onChange={e => handleInputChange('relevantExperience', e.target.value)} placeholder="Numbers only" />
            </div>

            <div className="space-y-2">
              <Label>Current CTC <span className="text-slate-400 font-normal text-xs">(Lakhs)</span></Label>
              <Input value={formData.ctc} onChange={e => handleInputChange('ctc', e.target.value)} placeholder="Numbers only" />
            </div>

            <div className="space-y-2">
              <Label>Expected CTC <span className="text-slate-400 font-normal text-xs">(Lakhs)</span></Label>
              <Input value={formData.ectc} onChange={e => handleInputChange('ectc', e.target.value)} placeholder="Numbers only" />
            </div>

            <div className="space-y-2">
              <Label className={errors.currentTakeHome ? "text-red-500" : ""}>Current Take Home <span className="text-slate-400 font-normal text-xs">(Thousands)</span> *</Label>
              <Input value={formData.currentTakeHome} onChange={e => handleInputChange('currentTakeHome', e.target.value)} className={errors.currentTakeHome ? "border-red-500" : ""} placeholder="Numbers only" />
              {errors.currentTakeHome && <span className="text-xs text-red-500">{errors.currentTakeHome}</span>}
            </div>

            <div className="space-y-2">
              <Label className={errors.expectedTakeHome ? "text-red-500" : ""}>Expected Take Home <span className="text-slate-400 font-normal text-xs">(Thousands)</span> *</Label>
              <Input value={formData.expectedTakeHome} onChange={e => handleInputChange('expectedTakeHome', e.target.value)} className={errors.expectedTakeHome ? "border-red-500" : ""} placeholder="Numbers only" />
              {errors.expectedTakeHome && <span className="text-xs text-red-500">{errors.expectedTakeHome}</span>}
            </div>

            {/* Notice Period Logic */}
            <div className="space-y-2">
              <Label className={errors.servingNoticePeriod ? "text-red-500" : ""}>Serving Notice *</Label>
              <Select value={formData.servingNoticePeriod} onValueChange={val => handleInputChange('servingNoticePeriod', val)}>
                <SelectTrigger className={errors.servingNoticePeriod ? "border-red-500" : ""}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.servingNoticePeriod === 'true' && (
              <div className="space-y-2">
                <Label>Negotiable</Label>
                <Select value={formData.isNegotiable} onValueChange={val => handleInputChange('isNegotiable', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.servingNoticePeriod === 'true' && formData.isNegotiable === 'Yes' && (
              <div className="space-y-2">
                <Label className={errors.noticePeriodDays ? "text-red-500" : ""}>Days Remaining *</Label>
                <Input value={formData.noticePeriodDays} onChange={e => handleInputChange('noticePeriodDays', e.target.value)} className={errors.noticePeriodDays ? "border-red-500" : ""} placeholder="e.g. 30" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Offers in Hand?</Label>
              <Select value={formData.offersInHand} onValueChange={val => handleInputChange('offersInHand', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.offersInHand === 'true' && (
              <div className="space-y-2">
                <Label className={errors.offerPackage ? "text-red-500" : ""}>Package Amount *</Label>
                <Input value={formData.offerPackage} onChange={e => handleInputChange('offerPackage', e.target.value)} placeholder="e.g. 15 LPA" />
                {errors.offerPackage && <span className="text-xs text-red-500">{errors.offerPackage}</span>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason For Change</Label>
              <textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} className="w-full border rounded-md p-2 h-10 text-sm" placeholder="Reason for changing" />
            </div>

            {/* Recruitment Details */}
            <div className="md:col-span-3 font-semibold text-slate-500 border-b pb-1 mt-4 flex items-center gap-2">
              <Target className="h-4 w-4" /> Recruitment Details
            </div>

            <div className="space-y-2">
              <Label className={errors.source ? "text-red-500" : ""}>Source *</Label>
              <Select value={isCustomSource ? 'Other' : formData.source} onValueChange={v => {
                if (v === 'Other') { setIsCustomSource(true); handleInputChange('source', ''); }
                else { setIsCustomSource(false); handleInputChange('source', v); }
              }}>
                <SelectTrigger className={errors.source ? "border-red-500" : ""}><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  {standardSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
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

            {/* Status Multi-Select */}
            <div className="space-y-2">
              <Label className={errors.status ? "text-red-500" : ""}>Status (Multi-select) *</Label>
              <div className={`border rounded-md p-2 min-h-[42px] flex flex-wrap gap-2 bg-white dark:bg-slate-900 ${errors.status ? 'border-red-500' : ''}`}>
                {formData.status.length > 0 ? (
                  formData.status.map(status => (
                    <Badge key={status} variant="secondary" className="flex items-center gap-1">
                      {status}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeStatus(status)} />
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 p-1">No status selected</span>
                )}
              </div>
              <Select key={formData.status.length} onValueChange={addStatus}>
                <SelectTrigger><SelectValue placeholder="Add a status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELECT_ALL" className="font-bold border-b border-slate-200 mb-1 text-blue-600">
                    <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Select All</div>
                  </SelectItem>
                  {allStatuses.map(status => (
                    <SelectItem key={status} value={status} disabled={formData.status.includes(status)}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <span className="text-xs text-red-500">{errors.status}</span>}
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={formData.rating} onValueChange={v => handleInputChange('rating', v)}>
                <SelectTrigger><SelectValue placeholder="Rate" /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={r.toString()}>{r} Stars</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={errors.dateAdded ? "text-red-500" : ""}>Date Added *</Label>
              <Input type="date" value={formData.dateAdded} onChange={e => handleInputChange('dateAdded', e.target.value)} className={errors.dateAdded ? "border-red-500" : ""} />
            </div>

            <div className="md:col-span-3 space-y-2 mt-2">
              <Label>Remarks</Label>
              <Textarea value={formData.remarks} onChange={e => handleInputChange('remarks', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>Cancel</Button>
            <Button onClick={() => handleSave(isEditDialogOpen)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditDialogOpen ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={open => { setIsImportDialogOpen(open); if (!open) { setImportFile(null); setImportResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-green-600" /> Import Candidates from Excel</DialogTitle>
            <DialogDescription>Upload an Excel file (.xlsx / .xls) to bulk-import candidates. Download the template below to ensure the correct column format.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">Required Excel Columns:</p>
              <p className="text-xs text-blue-700 leading-relaxed">name, email, contact, position, client, skills (comma-separated), totalExperience, ctc, ectc, noticePeriod, currentCompany, currentLocation, source, status</p>
              <Button variant="link" size="sm" className="p-0 h-auto text-blue-600 mt-1" onClick={() => {
                const headers = ['name', 'email', 'contact', 'position', 'client', 'skills', 'totalExperience', 'ctc', 'ectc', 'noticePeriod', 'currentCompany', 'currentLocation', 'source', 'status'];
                const exampleRow = ['John Doe', 'john@example.com', '9876543210', 'Software Engineer', 'Acme Corp', 'React,Node.js', '3', '6 LPA', '8 LPA', '30 days', 'TCS', 'Bangalore', 'Portal', 'Submitted'];
                const csv = [headers.join(','), exampleRow.join(',')].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'candidate_import_template.csv'; a.click();
              }}>↓ Download Template (CSV)</Button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors" onClick={() => document.getElementById('excel-import-input')?.click()}>
              <FileSpreadsheet className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              {importFile ? (
                <div><p className="font-semibold text-green-700">{importFile.name}</p><p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(1)} KB</p></div>
              ) : (
                <div><p className="text-slate-600 font-medium">Click to choose Excel file</p><p className="text-xs text-slate-400 mt-1">.xlsx or .xls, max 10MB</p></div>
              )}
              <input id="excel-import-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} />
            </div>

            {importResult && (
              <div className={`rounded-lg p-4 text-sm ${importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <p className="font-semibold text-green-700">✅ {importResult.success} candidate(s) processed successfully</p>
                {importResult.failed > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-red-600">❌ {importResult.failed} rows failed</p>
                    <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                      {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={!importFile || isImporting} onClick={handleImportExcel}>
              {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : <><FileSpreadsheet className="mr-2 h-4 w-4" />Import Now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewingCandidate && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600 text-white">{getInitials(viewingCandidate.name)}</AvatarFallback></Avatar>
                {viewingCandidate.name}
                <div className="ml-auto flex flex-wrap gap-2">
                  {Array.isArray(viewingCandidate.status)
                    ? viewingCandidate.status.map(s => <Badge key={s} variant={getStatusBadgeVariant(s)}>{s}</Badge>)
                    : <Badge variant={getStatusBadgeVariant(viewingCandidate.status as string)}>{viewingCandidate.status}</Badge>
                  }
                </div>
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
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-green-600" onClick={() => handleWhatsApp(viewingCandidate)}>
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div><Label className="text-xs text-slate-500">Date of Birth</Label><div>{formatDate(viewingCandidate.dateOfBirth)}</div></div>
                  <div><Label className="text-xs text-slate-500">Gender</Label><div>{viewingCandidate.gender || '-'}</div></div>
                  <div className="col-span-2"><Label className="text-xs text-slate-500">LinkedIn</Label><div>{viewingCandidate.linkedin ? <a href={viewingCandidate.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><Linkedin className="h-3 w-3" /> {viewingCandidate.linkedin}</a> : '-'}</div></div>
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
                  <div><Label className="text-xs text-slate-500">Take Home Salary</Label><div>{viewingCandidate.takeHomeSalary || '-'}</div></div>
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
                  {Array.isArray(viewingCandidate.status) && viewingCandidate.status.includes('Rejected') && (
                    <div className="col-span-2 text-red-600"><Label className="text-xs text-red-400">Rejection Reason</Label><div>{viewingCandidate.rejectionReason}</div></div>
                  )}
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <Label className="text-xs font-semibold text-yellow-700 flex items-center gap-2 mb-2"><FileText className="h-3 w-3" />Remarks</Label>
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap">{viewingCandidate.notes || 'No internal notes.'}</p>
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

const StatCard = ({ title, value, color, active, onClick }: any) => {
  const styles: any = {
    blue: "border-l-blue-500 text-blue-600 bg-blue-50/50",
    cyan: "border-l-cyan-500 text-cyan-600 bg-cyan-50/50",
    purple: "border-l-purple-500 text-purple-600 bg-purple-50/50",
    indigo: "border-l-indigo-500 text-indigo-600 bg-indigo-50/50",
    rose: "border-l-rose-500 text-rose-600 bg-rose-50/50",
    green: "border-l-green-500 text-green-600 bg-green-50/50",
    emerald: "border-l-emerald-500 text-emerald-600 bg-emerald-50/50",
    red: "border-l-red-500 text-red-600 bg-red-50/50",
    orange: "border-l-orange-500 text-orange-600 bg-orange-50/50",
    amber: "border-l-amber-500 text-amber-600 bg-amber-50/50",
  };
  const currentStyle = styles[color] || styles.blue;
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg shadow-sm border border-slate-200 border-l-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden bg-white ${currentStyle} ${active ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
    >
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-sm font-medium opacity-80">{title}</p>
        </div>
      </div>
      {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
      <div className={`absolute bottom-0 left-0 h-1 bg-current transition-all duration-300 opacity-20 ${active ? 'w-full' : 'w-0'}`} />
    </div>
  );
};