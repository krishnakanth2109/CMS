import React, { useState, useMemo, useRef, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOfficeIcon, UserIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon, MapPinIcon, LinkIcon, EyeIcon, PencilIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon, ClipboardDocumentListIcon, CalendarDaysIcon, DocumentTextIcon, PercentBadgeIcon, ExclamationTriangleIcon, CheckCircleIcon, NoSymbolIcon, ListBulletIcon, Squares2X2Icon, ArrowRightIcon, IdentificationIcon, ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Client Type Definition
interface Client {
  _id: string;
  id: string; 
  clientId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  locationLink?: string;
  industry?: string;
  gstNumber?: string;
  percentage?: number;
  candidatePeriod?: number;
  replacementPeriod?: number;
  terms?: string;
  notes?: string;
  active?: boolean;
  dateAdded: string;
}

// Client Detail Card Component
const ClientDetailCard: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
  const isCandidatePeriodExpired = useMemo(() => {
    if (!client.candidatePeriod) return false;
    const placementDate = new Date(client.dateAdded);
    const expiryDate = new Date(placementDate);
    expiryDate.setMonth(expiryDate.getMonth() + client.candidatePeriod);
    return new Date() > expiryDate;
  }, [client.candidatePeriod, client.dateAdded]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-2xl">
             <div className="flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{client.companyName}</h2>
                  <p className="text-purple-100">{client.clientId}</p>
                </div>
                <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-white" /></button>
             </div>
          </div>
          <div className="p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><UserIcon className="w-5 h-5"/> Contact Info</h3>
                   <div className="space-y-2 text-sm">
                     <p><span className="font-medium">Person:</span> {client.contactPerson}</p>
                     <p><span className="font-medium">Email:</span> {client.email}</p>
                     <p><span className="font-medium">Phone:</span> {client.phone || 'N/A'}</p>
                     <p><span className="font-medium">Address:</span> {client.address || 'N/A'}</p>
                   </div>
                </div>
                <div>
                   <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><BuildingOfficeIcon className="w-5 h-5"/> Business Terms</h3>
                   <div className="space-y-2 text-sm">
                     <p><span className="font-medium">Commission:</span> {client.percentage ? `${client.percentage}%` : 'N/A'}</p>
                     <p><span className="font-medium">Candidate Period:</span> {client.candidatePeriod ? `${client.candidatePeriod} months` : 'N/A'} 
                        {isCandidatePeriodExpired && <span className="text-red-500 ml-2 font-bold">(Expired)</span>}
                     </p>
                     <p><span className="font-medium">Replacement:</span> {client.replacementPeriod ? `${client.replacementPeriod} days` : 'N/A'}</p>
                     <p><span className="font-medium">GST:</span> {client.gstNumber || 'N/A'}</p>
                   </div>
                </div>
             </div>
             {client.terms && (
               <div className="bg-gray-50 p-4 rounded-lg">
                 <h4 className="font-semibold mb-1">Terms & Conditions</h4>
                 <p className="text-sm text-gray-600">{client.terms}</p>
               </div>
             )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface ClientForm {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  locationLink: string;
  industry: string;
  gstNumber: string;
  notes: string;
  clientId: string;
  percentage: string;
  candidatePeriod: string;
  replacementPeriod: string;
  terms: string;
  active: boolean;
}

const AdminClientInfo: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<ClientForm>({
    companyName: "", contactPerson: "", email: "", phone: "", website: "", address: "",
    locationLink: "", industry: "", gstNumber: "", notes: "", clientId: "",
    percentage: "", candidatePeriod: "", replacementPeriod: "", terms: "", active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({}); // Error state

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clients`, { headers: getAuthHeader() });
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data.map((c: any) => ({ ...c, id: c._id })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load clients", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // VALIDATION LOGIC
  const validateField = (name: string, value: string) => {
    let error = "";
    
    if (name === 'companyName' || name === 'contactPerson') {
      // Allow only letters and spaces
      if (/[^a-zA-Z\s]/.test(value)) {
        error = "Only alphabets allowed";
      }
    }
    
    if (name === 'phone') {
      // Allow only numbers
      if (/[^0-9]/.test(value)) {
        error = "Only numbers allowed";
      } else if (value.length > 10) {
        error = "Max 10 digits allowed";
      }
    }

    if (name === 'percentage' || name === 'candidatePeriod' || name === 'replacementPeriod') {
      if (value && /[^0-9]/.test(value)) {
        error = "Only numbers allowed";
      }
      // Check percentage range
      if (name === 'percentage' && value && (parseInt(value) < 0 || parseInt(value) > 100)) {
        error = "Must be 0-100";
      }
    }

    if (name === 'email') {
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            error = "Invalid email format";
        }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Input filtering for Company Name & Contact Person (prevent numbers being typed)
    if ((name === 'companyName' || name === 'contactPerson') && /[^a-zA-Z\s]/.test(value)) {
      return; // Ignore input if not alphabet/space
    }

    // Input filtering for Phone & Numeric Fields
    if ((name === 'phone' || name === 'percentage' || name === 'candidatePeriod' || name === 'replacementPeriod') && /[^0-9]/.test(value)) {
      return; // Ignore non-numeric input
    }

    if (name === 'phone' && value.length > 10) {
      return; // Limit phone to 10
    }

    validateField(name, value); // Trigger validation message
    
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });
  };

  const handleSubmit = async () => {
    // Final validation check
    const nameValid = validateField('companyName', form.companyName);
    const personValid = validateField('contactPerson', form.contactPerson);
    const emailValid = validateField('email', form.email);
    const phoneValid = validateField('phone', form.phone);

    if (!form.companyName || !form.contactPerson || !form.email) {
      toast({ title: "Validation Error", description: "Required fields missing", variant: "destructive" });
      return;
    }

    if (!nameValid || !personValid || !emailValid || !phoneValid || Object.values(errors).some(x => x !== "")) {
        toast({ title: "Validation Error", description: "Please fix errors in the form", variant: "destructive" });
        return;
    }

    try {
      const url = editingClient ? `${API_URL}/clients/${editingClient.id}` : `${API_URL}/clients`;
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Operation failed');

      toast({ title: "Success", description: `Client ${editingClient ? 'Updated' : 'Added'}` });
      setShowForm(false);
      setEditingClient(null);
      setErrors({});
      fetchClients();
      
      setForm({
        companyName: "", contactPerson: "", email: "", phone: "", website: "", address: "",
        locationLink: "", industry: "", gstNumber: "", notes: "", clientId: "",
        percentage: "", candidatePeriod: "", replacementPeriod: "", terms: "", active: true,
      });
    } catch (error) {
      toast({ title: "Error", description: "Could not save client", variant: "destructive" });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setErrors({});
    setForm({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || "",
      website: client.website || "",
      address: client.address || "",
      locationLink: client.locationLink || "",
      industry: client.industry || "",
      gstNumber: client.gstNumber || "",
      notes: client.notes || "",
      clientId: client.clientId || "",
      percentage: client.percentage?.toString() || "",
      candidatePeriod: client.candidatePeriod?.toString() || "",
      replacementPeriod: client.replacementPeriod?.toString() || "",
      terms: client.terms || "",
      active: client.active !== false,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (client: Client) => {
    try {
      await fetch(`${API_URL}/clients/${client.id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ active: !client.active })
      });
      fetchClients();
      toast({ title: "Status Updated", description: `Client is now ${!client.active ? 'Active' : 'Inactive'}` });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const uniqueIndustries = useMemo(() => Array.from(new Set(clients.map(c => c.industry).filter(Boolean))), [clients]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || client.industry === industryFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? client.active !== false : client.active === false);
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const getStatusBadge = (client: Client) => (
    <Badge className={client.active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
      {client.active !== false ? "Active" : "Inactive"}
    </Badge>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 text-gray-900 dark:text-gray-100">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Client Information</h1>
              <p className="text-gray-500">Manage client companies</p>
            </div>
            <Button onClick={() => { setEditingClient(null); setShowForm(!showForm); setErrors({}); }} className="bg-purple-600 hover:bg-purple-700">
              <PlusIcon className="w-4 h-4 mr-2" /> {showForm ? "Cancel" : "Add Client"}
            </Button>
          </div>

          {/* Controls */}
          <Card className="p-4">
            <div className="flex gap-4 flex-wrap justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search clients..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <select className="border rounded p-2 text-sm" value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
                  <option value="all">All Industries</option>
                  {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select className="border rounded p-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="mb-6">
                  <CardHeader><CardTitle>{editingClient ? "Edit Client" : "Add Client"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Company Name */}
                      <div>
                          <Input name="companyName" placeholder="Company Name *" value={form.companyName} onChange={handleChange} className={errors.companyName ? "border-red-500" : ""} />
                          {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
                      </div>

                      {/* Contact Person */}
                      <div>
                          <Input name="contactPerson" placeholder="Contact Person *" value={form.contactPerson} onChange={handleChange} className={errors.contactPerson ? "border-red-500" : ""} />
                          {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson}</p>}
                      </div>

                      {/* Email */}
                      <div>
                          <Input name="email" placeholder="Email *" value={form.email} onChange={handleChange} className={errors.email ? "border-red-500" : ""} />
                          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                          <Input name="phone" placeholder="Phone (10 digits)" value={form.phone} onChange={handleChange} maxLength={10} className={errors.phone ? "border-red-500" : ""} />
                          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                      </div>

                      <Input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} />
                      
                      {/* Commission */}
                      <div>
                          <Input name="percentage" placeholder="Commission %" type="text" value={form.percentage} onChange={handleChange} className={errors.percentage ? "border-red-500" : ""} />
                          {errors.percentage && <p className="text-xs text-red-500 mt-1">{errors.percentage}</p>}
                      </div>

                      {/* Candidate Period */}
                      <div>
                          <Input name="candidatePeriod" placeholder="Period (Months)" type="text" value={form.candidatePeriod} onChange={handleChange} className={errors.candidatePeriod ? "border-red-500" : ""} />
                          {errors.candidatePeriod && <p className="text-xs text-red-500 mt-1">{errors.candidatePeriod}</p>}
                      </div>

                      {/* Replacement Period */}
                      <div>
                          <Input name="replacementPeriod" placeholder="Replacement (Days)" type="text" value={form.replacementPeriod} onChange={handleChange} className={errors.replacementPeriod ? "border-red-500" : ""} />
                          {errors.replacementPeriod && <p className="text-xs text-red-500 mt-1">{errors.replacementPeriod}</p>}
                      </div>

                      <Input name="gstNumber" placeholder="GST Number" value={form.gstNumber} onChange={handleChange} />
                      <Input name="clientId" placeholder="Custom ID (Optional)" value={form.clientId} onChange={handleChange} />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button onClick={handleSubmit} disabled={Object.values(errors).some(e => e !== "")}>{editingClient ? "Update" : "Save"}</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {loading ? <div className="text-center p-10">Loading clients...</div> : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Terms</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(client => (
                      <tr key={client.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">
                          <div>{client.companyName}</div>
                          <div className="text-xs text-gray-500">{client.clientId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{client.contactPerson}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {client.percentage ? `${client.percentage}%` : '-'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(client)}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}><EyeIcon className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClient(client)}><PencilIcon className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(client)}>
                            {client.active !== false ? <NoSymbolIcon className="w-4 h-4 text-red-500" /> : <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {selectedClient && <ClientDetailCard client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  );
};

export default AdminClientInfo;