
import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
// import { useData } from '@/contexts/DataContext'; // Removed
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Download, Filter, Search } from 'lucide-react';
import { Candidate, Job } from '@/types';

export default function RecruiterCandidates() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // Local Data State replacing Context
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '', position: '', email: '', contact: '', status: 'Submitted', active: true
  });

  // Fetch Candidates and Jobs
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const [candRes, jobRes] = await Promise.all([
        fetch(`${apiUrl}/api/candidates`, { headers }),
        fetch(`${apiUrl}/api/jobs`, { headers })
      ]);

      if (candRes.ok && jobRes.ok) {
        const cData = await candRes.json();
        const jData = await jobRes.json();
        
        // Filter candidates for this recruiter if backend returns all
        // (Assuming backend returns all, we filter here, or backend filters)
        const myCandidates = cData.filter((c: Candidate) => c.recruiterId === user?.id || c.recruiterId === user?._id);
        const myJobs = jData.filter((j: Job) => j.primaryRecruiter === user?.name || j.secondaryRecruiter === user?.name);
        
        setCandidates(myCandidates);
        setJobs(myJobs);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, user]);

  const handleAdd = async () => {
    setIsSubmitting(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const payload = {
        ...formData,
        recruiterId: user?.id,
        recruiterName: user?.name
      };

      const res = await fetch(`${apiUrl}/api/candidates`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: "Success", description: "Candidate added successfully" });
        setIsAddDialogOpen(false);
        fetchData(); // Refresh list
      } else {
        throw new Error("Failed to add");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add candidate" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... [Keep render logic mostly same, mapping over `candidates` state instead of context] ...

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
         <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Candidates</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Add Candidate</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input className="col-span-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Email</Label>
                                <Input className="col-span-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            {/* ... Other fields ... */}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Candidate"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            {/* List Render */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map(candidate => (
                    <Card key={candidate._id || candidate.id} className="p-6">
                        <div className="flex justify-between">
                            <h3 className="font-bold">{candidate.name}</h3>
                            <Badge>{candidate.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{candidate.position}</p>
                    </Card>
                ))}
            </div>
         </div>
      </main>
    </div>
  );
}