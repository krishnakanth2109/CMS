import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, TrendingUp, Calendar } from 'lucide-react';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";   // ✅ correct import
import { useState } from 'react';

export default function AdminReports() {
  const { recruiters, candidates } = useData();
  const [filter, setFilter] = useState<"day" | "week" | "month">("month");

  // ✅ Filter candidates
  const filterCandidates = (range: "day" | "week" | "month") => {
    const today = new Date();
    return candidates.filter(c => {
      const date = new Date(c.submittedDate);
      const diff = (today.getTime() - date.getTime()) / (1000 * 3600 * 24);

      if (range === "day") return diff < 1;
      if (range === "week") return diff < 7;
      if (range === "month") return diff < 30;
      return true;
    });
  };

  const filteredCandidates = filterCandidates(filter);

  const recruiterPerformance = recruiters.map(r => {
    const userCandidates = filteredCandidates.filter(
      c => c.recruiterId === r.username || c.recruiterName === r.name
    );

    return {
      name: r.name.split(' ')[0],
      Submissions: userCandidates.length,
      Interviews: userCandidates.filter(c => c.status === "Interview").length,
      Offers: userCandidates.filter(c => c.status === "Offer").length,
      Joined: userCandidates.filter(c => c.status === "Joined").length
    };
  });

  const monthlyData = [
    { month: 'Jan', candidates: 45, interviews: 32, offers: 18, joined: 12 },
    { month: 'Feb', candidates: 52, interviews: 38, offers: 22, joined: 15 },
    { month: 'Mar', candidates: 61, interviews: 45, offers: 28, joined: 19 },
    { month: 'Apr', candidates: 48, interviews: 35, offers: 20, joined: 14 },
    { month: 'May', candidates: 70, interviews: 52, offers: 31, joined: 22 },
    { month: 'Jun', candidates: 65, interviews: 48, offers: 29, joined: 20 }
  ];

  // ✅ Export Recruiter Data to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(recruiterPerformance);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recruiter Report");
    XLSX.writeFile(workbook, `Recruiter_Report_${filter}.xlsx`);
  };

  // ✅ Export Recruiter Data to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Recruiter Performance Report", 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Recruiter", "Submissions", "Interviews", "Offers", "Joined"]],
      body: recruiterPerformance.map(r => [
        r.name, r.Submissions, r.Interviews, r.Offers, r.Joined
      ]),
    });
    doc.save(`Recruiter_Report_${filter}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground mt-2">Comprehensive performance insights</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFilter("day")}>Day</Button>
              <Button variant="outline" onClick={() => setFilter("week")}>Week</Button>
              <Button variant="outline" onClick={() => setFilter("month")}>Month</Button>
              <Button onClick={exportToExcel} className="gap-2"><Download className="h-4 w-4" />Excel</Button>
              <Button onClick={exportToPDF} className="gap-2"><Download className="h-4 w-4" />PDF</Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* ✅ Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredCandidates.length}</div>
                    <p className="text-xs text-muted-foreground">Filtered ({filter})</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Recruiters</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{recruiters.length}</div>
                    <p className="text-xs text-muted-foreground">All active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        (filteredCandidates.filter(c => c.status === "Joined").length /
                        (filteredCandidates.filter(c => c.status === "Offer").length || 1)) * 100
                      ).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Offer → Join</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ✅ Recruiter Performance Tab */}
            <TabsContent value="recruiters">
              <Card>
                <CardHeader>
                  <CardTitle>Recruiter Performance Comparison ({filter})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={recruiterPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />
                      <Legend />
                      <Bar dataKey="Submissions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Interviews" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Offers" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Joined" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ✅ Trend Analysis Tab */}
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>6-Month Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />
                      <Legend />
                      <Line type="monotone" dataKey="candidates" stroke="hsl(var(--primary))" strokeWidth={3} />
                      <Line type="monotone" dataKey="joined" stroke="hsl(var(--chart-4))" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
