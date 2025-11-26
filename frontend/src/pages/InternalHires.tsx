import { useState, useMemo, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StatCard } from '@/components/StatCard';
import { Users, UserPlus, Search, Filter, Edit, Trash2, Eye, Mail, Phone, MapPin, Briefcase, IndianRupee, UserCheck, XCircle, CheckCircle2, Clock, MoreVertical, Download, Plus, X, Power, PowerOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// Internal Candidate Interface
interface InternalCandidate {
  id: string;
  slNo: number;
  candidateId: string;
  fullName: string;
  contact: string;
  email: string;
  role: string;
  ctc: string;
  ectc: string;
  referenceName: string;
  location: string;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Offer' | 'Joined';
  experience: string;
  skills: string[];
  noticePeriod: string;
  appliedDate: string;
  recruiter: string;
  notes?: string;
  isActive: boolean;
}

export default function InternalHires() {
  const [candidates, setCandidates] = useState<InternalCandidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<InternalCandidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data for internal hires with INR format
  useEffect(() => {
    const mockCandidates: InternalCandidate[] = [
      {
        id: '1',
        slNo: 1,
        candidateId: 'INT-2024-001',
        fullName: 'John Smith',
        contact: '+91 98765 43210',
        email: 'john.smith@company.com',
        role: 'Senior Frontend Developer',
        ctc: '₹12 LPA',
        ectc: '₹15 LPA',
        referenceName: 'Sarah Johnson',
        location: 'Bangalore',
        status: 'Shortlisted',
        experience: '5 years',
        skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
        noticePeriod: '30 days',
        appliedDate: '2024-01-15',
        recruiter: 'Emily Davis',
        notes: 'Strong technical background, good cultural fit',
        isActive: true
      },
      {
        id: '2',
        slNo: 2,
        candidateId: 'INT-2024-002',
        fullName: 'Maria Garcia',
        contact: '+91 87654 32109',
        email: 'maria.garcia@company.com',
        role: 'Backend Engineer',
        ctc: '₹14 LPA',
        ectc: '₹18 LPA',
        referenceName: 'Mike Wilson',
        location: 'Hyderabad',
        status: 'Interview',
        experience: '6 years',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Docker'],
        noticePeriod: '15 days',
        appliedDate: '2024-01-18',
        recruiter: 'Emily Davis',
        notes: 'Excellent problem-solving skills',
        isActive: true
      },
      {
        id: '3',
        slNo: 3,
        candidateId: 'INT-2024-003',
        fullName: 'David Chen',
        contact: '+91 76543 21098',
        email: 'david.chen@company.com',
        role: 'DevOps Engineer',
        ctc: '₹16 LPA',
        ectc: '₹20 LPA',
        referenceName: 'Lisa Brown',
        location: 'Remote',
        status: 'Offer',
        experience: '4 years',
        skills: ['AWS', 'Kubernetes', 'Terraform', 'Python'],
        noticePeriod: '60 days',
        appliedDate: '2024-01-10',
        recruiter: 'Emily Davis',
        notes: 'Pending background check',
        isActive: true
      },
      {
        id: '4',
        slNo: 4,
        candidateId: 'INT-2024-004',
        fullName: 'Sarah Johnson',
        contact: '+91 65432 10987',
        email: 'sarah.johnson@company.com',
        role: 'Product Manager',
        ctc: '₹18 LPA',
        ectc: '₹22 LPA',
        referenceName: 'Tom Wilson',
        location: 'Delhi',
        status: 'Joined',
        experience: '8 years',
        skills: ['Product Strategy', 'Agile', 'UX Research', 'Analytics'],
        noticePeriod: '45 days',
        appliedDate: '2024-01-05',
        recruiter: 'Emily Davis',
        notes: 'Successfully onboarded',
        isActive: true
      },
      {
        id: '5',
        slNo: 5,
        candidateId: 'INT-2024-005',
        fullName: 'Michael Brown',
        contact: '+91 54321 09876',
        email: 'michael.brown@company.com',
        role: 'Data Scientist',
        ctc: '₹15 LPA',
        ectc: '₹18 LPA',
        referenceName: 'Anna Taylor',
        location: 'Mumbai',
        status: 'Rejected',
        experience: '5 years',
        skills: ['Python', 'Machine Learning', 'SQL', 'Tableau'],
        noticePeriod: '30 days',
        appliedDate: '2024-01-20',
        recruiter: 'Emily Davis',
        notes: 'Lacked required domain expertise',
        isActive: false
      },
      {
        id: '6',
        slNo: 6,
        candidateId: 'INT-2024-006',
        fullName: 'Emma Wilson',
        contact: '+91 43210 98765',
        email: 'emma.wilson@company.com',
        role: 'UX Designer',
        ctc: '₹10 LPA',
        ectc: '₹12 LPA',
        referenceName: 'James Miller',
        location: 'Chennai',
        status: 'Applied',
        experience: '3 years',
        skills: ['Figma', 'User Research', 'Prototyping', 'UI Design'],
        noticePeriod: '15 days',
        appliedDate: '2024-01-22',
        recruiter: 'Emily Davis',
        notes: 'Portfolio review pending',
        isActive: true
      },
      {
        id: '7',
        slNo: 7,
        candidateId: 'INT-2024-007',
        fullName: 'Rahul Sharma',
        contact: '+91 91234 56789',
        email: 'rahul.sharma@company.com',
        role: 'Full Stack Developer',
        ctc: '₹11 LPA',
        ectc: '₹14 LPA',
        referenceName: 'Priya Singh',
        location: 'Pune',
        status: 'Shortlisted',
        experience: '4 years',
        skills: ['React', 'Node.js', 'MongoDB', 'Express'],
        noticePeriod: '30 days',
        appliedDate: '2024-01-25',
        recruiter: 'Emily Davis',
        notes: 'Good communication skills',
        isActive: true
      },
      {
        id: '8',
        slNo: 8,
        candidateId: 'INT-2024-008',
        fullName: 'Priya Patel',
        contact: '+91 89876 54321',
        email: 'priya.patel@company.com',
        role: 'QA Engineer',
        ctc: '₹9 LPA',
        ectc: '₹11 LPA',
        referenceName: 'Raj Kumar',
        location: 'Gurgaon',
        status: 'Interview',
        experience: '3 years',
        skills: ['Selenium', 'Java', 'TestNG', 'JIRA'],
        noticePeriod: '45 days',
        appliedDate: '2024-01-28',
        recruiter: 'Emily Davis',
        notes: 'Automation testing expertise',
        isActive: false
      }
    ];
    setCandidates(mockCandidates);
  }, []);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = 
        candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.candidateId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
      const matchesLocation = locationFilter === 'all' || candidate.location === locationFilter;
      
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [candidates, searchTerm, statusFilter, locationFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const currentCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const total = candidates.length;
    const shortlisted = candidates.filter(c => c.status === 'Shortlisted').length;
    const interview = candidates.filter(c => c.status === 'Interview').length;
    const offer = candidates.filter(c => c.status === 'Offer').length;
    const joined = candidates.filter(c => c.status === 'Joined').length;
    const rejected = candidates.filter(c => c.status === 'Rejected').length;
    
    const conversionRate = total > 0 ? ((joined / total) * 100).toFixed(1) : '0';

    return {
      total,
      shortlisted,
      interview,
      offer,
      joined,
      rejected,
      conversionRate
    };
  }, [candidates]);

  // Status options
  const statusOptions = ['all', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Joined', 'Rejected'];
  const locationOptions = ['all', 'Bangalore', 'Hyderabad', 'Remote', 'Delhi', 'Mumbai', 'Chennai', 'Pune', 'Gurgaon'];

  // Get status badge
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'Joined':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800`}>Joined</span>;
      case 'Rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800`}>Rejected</span>;
      case 'Offer':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800`}>Offer</span>;
      case 'Interview':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800`}>Interview</span>;
      case 'Shortlisted':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800`}>Shortlisted</span>;
      case 'Applied':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-700`}>Applied</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`}>Unknown</span>;
    }
  };

  // Handle actions
  const handleView = (candidate: InternalCandidate) => {
    setSelectedCandidate(candidate);
    setIsViewModalOpen(true);
  };

  const handleEdit = (candidate: InternalCandidate) => {
    setSelectedCandidate(candidate);
    // In a real app, you would open an edit modal
    alert(`Edit candidate: ${candidate.fullName}`);
  };

  const handleToggleActive = (candidate: InternalCandidate) => {
    const action = candidate.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${candidate.fullName}?`)) {
      setCandidates(prev => 
        prev.map(c => 
          c.id === candidate.id ? { ...c, isActive: !c.isActive } : c
        )
      );
    }
  };

  const handleAddCandidate = () => {
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400">
                Internal Hires
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and track internal employee referrals and hires
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleAddCandidate}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Add Candidate
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Candidates"
              value={stats.total}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
            />
            
            <StatCard
              title="Shortlisted"
              value={stats.shortlisted}
              icon={UserCheck}
              gradient="from-yellow-500 to-yellow-600"
            />
            
            <StatCard
              title="In Interview"
              value={stats.interview}
              icon={Clock}
              gradient="from-purple-500 to-purple-600"
            />
            
            <StatCard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              icon={CheckCircle2}
              gradient="from-green-500 to-green-600"
            />
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Offers Made"
              value={stats.offer}
              icon={IndianRupee}
              gradient="from-indigo-500 to-indigo-600"
            />
            
            <StatCard
              title="Successfully Joined"
              value={stats.joined}
              icon={UserCheck}
              gradient="from-emerald-500 to-emerald-600"
            />
            
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircle}
              gradient="from-red-500 to-red-600"
            />
          </div>

          {/* Filters and Search */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search candidates by name, email, role, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  {statusOptions.filter(opt => opt !== 'all').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Locations</option>
                  {locationOptions.filter(opt => opt !== 'all').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>

                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          {/* Candidates Table */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Sl No</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Candidate ID</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Full Name</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Role</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">CTC/ECTC</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Reference</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Location</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCandidates.map((candidate, index) => (
                    <motion.tr
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={clsx(
                        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                      )}
                    >
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-mono text-sm">
                        {candidate.slNo}
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-mono text-sm text-blue-600 dark:text-blue-400">
                        {candidate.candidateId}
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                        {candidate.fullName}
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-500" />
                          {candidate.contact}
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-500" />
                          {candidate.email}
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-gray-500" />
                          {candidate.role}
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <IndianRupee className="w-3 h-3" />
                            Current: {candidate.ctc}
                          </div>
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <IndianRupee className="w-3 h-3" />
                            Expected: {candidate.ectc}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        {candidate.referenceName}
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          {candidate.location}
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        {getStatusBadge(candidate.status)}
                      </td>
                      <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(candidate)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(candidate)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(candidate)}
                            className={clsx(
                              candidate.isActive 
                                ? "text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            )}
                          >
                            {candidate.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {currentCandidates.length} of {filteredCandidates.length} candidates
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>

          {/* Add Candidate Modal */}
          <Dialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <DialogTitle className="text-xl font-bold">Add Internal Candidate</DialogTitle>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name *
                        </label>
                        <Input type="text" placeholder="Enter full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Number *
                        </label>
                        <Input type="tel" placeholder="Enter contact number" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address *
                        </label>
                        <Input type="email" placeholder="Enter email address" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Role/Position *
                        </label>
                        <Input type="text" placeholder="Enter role/position" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current CTC (INR) *
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                          <Input 
                            type="text" 
                            placeholder="Enter current CTC in LPA" 
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Expected CTC (INR) *
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                          <Input 
                            type="text" 
                            placeholder="Enter expected CTC in LPA" 
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Reference Name *
                        </label>
                        <Input type="text" placeholder="Enter reference name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location *
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">Select location</option>
                          {locationOptions.filter(opt => opt !== 'all').map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status *
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">Select status</option>
                          {statusOptions.filter(opt => opt !== 'all').map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Experience
                        </label>
                        <Input type="text" placeholder="Enter years of experience" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Skills
                    </label>
                    <Input type="text" placeholder="Enter skills (comma separated)" />
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Notes
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={3}
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Candidate
                    </Button>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          {/* View Candidate Modal */}
          {selectedCandidate && (
            <Dialog open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} className="relative z-50">
              <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <DialogTitle className="text-2xl font-bold">Candidate Details</DialogTitle>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="overflow-auto max-h-[calc(90vh-120px)]">
                    <div className="p-6 space-y-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                            {selectedCandidate.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCandidate.fullName}</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">{selectedCandidate.role}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(selectedCandidate.status)}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Candidate ID: {selectedCandidate.candidateId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Personal & Contact Info */}
                        <div className="space-y-6">
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact Information</h3>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.email}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.contact}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.location}</span>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Compensation (INR)</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Current CTC</span>
                                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                  <IndianRupee className="w-4 h-4" />
                                  {selectedCandidate.ctc}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Expected CTC</span>
                                <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <IndianRupee className="w-4 h-4" />
                                  {selectedCandidate.ectc}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Notice Period</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.noticePeriod}</span>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Right Column - Professional Details */}
                        <div className="space-y-6">
                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Professional Details</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Experience</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.experience}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Reference</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.referenceName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Recruiter</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedCandidate.recruiter}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Applied Date</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {new Date(selectedCandidate.appliedDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedCandidate.skills.map((skill, index) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </Card>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {selectedCandidate.notes && (
                        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/10">
                          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Additional Notes</h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedCandidate.notes}
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Candidate ID: {selectedCandidate.candidateId}</span>
                        <span>•</span>
                        <span>Status: {selectedCandidate.status}</span>
                        <span>•</span>
                        <span>Active: {selectedCandidate.isActive ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => handleToggleActive(selectedCandidate)}
                          className={clsx(
                            "flex items-center gap-2",
                            selectedCandidate.isActive 
                              ? "text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-900/20"
                              : "text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                          )}
                        >
                          {selectedCandidate.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          {selectedCandidate.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                          Close
                        </Button>
                        <Button 
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          onClick={() => handleEdit(selectedCandidate)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Candidate
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}