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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus, Search, Edit, Filter, Download, User, Phone, Mail,
  Building, Briefcase, DollarSign, Clock, AlertTriangle, AlertCircle, Copy, Check, Calendar,
  Eye, EyeOff, CheckCircle, XCircle, Loader2, Trash2, List, LayoutGrid
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Candidate, Job } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Extend types if necessary for backend compatibility
interface BackendCandidate extends Candidate {
  _id: string;
  dateAdded?: string;
}

interface BackendJob extends Job {
  _id: string;
  deadline?: string;
}

export default function RecruiterCandidates() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // Data State
  const [candidates, setCandidates] = useState<BackendCandidate[]>([]);
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);

  // UI & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tatFilter, setTatFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  
  // Modal State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Filter for current recruiter
        const myCandidates = allCandidates.filter((c: any) => 
          c.recruiterId === user?.id || c.recruiterId?._id === user?.id
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

  // --- 2. Helper Functions ---
  const getFilteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const searchMatch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.candidateId?.toLowerCase().includes(searchTerm.toLowerCase());

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

  // --- 3. Handlers ---

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const openEditDialog = (c: BackendCandidate) => {
    setSelectedCandidateId(c._id || c.id);
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
      assignedJobId: c.assignedJobId || '',
      dateAdded: c.dateAdded ? new Date(c.dateAdded).toISOString().split('T')[0] : '',
      active: c.active !== false
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async (isEdit: boolean) => {
    if (!formData.name || !formData.email) {
      toast({ title: "Validation Error", description: "Name and Email are required", variant: "destructive" });
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

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

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

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await fetch(`${API_URL}/candidates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
      });
      toast({ title: "Deleted", description: "Candidate removed" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed" });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedCandidateId(id);
    setTimeout(() => setCopiedCandidateId(null), 2000);
    toast({ title: "Copied", description: "ID copied to clipboard" });
  };

  // Render Loading
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
         <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Candidates</h1>
                    <p className="text-slate-500">Manage and track your candidate pipeline</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="hidden sm:flex"><Download className="mr-2 h-4 w-4"/> Export</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setFormData(initialFormState); setIsAddDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4"/> Add Candidate
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <StatCard title="Total" value={stats.total} color="blue" active={activeStatFilter === null} onClick={() => setActiveStatFilter(null)} />
                <StatCard title="Submitted" value={stats.submitted} color="slate" active={activeStatFilter === 'submitted'} onClick={() => setActiveStatFilter('submitted')} />
                <StatCard title="Interview" value={stats.interview} color="orange" active={activeStatFilter === 'interview'} onClick={() => setActiveStatFilter('interview')} />
                <StatCard title="Offer" value={stats.offer} color="purple" active={activeStatFilter === 'offer'} onClick={() => setActiveStatFilter('offer')} />
                <StatCard title="Joined" value={stats.joined} color="green" onClick={() => {}} />
                <StatCard title="Rejected" value={stats.rejected} color="red" onClick={() => {}} />
            </div>

            {/* Filters Bar */}
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

            {/* Content Display */}
            {viewMode === 'table' ? (
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Candidate</th>
                                    <th className="p-4">Position / Client</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Experience</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {getFilteredCandidates.map(c => (
                                    <tr key={c._id || c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-slate-200" onClick={() => copyId(c.candidateId || c._id)}>
                                                {c.candidateId || c._id.substring(0,6)}
                                            </code>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm"><AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(c.name)}</AvatarFallback></Avatar>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                                                    <div className="text-xs text-slate-500">{c.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{c.position}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1"><Building className="h-3 w-3"/> {c.client}</div>
                                        </td>
                                        <td className="p-4"><Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge></td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-500 space-y-1">
                                                <div>Total: <span className="font-medium">{c.totalExperience || 0}y</span></div>
                                                <div>Rel: <span className="font-medium">{c.relevantExperience || 0}y</span></div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-500 space-y-1">
                                                <div className="flex items-center gap-1"><Phone className="h-3 w-3"/> {c.contact}</div>
                                                <div className="flex items-center gap-1"><DollarSign className="h-3 w-3"/> {c.ctc || 'N/A'} LPA</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditDialog(c)}><Edit className="h-4 w-4 text-blue-600"/></Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(c._id)}><Trash2 className="h-4 w-4 text-red-600"/></Button>
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
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-center p-1 bg-slate-50 rounded">Exp: {c.totalExperience}y</div>
                                    <div className="text-center p-1 bg-slate-50 rounded">CTC: {c.ctc}</div>
                                    <div className="text-center p-1 bg-slate-50 rounded">NP: {c.noticePeriod}</div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" className="w-full" size="sm" onClick={() => openEditDialog(c)}>Edit</Button>
                                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700" size="sm" onClick={() => handleDelete(c._id)}>Delete</Button>
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
                <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} /></div>
                <div className="space-y-2"><Label>Email *</Label><Input value={formData.email} onChange={e => handleInputChange('email', e.target.value)} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={formData.contact} onChange={e => handleInputChange('contact', e.target.value)} /></div>
                <div className="space-y-2"><Label>Position</Label><Input value={formData.position} onChange={e => handleInputChange('position', e.target.value)} /></div>
                <div className="space-y-2"><Label>Client</Label><Input value={formData.client} onChange={e => handleInputChange('client', e.target.value)} /></div>
                
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
                <div className="space-y-2"><Label>Total Exp (Years)</Label><Input value={formData.totalExperience} onChange={e => handleInputChange('totalExperience', e.target.value)} /></div>
                <div className="space-y-2"><Label>Relevant Exp</Label><Input value={formData.relevantExperience} onChange={e => handleInputChange('relevantExperience', e.target.value)} /></div>
                <div className="space-y-2"><Label>Current CTC (LPA)</Label><Input value={formData.ctc} onChange={e => handleInputChange('ctc', e.target.value)} /></div>
                <div className="space-y-2"><Label>Expected CTC</Label><Input value={formData.ectc} onChange={e => handleInputChange('ectc', e.target.value)} /></div>
                <div className="space-y-2"><Label>Notice Period</Label><Input value={formData.noticePeriod} onChange={e => handleInputChange('noticePeriod', e.target.value)} /></div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Skills (comma separated)</Label>
                    <Input value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} placeholder="Java, React, AWS..." />
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