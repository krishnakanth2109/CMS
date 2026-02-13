import React, { useState, useMemo, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOfficeIcon, UserIcon, MagnifyingGlassIcon, XMarkIcon, EyeIcon, PencilIcon, PlusIcon, CheckCircleIcon, NoSymbolIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Types ---
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

// --- Detail Modal Component ---
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
                     <p><span className="font-medium">Person:</span> {client.contactPerson || 'N/A'}</p>
                     <p><span className="font-medium">Email:</span> {client.email || 'N/A'}</p>
                     <p><span className="font-medium">Phone:</span> {client.phone || 'N/A'}</p>
                     <p><span className="font-medium">Address:</span> {client.address || 'N/A'}</p>
                     <p><span className="font-medium">Website:</span> {client.website || 'N/A'}</p>
                   </div>
                </div>
                <div>
                   <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><BuildingOfficeIcon className="w-5 h-5"/> Business Terms</h3>
                   <div className="space-y-2 text-sm">
                     <p><span className="font-medium">Commission:</span> {client.percentage ? `${client.percentage}%` : 'N/A'}</p>
                     <p><span className="font-medium">Period:</span> {client.candidatePeriod ? `${client.candidatePeriod} months` : 'N/A'}</p>
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

// --- Main Component ---
const AdminClientInfo: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const initialFormState: ClientForm = {
    companyName: "", contactPerson: "", email: "", phone: "", website: "", address: "",
    locationLink: "", industry: "", gstNumber: "", notes: "", clientId: "",
    percentage: "", candidatePeriod: "", replacementPeriod: "", terms: "", active: true,
  };

  const [form, setForm] = useState<ClientForm>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.companyName.trim()) newErrors.companyName = "Company Name is required";
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (form.email.trim() && !emailRegex.test(form.email)) newErrors.email = "Invalid email format";

    if (form.phone.trim() && form.phone.length !== 10) newErrors.phone = "Phone must be 10 digits";

    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (form.website.trim() && !urlRegex.test(form.website)) newErrors.website = "Invalid URL";

    if (form.percentage && (isNaN(parseFloat(form.percentage)) || parseFloat(form.percentage) > 100)) newErrors.percentage = "Invalid %";
    if (form.candidatePeriod && isNaN(parseInt(form.candidatePeriod))) newErrors.candidatePeriod = "Must be a number";
    if (form.replacementPeriod && isNaN(parseInt(form.replacementPeriod))) newErrors.replacementPeriod = "Must be a number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'phone' && /[^0-9]/.test(value)) return;
    if (name === 'phone' && value.length > 10) return;
    if ((name === 'candidatePeriod' || name === 'replacementPeriod') && /[^0-9]/.test(value)) return;

    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });

    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
        toast({ title: "Validation Error", description: "Please fix errors", variant: "destructive" });
        return;
    }

    try {
      const url = editingClient ? `${API_URL}/clients/${editingClient.id}` : `${API_URL}/clients`;
      const method = editingClient ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: getAuthHeader(), body: JSON.stringify(form) });

      if (!response.ok) throw new Error('Operation failed');

      toast({ title: "Success", description: `Client ${editingClient ? 'Updated' : 'Added'}` });
      setShowForm(false); setEditingClient(null); setForm(initialFormState); setErrors({}); fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: "Could not save client", variant: "destructive" });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client); setErrors({});
    setForm({
      companyName: client.companyName || "", contactPerson: client.contactPerson || "", email: client.email || "",
      phone: client.phone || "", website: client.website || "", address: client.address || "",
      locationLink: client.locationLink || "", industry: client.industry || "", gstNumber: client.gstNumber || "",
      notes: client.notes || "", clientId: client.clientId || "", percentage: client.percentage?.toString() || "",
      candidatePeriod: client.candidatePeriod?.toString() || "", replacementPeriod: client.replacementPeriod?.toString() || "",
      terms: client.terms || "", active: client.active !== false,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (client: Client) => {
    try {
      await fetch(`${API_URL}/clients/${client.id}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify({ active: !client.active }) });
      fetchClients();
      toast({ title: "Updated", description: `Status changed` });
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const uniqueIndustries = useMemo(() => Array.from(new Set(clients.map(c => c.industry).filter(Boolean))), [clients]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
          
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold">Client Information</h1><p className="text-gray-500">Manage client companies</p></div>
            <Button onClick={() => { setEditingClient(null); setShowForm(!showForm); setErrors({}); setForm(initialFormState); }} className="bg-purple-600 hover:bg-purple-700">
              <PlusIcon className="w-4 h-4 mr-2" /> {showForm ? "Cancel" : "Add Client"}
            </Button>
          </div>

          <Card className="p-4">
            <div className="flex gap-4 flex-wrap justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search clients..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2">
                {/* --- FIXED DROPDOWN STYLING --- */}
                <select 
                  className="border rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={industryFilter} 
                  onChange={e => setIndustryFilter(e.target.value)}
                >
                  <option value="all">All Industries</option>
                  {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                
                <select 
                  className="border rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {/* ----------------------------- */}
              </div>
            </div>
          </Card>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="mb-6 border-l-4 border-purple-500">
                  <CardHeader><CardTitle>{editingClient ? "Edit Client" : "Add Client"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><Input name="companyName" placeholder="Company Name *" value={form.companyName} onChange={handleChange} className={errors.companyName ? "border-red-500" : ""} />{errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}</div>
                      <div><Input name="contactPerson" placeholder="Contact Person" value={form.contactPerson} onChange={handleChange} /></div>
                      <div><Input name="email" placeholder="Email" value={form.email} onChange={handleChange} className={errors.email ? "border-red-500" : ""} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
                      <div><Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} maxLength={10} className={errors.phone ? "border-red-500" : ""} />{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}</div>
                      <Input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} />
                      <div><Input name="percentage" placeholder="Commission %" type="text" value={form.percentage} onChange={handleChange} className={errors.percentage ? "border-red-500" : ""} />{errors.percentage && <p className="text-xs text-red-500 mt-1">{errors.percentage}</p>}</div>
                      <div><Input name="candidatePeriod" placeholder="Period (Months)" type="text" value={form.candidatePeriod} onChange={handleChange} className={errors.candidatePeriod ? "border-red-500" : ""} />{errors.candidatePeriod && <p className="text-xs text-red-500 mt-1">{errors.candidatePeriod}</p>}</div>
                      <div><Input name="replacementPeriod" placeholder="Replacement (Days)" type="text" value={form.replacementPeriod} onChange={handleChange} className={errors.replacementPeriod ? "border-red-500" : ""} />{errors.replacementPeriod && <p className="text-xs text-red-500 mt-1">{errors.replacementPeriod}</p>}</div>
                      <Input name="gstNumber" placeholder="GST Number" value={form.gstNumber} onChange={handleChange} />
                      <div><Input name="website" placeholder="Website URL" value={form.website} onChange={handleChange} className={errors.website ? "border-red-500" : ""} />{errors.website && <p className="text-xs text-red-500 mt-1">{errors.website}</p>}</div>
                      <Input name="address" placeholder="Full Address" value={form.address} onChange={handleChange} className="md:col-span-2" />
                      <Input name="clientId" placeholder="Custom ID (Optional)" value={form.clientId} onChange={handleChange} />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button onClick={handleSubmit}>{editingClient ? "Update Client" : "Save Client"}</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

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
                          <div>{client.contactPerson || '-'}</div>
                          <div className="text-xs text-gray-500">{client.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3">{client.percentage ? `${client.percentage}%` : '-'}</td>
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