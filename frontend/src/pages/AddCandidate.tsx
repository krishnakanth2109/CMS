import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useData, CandidateInput } from '@/contexts/DataContext';
import { useJobs } from '@/contexts/JobsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { CandidateStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AddCandidate() {
  const { addCandidate } = useData();
  const { jobs } = useJobs();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    recruiterName: '',
    dateAdded: new Date().toISOString().split('T')[0],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.skills.trim()) errors.skills = 'Skills are required';
    if (!formData.client.trim()) errors.client = 'Client company is required';
    
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

    if (!formData.recruiterName.trim()) errors.recruiterName = 'Recruiter name is required';
    if (!formData.dateAdded.trim()) errors.dateAdded = 'Date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
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
      const newCandidateData: CandidateInput = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        skills: formData.skills.split(',').map(skill => skill.trim()),
        client: formData.client.trim(),
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        status: formData.status,
        recruiterId: 'admin-1',
        recruiterName: formData.recruiterName.trim(),
        createdAt: formData.dateAdded,
        dateAdded: formData.dateAdded,
        notes: formData.notes.trim(),
        totalExperience: formData.totalExperience.trim(),
        relevantExperience: formData.relevantExperience.trim(),
        ctc: formData.ctc.trim(),
        ectc: formData.ectc.trim(),
        noticePeriod: formData.noticePeriod.trim(),
        // FIX: Handle "unassigned" value here
        assignedJobId: (formData.assignedJobId && formData.assignedJobId !== 'unassigned') ? formData.assignedJobId : undefined,
      };

      addCandidate(newCandidateData);

      toast({
        title: 'Candidate added successfully',
        description: `${formData.name} has been added to the database`,
      });

      navigate('/admin/candidates');
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/candidates')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Candidate</h1>
              <p className="text-muted-foreground">Enter details to create a new candidate profile</p>
            </div>
          </div>

          <Card className="border-none shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
              <CardDescription>Fields marked with <span className="text-red-500">*</span> are required.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4 md:col-span-2">
                <Label className="text-base font-medium text-blue-600 dark:text-blue-400">Basic Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position <span className="text-red-500">*</span></Label>
                    <Input
                      id="position"
                      placeholder="Job position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className={formErrors.position ? 'border-red-500' : ''}
                    />
                    {formErrors.position && <p className="text-red-500 text-sm">{formErrors.position}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4 md:col-span-2">
                <Label className="text-base font-medium text-blue-600 dark:text-blue-400">Contact Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Phone Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact"
                      placeholder="+1 (555) 000-0000"
                      value={formData.contact}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      className={formErrors.contact ? 'border-red-500' : ''}
                    />
                    {formErrors.contact && <p className="text-red-500 text-sm">{formErrors.contact}</p>}
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="space-y-4 md:col-span-2">
                <Label className="text-base font-medium text-blue-600 dark:text-blue-400">Professional Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client Company <span className="text-red-500">*</span></Label>
                    <Input
                      id="client"
                      placeholder="Client company name"
                      value={formData.client}
                      onChange={(e) => handleInputChange('client', e.target.value)}
                      className={formErrors.client ? 'border-red-500' : ''}
                    />
                    {formErrors.client && <p className="text-red-500 text-sm">{formErrors.client}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills <span className="text-red-500">*</span></Label>
                    <Input
                      id="skills"
                      placeholder="React, Node.js, TypeScript (comma separated)"
                      value={formData.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      className={formErrors.skills ? 'border-red-500' : ''}
                    />
                    {formErrors.skills && <p className="text-red-500 text-sm">{formErrors.skills}</p>}
                  </div>
                </div>
              </div>

              {/* Date & Recruiter */}
              <div className="space-y-4 md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateAdded">Date Added <span className="text-red-500">*</span></Label>
                    <Input
                      id="dateAdded"
                      type="date"
                      value={formData.dateAdded}
                      onChange={(e) => handleInputChange('dateAdded', e.target.value)}
                      className={formErrors.dateAdded ? 'border-red-500' : ''}
                    />
                    {formErrors.dateAdded && <p className="text-red-500 text-sm">{formErrors.dateAdded}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiterName">Recruiter Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="recruiterName"
                      placeholder="Recruiter's name"
                      value={formData.recruiterName}
                      onChange={(e) => handleInputChange('recruiterName', e.target.value)}
                      className={formErrors.recruiterName ? 'border-red-500' : ''}
                    />
                    {formErrors.recruiterName && <p className="text-red-500 text-sm">{formErrors.recruiterName}</p>}
                  </div>
                </div>
              </div>

              {/* Experience & Compensation */}
              <div className="space-y-4 md:col-span-2">
                <Label className="text-base font-medium text-blue-600 dark:text-blue-400">Experience & Compensation</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalExperience">Total Exp (years)</Label>
                    <Input
                      id="totalExperience"
                      placeholder="e.g., 5.5"
                      value={formData.totalExperience}
                      onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relevantExperience">Relevant Exp (years)</Label>
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

              {/* Additional Info */}
              <div className="space-y-4 md:col-span-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="noticePeriod">Notice Period</Label>
                      <Input
                        id="noticePeriod"
                        placeholder="e.g., 30 days"
                        value={formData.noticePeriod}
                        onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                      />
                    </div>
                    {/* Select Input Fixed Here */}
                    <div className="space-y-2">
                      <Label htmlFor="assignedJobId">Assigned Job</Label>
                      <Select 
                        value={formData.assignedJobId || "unassigned"} 
                        onValueChange={(value: string) => handleInputChange('assignedJobId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assigned job" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">No job assigned</SelectItem>
                          {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} - {job.client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* End Select Input Fix */}
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
                 </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Remarks & Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes, feedback, or remarks about the candidate..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate('/admin/candidates')}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Candidate'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}