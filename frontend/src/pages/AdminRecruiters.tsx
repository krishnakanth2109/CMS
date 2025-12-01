import React, { useState, useRef, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Removed useData from imports as we fetch directly now
// import { useData } from "@/contexts/DataContext"; 
import { Recruiter, Candidate } from "@/types";
import {
  AlertTriangle, UserPlus, Search, Mail, Phone, TrendingUp, X, Download, Grid3X3, List, Edit, Trash2, UserX, UserCheck, IdCard, Camera, Briefcase, MoreVertical, Users, Eye, EyeOff, ArrowUpDown
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

// Get API URL from env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
interface PerformanceRow {
  date: string;
  submissions: number;
  interviews: number;
  offers: number;
}
type ViewMode = "grid" | "list";
type SortField = "name" | "email" | "recruiterId" | "role" | "submissions" | "interviews" | "offers" | "joined" | "status";
type SortOrder = "asc" | "desc";

// Extended Candidate interface for frontend mapping if needed
interface CandidateWithId extends Candidate {
  _id?: string;
  recruiterId: string; // Ensure string for comparison
}

export default function AdminRecruiters() {
  const navigate = useNavigate();
  
  // State for Data
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [candidates, setCandidates] = useState<CandidateWithId[]>([]); // Fetched candidates
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  
  const [selectedStatsRecruiters, setSelectedStatsRecruiters] = useState<Recruiter[]>([]);
  const [statsModalTitle, setStatsModalTitle] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statsModalType, setStatsModalType] = useState<'total' | 'active' | 'inactive' | 'roles'>('total');

  const [showStatsModal, setShowStatsModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [candidatesModalTitle, setCandidatesModalTitle] = useState("");

  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null);
  const [recruiterToDelete, setRecruiterToDelete] = useState<Recruiter | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newRecruiter, setNewRecruiter] = useState({
    recruiterId: "",
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    profilePicture: "",
    role: "recruiter"
  });

  const [editRecruiter, setEditRecruiter] = useState({
    id: "",
    recruiterId: "",
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    profilePicture: "",
    role: "recruiter"
  });

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [performanceData, setPerformanceData] = useState<PerformanceRow[]>([]);

  // --- API Functions ---
  const getAuthHeader = () => {
    const token = sessionStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      
      // Fetch Recruiters and Candidates in parallel
      const [recruiterRes, candidateRes] = await Promise.all([
        fetch(`${API_URL}/recruiters`, { headers }),
        fetch(`${API_URL}/candidates`, { headers })
      ]);

      if (!recruiterRes.ok) throw new Error('Failed to fetch recruiters');
      if (!candidateRes.ok) throw new Error('Failed to fetch candidates');
      
      const recruiterData = await recruiterRes.json();
      const candidateData = await candidateRes.json();

      // Map _id to id for frontend consistency
      const mappedRecruiters = recruiterData.map((r: any) => ({ ...r, id: r._id }));
      const mappedCandidates = candidateData.map((c: any) => ({ ...c, id: c._id }));

      setRecruiters(mappedRecruiters);
      setCandidates(mappedCandidates);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Validation Logic ---
  const validateForm = (data: any, isEdit = false) => {
    const newErrors: Record<string, string> = {};
    
    if (!data.name.trim()) newErrors.name = "Name is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(data.email)) newErrors.email = "Invalid email format";
    
    const phoneRegex = /^\d{10}$/;
    if (data.phone && !phoneRegex.test(data.phone)) newErrors.phone = "Phone must be exactly 10 digits";
    
    if (!data.recruiterId.trim()) newErrors.recruiterId = "Recruiter ID is required";
    
    if (!isEdit && (!data.password || data.password.length < 6)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleAddRecruiter = async () => {
    if (!validateForm(newRecruiter)) {
      toast({ title: "Validation Error", description: "Please fix the errors in the form", variant: "destructive" });
      return;
    }

    try {
      const payload = { ...newRecruiter, role: 'recruiter' };
      const response = await fetch(`${API_URL}/recruiters`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create recruiter');

      toast({ title: "Success", description: "Recruiter added successfully!" });
      setShowModal(false);
      setNewRecruiter({
        recruiterId: "", name: "", email: "", phone: "", username: "", 
        password: "", profilePicture: "", role: "recruiter"
      });
      setErrors({});
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditRecruiter = async () => {
    if (!validateForm(editRecruiter, true)) {
      toast({ title: "Validation Error", description: "Please fix the errors in the form", variant: "destructive" });
      return;
    }

    try {
      const payload = { ...editRecruiter, role: 'recruiter' };
      const response = await fetch(`${API_URL}/recruiters/${editRecruiter.id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update recruiter');

      toast({ title: "Success", description: "Recruiter updated successfully!" });
      setShowEditModal(false);
      setErrors({});
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteRecruiter = async () => {
    if (!recruiterToDelete) return;
    try {
      const response = await fetch(`${API_URL}/recruiters/${recruiterToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to delete recruiter');
      toast({ title: "Success", description: "Recruiter deleted successfully!" });
      setShowDeleteModal(false);
      setRecruiterToDelete(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (recruiter: Recruiter) => {
    try {
      const response = await fetch(`${API_URL}/recruiters/${recruiter.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to update status');
      const data = await response.json();
      toast({ title: "Success", description: data.message });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditModal = (recruiter: Recruiter) => {
    setEditRecruiter({
      id: recruiter.id,
      recruiterId: recruiter.recruiterId || "",
      name: recruiter.name,
      email: recruiter.email,
      phone: recruiter.phone || "",
      username: recruiter.username || "",
      profilePicture: recruiter.profilePicture || "",
      role: "recruiter",
      password: "",
    });
    setErrors({});
    setShowEditModal(true);
  };

  // --- Logic & Helpers ---
  const calculateRecruiterStats = (recruiterId: string) => {
    // Filter based on the real candidates data fetched from backend
    const recruiterCandidates = candidates.filter(candidate => 
      candidate.recruiterId === recruiterId
    );

    return {
      totalSubmissions: recruiterCandidates.length,
      interviews: recruiterCandidates.filter(c => ['L1 Interview', 'L2 Interview', 'Interview'].includes(c.status)).length,
      offers: recruiterCandidates.filter(c => c.status === 'Offer').length,
      joined: recruiterCandidates.filter(c => c.status === 'Joined').length,
      rejected: recruiterCandidates.filter(c => c.status === 'Rejected').length,
      pending: recruiterCandidates.filter(c => c.status === 'Pending' || c.status === 'Submitted').length
    };
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const filteredAndSortedRecruiters = recruiters
    .filter((r: Recruiter) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recruiterId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: Recruiter, b: Recruiter) => {
      let aValue: any = '';
      let bValue: any = '';
      const statsA = calculateRecruiterStats(a.id);
      const statsB = calculateRecruiterStats(b.id);

      switch (sortField) {
        case 'name': aValue = a.name; bValue = b.name; break;
        case 'email': aValue = a.email; bValue = b.email; break;
        case 'recruiterId': aValue = a.recruiterId || ""; bValue = b.recruiterId || ""; break;
        case 'role': aValue = a.role || ""; bValue = b.role || ""; break;
        case 'status': aValue = a.active; bValue = b.active; break;
        case 'submissions': aValue = statsA.totalSubmissions; bValue = statsB.totalSubmissions; break;
        case 'interviews': aValue = statsA.interviews; bValue = statsB.interviews; break;
        case 'offers': aValue = statsA.offers; bValue = statsB.offers; break;
        case 'joined': aValue = statsA.joined; bValue = statsB.joined; break;
      }

      if (sortOrder === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (isEdit) {
          setEditRecruiter({ ...editRecruiter, profilePicture: result });
        } else {
          setNewRecruiter({ ...newRecruiter, profilePicture: result });
        }
        toast({ title: "Success", description: "Picture uploaded" });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (isEdit: boolean = false) => {
    isEdit ? editFileInputRef.current?.click() : fileInputRef.current?.click();
  };

  const getStatusBadge = (recruiter: Recruiter) => {
    const isActive = recruiter.active !== false;
    return (
      <Badge variant="secondary" className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isActive ? <><UserCheck className="h-3 w-3 mr-1" /> Active</> : <><UserX className="h-3 w-3 mr-1" /> Inactive</>}
      </Badge>
    );
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const generatePerformanceData = (recruiter: Recruiter, start: string, end: string): PerformanceRow[] => {
    const startDt = new Date(start);
    const endDt = new Date(end);
    const data: PerformanceRow[] = [];
    for (let d = new Date(startDt); d <= endDt; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toISOString().split("T")[0],
        submissions: Math.floor(Math.random() * 5),
        interviews: Math.floor(Math.random() * 2),
        offers: Math.floor(Math.random() * 1),
      });
    }
    return data;
  };

  const handleGenerateReport = () => {
    if (!startDate || !endDate || !selectedRecruiter) {
      toast({ title: "Error", description: "Select start and end dates.", variant: "destructive" });
      return;
    }
    setPerformanceData(generatePerformanceData(selectedRecruiter, startDate, endDate));
  };

  const downloadPDF = () => {
    if (!selectedRecruiter || performanceData.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Performance: ${selectedRecruiter.name}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Submissions", "Interviews", "Offers"]],
      body: performanceData.map((d) => [d.date, d.submissions, d.interviews, d.offers]),
    });
    doc.save("report.pdf");
  };

  const totalRecruiters = recruiters.length;
  const activeRecruiters = recruiters.filter(r => r.active !== false).length;
  const inactiveRecruiters = recruiters.filter(r => r.active === false).length;
  const uniqueRoles = new Set(recruiters.map(r => r.role || 'recruiter')).size;

  const handleMainStatCardClick = (type: 'total' | 'active' | 'inactive' | 'roles') => {
    let data: Recruiter[] = [];
    let title = "";
    
    if (type === 'total') { data = recruiters; title = "All Recruiters"; }
    else if (type === 'active') { data = recruiters.filter(r => r.active !== false); title = "Active Recruiters"; }
    else if (type === 'inactive') { data = recruiters.filter(r => r.active === false); title = "Inactive Recruiters"; }
    else if (type === 'roles') { data = recruiters; title = "Recruiters by Role"; }

    setSelectedStatsRecruiters(data);
    setStatsModalTitle(title);
    setStatsModalType(type);
    setShowStatsModal(true);
  };

  const handleStatCardClick = (recruiter: Recruiter, metric: string) => {
    setCandidatesModalTitle(`${metric} for ${recruiter.name}`);
    setShowCandidatesModal(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Recruiters Management</h1>
              <p className="text-gray-500">Manage your recruitment team</p>
            </div>
            <Button onClick={() => { setShowModal(true); setErrors({}); }} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" /> Add Recruiter
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition" onClick={() => handleMainStatCardClick('total')}>
               <CardContent className="p-4 flex justify-between items-center">
                 <div><p className="text-blue-100 text-sm">Total</p><p className="text-2xl font-bold">{totalRecruiters}</p></div>
                 <Users className="h-8 w-8 opacity-80" />
               </CardContent>
             </Card>
             <Card className="bg-green-600 text-white cursor-pointer hover:bg-green-700 transition" onClick={() => handleMainStatCardClick('active')}>
               <CardContent className="p-4 flex justify-between items-center">
                 <div><p className="text-green-100 text-sm">Active</p><p className="text-2xl font-bold">{activeRecruiters}</p></div>
                 <UserCheck className="h-8 w-8 opacity-80" />
               </CardContent>
             </Card>
             <Card className="bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition" onClick={() => handleMainStatCardClick('inactive')}>
               <CardContent className="p-4 flex justify-between items-center">
                 <div><p className="text-purple-100 text-sm">Inactive</p><p className="text-2xl font-bold">{inactiveRecruiters}</p></div>
                 <UserX className="h-8 w-8 opacity-80" />
               </CardContent>
             </Card>
             <Card className="bg-orange-600 text-white cursor-pointer hover:bg-orange-700 transition" onClick={() => handleMainStatCardClick('roles')}>
               <CardContent className="p-4 flex justify-between items-center">
                 <div><p className="text-orange-100 text-sm">Roles</p><p className="text-2xl font-bold">{uniqueRoles}</p></div>
                 <Briefcase className="h-8 w-8 opacity-80" />
               </CardContent>
             </Card>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search recruiters..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={(val: any) => setSortField(val)}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="recruiterId">ID</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                   <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => setViewMode('grid')} size="icon"><Grid3X3 className="h-4 w-4"/></Button>
                   <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} size="icon"><List className="h-4 w-4"/></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedRecruiters.map((recruiter) => {
                    const stats = calculateRecruiterStats(recruiter.id);
                    return (
                      <Card key={recruiter.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
                              {recruiter.profilePicture ? <img src={recruiter.profilePicture} className="w-full h-full object-cover" /> : getInitials(recruiter.name)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{recruiter.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{recruiter.recruiterId}</Badge>
                                {getStatusBadge(recruiter)}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(recruiter)}><Edit className="h-4 w-4 mr-2"/> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedRecruiter(recruiter); setShowPerformanceModal(true); }}><TrendingUp className="h-4 w-4 mr-2"/> Performance</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleStatus(recruiter)}>{recruiter.active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setRecruiterToDelete(recruiter); setShowDeleteModal(true); }} className="text-red-600"><Trash2 className="h-4 w-4 mr-2"/> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-2 text-sm text-gray-500 mb-4">
                             <div className="flex items-center gap-2"><Mail className="h-4 w-4"/> {recruiter.email}</div>
                             <div className="flex items-center gap-2"><Phone className="h-4 w-4"/> {recruiter.phone || 'N/A'}</div>
                             <div className="flex items-center gap-2"><Briefcase className="h-4 w-4"/> {recruiter.role}</div>
                           </div>
                           <div className="grid grid-cols-4 gap-2 border-t pt-4 text-center">
                              <div className="cursor-pointer" onClick={() => handleStatCardClick(recruiter, 'submissions')}>
                                <div className="font-bold text-lg text-blue-600">{stats.totalSubmissions}</div>
                                <div className="text-[10px]">Subs</div>
                              </div>
                              <div className="cursor-pointer" onClick={() => handleStatCardClick(recruiter, 'interviews')}>
                                <div className="font-bold text-lg text-purple-600">{stats.interviews}</div>
                                <div className="text-[10px]">Intrvw</div>
                              </div>
                              <div className="cursor-pointer" onClick={() => handleStatCardClick(recruiter, 'offers')}>
                                <div className="font-bold text-lg text-green-600">{stats.offers}</div>
                                <div className="text-[10px]">Offer</div>
                              </div>
                              <div className="cursor-pointer" onClick={() => handleStatCardClick(recruiter, 'joined')}>
                                <div className="font-bold text-lg text-orange-600">{stats.joined}</div>
                                <div className="text-[10px]">Join</div>
                              </div>
                           </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* List View - UPDATED with Full Column Names */}
              {viewMode === "list" && (
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 font-medium">
                        <tr>
                          <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('name')}>
                            Recruiter {getSortIcon('name')}
                          </th>
                          <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('recruiterId')}>
                            ID {getSortIcon('recruiterId')}
                          </th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          
                          {/* Updated Column Headers to Full Names */}
                          <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('submissions')}>Submissions {getSortIcon('submissions')}</th>
                          <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('interviews')}>Interviews {getSortIcon('interviews')}</th>
                          <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('offers')}>Offers {getSortIcon('offers')}</th>
                          <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('joined')}>Joined {getSortIcon('joined')}</th>
                          
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedRecruiters.map((recruiter) => {
                           const stats = calculateRecruiterStats(recruiter.id);
                           return (
                            <tr key={recruiter.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                                    {recruiter.profilePicture ? <img src={recruiter.profilePicture} className="w-full h-full rounded-full object-cover"/> : getInitials(recruiter.name)}
                                  </div>
                                  <div>
                                    <div>{recruiter.name}</div>
                                    <div className="text-xs text-gray-500">{recruiter.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">{recruiter.recruiterId}</td>
                              <td className="px-4 py-3">{recruiter.role}</td>
                              <td className="px-4 py-3">{getStatusBadge(recruiter)}</td>
                              
                              {/* Stats Cells */}
                              <td className="px-4 py-3 text-center font-medium text-blue-600 cursor-pointer hover:bg-blue-50 rounded" onClick={() => handleStatCardClick(recruiter, 'submissions')}>
                                {stats.totalSubmissions}
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-purple-600 cursor-pointer hover:bg-purple-50 rounded" onClick={() => handleStatCardClick(recruiter, 'interviews')}>
                                {stats.interviews}
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-green-600 cursor-pointer hover:bg-green-50 rounded" onClick={() => handleStatCardClick(recruiter, 'offers')}>
                                {stats.offers}
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-orange-600 cursor-pointer hover:bg-orange-50 rounded" onClick={() => handleStatCardClick(recruiter, 'joined')}>
                                {stats.joined}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(recruiter)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => { setRecruiterToDelete(recruiter); setShowDeleteModal(true); }} className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                              </td>
                            </tr>
                           );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Add Recruiter Modal */}
          <Dialog open={showModal} onClose={() => setShowModal(false)} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <DialogTitle className="text-xl font-bold mb-4">Add Recruiter</DialogTitle>
                <div className="space-y-4">
                   {/* Profile Pic */}
                   <div className="flex items-center gap-4">
                     <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                       {newRecruiter.profilePicture ? <img src={newRecruiter.profilePicture} className="w-full h-full object-cover"/> : <Camera className="h-6 w-6 text-gray-400"/>}
                     </div>
                     <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileUpload(e, false)} />
                     <Button variant="outline" size="sm" onClick={() => triggerFileInput(false)}>Upload Photo</Button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium">Recruiter ID *</label>
                        <Input value={newRecruiter.recruiterId} onChange={e => setNewRecruiter({...newRecruiter, recruiterId: e.target.value})} className={errors.recruiterId ? "border-red-500" : ""} />
                        {errors.recruiterId && <p className="text-xs text-red-500 mt-1">{errors.recruiterId}</p>}
                     </div>
                     <div>
                        <label className="text-sm font-medium">Full Name *</label>
                        <Input value={newRecruiter.name} onChange={e => setNewRecruiter({...newRecruiter, name: e.target.value})} className={errors.name ? "border-red-500" : ""} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                     </div>
                   </div>
                   
                   <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input value={newRecruiter.email} onChange={e => setNewRecruiter({...newRecruiter, email: e.target.value})} className={errors.email ? "border-red-500" : ""} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input value={newRecruiter.phone} onChange={e => setNewRecruiter({...newRecruiter, phone: e.target.value})} maxLength={10} className={errors.phone ? "border-red-500" : ""} />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                     </div>
                     <div>
                       <label className="text-sm font-medium">Role</label>
                       <Input value="Recruiter" disabled className="bg-gray-100 dark:bg-gray-800 text-gray-500" />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-sm font-medium">Username</label><Input value={newRecruiter.username} onChange={e => setNewRecruiter({...newRecruiter, username: e.target.value})} /></div>
                     <div>
                        <label className="text-sm font-medium">Password *</label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            value={newRecruiter.password} 
                            onChange={e => setNewRecruiter({...newRecruiter, password: e.target.value})} 
                            className={errors.password ? "border-red-500" : ""}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                     </div>
                   </div>

                   <div className="flex justify-end gap-2 mt-4">
                     <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                     <Button onClick={handleAddRecruiter}>Save Recruiter</Button>
                   </div>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          {/* Edit Recruiter Modal */}
          <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <DialogTitle className="text-xl font-bold mb-4">Edit Recruiter</DialogTitle>
                <div className="space-y-4">
                   {/* Profile Pic */}
                   <div className="flex items-center gap-4">
                     <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                       {editRecruiter.profilePicture ? <img src={editRecruiter.profilePicture} className="w-full h-full object-cover"/> : <Camera className="h-6 w-6 text-gray-400"/>}
                     </div>
                     <input type="file" ref={editFileInputRef} hidden onChange={(e) => handleFileUpload(e, true)} />
                     <Button variant="outline" size="sm" onClick={() => triggerFileInput(true)}>Change Photo</Button>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium">Recruiter ID *</label>
                        <Input value={editRecruiter.recruiterId} onChange={e => setEditRecruiter({...editRecruiter, recruiterId: e.target.value})} className={errors.recruiterId ? "border-red-500" : ""} />
                        {errors.recruiterId && <p className="text-xs text-red-500 mt-1">{errors.recruiterId}</p>}
                     </div>
                     <div>
                        <label className="text-sm font-medium">Full Name *</label>
                        <Input value={editRecruiter.name} onChange={e => setEditRecruiter({...editRecruiter, name: e.target.value})} className={errors.name ? "border-red-500" : ""} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                     </div>
                   </div>

                   <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input value={editRecruiter.email} onChange={e => setEditRecruiter({...editRecruiter, email: e.target.value})} className={errors.email ? "border-red-500" : ""} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input value={editRecruiter.phone} onChange={e => setEditRecruiter({...editRecruiter, phone: e.target.value})} maxLength={10} className={errors.phone ? "border-red-500" : ""} />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                     </div>
                     <div>
                       <label className="text-sm font-medium">Role</label>
                       <Input value="Recruiter" disabled className="bg-gray-100 dark:bg-gray-800 text-gray-500" />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-sm font-medium">Username</label><Input value={editRecruiter.username} onChange={e => setEditRecruiter({...editRecruiter, username: e.target.value})} /></div>
                     <div>
                        <label className="text-sm font-medium">Password</label>
                        <div className="relative">
                          <Input 
                            type={showEditPassword ? "text" : "password"} 
                            placeholder="Leave blank to keep current" 
                            value={editRecruiter.password} 
                            onChange={e => setEditRecruiter({...editRecruiter, password: e.target.value})} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                          >
                            {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                     </div>
                   </div>

                   <div className="flex justify-end gap-2 mt-4">
                     <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                     <Button onClick={handleEditRecruiter}>Update Recruiter</Button>
                   </div>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          {/* Delete Modal */}
          <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="relative z-50">
             <DialogBackdrop className="fixed inset-0 bg-black/50" />
             <div className="fixed inset-0 flex items-center justify-center p-4">
               <DialogPanel className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md shadow-2xl">
                 <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Confirm Deletion</DialogTitle>
                 <p className="mt-2 text-gray-600">Are you sure you want to delete <strong>{recruiterToDelete?.name}</strong>? This action cannot be undone.</p>
                 <div className="flex justify-end gap-2 mt-4">
                   <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                   <Button variant="destructive" onClick={handleDeleteRecruiter}>Delete</Button>
                 </div>
               </DialogPanel>
             </div>
          </Dialog>

           {/* Performance/Stats modals structure preserved for layout correctness */}
           {showPerformanceModal && selectedRecruiter && (
             <Dialog open={showPerformanceModal} onClose={() => setShowPerformanceModal(false)} className="relative z-50">
               <DialogBackdrop className="fixed inset-0 bg-black/50" />
               <div className="fixed inset-0 flex items-center justify-center p-4">
                 <DialogPanel className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                   <DialogTitle className="text-xl font-bold mb-4">Performance: {selectedRecruiter.name}</DialogTitle>
                   <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="text-sm">Start Date</label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                        <div><label className="text-sm">End Date</label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                        <div className="flex items-end"><Button onClick={handleGenerateReport} className="w-full">Generate Report</Button></div>
                      </div>
                      {performanceData.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                           <table className="w-full text-sm">
                             <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="p-2 text-left">Date</th><th className="p-2">Submissions</th><th className="p-2">Interviews</th><th className="p-2">Offers</th></tr></thead>
                             <tbody>{performanceData.map((d,i) => <tr key={i} className="border-t"><td className="p-2">{d.date}</td><td className="p-2 text-center">{d.submissions}</td><td className="p-2 text-center">{d.interviews}</td><td className="p-2 text-center">{d.offers}</td></tr>)}</tbody>
                           </table>
                           <div className="mt-4 flex justify-end"><Button onClick={downloadPDF} variant="outline"><Download className="mr-2 h-4 w-4"/> Download PDF</Button></div>
                        </div>
                      ) : <div className="text-center py-8 text-gray-500">No data generated yet.</div>}
                      <div className="flex justify-end"><Button onClick={() => setShowPerformanceModal(false)} variant="ghost">Close</Button></div>
                   </div>
                 </DialogPanel>
               </div>
             </Dialog>
           )}

           {/* Stats Modal (Simplified) */}
           {showStatsModal && (
             <Dialog open={showStatsModal} onClose={() => setShowStatsModal(false)} className="relative z-50">
               <DialogBackdrop className="fixed inset-0 bg-black/50" />
               <div className="fixed inset-0 flex items-center justify-center p-4">
                  <DialogPanel className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                     <DialogTitle className="text-xl font-bold mb-4">{statsModalTitle}</DialogTitle>
                     <div className="space-y-2">
                        {selectedStatsRecruiters.map(r => (
                          <div key={r.id} className="flex justify-between items-center p-2 border-b">
                            <div className="flex items-center gap-2">
                               <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">{getInitials(r.name)}</div>
                               <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-500">{r.email}</div></div>
                            </div>
                            <Badge variant="outline">{r.role}</Badge>
                          </div>
                        ))}
                     </div>
                     <div className="flex justify-end mt-4"><Button onClick={() => setShowStatsModal(false)}>Close</Button></div>
                  </DialogPanel>
               </div>
             </Dialog>
           )}
           
        </div>
      </div>
    </div>
  );
}