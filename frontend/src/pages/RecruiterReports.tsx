import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Briefcase, Award } from 'lucide-react';

export default function RecruiterReports() {
  const { user } = useAuth();
  const { candidates, recruiters } = useData();
  
  const myRecruiter = recruiters.find(r => r.username === user?.username);
  const myCandidates = candidates.filter(c => c.recruiterName === myRecruiter?.name);

  const statusData = [
    { name: 'Submitted', value: myCandidates.filter(c => c.status === 'Submitted').length, color: 'hsl(var(--chart-1))' },
    { name: 'Interview', value: myCandidates.filter(c => c.status === 'Interview').length, color: 'hsl(var(--chart-2))' },
    { name: 'Offer', value: myCandidates.filter(c => c.status === 'Offer').length, color: 'hsl(var(--chart-3))' },
    { name: 'Joined', value: myCandidates.filter(c => c.status === 'Joined').length, color: 'hsl(var(--chart-4))' }
  ];

  const weeklyData = [
    { week: 'Week 1', submitted: 3, interviews: 2, offers: 1, joined: 1 },
    { week: 'Week 2', submitted: 4, interviews: 3, offers: 2, joined: 1 },
    { week: 'Week 3', submitted: 2, interviews: 2, offers: 1, joined: 1 },
    { week: 'Week 4', submitted: 5, interviews: 4, offers: 2, joined: 2 }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Reports</h1>
            <p className="text-muted-foreground mt-2">Your performance analytics and insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myRecruiter?.stats.totalSubmissions || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myRecruiter?.stats.interviews || 0}</div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Offers</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myRecruiter?.stats.offers || 0}</div>
                <p className="text-xs text-muted-foreground">Extended</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myRecruiter ? Math.round((myRecruiter.stats.joined / myRecruiter.stats.totalSubmissions) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Conversion rate</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="submitted" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="interviews" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    <Line type="monotone" dataKey="offers" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                    <Line type="monotone" dataKey="joined" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Candidate Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="submitted" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="interviews" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="offers" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="joined" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
