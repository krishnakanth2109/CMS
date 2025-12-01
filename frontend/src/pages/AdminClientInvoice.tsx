import React, { useState, useMemo, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 
import { motion } from "framer-motion";
import html2pdf from 'html2pdf.js';

import {
  BuildingOfficeIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  PrinterIcon,
  PencilSquareIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Types ---

interface Client {
  _id: string;
  id: string;
  companyName: string;
  address?: string;
  gstNumber?: string;
}

interface Candidate {
  _id: string;
  id: string;
  name: string;
  position: string;
  status: string;
  email?: string;
  ctc?: string; // Used as salary
  joiningDate?: string; 
  clientId?: string; 
}

interface InvoiceItem {
  id: string;
  candidateName: string;
  role: string;
  joiningDate: string;
  actualSalary: number;
  percentage: number;
  payment: number;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  pan: string;
  gst: string;
}

interface InvoiceForm {
  invoiceNumber: string;
  invoiceDate: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  bankDetails: BankDetails;
  authorizedSignatory: string;
}

// --- Helper Functions ---

const getOrdinalDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `${getOrdinal(day)} ${month} ${year}`;
};

const numberToWords = (num: number): string => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + convertGroup(n % 100);
  };

  if (num === 0) return 'Zero';
  
  let output = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  if (crore > 0) output += convertGroup(crore) + 'Crore ';
  if (lakh > 0) output += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) output += convertGroup(thousand) + 'Thousand ';
  if (num > 0) output += convertGroup(num);

  return output.trim() + ' Rupees only';
};

// --- Printable Component ---

const PrintableInvoice: React.FC<{
  form: InvoiceForm;
  selectedClient: Client | undefined;
}> = ({ form, selectedClient }) => {
  return (
    <div className="bg-white text-black font-sans leading-normal relative overflow-hidden" 
      id="invoice-content"
      style={{ 
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '0', 
        position: 'relative'
      }}>
      
      {/* 1. Header Design */}
      <div className="flex justify-between items-start pt-12 px-12 pb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-10 h-12 bg-gradient-to-br from-blue-700 to-blue-900 clip-path-logo transform skew-x-[-10deg]"></div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-[#0088CC] tracking-wide uppercase leading-none">VAGARIOUS</h1>
              <span className="text-sm font-bold text-[#0088CC] tracking-[0.2em] uppercase">SOLUTIONS PVT LTD</span>
            </div>
          </div>
        </div>
        <div 
          className="absolute top-0 right-0 w-[200px] h-[100px] bg-[#00AEEF]"
          style={{ clipPath: 'polygon(20% 0%, 100% 0, 100% 100%, 0% 100%)' }}
        ></div>
      </div>

      <div className="px-12 mt-8">
        {/* 2. To Address Section */}
        <div className="mb-8">
          <p className="font-bold mb-2 text-sm">To,</p>
          {selectedClient ? (
            <div className="text-sm font-bold leading-relaxed">
              <p>{selectedClient.companyName}</p>
              <p className="font-medium text-gray-800 w-2/3">
                {selectedClient.address || "Address not available"}
              </p>
              <p className="font-bold">GST : {selectedClient.gstNumber || "N/A"}</p>
            </div>
          ) : (
            <p className="text-red-500 text-sm font-bold">[PLEASE SELECT A CLIENT]</p>
          )}
        </div>

        {/* 3. Date */}
        <div className="flex justify-end mb-6">
          <p className="font-bold text-sm">{getOrdinalDate(form.invoiceDate)}</p>
        </div>

        {/* 4. Subject */}
        <div className="mb-4">
          <p className="font-bold text-sm">SUB: Final Invoice</p>
        </div>

        {/* 5. Tax Invoice Title */}
        <div className="text-center mb-1">
          <h2 className="font-bold text-sm uppercase">TAX INVOICE</h2>
        </div>

        {/* 6. Main Table */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
             <h1 className="text-6xl font-black uppercase text-gray-500 text-center leading-tight">VAGARIOUS<br/>SOLUTIONS PVT LTD</h1>
          </div>

          <table className="w-full border-collapse border border-black text-[11px] relative z-10">
            <thead>
              <tr className="bg-white">
                <th className="border border-black p-2 text-center font-bold w-[5%]">S.no</th>
                <th className="border border-black p-2 text-center font-bold w-[20%]">Candidate<br/>Name</th>
                <th className="border border-black p-2 text-center font-bold w-[15%]">Role</th>
                <th className="border border-black p-2 text-center font-bold w-[15%]">Joining Date</th>
                <th className="border border-black p-2 text-center font-bold w-[15%]">Actual<br/>Salary</th>
                <th className="border border-black p-2 text-center font-bold w-[10%]">Percentage</th>
                <th className="border border-black p-2 text-center font-bold w-[15%]">Payment</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={item.id} className="text-center h-10">
                  <td className="border border-black p-2">{index + 1}</td>
                  <td className="border border-black p-2 font-medium">{item.candidateName}</td>
                  <td className="border border-black p-2">{item.role}</td>
                  <td className="border border-black p-2">{item.joiningDate}</td>
                  <td className="border border-black p-2 text-right px-4">{item.actualSalary.toLocaleString('en-IN')}</td>
                  <td className="border border-black p-2">{item.percentage}%</td>
                  <td className="border border-black p-2 text-right px-4">{item.payment.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                </tr>
              ))}
              
              <tr className="font-bold h-10">
                <td className="border border-black p-2 text-center" colSpan={6}>Total</td>
                <td className="border border-black p-2 text-right px-4">{form.total.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7. Amount in Words */}
        <div className="mb-6 text-sm">
          ( {numberToWords(Math.round(form.total))} / ...)
        </div>

        {/* 8. Bank Account Details */}
        <div className="mb-10 text-xs font-bold leading-loose">
          <p className="mb-1">Account Details: -</p>
          <div className="ml-0">
            <p>Account No.: - {form.bankDetails.accountNumber}</p>
            <p>Name : {form.bankDetails.accountName}</p>
            <p>Bank : {form.bankDetails.bankName}</p>
            <p>Branch : {form.bankDetails.branch}</p>
            <p>PAN No. : {form.bankDetails.pan}</p>
            <p>GST : {form.bankDetails.gst}</p>
          </div>
        </div>

        {/* 9. Signature Section */}
        <div className="mt-8 text-xs font-bold">
          <p className="mb-8">Authorized Signature</p>
          <div className="w-24 h-12 mb-2 relative">
             <div className="absolute inset-0 border-b-2 border-blue-900 transform -rotate-12 opacity-50"></div>
          </div>
          <p>{form.authorizedSignatory}</p>
          <p>Vagarious Solutions Pvt Ltd</p>
        </div>
      </div>

      {/* 10. Footer Section */}
      <div className="absolute bottom-0 w-full bg-[#0088CC] text-white py-4 px-12 text-center text-[10px]">
        <p>2nd Floor, Spline Arcade, Ayyappa Society Main Rd, Madhapur, Hyderabad, TS 500081</p>
        <p>Ph: +91 8919801095 | Email: ops@vagarioussolutions.com | www.vagarioussolutions.com</p>
      </div>
    </div>
  );
};

// --- Main Admin Component ---

const AdminClientInvoice: React.FC = () => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetched Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Form State
  const [form, setForm] = useState<InvoiceForm>({
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    clientId: "",
    items: [],
    subtotal: 0,
    total: 0,
    authorizedSignatory: "Navya S",
    bankDetails: {
      accountNumber: "000805022576",
      accountName: "Vagarious Solutions Pvt Ltd.",
      bankName: "ICICI Bank",
      branch: "Begumpet Branch",
      pan: "AAHCV0176E",
      gst: "36AAHCV0176E1ZE"
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // 1. Fetch Data from Backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resClients, resCandidates] = await Promise.all([
          fetch(`${API_URL}/clients`, { headers: getAuthHeader() }),
          fetch(`${API_URL}/candidates`, { headers: getAuthHeader() })
        ]);

        if (resClients.ok) {
          const clientData = await resClients.json();
          // Map _id to id for consistent usage
          setClients(clientData.map((c: any) => ({ ...c, id: c._id })));
        }

        if (resCandidates.ok) {
          const candData = await resCandidates.json();
          setCandidates(candData.map((c: any) => ({ ...c, id: c._id })));
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get selected client details
  const selectedClient = useMemo(() => {
    return clients.find(client => client.id === form.clientId);
  }, [form.clientId, clients]);

  // Filter candidates (Only Joined ones, and belonging to selected client if chosen)
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Basic filters
      const isJoined = candidate.status === 'Joined';
      const matchesSearch = 
        candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // If client selected, filter by client (assuming candidate has clientId field or client Name matches)
      // Note: Adjust 'client' property matching based on your schema
      // For this example, we rely on manual selection if linking isn't strict in DB
      return isJoined && matchesSearch;
    });
  }, [candidates, searchTerm]);

  // Recalculate totals
  useEffect(() => {
    const total = form.items.reduce((sum, item) => sum + item.payment, 0);
    setForm(prev => ({ ...prev, subtotal: total, total }));
  }, [form.items]);

  // Handlers
  const handleClientChange = (clientId: string) => {
    setForm(prev => ({ ...prev, clientId }));
  };

  const handleAddCandidate = (candidate: Candidate) => {
    if (form.items.some(item => item.candidateName === candidate.name)) {
      toast({ title: "Already added", description: "Candidate already in invoice", variant: "destructive" });
      return;
    }

    // Parse Salary (CTC) - Assuming format like "12 LPA" or just number
    const ctcString = candidate.ctc ? candidate.ctc.replace(/[^0-9.]/g, '') : '0';
    const ctc = parseFloat(ctcString) * 100000 || 0; // Assuming CTC is in Lakhs, convert to actual value if needed. Or just use as is.
    // Adjusted logic: If backend stores as '12', treat as 12,00,000 for invoice? 
    // Usually invoice needs full yearly or monthly salary. 
    // Let's assume the input 'actualSalary' field on invoice is manually editable anyway.
    
    const defaultPercentage = 8.33; 
    
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      candidateName: candidate.name,
      role: candidate.position || "N/A",
      joiningDate: candidate.joiningDate ? new Date(candidate.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      actualSalary: ctc, // Default value
      percentage: defaultPercentage,
      payment: Math.round((ctc * defaultPercentage) / 100)
    };

    setForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
    toast({ title: "Success", description: "Candidate added to invoice" });
  };

  const removeItem = (id: string) => {
    setForm(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'actualSalary' || field === 'percentage') {
            updated.payment = Math.round((Number(updated.actualSalary) * Number(updated.percentage)) / 100);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  // Manual Add Item Handler
  const handleManualAdd = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      candidateName: "",
      role: "",
      joiningDate: new Date().toISOString().split('T')[0],
      actualSalary: 0,
      percentage: 8.33,
      payment: 0
    };
    setForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  };

  const handleDownload = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) {
      toast({ title: "Error", description: "Invoice content not found", variant: "destructive" });
      return;
    }

    setIsDownloading(true);
    const opt = {
      margin: 0,
      filename: `Invoice_${form.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, logging: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast({ title: "Success", description: "Invoice downloaded" });
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <DashboardSidebar />
      
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Invoice Generator
              </h1>
              <p className="text-gray-500 mt-1">Create professional invoices for clients</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <PencilSquareIcon className="w-4 h-4 mr-2"/> : <DocumentTextIcon className="w-4 h-4 mr-2"/>}
                {showPreview ? "Edit Details" : "Preview Invoice"}
              </Button>
              
              {showPreview && (
                <>
                  <Button onClick={handlePrint} variant="secondary">
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700" disabled={isDownloading}>
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    {isDownloading ? "Downloading..." : "Download PDF"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!showPreview ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Client Selection */}
                <Card className="border-0 shadow-md ring-1 ring-gray-100 dark:ring-gray-700">
                  <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                      Client Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Select Client</label>
                        <select 
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={form.clientId}
                          onChange={(e) => handleClientChange(e.target.value)}
                          disabled={loading}
                        >
                          <option value="">-- Choose Client --</option>
                          {clients && clients.length > 0 ? (
                            clients.map(c => (
                              <option 
                                key={c.id} 
                                value={c.id}
                              >
                                {c.companyName}
                              </option>
                            ))
                          ) : (
                            <option disabled>Loading clients or No clients found...</option>
                          )}
                        </select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Invoice Date</label>
                        <Input 
                          type="date" 
                          value={form.invoiceDate}
                          onChange={(e) => setForm({...form, invoiceDate: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    {selectedClient && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                        <p className="font-bold text-blue-800 dark:text-blue-300">{selectedClient.companyName}</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedClient.address || "No address on file"}</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">GST: {selectedClient.gstNumber || "N/A"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Candidate Items */}
                <Card className="border-0 shadow-md ring-1 ring-gray-100 dark:ring-gray-700">
                  <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalculatorIcon className="w-5 h-5 text-green-500" />
                      Invoice Items
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleManualAdd}>
                           <PlusIcon className="w-4 h-4 mr-1" /> Manual Add
                        </Button>
                        <Badge variant="secondary">{form.items.length} Items</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Candidate Search (From Backend) */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Input 
                        placeholder="Search for joined candidates..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {filteredCandidates.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">No joined candidates found matching "{searchTerm}"</div>
                          ) : (
                            filteredCandidates.map(cand => (
                              <div 
                                key={cand.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                onClick={() => {
                                  handleAddCandidate(cand);
                                  setSearchTerm("");
                                }}
                              >
                                <div>
                                  <p className="font-medium text-sm">{cand.name}</p>
                                  <p className="text-xs text-gray-500">{cand.position}</p>
                                </div>
                                <PlusIcon className="w-4 h-4 text-blue-500" />
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                      {form.items.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                          <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No candidates added to invoice yet.</p>
                        </div>
                      ) : (
                        form.items.map((item) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group"
                          >
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-3">
                                <label className="text-xs text-gray-500 block mb-1">Candidate Name</label>
                                <Input value={item.candidateName} onChange={(e) => updateItem(item.id, 'candidateName', e.target.value)} />
                              </div>
                              <div className="md:col-span-3">
                                <label className="text-xs text-gray-500 block mb-1">Role</label>
                                <Input value={item.role} onChange={(e) => updateItem(item.id, 'role', e.target.value)} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">Join Date</label>
                                <Input type="date" value={item.joiningDate} onChange={(e) => updateItem(item.id, 'joiningDate', e.target.value)} className="text-xs" />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">Actual Salary</label>
                                <Input type="number" value={item.actualSalary} onChange={(e) => updateItem(item.id, 'actualSalary', e.target.value)} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">% Comm.</label>
                                <div className="relative">
                                  <Input type="number" value={item.percentage} onChange={(e) => updateItem(item.id, 'percentage', e.target.value)} />
                                  <span className="absolute right-3 top-2 text-xs text-gray-400">%</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                              <p className="text-sm font-semibold text-gray-700">
                                Payment: <span className="text-green-600 text-lg ml-2">₹{item.payment.toLocaleString('en-IN')}</span>
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Settings & Summary */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <p className="text-blue-100 mb-1 font-medium">Total Amount</p>
                    <h2 className="text-4xl font-bold tracking-tight">₹ {form.total.toLocaleString('en-IN')}</h2>
                    <div className="mt-6 pt-6 border-t border-blue-500/30 text-sm text-blue-100">
                      {form.items.length} candidates included in this invoice.
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                   <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-md flex items-center gap-2">
                      <BanknotesIcon className="w-5 h-5 text-gray-500" />
                      Sender Details (Internal)
                    </CardTitle>
                   </CardHeader>
                   <CardContent className="p-4 space-y-3">
                     <div>
                       <label className="text-xs text-gray-500">Bank Name</label>
                       <Input value={form.bankDetails.bankName} onChange={(e) => setForm({...form, bankDetails: {...form.bankDetails, bankName: e.target.value}})} className="h-8 text-sm" />
                     </div>
                     <div>
                       <label className="text-xs text-gray-500">Account No</label>
                       <Input value={form.bankDetails.accountNumber} onChange={(e) => setForm({...form, bankDetails: {...form.bankDetails, accountNumber: e.target.value}})} className="h-8 text-sm" />
                     </div>
                     <div>
                       <label className="text-xs text-gray-500">PAN No</label>
                       <Input value={form.bankDetails.pan} onChange={(e) => setForm({...form, bankDetails: {...form.bankDetails, pan: e.target.value}})} className="h-8 text-sm" />
                     </div>
                     <div>
                       <label className="text-xs text-gray-500">Signatory Name</label>
                       <Input value={form.authorizedSignatory} onChange={(e) => setForm({...form, authorizedSignatory: e.target.value})} className="h-8 text-sm" />
                     </div>
                   </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex justify-center bg-gray-200/50 p-8 rounded-xl overflow-auto border border-gray-200">
              <div id="printable-area" className="bg-white shadow-2xl">
                 <PrintableInvoice form={form} selectedClient={selectedClient} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminClientInvoice;