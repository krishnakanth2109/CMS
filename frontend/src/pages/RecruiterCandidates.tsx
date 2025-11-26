import { useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useData } from '@/contexts/DataContext';
import { useJobs } from '@/contexts/JobsContext';
import { useAuth } from '@/contexts/AuthContext';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Search, Edit, Filter, Download, User, Phone, Mail,
  Building, Briefcase, DollarSign, Clock, AlertTriangle, AlertCircle, Copy, Check, Calendar,
  Eye, EyeOff, CheckCircle, XCircle
} from 'lucide-react';
import { CandidateStatus, Candidate, Job } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function RecruiterCandidates() {
  const { candidates, addCandidate, updateCandidate } = useData();
  const { jobs } = useJobs();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tatFilter, setTatFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    skills: '',
    client: '',
    contact: '',
    email: '',
    status: 'Submitted' as CandidateStatus,
    notes: '',
    totalExperience: '',
    relevantExperience: '',
    ctc: '',
    ectc: '',
    noticePeriod: '',
    assignedJobId: '',
    dateAdded: new Date().toISOString().split('T')[0],
    active: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const myCandidates = candidates.filter(c => c.recruiterId === user?.id);
  const myJobs = jobs.filter(j => j.assignedRecruiter === user?.id);

  // Helper function to get job TAT status
  const getJobTatStatus = (job: Job): 'normal' | 'urgent' | 'expired' => {
    if (!job.deadline) return 'normal';
    
    const today = new Date();
    const deadline = new Date(job.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) return 'expired';
    if (daysUntilDeadline <= 3) return 'urgent';
    return 'normal';
  };

  // Get jobs by TAT status
  const urgentTatJobs = myJobs.filter(job => getJobTatStatus(job) === 'urgent');
  const expiredTatJobs = myJobs.filter(job => getJobTatStatus(job) === 'expired');

  // Get candidates for specific job TAT status
  const getCandidatesByJobTat = (tatStatus: 'urgent' | 'expired') => {
    const targetJobs = tatStatus === 'urgent' ? urgentTatJobs : expiredTatJobs;
    const jobIds = targetJobs.map(job => job.id);
    
    return myCandidates.filter(candidate => 
      candidate.assignedJobId && jobIds.includes(candidate.assignedJobId)
    );
  };

  // Filter candidates based on active stat filter
  const getFilteredCandidates = () => {
    const filtered = myCandidates.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.skills && (Array.isArray(c.skills) ? c.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) : c.skills.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        c.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.totalExperience?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ctc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.candidateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.dateAdded?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      // Apply TAT filter
      let matchesTat = true;
      if (tatFilter === 'urgent') {
        const urgentCandidates = getCandidatesByJobTat('urgent');
        matchesTat = urgentCandidates.some(uc => uc.id === c.id);
      } else if (tatFilter === 'expired') {
        const expiredCandidates = getCandidatesByJobTat('expired');
        matchesTat = expiredCandidates.some(ec => ec.id === c.id);
      }

      // Apply active stat filter
      let matchesStat = true;
      if (activeStatFilter) {
        switch (activeStatFilter) {
          case 'total': {
            matchesStat = true; // Show all
            break;
          }
          case 'submitted': {
            matchesStat = c.status === 'Submitted';
            break;
          }
          case 'interview': {
            matchesStat = ['L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview', 'Interview'].includes(c.status);
            break;
          }
          case 'offer': {
            matchesStat = c.status === 'Offer';
            break;
          }
          case 'joined': {
            matchesStat = c.status === 'Joined';
            break;
          }
          case 'urgentTat': {
            const urgentCandidates = getCandidatesByJobTat('urgent');
            matchesStat = urgentCandidates.some(uc => uc.id === c.id);
            break;
          }
          case 'expiredTat': {
            const expiredCandidates = getCandidatesByJobTat('expired');
            matchesStat = expiredCandidates.some(ec => ec.id === c.id);
            break;
          }
          default: {
            matchesStat = true;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesTat && matchesStat;
    });

    return filtered;
  };

  const filteredCandidates = getFilteredCandidates();

  const getStatusVariant = (status: CandidateStatus) => {
    const variants: Record<CandidateStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
      'Submitted': 'default',
      'Pending': 'secondary',
      'L1 Interview': 'outline',
      'L2 Interview': 'outline',
      'Final Interview': 'outline',
      'Technical Interview': 'outline',
      'HR Interview': 'outline',
      'Interview': 'destructive',
      'Offer': 'default',
      'Joined': 'success',
      'Rejected': 'destructive'
    };
    return variants[status] || 'default';
  };

  const getTatDisplay = (jobId: string) => {
    const job = myJobs.find(j => j.id === jobId);
    if (!job || !job.deadline) return null;
    
    const tatStatus = getJobTatStatus(job);
    if (tatStatus === 'urgent') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Urgent TAT
        </Badge>
      );
    } else if (tatStatus === 'expired') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-destructive border-destructive">
          <AlertCircle className="h-3 w-3" />
          Expired TAT
        </Badge>
      );
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return '-';
    return `₹${amount} LPA`;
  };

  const formatExperience = (exp: string) => {
    if (!exp) return '-';
    return `${exp} years`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const copyCandidateId = (candidateId: string) => {
    navigator.clipboard.writeText(candidateId);
    setCopiedCandidateId(candidateId);
    setTimeout(() => setCopiedCandidateId(null), 2000);
    
    toast({
      title: 'Candidate ID copied!',
      description: 'Candidate ID has been copied to clipboard',
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.position.trim()) {
      errors.position = 'Position is required';
    }

    if (!formData.skills.trim()) {
      errors.skills = 'Skills are required';
    }

    if (!formData.client.trim()) {
      errors.client = 'Client company is required';
    }

    if (!formData.contact.trim()) {
      errors.contact = 'Contact number is required';
    } else if (!/^[+]?[1-9][\d\s\-()]{8,}$/.test(formData.contact.replace(/\s/g, ''))) {
      errors.contact = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.dateAdded.trim()) {
      errors.dateAdded = 'Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new candidate object
      const newCandidateData = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        skills: formData.skills,
        client: formData.client.trim(),
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        status: formData.status,
        recruiterId: user?.id || '',
        recruiterName: user?.name || 'Recruiter',
        createdAt: formData.dateAdded,
        dateAdded: formData.dateAdded,
        notes: formData.notes.trim(),
        totalExperience: formData.totalExperience.trim(),
        relevantExperience: formData.relevantExperience.trim(),
        ctc: formData.ctc.trim(),
        ectc: formData.ectc.trim(),
        noticePeriod: formData.noticePeriod.trim(),
        assignedJobId: formData.assignedJobId || undefined,
        active: formData.active,
      };

      console.log('Adding candidate with data:', newCandidateData);

      // Call addCandidate from context
      addCandidate(newCandidateData);

      toast({
        title: 'Candidate added successfully',
        description: `${formData.name} has been added to your pipeline`,
      });

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast({
        title: 'Error adding candidate',
        description: 'There was a problem adding the candidate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCandidate) return;

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedCandidate = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        skills: formData.skills,
        client: formData.client.trim(),
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        status: formData.status,
        dateAdded: formData.dateAdded,
        notes: formData.notes.trim(),
        totalExperience: formData.totalExperience.trim(),
        relevantExperience: formData.relevantExperience.trim(),
        ctc: formData.ctc.trim(),
        ectc: formData.ectc.trim(),
        noticePeriod: formData.noticePeriod.trim(),
        assignedJobId: formData.assignedJobId || undefined,
        active: formData.active,
      };

      updateCandidate(selectedCandidate, updatedCandidate);

      toast({
        title: 'Candidate updated successfully',
        description: 'Changes have been saved',
      });

      setIsEditDialogOpen(false);
      setSelectedCandidate(null);
      resetForm();
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast({
        title: 'Error updating candidate',
        description: 'There was a problem updating the candidate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCandidateActive = (id: string, currentActive: boolean, name: string) => {
    try {
      updateCandidate(id, { active: !currentActive });

      toast({
        title: `Candidate ${!currentActive ? 'activated' : 'deactivated'}`,
        description: `${name} has been ${!currentActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast({
        title: 'Error updating candidate',
        description: 'There was a problem updating the candidate status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate.id);
    setFormData({
      name: candidate.name,
      position: candidate.position,
      skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
      client: candidate.client || '',
      contact: candidate.contact || '',
      email: candidate.email || '',
      status: candidate.status,
      dateAdded: candidate.dateAdded || candidate.createdAt,
      notes: candidate.notes || '',
      totalExperience: candidate.totalExperience || '',
      relevantExperience: candidate.relevantExperience || '',
      ctc: candidate.ctc || '',
      ectc: candidate.ectc || '',
      noticePeriod: candidate.noticePeriod || '',
      assignedJobId: candidate.assignedJobId || '',
      active: candidate.active !== undefined ? candidate.active : true,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      skills: '',
      client: '',
      contact: '',
      email: '',
      status: 'Submitted',
      dateAdded: new Date().toISOString().split('T')[0],
      notes: '',
      totalExperience: '',
      relevantExperience: '',
      ctc: '',
      ectc: '',
      noticePeriod: '',
      assignedJobId: '',
      active: true,
    });
    setFormErrors({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleExport = () => {
    try {
      const candidatesToExport = filteredCandidates.length > 0 ? filteredCandidates : myCandidates;
      
      if (candidatesToExport.length === 0) {
        toast({
          title: 'No data to export',
          description: 'There are no candidates to export',
          variant: 'destructive',
        });
        return;
      }

      const headers = [
        'Sl.No',
        'Candidate ID',
        'Name',
        'Position',
        'Client',
        'Contact',
        'Email',
        'Status',
        'Skills',
        'Total Experience',
        'Relevant Experience',
        'Current CTC (LPA)',
        'Expected CTC (LPA)',
        'Notice Period',
        'Date Added',
        'Notes',
        'Created Date',
        'Assigned Job',
        'Active Status'
      ];

      const csvData = candidatesToExport.map((candidate, index) => {
        const assignedJob = candidate.assignedJobId ? myJobs.find(j => j.id === candidate.assignedJobId) : null;
        return [
          index + 1,
          candidate.candidateId || candidate.id,
          candidate.name,
          candidate.position,
          candidate.client || '',
          candidate.contact || '',
          candidate.email || '',
          candidate.status,
          Array.isArray(candidate.skills) ? candidate.skills.join('; ') : candidate.skills,
          candidate.totalExperience || '',
          candidate.relevantExperience || '',
          candidate.ctc || '',
          candidate.ectc || '',
          candidate.noticePeriod || '',
          candidate.dateAdded || candidate.createdAt,
          candidate.notes || '',
          candidate.createdAt,
          assignedJob ? assignedJob.title : '',
          candidate.active ? 'Active' : 'Inactive'
        ];
      });

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => 
            `"${String(field).replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export successful',
        description: `Exported ${candidatesToExport.length} candidates to CSV`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export candidates data',
        variant: 'destructive',
      });
    }
  };

  const handleStatCardClick = (statType: string) => {
    setActiveStatFilter(activeStatFilter === statType ? null : statType);
    
    // Clear other filters when clicking a stat card
    setStatusFilter('all');
    setTatFilter('all');
    setSearchTerm('');
  };

  const stats = {
    total: myCandidates.length,
    submitted: myCandidates.filter(c => c.status === 'Submitted').length,
    interview: myCandidates.filter(c => ['L1 Interview', 'L2 Interview', 'Final Interview', 'Technical Interview', 'HR Interview', 'Interview'].includes(c.status)).length,
    offer: myCandidates.filter(c => c.status === 'Offer').length,
    joined: myCandidates.filter(c => c.status === 'Joined').length,
    urgentTat: getCandidatesByJobTat('urgent').length,
    expiredTat: getCandidatesByJobTat('expired').length,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent">
                My Candidates
              </h1>
              <p className="text-muted-foreground text-lg">Manage and track your candidate pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleExport} type="button">
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                    Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Add New Candidate</DialogTitle>
                    <DialogDescription>
                      Enter candidate details to add to your pipeline. Fields marked with <span className="text-red-500">*</span> are required.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4 md:col-span-2">
                      <Label className="text-base font-medium">Basic Information</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-1">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={formErrors.name ? 'border-red-500' : ''}
                          />
                          {formErrors.name && (
                            <p className="text-red-500 text-sm">{formErrors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position" className="flex items-center gap-1">
                            Position <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="position"
                            placeholder="Job position"
                            value={formData.position}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            className={formErrors.position ? 'border-red-500' : ''}
                          />
                          {formErrors.position && (
                            <p className="text-red-500 text-sm">{formErrors.position}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-4 md:col-span-2">
                      <Label className="text-base font-medium">Contact Details</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-1">
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={formErrors.email ? 'border-red-500' : ''}
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-sm">{formErrors.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact" className="flex items-center gap-1">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="contact"
                            placeholder="+1 (555) 000-0000"
                            value={formData.contact}
                            onChange={(e) => handleInputChange('contact', e.target.value)}
                            className={formErrors.contact ? 'border-red-500' : ''}
                          />
                          {formErrors.contact && (
                            <p className="text-red-500 text-sm">{formErrors.contact}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Professional Details */}
                    <div className="space-y-4 md:col-span-2">
                      <Label className="text-base font-medium">Professional Details</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client" className="flex items-center gap-1">
                            Client Company <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="client"
                            placeholder="Client company name"
                            value={formData.client}
                            onChange={(e) => handleInputChange('client', e.target.value)}
                            className={formErrors.client ? 'border-red-500' : ''}
                          />
                          {formErrors.client && (
                            <p className="text-red-500 text-sm">{formErrors.client}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skills" className="flex items-center gap-1">
                            Skills <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="skills"
                            placeholder="React, Node.js, TypeScript (comma separated)"
                            value={formData.skills}
                            onChange={(e) => handleInputChange('skills', e.target.value)}
                            className={formErrors.skills ? 'border-red-500' : ''}
                          />
                          {formErrors.skills && (
                            <p className="text-red-500 text-sm">{formErrors.skills}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Date Added */}
                    <div className="space-y-2">
                      <Label htmlFor="dateAdded" className="flex items-center gap-1">
                        Date Added <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dateAdded"
                        type="date"
                        value={formData.dateAdded}
                        onChange={(e) => handleInputChange('dateAdded', e.target.value)}
                        className={formErrors.dateAdded ? 'border-red-500' : ''}
                      />
                      {formErrors.dateAdded && (
                        <p className="text-red-500 text-sm">{formErrors.dateAdded}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: CandidateStatus) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Submitted">Submitted</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="L1 Interview">L1 Interview</SelectItem>
                          <SelectItem value="L2 Interview">L2 Interview</SelectItem>
                          <SelectItem value="Final Interview">Final Interview</SelectItem>
                          <SelectItem value="Technical Interview">Technical Interview</SelectItem>
                          <SelectItem value="HR Interview">HR Interview</SelectItem>
                          <SelectItem value="Interview">Interview</SelectItem>
                          <SelectItem value="Offer">Offer</SelectItem>
                          <SelectItem value="Joined">Joined</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Experience & Compensation */}
                    <div className="space-y-4 md:col-span-2">
                      <Label className="text-base font-medium">Experience & Compensation</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="totalExperience">Total Experience (years)</Label>
                          <Input
                            id="totalExperience"
                            placeholder="e.g., 5.5"
                            value={formData.totalExperience}
                            onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="relevantExperience">Relevant Experience (years)</Label>
                          <Input
                            id="relevantExperience"
                            placeholder="e.g., 4.0"
                            value={formData.relevantExperience}
                            onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ctc">Current CTC (LPA)</Label>
                          <Input
                            id="ctc"
                            placeholder="e.g., 15.0"
                            value={formData.ctc}
                            onChange={(e) => handleInputChange('ctc', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ectc">Expected CTC (LPA)</Label>
                          <Input
                            id="ectc"
                            placeholder="e.g., 20.0"
                            value={formData.ectc}
                            onChange={(e) => handleInputChange('ectc', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="noticePeriod">Notice Period</Label>
                      <Input
                        id="noticePeriod"
                        placeholder="e.g., 30 days, Immediate"
                        value={formData.noticePeriod}
                        onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedJobId">Assigned Job</Label>
                      <Select value={formData.assignedJobId} onValueChange={(value: string) => handleInputChange('assignedJobId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assigned job" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No job assigned</SelectItem>
                          {myJobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} - {job.client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Remarks & Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes, feedback, or remarks about the candidate..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }} 
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAdd} 
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
                      type="button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Candidate'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 animate-scale-in">
            <Card 
              className={`p-4 border-l-4 border-l-blue-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md ${
                activeStatFilter === 'total' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleStatCardClick('total')}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-slate-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md ${
                activeStatFilter === 'submitted' ? 'ring-2 ring-slate-500' : ''
              }`}
              onClick={() => handleStatCardClick('submitted')}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.submitted}</div>
              <div className="text-sm text-muted-foreground">Submitted</div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-orange-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md ${
                activeStatFilter === 'interview' ? 'ring-2 ring-orange-500' : ''
              }`}
              onClick={() => handleStatCardClick('interview')}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.interview}</div>
              <div className="text-sm text-muted-foreground">Interview</div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-purple-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md ${
                activeStatFilter === 'offer' ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => handleStatCardClick('offer')}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.offer}</div>
              <div className="text-sm text-muted-foreground">Offer</div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-red-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md ${
                activeStatFilter === 'urgentTat' ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => handleStatCardClick('urgentTat')}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.urgentTat}</div>
              <div className="text-sm text-muted-foreground">Urgent TAT</div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-yellow-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md ${
                activeStatFilter === 'expiredTat' ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => handleStatCardClick('expiredTat')}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.expiredTat}</div>
              <div className="text-sm text-muted-foreground">Expired TAT</div>
            </Card>
          </div>

          {/* Active Filter Indicator */}
          {activeStatFilter && (
            <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                      Showing {activeStatFilter.replace(/([A-Z])/g, ' $1').trim()} Candidates
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {filteredCandidates.length} candidates match this criteria
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveStatFilter(null)}
                  type="button"
                  className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
                >
                  Clear Filter
                </Button>
              </div>
            </Card>
          )}

          {/* Controls Section */}
          <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-none shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates by name, position, skills, experience, candidate ID, date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-800"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[180px] bg-white dark:bg-slate-800">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="L1 Interview">L1 Interview</SelectItem>
                    <SelectItem value="L2 Interview">L2 Interview</SelectItem>
                    <SelectItem value="Final Interview">Final Interview</SelectItem>
                    <SelectItem value="Technical Interview">Technical Interview</SelectItem>
                    <SelectItem value="HR Interview">HR Interview</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Joined">Joined</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tatFilter} onValueChange={setTatFilter}>
                  <SelectTrigger className="w-full lg:w-[180px] bg-white dark:bg-slate-800">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="TAT Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All TAT</SelectItem>
                    <SelectItem value="urgent">Urgent TAT</SelectItem>
                    <SelectItem value="expired">Expired TAT</SelectItem>
                  </SelectContent>
                </Select>

                <Tabs value={viewMode} onValueChange={(v: 'table' | 'grid') => setViewMode(v)} className="hidden sm:flex">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </Card>

          {/* TAT Quick Actions */}
          {(tatFilter === 'urgent' || tatFilter === 'expired') && (
            <Card className="p-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tatFilter === 'urgent' ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <div>
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                          Urgent TAT Candidates
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {stats.urgentTat} candidates assigned to jobs with urgent deadlines
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">
                          Expired TAT Candidates
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {stats.expiredTat} candidates assigned to jobs with expired deadlines
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTatFilter('all')}
                  type="button"
                >
                  Clear Filter
                </Button>
              </div>
            </Card>
          )}

          {/* Candidates List - Table View */}
          {viewMode === 'table' ? (
            <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-none shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCandidates.length} of {myCandidates.length} candidates
                  {activeStatFilter && ` (${activeStatFilter.replace(/([A-Z])/g, ' $1').trim()})`}
                  {tatFilter !== 'all' && ` (${tatFilter === 'urgent' ? 'Urgent TAT' : 'Expired TAT'})`}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={handleExport} className="gap-2" type="button">
                    <Download className="h-4 w-4" />
                    Export {filteredCandidates.length > 0 ? `(${filteredCandidates.length})` : ''}
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Sl.No</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Candidate ID</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Candidate</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Position</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Client</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Date Added</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">TAT Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Experience</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">CTC/ECTC</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Notice Period</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Skills</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Remarks</th>
                      <th className="text-right py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate, index) => (
                      <tr key={candidate.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-muted-foreground font-medium">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                              {candidate.candidateId || candidate.id}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                              onClick={() => copyCandidateId(candidate.candidateId || candidate.id)}
                              type="button"
                            >
                              {copiedCandidateId === (candidate.candidateId || candidate.id) ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`text-sm ${
                                candidate.active !== false 
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                              }`}>
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className={`font-medium ${
                                candidate.active !== false 
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {candidate.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">{candidate.position}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {candidate.client}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {formatDate(candidate.dateAdded || candidate.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {candidate.assignedJobId && getTatDisplay(candidate.assignedJobId)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Total: </span>
                              {formatExperience(candidate.totalExperience)}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Relevant: </span>
                              {formatExperience(candidate.relevantExperience)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Current: </span>
                              {formatCurrency(candidate.ctc)}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Expected: </span>
                              {formatCurrency(candidate.ectc)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{candidate.noticePeriod || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(() => {
                              const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : (candidate.skills ? [candidate.skills] : []);
                              return (
                                <>
                                  {skillsArray.slice(0, 3).map((skill: string, idx: number) => (
                                    <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                                      {skill}
                                    </span>
                                  ))}
                                  {skillsArray.length > 3 && (
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md">
                                      +{skillsArray.length - 3}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={getStatusVariant(candidate.status)} className="capitalize">
                            {candidate.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                          {candidate.notes || '-'}
                        </td>
                        <td className="text-right py-4 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditDialog(candidate)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                              type="button"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCandidateActive(candidate.id, candidate.active !== false, candidate.name)}
                              className={`h-8 w-8 p-0 ${
                                candidate.active !== false
                                  ? 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20'
                                  : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                              }`}
                              type="button"
                            >
                              {candidate.active !== false ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCandidates.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No candidates found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || tatFilter !== 'all' || activeStatFilter
                      ? 'Try adjusting your search or filter' 
                      : 'Get started by adding your first candidate'}
                  </p>
                  <Button 
                    type="button" 
                    className="gap-2"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Candidate
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            /* Grid View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCandidates.length} of {myCandidates.length} candidates
                  {activeStatFilter && ` (${activeStatFilter.replace(/([A-Z])/g, ' $1').trim()})`}
                  {tatFilter !== 'all' && ` (${tatFilter === 'urgent' ? 'Urgent TAT' : 'Expired TAT'})`}
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" type="button">
                  <Download className="h-4 w-4" />
                  Export {filteredCandidates.length > 0 ? `(${filteredCandidates.length})` : ''}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates.map((candidate, index) => (
                  <Card key={candidate.id} className={`p-6 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all ${
                    candidate.active !== false 
                      ? 'bg-white/80 dark:bg-slate-900/80' 
                      : 'bg-slate-50/80 dark:bg-slate-800/80 opacity-75'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${
                            candidate.active !== false 
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}>
                            {getInitials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`font-semibold ${
                            candidate.active !== false 
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {candidate.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{candidate.position}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusVariant(candidate.status)} className="capitalize">
                          {candidate.status}
                        </Badge>
                        {candidate.assignedJobId && getTatDisplay(candidate.assignedJobId)}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Sl.No: {index + 1}</div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                            {candidate.candidateId || candidate.id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                            onClick={() => copyCandidateId(candidate.candidateId || candidate.id)}
                            type="button"
                          >
                            {copiedCandidateId === (candidate.candidateId || candidate.id) ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-slate-700 dark:text-slate-300">{candidate.client}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-slate-700 dark:text-slate-300">
                          Added: {formatDate(candidate.dateAdded || candidate.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-slate-700 dark:text-slate-300">{candidate.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-slate-700 dark:text-slate-300 truncate">{candidate.email}</span>
                      </div>
                    </div>

                    {/* Experience Section */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Experience</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatExperience(candidate.totalExperience)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Relevant: {formatExperience(candidate.relevantExperience)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Compensation</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current: {formatCurrency(candidate.ctc)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expected: {formatCurrency(candidate.ectc)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Notice:</span>
                        <span className="text-slate-700 dark:text-slate-300">{candidate.noticePeriod || 'Immediate'}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : (candidate.skills ? [candidate.skills] : []);
                          return (
                            <>
                              {skillsArray.slice(0, 4).map((skill: string, idx: number) => (
                                <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                                  {skill}
                                </span>
                              ))}
                              {skillsArray.length > 4 && (
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md">
                                  +{skillsArray.length - 4}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {candidate.notes && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{candidate.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          Added {formatDate(candidate.dateAdded || candidate.createdAt)}
                        </div>
                        {candidate.active !== false ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(candidate)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          type="button"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCandidateActive(candidate.id, candidate.active !== false, candidate.name)}
                          className={`h-8 w-8 p-0 ${
                            candidate.active !== false
                              ? 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20'
                              : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                          }`}
                          type="button"
                        >
                          {candidate.active !== false ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Candidate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Candidate</DialogTitle>
            <DialogDescription>Update candidate details and status</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4 md:col-span-2">
              <Label className="text-base font-medium">Basic Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={formErrors.position ? 'border-red-500' : ''}
                  />
                  {formErrors.position && (
                    <p className="text-red-500 text-sm">{formErrors.position}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label className="text-base font-medium">Contact Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Phone Number</Label>
                  <Input
                    id="edit-contact"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    className={formErrors.contact ? 'border-red-500' : ''}
                  />
                  {formErrors.contact && (
                    <p className="text-red-500 text-sm">{formErrors.contact}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label className="text-base font-medium">Professional Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-client">Client Company</Label>
                  <Input
                    id="edit-client"
                    value={formData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                    className={formErrors.client ? 'border-red-500' : ''}
                  />
                  {formErrors.client && (
                    <p className="text-red-500 text-sm">{formErrors.client}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-skills">Skills</Label>
                  <Input
                    id="edit-skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    className={formErrors.skills ? 'border-red-500' : ''}
                  />
                  {formErrors.skills && (
                    <p className="text-red-500 text-sm">{formErrors.skills}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dateAdded">Date Added</Label>
              <Input
                id="edit-dateAdded"
                type="date"
                value={formData.dateAdded}
                onChange={(e) => handleInputChange('dateAdded', e.target.value)}
                className={formErrors.dateAdded ? 'border-red-500' : ''}
              />
              {formErrors.dateAdded && (
                <p className="text-red-500 text-sm">{formErrors.dateAdded}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: CandidateStatus) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="L1 Interview">L1 Interview</SelectItem>
                  <SelectItem value="L2 Interview">L2 Interview</SelectItem>
                  <SelectItem value="Final Interview">Final Interview</SelectItem>
                  <SelectItem value="Technical Interview">Technical Interview</SelectItem>
                  <SelectItem value="HR Interview">HR Interview</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Joined">Joined</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label className="text-base font-medium">Experience & Compensation</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalExperience">Total Experience (years)</Label>
                  <Input
                    id="edit-totalExperience"
                    value={formData.totalExperience}
                    onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-relevantExperience">Relevant Experience (years)</Label>
                  <Input
                    id="edit-relevantExperience"
                    value={formData.relevantExperience}
                    onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ctc">Current CTC (LPA)</Label>
                  <Input
                    id="edit-ctc"
                    value={formData.ctc}
                    onChange={(e) => handleInputChange('ctc', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ectc">Expected CTC (LPA)</Label>
                  <Input
                    id="edit-ectc"
                    value={formData.ectc}
                    onChange={(e) => handleInputChange('ectc', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-noticePeriod">Notice Period</Label>
              <Input
                id="edit-noticePeriod"
                value={formData.noticePeriod}
                onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assignedJobId">Assigned Job</Label>
              <Select value={formData.assignedJobId} onValueChange={(value: string) => handleInputChange('assignedJobId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assigned job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No job assigned</SelectItem>
                  {myJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Remarks & Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Active Candidate
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.active 
                  ? 'This candidate is currently active and will appear in searches and reports.' 
                  : 'This candidate is inactive and will be hidden from searches and reports.'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }} 
              type="button"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEdit} 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
              type="button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}