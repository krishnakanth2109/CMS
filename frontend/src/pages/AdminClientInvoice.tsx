import React, { useState, useMemo, useRef, useEffect } from "react";
import { useClients, Client } from "@/contexts/ClientsContext";
import { useData } from "@/contexts/DataContext";
import { Candidate } from "@/types";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOfficeIcon,
  UserIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PencilSquareIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

// 🔹 Invoice Item Interface
interface InvoiceItem {
  id: string;
  candidateName: string;
  role: string;
  joiningDate: string;
  actualSalary: number;
  percentage: number;
  payment: number;
}

// 🔹 Invoice Form Interface
interface InvoiceForm {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
}

// 🔹 Printable Invoice Component (Matches Screenshot Exactly - Plain Format)
const PrintableInvoice: React.FC<{
  form: InvoiceForm;
  selectedClient: Client | undefined;
}> = ({ form, selectedClient }) => {
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    let words = '';
    
    if (num >= 100000) {
      const lakhs = Math.floor(num / 100000);
      words += numberToWords(lakhs) + ' Lakh ';
      num %= 100000;
    }
    
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      words += numberToWords(thousands) + ' Thousand ';
      num %= 1000;
    }
    
    if (num >= 100) {
      const hundreds = Math.floor(num / 100);
      words += ones[hundreds] + ' Hundred ';
      num %= 100;
    }
    
    if (num > 0) {
      if (num < 20) {
        words += ones[num];
      } else {
        words += tens[Math.floor(num / 10)];
        if (num % 10 > 0) {
          words += ' ' + ones[num % 10];
        }
      }
    }
    
    return words.trim() + ' Rupees only';
  };

  return (
    <div className="bg-white text-black p-8 print:p-0 font-sans text-sm" style={{ 
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '15mm'
    }}>
      {/* Company Header - Simple Text Only */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase">VAGARIOUS SOLUTIONS PVT LTD</h1>
      </div>

      {/* To Section - Client Details */}
      <div className="mb-6">
        <div className="text-sm">
          <strong>To,</strong><br />
          {selectedClient && (
            <>
              <strong>{selectedClient.companyName}</strong><br />
              {selectedClient.address || "1st Floor, 3-5-677/1,"}<br />
              {selectedClient.address ? "" : "Opp RBI Quarter, Near Srinagar Colony,"}<br />
              {selectedClient.address ? "" : "Yelia Reddy Guds, Hyderabad, 500073"}<br />
              GST : {selectedClient.gstNumber || "36A4CCT3963L2T"}
            </>
          )}
        </div>
      </div>

      {/* Date and Invoice Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm">
              {new Date(form.invoiceDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">TAX INVOICE</div>
          </div>
        </div>
        
        <div className="mt-2">
          <div className="text-sm">
            <strong>SUB:</strong> Final invoice
          </div>
        </div>
      </div>

      {/* Tax Invoice Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-800 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-800 p-2 text-left font-bold">S.no</th>
              <th className="border border-gray-800 p-2 text-left font-bold">Candidate Name</th>
              <th className="border border-gray-800 p-2 text-left font-bold">Role</th>
              <th className="border border-gray-800 p-2 text-left font-bold">Joining Date</th>
              <th className="border border-gray-800 p-2 text-left font-bold">Actual Salary</th>
              <th className="border border-gray-800 p-2 text-left font-bold">Percentage</th>
              <th className="border border-gray-800 p-2 text-left font-bold">Payment</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-gray-800 p-2">{index + 1}</td>
                <td className="border border-gray-800 p-2">{item.candidateName}</td>
                <td className="border border-gray-800 p-2">{item.role}</td>
                <td className="border border-gray-800 p-2">{item.joiningDate}</td>
                <td className="border border-gray-800 p-2 text-right">{item.actualSalary.toLocaleString('en-IN')}</td>
                <td className="border border-gray-800 p-2 text-right">{item.percentage}%</td>
                <td className="border border-gray-800 p-2 text-right">{item.payment.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-800 p-2 text-center" colSpan={6}>Total</td>
              <td className="border border-gray-800 p-2 text-right">{form.total.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div className="mb-6 text-sm">
        ({numberToWords(form.total)})
      </div>

      {/* Account Details */}
      <div className="mb-6 text-sm">
        <div><strong>Account Details: -</strong></div>
        <div>Account No.: - 000805023576</div>
        <div>Name: Vagarious Solutions Pvt Ltd.</div>
        <div>Bank: ICICI Bank</div>
        <div>Branch: Begumpet Branch</div>
        <div>PAN No.: AMICV0178E</div>
        <div>GST : 36AAHCV0176E12E</div>
      </div>

      {/* Authorization */}
      <div className="mt-12">
        <div className="text-sm mb-2">
          <strong>Authorized Signature</strong>
        </div>
        <div className="mt-12">
          <div className="text-sm">
            <strong>Nevya S</strong><br />
            Vagarious Solutions Pvt Ltd
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="text-center mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
        <div>2nd Floor, Spline Arcade, Ayyappa Society Main Rd, Madhapur, Hyderabad, TS 500081</div>
        <div>Ph: +91 8919801095 | Email: ops@vagarioussolutions.com | www.vagarioussolutions.com</div>
      </div>
    </div>
  );
};

const ClientInvoice: React.FC = () => {
  const { clients } = useClients();
  const { candidates } = useData();

  // Invoice form state
  const [form, setForm] = useState<InvoiceForm>({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientId: "",
    items: [],
    subtotal: 0,
    total: 0,
    status: "draft"
  });

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);

  // Filter candidates based on selected client
  const filteredCandidates = useMemo(() => {
    if (!form.clientId) return [];
    return candidates.filter(candidate => 
      candidate.recruiterId && candidate.status === 'Joined' &&
      (candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       candidate.position?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [form.clientId, candidates, searchTerm]);

  // Get selected client details
  const selectedClient = useMemo(() => {
    return clients.find(client => client.id === form.clientId);
  }, [form.clientId, clients]);

  // Calculate invoice totals
  useEffect(() => {
    const subtotal = form.items.reduce((sum, item) => sum + item.payment, 0);
    const total = subtotal;

    setForm(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [form.items]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setForm(prev => ({ 
      ...prev, 
      clientId
    }));
    setSearchTerm("");
    setSelectedCandidates([]);
    setForm(prev => ({ ...prev, items: [] }));
  };

  // Handle item changes
  const handleItemChange = (id: string, field: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate payment if actual salary or percentage changes
          if (field === 'actualSalary' || field === 'percentage') {
            updatedItem.payment = (Number(updatedItem.actualSalary) * Number(updatedItem.percentage)) / 100;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Add new candidate row
  const addCandidateRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      candidateName: "",
      role: "",
      joiningDate: new Date().toISOString().split('T')[0],
      actualSalary: 0,
      percentage: 8.33,
      payment: 0
    };
    
    setForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove candidate row
  const removeCandidateRow = (id: string) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Add candidate from dropdown
  const handleAddCandidate = (candidate: Candidate) => {
    // Check if candidate is already added
    if (form.items.some(item => item.candidateName === candidate.name)) {
      toast.error("Candidate already added to invoice");
      return;
    }

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      candidateName: candidate.name,
      role: candidate.position,
      joiningDate: new Date().toISOString().split('T')[0],
      actualSalary: parseFloat(candidate.ctc || '0') || 0,
      percentage: 8.33,
      payment: (parseFloat(candidate.ctc || '0') * 8.33) / 100
    };

    setForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setSelectedCandidates(prev => [...prev, candidate]);
    toast.success(`Added ${candidate.name} to invoice`);
  };

  // Remove candidate from selection
  const handleRemoveSelectedCandidate = (candidateName: string) => {
    setSelectedCandidates(prev => prev.filter(c => c.name !== candidateName));
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.candidateName !== candidateName)
    }));
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomNum}`;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!form.clientId || !form.invoiceNumber) {
      toast.error("Please fill in all required fields: Client and Invoice Number");
      return;
    }

    if (form.items.length === 0) {
      toast.error("Please add at least one candidate to the invoice");
      return;
    }

    if (form.items.some(item => !item.candidateName || !item.role)) {
      toast.error("Please ensure all candidate rows have names and roles");
      return;
    }

    toast.success("Invoice created successfully!");
    setShowPreview(true);
  };

  // Download invoice as PDF
  const downloadInvoice = () => {
    const element = document.getElementById('printable-invoice');
    if (element) {
      const htmlContent = element.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice_${form.invoiceNumber}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 15mm; 
                  font-family: Arial, sans-serif; 
                  color: #000;
                  background: white;
                  font-size: 14px;
                  width: 210mm;
                  min-height: 297mm;
                }
                @media print {
                  body { margin: 0; padding: 15mm; }
                  .no-print { display: none !important; }
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 10px 0;
                }
                th, td { 
                  border: 1px solid #000; 
                  padding: 8px; 
                  text-align: left;
                }
                th { 
                  background-color: #f0f0f0; 
                  font-weight: bold;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .bold { font-weight: bold; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  // Direct print function
  const printInvoice = () => {
    const printContent = document.getElementById('printable-invoice');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      
      document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice_${form.invoiceNumber}</title>
            <style>
              body { 
                margin: 0; 
                padding: 15mm; 
                font-family: Arial, sans-serif; 
                color: #000;
                background: white;
                font-size: 14px;
                width: 210mm;
                min-height: 297mm;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 10px 0;
              }
              th, td { 
                border: 1px solid #000; 
                padding: 8px; 
                text-align: left;
              }
              th { 
                background-color: #f0f0f0; 
                font-weight: bold;
              }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientId: "",
      items: [],
      subtotal: 0,
      total: 0,
      status: "draft"
    });
    setSearchTerm("");
    setSelectedCandidates([]);
    setShowPreview(false);
  };

  // Initialize invoice number on component mount
  useEffect(() => {
    setForm(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 dark:from-green-400 dark:via-blue-400 dark:to-purple-400">
                Professional Invoice Generator
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create clean invoices matching your screenshot format
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={resetForm}
                variant="outline"
                className="gap-2 border-gray-200 dark:border-gray-600"
              >
                <DocumentTextIcon className="w-4 h-4" />
                New Invoice
              </Button>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <EyeIcon className="w-4 h-4" />
                {showPreview ? "Edit Invoice" : "Preview Invoice"}
              </Button>
            </div>
          </motion.div>

          {/* Invoice Form and Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Invoice Form */}
            {!showPreview ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Client Selection */}
                <Card className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-xl font-semibold">
                        Client Selection
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Client *
                      </label>
                      <select
                        value={form.clientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        className="w-full rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.companyName} - {client.contactPerson}
                          </option>
                        ))}
                      </select>
                      
                      {selectedClient && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{selectedClient.companyName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.contactPerson}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  📧 {selectedClient.email}
                                </Badge>
                                {selectedClient.gstNumber && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    GST: {selectedClient.gstNumber}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Candidate Selection */}
                    {form.clientId && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Candidates
                          </label>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {filteredCandidates.length} candidates found
                          </span>
                        </div>
                        
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search candidates to add to invoice..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                          {filteredCandidates.map(candidate => (
                            <div
                              key={candidate.id}
                              className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                              onClick={() => handleAddCandidate(candidate)}
                            >
                              <div>
                                <p className="font-medium">{candidate.name}</p>
                                <p className="text-sm text-gray-600">{candidate.position}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-700">
                                {candidate.ctc ? `₹${candidate.ctc}` : 'No CTC'}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        {/* Selected Candidates */}
                        {selectedCandidates.length > 0 && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                              Selected Candidates ({selectedCandidates.length})
                            </label>
                            <div className="space-y-2">
                              {selectedCandidates.map(candidate => (
                                <div key={candidate.id} className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                                  <div>
                                    <span className="font-medium">{candidate.name}</span>
                                    <span className="text-sm text-gray-600 ml-2">- {candidate.position}</span>
                                  </div>
                                  <Button
                                    onClick={() => handleRemoveSelectedCandidate(candidate.name)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-100"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <CardTitle className="text-xl font-semibold">
                        Invoice & Candidate Details
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Invoice Number *
                        </label>
                        <Input
                          name="invoiceNumber"
                          value={form.invoiceNumber}
                          onChange={handleChange}
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 font-mono"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Invoice Date *
                        </label>
                        <Input
                          name="invoiceDate"
                          type="date"
                          value={form.invoiceDate}
                          onChange={handleChange}
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    {/* Candidate Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Candidate Details ({form.items.length} candidates)
                        </label>
                        <div className="flex gap-2">
                          <Button
                            onClick={addCandidateRow}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Manual
                          </Button>
                        </div>
                      </div>

                      {form.items.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No candidates added yet</p>
                          <p className="text-sm text-gray-400 mt-1">Select candidates from the dropdown above or add manually</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {form.items.map((item, index) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-700">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold">Candidate {index + 1}</h4>
                                <Button
                                  onClick={() => removeCandidateRow(item.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-gray-600">Candidate Name</label>
                                  <Input
                                    placeholder="Name"
                                    value={item.candidateName}
                                    onChange={(e) => handleItemChange(item.id, 'candidateName', e.target.value)}
                                    className="bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-gray-600">Role</label>
                                  <Input
                                    placeholder="Role"
                                    value={item.role}
                                    onChange={(e) => handleItemChange(item.id, 'role', e.target.value)}
                                    className="bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-gray-600">Joining Date</label>
                                  <Input
                                    type="date"
                                    value={item.joiningDate}
                                    onChange={(e) => handleItemChange(item.id, 'joiningDate', e.target.value)}
                                    className="bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-gray-600">Actual Salary (₹)</label>
                                  <Input
                                    type="number"
                                    placeholder="Salary"
                                    value={item.actualSalary}
                                    onChange={(e) => handleItemChange(item.id, 'actualSalary', parseFloat(e.target.value) || 0)}
                                    className="bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-gray-600">Percentage (%)</label>
                                  <Input
                                    type="number"
                                    placeholder="Percentage"
                                    value={item.percentage}
                                    onChange={(e) => handleItemChange(item.id, 'percentage', parseFloat(e.target.value) || 0)}
                                    className="bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-gray-600">Payment (₹)</label>
                                  <Input
                                    value={item.payment.toLocaleString('en-IN')}
                                    readOnly
                                    className="bg-gray-50 dark:bg-gray-500 border-gray-200 dark:border-gray-400 text-sm font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="px-8"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                    disabled={form.items.length === 0}
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Invoice Preview */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <Card className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg print:shadow-none print:border-0 print:bg-white">
                  <CardContent className="p-0 print:p-0">
                    <div id="printable-invoice" className="flex justify-center">
                      <PrintableInvoice 
                        form={form}
                        selectedClient={selectedClient}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Actions */}
                <div className="flex justify-center gap-3 print:hidden">
                  <Button
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    className="px-8"
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-2" />
                    Edit Invoice
                  </Button>
                  <Button
                    onClick={printInvoice}
                    variant="outline"
                    className="px-8 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Print Invoice
                  </Button>
                  <Button
                    onClick={downloadInvoice}
                    className="px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Invoice Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Invoice Summary Card */}
              <Card className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg sticky top-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <CalculatorIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="text-xl font-semibold">
                      Invoice Summary
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Total Candidates</span>
                      <span className="font-medium text-gray-900 dark:text-white">{form.items.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Total Payment</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{form.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{form.items.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Candidates</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Math.ceil((new Date(form.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Days Due</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    <CardTitle className="text-xl font-semibold">
                      Printing Instructions
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Optimized for A4 paper (210mm × 297mm)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Plain format matching your screenshot exactly</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Use "Print Invoice" for direct printing</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInvoice;