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
  Plus, Search, Edit, Filter, Download, Phone, Mail,
  Building, Briefcase, Loader2, Ban, List, LayoutGrid
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Candidate, Job } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Extend types for backend compatibility
interface BackendCandidate extends Candidate {
  _id: string;
  dateAdded?: string;
  assignedJobId?: string | { _id: string; position: string; clientName: string }; 
}

interface BackendJob extends Job {
  _id: string;
  deadline?: string;
}

export default function RecruiterCandidates() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Data State
  const [candidates, setCandidates] = useState<BackendCandidate[]>([]);
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);

  // UI & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  
  // Modal State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const initialFormState = {
    name: '', position: '', skills: '', client: '', contact: '', email: '',
    status: 'Submitted', notes: '', totalExperience: '', relevantExperience: '',
    ctc: '', ectc: '', noticePeriod: '', assignedJobId: '', 
    dateAdded: new Date().toISOString().split('T')[0], active: true
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- 1. Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` };

      const [candRes, jobRes] = await Promise.all([
        fetch(`${API_URL}/candidates`, { headers }),
        fetch(`${API_URL}/jobs`, { headers })
      ]);

      if (candRes.ok && jobRes.ok) {
        const allCandidates = await candRes.json();
        const allJobs = await jobRes.json();

        // Filter for current recruiter and Active candidates only
        const myCandidates = allCandidates.filter((c: any) => 
          (c.recruiterId === user?.id || c.recruiterId?._id === user?.id) && c.active !== false
        );
        
        const myJobs = allJobs.filter((j: any) => 
          j.primaryRecruiter === user?.name || j.secondaryRecruiter === user?.name
        );

        setCandidates(myCandidates);
        setJobs(myJobs);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Validation ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const data = formData;

    if (!data.name.trim()) newErrors.name = "Name is required";
    else if (data.name.length < 2) newErrors.name = "Name too short";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(data.email)) newErrors.email = "Invalid email";

    const phoneRegex = /^[0-9+\s-]{10,15}$/;
    if (!data.contact.trim()) newErrors.contact = "Phone is required";
    else if (!phoneRegex.test(data.contact)) newErrors.contact = "Invalid phone format";

    if (!data.position.trim()) newErrors.position = "Position is required";
    if (!data.client.trim()) newErrors.client = "Client is required";
    if (!data.skills.toString().trim()) newErrors.skills = "Skills are required";

    // Numeric checks if present
    if (data.totalExperience && isNaN(parseFloat(data.totalExperience))) newErrors.totalExperience = "Number expected";
    if (data.relevantExperience && isNaN(parseFloat(data.relevantExperience))) newErrors.relevantExperience = "Number expected";
    if (data.ctc && isNaN(parseFloat(data.ctc))) newErrors.ctc = "Number expected";
    if (data.ectc && isNaN(parseFloat(data.ectc))) newErrors.ectc = "Number expected";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 2. Helper Functions ---
  const getFilteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const searchMatch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.candidateId && c.candidateId.toLowerCase().includes(searchTerm.toLowerCase()));

      const statusMatch = statusFilter === 'all' || c.status === statusFilter;

      let statCardMatch = true;
      if (activeStatFilter) {
        if (activeStatFilter === 'submitted') statCardMatch = c.status === 'Submitted';
        if (activeStatFilter === 'interview') statCardMatch = c.status.includes('Interview');
        if (activeStatFilter === 'offer') statCardMatch = c.status === 'Offer';
      }

      return searchMatch && statusMatch && statCardMatch;
    });
  }, [candidates, searchTerm, statusFilter, activeStatFilter]);

  const stats = useMemo(() => ({
    total: candidates.length,
    submitted: candidates.filter(c => c.status === 'Submitted').length,
    interview: candidates.filter(c => c.status.includes('Interview')).length,
    offer: candidates.filter(c => c.status === 'Offer').length,
    joined: candidates.filter(c => c.status === 'Joined').length,
    rejected: candidates.filter(c => c.status === 'Rejected').length
  }), [candidates]);

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'Offer' || status === 'Joined') return 'default'; 
    if (status === 'Rejected') return 'destructive';
    if (status.includes('Interview')) return 'secondary'; 
    return 'outline';
  };

  const getInitials = (n: string) => n.split(' ').map(i => i[0]).join('').toUpperCase().substring(0,2);

  const getAssignedJobTitle = (candidateJobId: string | any) => {
    if (!candidateJobId) return 'N/A';
    if (typeof candidateJobId === 'object' && candidateJobId.position) return `${candidateJobId.position} (${candidateJobId.clientName})`;
    const job = jobs.find(j => (j._id || j.id) === candidateJobId);
    return job ? `${job.position} - ${job.clientName}` : 'N/A';
  };

  // --- 3. Handlers ---
  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  const openEditDialog = (c: BackendCandidate) => {
    setErrors({});
    setSelectedCandidateId(c._id || c.id);
    const jobIdValue = typeof c.assignedJobId === 'object' && c.assignedJobId !== null 
      ? c.assignedJobId._id 
      : (c.assignedJobId || '');

    setFormData({
      name: c.name,
      position: c.position,
      skills: Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || '',
      client: c.client || '',
      contact: c.contact || '',
      email: c.email || '',
      status: c.status,
      notes: c.notes || '',
      totalExperience: c.totalExperience || '',
      relevantExperience: c.relevantExperience || '',
      ctc: c.ctc || '',
      ectc: c.ectc || '',
      noticePeriod: c.noticePeriod || '',
      assignedJobId: jobIdValue,
      dateAdded: c.dateAdded ? new Date(c.dateAdded).toISOString().split('T')[0] : '',
      active: c.active !== false
    });
    setIsEditDialogOpen(true);
  };

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
        recruiterId: user?.id, 
        recruiterName: user?.name
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
      } else {
        throw new Error("Operation failed");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save candidate" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if(!confirm("Are you sure you want to deactivate this candidate? They will be hidden from the active list.")) return;
    try {
      await fetch(`${API_URL}/candidates/${id}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: false })
      });
      toast({ title: "Deactivated", description: "Candidate deactivated successfully" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Deactivation failed" });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "Copied", description: "ID copied to clipboard" });
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
         <div className="max-w-[1600px] mx-auto space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Candidates</h1>
                    <p className="text-slate-500">Manage and track your candidate pipeline</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="hidden sm:flex"><Download className="mr-2 h-4 w-4"/> Export</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setFormData(initialFormState); setErrors({}); setIsAddDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4"/> Add Candidate
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <StatCard title="Total" value={stats.total} color="blue" active={activeStatFilter === null} onClick={() => setActiveStatFilter(null)} />
                <StatCard title="Submitted" value={stats.submitted} color="slate" active={activeStatFilter === 'submitted'} onClick={() => setActiveStatFilter('submitted')} />
                <StatCard title="Interview" value={stats.interview} color="orange" active={activeStatFilter === 'interview'} onClick={() => setActiveStatFilter('interview')} />
                <StatCard title="Offer" value={stats.offer} color="purple" active={activeStatFilter === 'offer'} onClick={() => setActiveStatFilter('offer')} />
                <StatCard title="Joined" value={stats.joined} color="green" onClick={() => {}} />
                <StatCard title="Rejected" value={stats.rejected} color="red" onClick={() => {}} />
            </div>

            <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                        <Input 
                            placeholder="Search candidates..." 
                            className="pl-10 bg-slate-50 dark:bg-slate-800 border-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4"/> <SelectValue placeholder="Status"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="Interview">Interview</SelectItem>
                                <SelectItem value="Offer">Offer</SelectItem>
                                <SelectItem value="Joined">Joined</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <Button 
                                variant="ghost" size="sm" 
                                className={viewMode === 'table' ? 'bg-white shadow-sm' : ''}
                                onClick={() => setViewMode('table')}
                            ><List className="h-4 w-4"/></Button>
                            <Button 
                                variant="ghost" size="sm" 
                                className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
                                onClick={() => setViewMode('grid')}
                            ><LayoutGrid className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </div>
            </Card>

            {viewMode === 'table' ? (
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4 w-[50px]">S.No</th>
                                    <th className="p-4">Candidate Details</th>
                                    <th className="p-4">Job / Client</th>
                                    <th className="p-4">Experience & NP</th>
                                    <th className="p-4">Compensation</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {getFilteredCandidates.map((c, index) => (
                                    <tr key={c._id || c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-slate-500">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(c.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                                                    <div className="text-xs text-slate-500 mb-1">{c.email}</div>
                                                    <div className="flex items-center gap-2">
                                                        <code 
                                                            className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] cursor-pointer hover:bg-slate-200 text-slate-500" 
                                                            onClick={() => copyId(c.candidateId || c._id)}
                                                            title="Click to copy ID"
                                                        >
                                                            {c.candidateId || c._id.substring(0,6)}
                                                        </code>
                                                        <span className="flex items-center text-xs text-slate-500">
                                                            <Phone className="h-3 w-3 mr-1" /> {c.contact}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{c.position}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Building className="h-3 w-3"/> {c.client}
                                            </div>
                                            <div className="text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded mt-2 inline-block">
                                                <span className="font-semibold">For: </span>
                                                {getAssignedJobTitle(c.assignedJobId)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                                                <div className="flex justify-between w-full max-w-[120px]">
                                                    <span>Total Exp:</span>
                                                    <span className="font-medium">{c.totalExperience || 0}y</span>
                                                </div>
                                                <div className="flex justify-between w-full max-w-[120px]">
                                                    <span>Rel Exp:</span>
                                                    <span className="font-medium">{c.relevantExperience || 0}y</span>
                                                </div>
                                                <div className="flex justify-between w-full max-w-[120px] text-orange-600 dark:text-orange-400">
                                                    <span>Notice:</span>
                                                    <span className="font-medium">{c.noticePeriod || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-1.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Current</span>
                                                    <span className="font-medium text-sm">{c.ctc || 'N/A'} LPA</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Expected</span>
                                                    <span className="font-medium text-sm text-green-600">{c.ectc || 'N/A'} LPA</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50" onClick={() => openEditDialog(c)}>
                                                    <Edit className="h-4 w-4 text-blue-600"/>
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50" onClick={() => handleDeactivate(c._id)} title="Deactivate">
                                                    <Ban className="h-4 w-4 text-red-600"/>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {getFilteredCandidates.length === 0 && <div className="p-12 text-center text-slate-500">No candidates found matching your filters.</div>}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredCandidates.map(c => (
                        <Card key={c._id || c.id} className="hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">{getInitials(c.name)}</AvatarFallback></Avatar>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{c.name}</h3>
                                            <p className="text-sm text-slate-500">{c.position}</p>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                                </div>
                                <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 mb-5">
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded"><Building className="h-4 w-4 text-slate-400"/> {c.client}</div>
                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400"/> <span className="truncate">{c.email}</span></div>
                                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400"/> {c.contact}</div>
                                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-400"/> For: {getAssignedJobTitle(c.assignedJobId)}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-center p-1 bg-slate-50 rounded">Exp: {c.totalExperience}y</div>
                                    <div className="text-center p-1 bg-slate-50 rounded">CTC: {c.ctc}</div>
                                    <div className="text-center p-1 bg-slate-50 rounded">NP: {c.noticePeriod}</div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" className="w-full" size="sm" onClick={() => openEditDialog(c)}>Edit</Button>
                                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700" size="sm" onClick={() => handleDeactivate(c._id)}>Deactivate</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
         </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if(!open) { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{isEditDialogOpen ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
                <DialogDescription>Fill in the details below. Required fields marked with *</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                    <Label className={errors.name ? "text-red-500" : ""}>Name *</Label>
                    <Input 
                        value={formData.name} 
                        onChange={e => handleInputChange('name', e.target.value)} 
                        className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.email ? "text-red-500" : ""}>Email *</Label>
                    <Input 
                        value={formData.email} 
                        onChange={e => handleInputChange('email', e.target.value)} 
                        className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.contact ? "text-red-500" : ""}>Phone *</Label>
                    <Input 
                        value={formData.contact} 
                        onChange={e => handleInputChange('contact', e.target.value)} 
                        className={errors.contact ? "border-red-500" : ""}
                    />
                    {errors.contact && <span className="text-xs text-red-500">{errors.contact}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.position ? "text-red-500" : ""}>Position *</Label>
                    <Input 
                        value={formData.position} 
                        onChange={e => handleInputChange('position', e.target.value)} 
                        className={errors.position ? "border-red-500" : ""}
                    />
                    {errors.position && <span className="text-xs text-red-500">{errors.position}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.client ? "text-red-500" : ""}>Client *</Label>
                    <Input 
                        value={formData.client} 
                        onChange={e => handleInputChange('client', e.target.value)} 
                        className={errors.client ? "border-red-500" : ""}
                    />
                    {errors.client && <span className="text-xs text-red-500">{errors.client}</span>}
                </div>
                
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={val => handleInputChange('status', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="L1 Interview">L1 Interview</SelectItem>
                            <SelectItem value="L2 Interview">L2 Interview</SelectItem>
                            <SelectItem value="Final Interview">Final Interview</SelectItem>
                            <SelectItem value="HR Interview">HR Interview</SelectItem>
                            <SelectItem value="Offer">Offer</SelectItem>
                            <SelectItem value="Joined">Joined</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Assigned Job</Label>
                    <Select value={formData.assignedJobId} onValueChange={val => handleInputChange('assignedJobId', val)}>
                        <SelectTrigger><SelectValue placeholder="Select Job" /></SelectTrigger>
                        <SelectContent>
                            {jobs.map(j => <SelectItem key={j._id || j.id} value={j._id || j.id}>{j.position} - {j.clientName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Row */}
                <div className="space-y-2">
                    <Label className={errors.totalExperience ? "text-red-500" : ""}>Total Exp (Years)</Label>
                    <Input 
                        value={formData.totalExperience} 
                        onChange={e => handleInputChange('totalExperience', e.target.value)} 
                        className={errors.totalExperience ? "border-red-500" : ""}
                    />
                    {errors.totalExperience && <span className="text-xs text-red-500">{errors.totalExperience}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.relevantExperience ? "text-red-500" : ""}>Relevant Exp</Label>
                    <Input 
                        value={formData.relevantExperience} 
                        onChange={e => handleInputChange('relevantExperience', e.target.value)} 
                        className={errors.relevantExperience ? "border-red-500" : ""}
                    />
                    {errors.relevantExperience && <span className="text-xs text-red-500">{errors.relevantExperience}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.ctc ? "text-red-500" : ""}>Current CTC (LPA)</Label>
                    <Input 
                        value={formData.ctc} 
                        onChange={e => handleInputChange('ctc', e.target.value)} 
                        className={errors.ctc ? "border-red-500" : ""}
                    />
                    {errors.ctc && <span className="text-xs text-red-500">{errors.ctc}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.ectc ? "text-red-500" : ""}>Expected CTC (LPA)</Label>
                    <Input 
                        value={formData.ectc} 
                        onChange={e => handleInputChange('ectc', e.target.value)} 
                        className={errors.ectc ? "border-red-500" : ""}
                    />
                    {errors.ectc && <span className="text-xs text-red-500">{errors.ectc}</span>}
                </div>

                <div className="space-y-2">
                    <Label>Notice Period</Label>
                    <Input value={formData.noticePeriod} onChange={e => handleInputChange('noticePeriod', e.target.value)} />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label className={errors.skills ? "text-red-500" : ""}>Skills * (comma separated)</Label>
                    <Input 
                        value={formData.skills} 
                        onChange={e => handleInputChange('skills', e.target.value)} 
                        placeholder="Java, React, AWS..." 
                        className={errors.skills ? "border-red-500" : ""}
                    />
                    {errors.skills && <span className="text-xs text-red-500">{errors.skills}</span>}
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Internal notes..." />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>Cancel</Button>
                <Button onClick={() => handleSave(isEditDialogOpen)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isEditDialogOpen ? "Update Candidate" : "Save Candidate"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Component for Stat Cards
const StatCard = ({ title, value, color, active, onClick }: any) => {
    const colors: any = {
        blue: 'border-l-blue-500',
        slate: 'border-l-slate-500',
        orange: 'border-l-orange-500',
        purple: 'border-l-purple-500',
        red: 'border-l-red-500',
        yellow: 'border-l-yellow-500',
        green: 'border-l-green-500'
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 ${colors[color]} cursor-pointer transition-all ${active ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:shadow-md'}`}
        >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            <p className="text-sm text-slate-500">{title}</p>
        </div>
    );
};