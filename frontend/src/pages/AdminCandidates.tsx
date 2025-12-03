import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Download, User, Phone, Mail, Building, Check, Copy, Plus, Edit, Eye, EyeOff, LayoutGrid, List } from 'lucide-react';
import { CandidateStatus, Candidate, Recruiter } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Env var
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Extend Candidate to include _id and active status
interface BackendCandidate extends Candidate {
  _id: string;
  active?: boolean;
  dateAdded?: string;
}

export default function AdminCandidates() {
  const { toast } = useToast();
  
  // Data State
  const [candidates, setCandidates] = useState<BackendCandidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter/View State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recruiterFilter, setRecruiterFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    noticePeriod: '',
    notes: '',
    dateAdded: new Date().toISOString().split('T')[0],
  });

  // --- API Calls ---

  const getAuthHeader = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCand, resRec] = await Promise.all([
        fetch(`${API_URL}/candidates`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() })
      ]);

      if (resCand.ok) {
        const data = await resCand.json();
        const mappedCandidates = data.map((c: any) => ({ ...c, id: c._id }));
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

    // --- UPDATED NAME VALIDATION ---
    // Only allows Alphabets (a-z, A-Z), spaces, hyphens, and apostrophes.
    // Explicitly rejects numbers.
    const nameRegex = /^[a-zA-Z\s'-]+$/;

    if (!data.name.trim()) {
      newErrors.name = "Full Name is required";
    } else if (data.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (!nameRegex.test(data.name)) {
      newErrors.name = "Name cannot contain numbers or special characters";
    }

    // Email Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(data.email)) newErrors.email = "Invalid email format";

    // Phone Regex (Simple 10-15 digits)
    const phoneRegex = /^[0-9+\s-]{10,15}$/;
    if (!data.contact.trim()) newErrors.contact = "Phone number is required";
    else if (!phoneRegex.test(data.contact)) newErrors.contact = "Enter a valid phone number";

    if (!data.position.trim()) newErrors.position = "Position is required";
    if (!data.client.trim()) newErrors.client = "Client is required";
    if (!data.skills.toString().trim()) newErrors.skills = "At least one skill is required";
    
    // Dropdown Required
    if (!data.recruiterId) newErrors.recruiterId = "Please assign a recruiter";

    // Numeric/Format Checks (if provided)
    if (data.totalExperience && isNaN(parseFloat(data.totalExperience))) newErrors.totalExperience = "Must be a number";
    if (data.relevantExperience && isNaN(parseFloat(data.relevantExperience))) newErrors.relevantExperience = "Must be a number";
    if (data.ctc && isNaN(parseFloat(data.ctc))) newErrors.ctc = "Must be a number";
    if (data.ectc && isNaN(parseFloat(data.ectc))) newErrors.ectc = "Must be a number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for specific field on change
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
      noticePeriod: '', notes: '', dateAdded: new Date().toISOString().split('T')[0],
    });
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
      totalExperience: c.totalExperience || '',
      relevantExperience: c.relevantExperience || '',
      ctc: c.ctc || '',
      ectc: c.ectc || '',
      noticePeriod: c.noticePeriod || '',
      notes: c.notes || '',
      dateAdded: c.dateAdded ? new Date(c.dateAdded).toISOString().split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the highlighted errors.", 
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
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      toast({ title: "Success", description: `Candidate ${isEditMode ? 'Updated' : 'Added'}` });
      setIsDialogOpen(false);
      fetchData(); 
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: error.message || "Could not save candidate", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/candidates/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({ 
        title: "Success", 
        description: `Candidate ${!currentStatus ? 'Activated' : 'Deactivated'} successfully` 
      });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const copyCandidateId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedCandidateId(id);
    setTimeout(() => setCopiedCandidateId(null), 2000);
  };

  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Position", "Client", "Status", "Recruiter", "Active"];
    const rows = filteredCandidates.map(c => [
      c.candidateId, c.name, c.email, c.contact, c.position, c.client, c.status, c.recruiterName, c.active ? 'Yes' : 'No'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "candidates.csv");
    document.body.appendChild(link);
    link.click();
  };

  // --- Filtering ---
  
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.candidateId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const cRecruiterId = typeof c.recruiterId === 'object' ? (c.recruiterId as any)._id : c.recruiterId;
    const matchesRecruiter = recruiterFilter === 'all' || cRecruiterId === recruiterFilter;

    return matchesSearch && matchesStatus && matchesRecruiter;
  });

  const getStatusVariant = (status: string) => {
    if(['Joined', 'Offer'].includes(status)) return 'default';
    if(['Rejected'].includes(status)) return 'destructive';
    return 'secondary';
  };

  const getInitials = (n: string) => n.split(' ').map(i => i[0]).join('').toUpperCase().substring(0,2);

  // --- Render ---

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Candidate Database</h1>
              <p className="text-muted-foreground">View and manage candidates across all recruiters</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Export</Button>
              <Button onClick={handleOpenAddDialog} className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4"/> Add Candidate</Button>
            </div>
          </div>

          {/* Controls */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                <Input placeholder="Search candidates..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                   <SelectTrigger className="w-[150px]"><Filter className="mr-2 h-4 w-4"/><SelectValue placeholder="Status"/></SelectTrigger>
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
                   <SelectTrigger className="w-[180px]"><User className="mr-2 h-4 w-4"/><SelectValue placeholder="Recruiter"/></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All Recruiters</SelectItem>
                      {recruiters.map(r => (
                        // @ts-ignore
                        <SelectItem key={r.id || r._id} value={r.id || r._id}>{r.name}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>

                <Tabs value={viewMode} onValueChange={(v:any) => setViewMode(v)}>
                  <TabsList>
                    <TabsTrigger value="table"><List className="h-4 w-4"/></TabsTrigger>
                    <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4"/></TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </Card>

          {/* Content */}
          {loading ? (
             <div className="p-12 text-center">Loading candidates...</div>
          ) : viewMode === 'table' ? (
            <Card className="overflow-hidden">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-12">S.No</TableHead>
                     <TableHead>ID</TableHead>
                     <TableHead>Candidate</TableHead>
                     <TableHead>Position</TableHead>
                     <TableHead>Recruiter</TableHead>
                     <TableHead>Client</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredCandidates.map((c, index) => (
                     <TableRow key={c.id} className={c.active === false ? "opacity-60 bg-gray-50 dark:bg-gray-900" : ""}>
                       <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <code className="bg-gray-100 px-1 rounded text-xs">{c.candidateId}</code>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCandidateId(c.candidateId!)}>
                             {copiedCandidateId === c.candidateId ? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3"/>}
                           </Button>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                           <div>
                             <div className="font-medium">{c.name}</div>
                             <div className="text-xs text-muted-foreground">{c.email}</div>
                             {c.active === false && <span className="text-[10px] text-red-500 font-bold">INACTIVE</span>}
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>{c.position}</TableCell>
                       <TableCell>
                          <div className="flex items-center gap-1">
                             <User className="h-3 w-3 text-gray-400"/>
                             <span className="text-sm">{c.recruiterName || 'Unknown'}</span>
                          </div>
                       </TableCell>
                       <TableCell>{c.client}</TableCell>
                       <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status}</Badge></TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(c)}><Edit className="h-4 w-4"/></Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleToggleStatus(c._id || c.id!, c.active !== false)}
                                className={c.active !== false ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                                title={c.active !== false ? "Deactivate" : "Activate"}
                            >
                                {c.active !== false ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                   {filteredCandidates.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8">No candidates found.</TableCell></TableRow>}
                 </TableBody>
               </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((c, index) => (
                <Card key={c.id} className={`p-6 hover:shadow-lg transition-all ${c.active === false ? 'opacity-75 bg-gray-50 border-dashed' : ''}`}>
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <span className="text-sm text-gray-500 font-mono">#{index + 1}</span>
                        <Avatar><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-bold">{c.name}</div>
                          <div className="text-sm text-muted-foreground">{c.position}</div>
                          {c.active === false && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded">INACTIVE</span>}
                        </div>
                      </div>
                      <Badge>{c.status}</Badge>
                   </div>
                   <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2"><Building className="h-4 w-4"/> {c.client}</div>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4"/> {c.email}</div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4"/> {c.contact}</div>
                      <div className="flex items-center gap-2"><User className="h-4 w-4"/> Recruiter: {c.recruiterName}</div>
                   </div>
                   <div className="flex justify-end gap-2 border-t pt-4">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(c)}><Edit className="h-4 w-4 mr-1"/> Edit</Button>
                      <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleStatus(c._id || c.id!, c.active !== false)}
                          className={c.active !== false ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                      >
                          {c.active !== false ? <><EyeOff className="h-4 w-4 mr-1"/> Deactivate</> : <><Eye className="h-4 w-4 mr-1"/> Activate</>}
                      </Button>
                   </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>{isEditMode ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
               <DialogDescription>Fill in the details below. All * fields are required.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
               {/* Basic Info */}
               <div className="space-y-2">
                 <Label className={errors.name ? "text-red-500" : ""}>Full Name *</Label>
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
                 <Label className={errors.skills ? "text-red-500" : ""}>Skills * (comma separated)</Label>
                 <Input 
                    value={formData.skills} 
                    onChange={e => handleInputChange('skills', e.target.value)} 
                    className={errors.skills ? "border-red-500" : ""}
                 />
                 {errors.skills && <span className="text-xs text-red-500">{errors.skills}</span>}
               </div>

               {/* Admin Assignment */}
               <div className="space-y-2">
                 <Label className={errors.recruiterId ? "text-red-500" : "text-blue-600"}>Assign Recruiter *</Label>
                 <Select value={formData.recruiterId} onValueChange={(val) => handleInputChange('recruiterId', val)}>
                    <SelectTrigger className={errors.recruiterId ? "border-red-500" : ""}><SelectValue placeholder="Select Recruiter"/></SelectTrigger>
                    <SelectContent>
                      {recruiters.map(r => (
                        // @ts-ignore
                        <SelectItem key={r.id || r._id} value={r.id || r._id}>{r.name} ({r.recruiterId})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
                 {errors.recruiterId && <span className="text-xs text-red-500">{errors.recruiterId}</span>}
               </div>

               <div className="space-y-2">
                 <Label>Status</Label>
                 <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                    <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
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
               
               {/* Experience */}
               <div className="space-y-2">
                  <Label className={errors.totalExperience ? "text-red-500" : ""}>Total Exp (Yrs)</Label>
                  <Input 
                    value={formData.totalExperience} 
                    onChange={e => handleInputChange('totalExperience', e.target.value)}
                    className={errors.totalExperience ? "border-red-500" : ""}
                  />
                  {errors.totalExperience && <span className="text-xs text-red-500">{errors.totalExperience}</span>}
               </div>
               
               <div className="space-y-2">
                  <Label className={errors.ctc ? "text-red-500" : ""}>Current CTC</Label>
                  <Input 
                    value={formData.ctc} 
                    onChange={e => handleInputChange('ctc', e.target.value)}
                    className={errors.ctc ? "border-red-500" : ""}
                  />
                  {errors.ctc && <span className="text-xs text-red-500">{errors.ctc}</span>}
               </div>
               
               <div className="space-y-2">
                  <Label className={errors.ectc ? "text-red-500" : ""}>Expected CTC</Label>
                  <Input 
                    value={formData.ectc} 
                    onChange={e => handleInputChange('ectc', e.target.value)}
                    className={errors.ectc ? "border-red-500" : ""}
                  />
                  {errors.ectc && <span className="text-xs text-red-500">{errors.ectc}</span>}
               </div>
               
               <div className="space-y-2">
                  <Label className={errors.noticePeriod ? "text-red-500" : ""}>Notice Period</Label>
                  <Input 
                    value={formData.noticePeriod} 
                    onChange={e => handleInputChange('noticePeriod', e.target.value)}
                  />
               </div>

               <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} />
               </div>
            </div>

            <DialogFooter>
               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Candidate'}</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}