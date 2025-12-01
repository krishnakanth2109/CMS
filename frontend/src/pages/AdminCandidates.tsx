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
import { Search, Filter, Download, User, Phone, Mail, Building, Briefcase, Clock, AlertTriangle, AlertCircle, Copy, Check, Plus, Edit, Trash2 } from 'lucide-react';
import { CandidateStatus, Candidate, Recruiter } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Env var
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminCandidates() {
  const { toast } = useToast();
  
  // Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
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

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    position: '',
    skills: '',
    client: '',
    status: 'Submitted' as CandidateStatus,
    recruiterId: '', // Admin selects this
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
      // 1. Fetch Candidates
      const resCand = await fetch(`${API_URL}/candidates`, { headers: getAuthHeader() });
      if (resCand.ok) setCandidates(await resCand.json());

      // 2. Fetch Recruiters (to assign candidates)
      const resRec = await fetch(`${API_URL}/recruiters`, { headers: getAuthHeader() });
      if (resRec.ok) setRecruiters(await resRec.json());

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

  // --- Handlers ---

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', contact: '', position: '', skills: '', client: '',
      status: 'Submitted', recruiterId: '', assignedJobId: '',
      totalExperience: '', relevantExperience: '', ctc: '', ectc: '', 
      noticePeriod: '', notes: '', dateAdded: new Date().toISOString().split('T')[0],
    });
    setIsEditMode(false);
    setSelectedCandidateId(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (c: Candidate) => {
    setIsEditMode(true);
    setSelectedCandidateId(c.id); // or c._id
    setFormData({
      name: c.name,
      email: c.email || '',
      contact: c.contact || '',
      position: c.position || '',
      skills: Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || '',
      client: c.client || '',
      status: c.status,
      recruiterId: c.recruiterId || '',
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
    // VALIDATION: Ensure all required fields are present
    if (
      !formData.name || 
      !formData.email || 
      !formData.recruiterId || 
      !formData.contact || 
      !formData.position || 
      !formData.client || 
      !formData.skills
    ) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields (Name, Email, Phone, Position, Client, Skills, Recruiter)", 
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
      fetchData(); // Refresh list
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

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await fetch(`${API_URL}/candidates/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      toast({ title: "Deleted", description: "Candidate removed" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const copyCandidateId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedCandidateId(id);
    setTimeout(() => setCopiedCandidateId(null), 2000);
  };

  const handleExport = () => {
    // Basic CSV implementation
    const headers = ["ID", "Name", "Email", "Phone", "Position", "Client", "Status", "Recruiter"];
    const rows = filteredCandidates.map(c => [
      c.candidateId, c.name, c.email, c.contact, c.position, c.client, c.status, c.recruiterName
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
    // @ts-ignore - Handle recruiterId object or string mismatch
    const matchesRecruiter = recruiterFilter === 'all' || c.recruiterId === recruiterFilter || c.recruiterId?._id === recruiterFilter;

    return matchesSearch && matchesStatus && matchesRecruiter;
  });

  const getStatusVariant = (status: string) => {
    if(['Joined', 'Offer'].includes(status)) return 'success'; // You might need to add success variant to badge or use className
    if(['Rejected'].includes(status)) return 'destructive';
    return 'default';
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
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
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
                     {/* Added Sl.No Header */}
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
                     <TableRow key={c.id}>
                       {/* Added Sl.No Cell */}
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
                       <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                       <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(c)}><Edit className="h-4 w-4"/></Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
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
                <Card key={c.id} className="p-6 hover:shadow-lg transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <span className="text-sm text-gray-500 font-mono">#{index + 1}</span>
                        <Avatar><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-bold">{c.name}</div>
                          <div className="text-sm text-muted-foreground">{c.position}</div>
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
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 className="h-4 w-4 mr-1"/> Delete</Button>
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
                 <Label>Full Name *</Label>
                 <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Email *</Label>
                 <Input value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Phone *</Label>
                 <Input value={formData.contact} onChange={e => handleInputChange('contact', e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Position *</Label>
                 <Input value={formData.position} onChange={e => handleInputChange('position', e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Client *</Label>
                 <Input value={formData.client} onChange={e => handleInputChange('client', e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Skills * (comma separated)</Label>
                 <Input value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} />
               </div>

               {/* Admin Assignment */}
               <div className="space-y-2">
                 <Label className="text-blue-600">Assign Recruiter *</Label>
                 <Select value={formData.recruiterId} onValueChange={(val) => handleInputChange('recruiterId', val)}>
                    <SelectTrigger><SelectValue placeholder="Select Recruiter"/></SelectTrigger>
                    <SelectContent>
                      {recruiters.map(r => (
                        // @ts-ignore
                        <SelectItem key={r.id || r._id} value={r.id || r._id}>{r.name} ({r.recruiterId})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
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
               <div className="space-y-2"><Label>Total Exp</Label><Input value={formData.totalExperience} onChange={e => handleInputChange('totalExperience', e.target.value)}/></div>
               <div className="space-y-2"><Label>Current CTC</Label><Input value={formData.ctc} onChange={e => handleInputChange('ctc', e.target.value)}/></div>
               <div className="space-y-2"><Label>Expected CTC</Label><Input value={formData.ectc} onChange={e => handleInputChange('ectc', e.target.value)}/></div>
               <div className="space-y-2"><Label>Notice Period</Label><Input value={formData.noticePeriod} onChange={e => handleInputChange('noticePeriod', e.target.value)}/></div>

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