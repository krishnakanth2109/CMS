import { useState, useRef } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useJobs } from '@/contexts/JobsContext';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Award, 
  MapPin, 
  Calendar,
  Download,
  Upload,
  Shield,
  Bell,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Edit,
  Camera,
  CheckCircle,
  Star,
  Target,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RecruiterProfile() {
  const { user } = useAuth();
  const { recruiters, candidates, updateRecruiter } = useData();
  const { jobs } = useJobs();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const myRecruiter = recruiters.find(r => r.username === user?.username);

  // Enhanced form state
  const [formData, setFormData] = useState({
    name: myRecruiter?.name || '',
    email: myRecruiter?.email || '',
    phone: myRecruiter?.phone || '',
    location: myRecruiter?.location || '',
    specialization: myRecruiter?.specialization || '',
    experience: myRecruiter?.experience || '',
    bio: myRecruiter?.bio || '',
    linkedin: myRecruiter?.socials?.linkedin || '',
    github: myRecruiter?.socials?.github || '',
    twitter: myRecruiter?.socials?.twitter || '',
    website: myRecruiter?.socials?.website || '',
  });

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    candidateAlerts: true,
    privacyMode: false,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState(myRecruiter?.profilePicture || '');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Calculate enhanced stats
  const myCandidates = candidates.filter(candidate => candidate.recruiterName === myRecruiter?.name);
  const myJobs = jobs.filter(job => job.assignedRecruiter === myRecruiter?.name);
  
  const stats = {
    totalSubmissions: myRecruiter?.stats.totalSubmissions || 0,
    interviews: myRecruiter?.stats.interviews || 0,
    offers: myRecruiter?.stats.offers || 0,
    joined: myRecruiter?.stats.joined || 0,
    activeCandidates: myCandidates.filter(c => !['Rejected', 'Joined'].includes(c.status)).length,
    totalJobs: myJobs.length,
    successRate: myRecruiter?.stats.totalSubmissions ?
      Math.round((myRecruiter.stats.joined / myRecruiter.stats.totalSubmissions) * 100) : 0,
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingChange = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // In a real app, you would call an API here
    const { linkedin, github, twitter, website, ...restFormData } = formData;
    updateRecruiter(myRecruiter.id, {
      ...restFormData,
      socials: { linkedin, github, twitter, website },
      profilePicture,
    });
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you would call an API here
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const exportProfileData = () => {
    const profileData = {
      ...formData,
      profilePicture,
      stats,
      settings,
      lastUpdated: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `recruiter-profile-${user?.username}.json`;
    link.click();
    
    toast({
      title: "Data exported",
      description: "Your profile data has been exported successfully.",
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Profile</h1>
              <p className="text-muted-foreground mt-2">Manage your personal information and recruitment preferences</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportProfileData} className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture & Basic Info */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                        <AvatarImage src={profilePicture} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {getInitials(formData.name || user?.username || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                        onClick={triggerFileInput}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">{formData.name || 'Unknown User'}</h3>
                      <p className="text-muted-foreground">@{user?.username}</p>
                      <Badge variant="secondary" className="gap-1">
                        <Award className="h-3 w-3" />
                        Recruiter
                      </Badge>
                    </div>

                    {/* Quick Stats */}
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Success Rate</span>
                        <span className="font-semibold">{stats.successRate}%</span>
                      </div>
                      <Progress value={stats.successRate} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">{stats.totalSubmissions}</div>
                          <div className="text-xs text-muted-foreground">Submissions</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{stats.joined}</div>
                          <div className="text-xs text-muted-foreground">Placements</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Main Profile Form */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle>Personal Information</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input 
                            id="name" 
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input 
                            id="username" 
                            value={user?.username} 
                            disabled 
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="email" 
                              type="email" 
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="phone" 
                              type="tel" 
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="location" 
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <CardTitle>Professional Details</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input 
                            id="specialization" 
                            value={formData.specialization}
                            onChange={(e) => handleInputChange('specialization', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g., IT Recruitment, Sales Recruitment" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input 
                            id="experience" 
                            type="number" 
                            value={formData.experience}
                            onChange={(e) => handleInputChange('experience', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Years" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea 
                          id="bio" 
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Tell us about your recruitment expertise, achievements, and approach..." 
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle>Social Links</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </div>
                          </Label>
                          <Input 
                            id="linkedin" 
                            value={formData.linkedin}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://linkedin.com/in/username" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github">
                            <div className="flex items-center gap-2">
                              <Github className="h-4 w-4" />
                              GitHub
                            </div>
                          </Label>
                          <Input 
                            id="github" 
                            value={formData.github}
                            onChange={(e) => handleInputChange('github', e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://github.com/username" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="twitter">
                            <div className="flex items-center gap-2">
                              <Twitter className="h-4 w-4" />
                              Twitter
                            </div>
                          </Label>
                          <Input 
                            id="twitter" 
                            value={formData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://twitter.com/username" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Website
                            </div>
                          </Label>
                          <Input 
                            id="website" 
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://yourwebsite.com" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {isEditing && (
                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{stats.totalSubmissions}</div>
                          <div className="text-sm text-muted-foreground">Total Submissions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{stats.joined}</div>
                          <div className="text-sm text-muted-foreground">Successful Placements</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Submission to Interview</span>
                          <span className="font-semibold">
                            {stats.totalSubmissions ? Math.round((stats.interviews / stats.totalSubmissions) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={stats.totalSubmissions ? (stats.interviews / stats.totalSubmissions) * 100 : 0} 
                          className="h-2"
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span>Interview to Offer</span>
                          <span className="font-semibold">
                            {stats.interviews ? Math.round((stats.offers / stats.interviews) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={stats.interviews ? (stats.offers / stats.interviews) * 100 : 0} 
                          className="h-2"
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span>Offer to Join</span>
                          <span className="font-semibold">
                            {stats.offers ? Math.round((stats.joined / stats.offers) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={stats.offers ? (stats.joined / stats.offers) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Activity Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{stats.activeCandidates}</div>
                          <div className="text-sm text-muted-foreground">Active Candidates</div>
                        </div>
                        <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-600">{stats.totalJobs}</div>
                          <div className="text-sm text-muted-foreground">Managed Jobs</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Candidate Pipeline</span>
                          </div>
                          <Badge variant="secondary">{myCandidates.length}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Active Applications</span>
                          </div>
                          <Badge variant="secondary">
                            {myCandidates.filter(c => c.status === 'Submitted' || c.status === 'Interview').length}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span>Success Rate</span>
                          </div>
                          <Badge variant={stats.successRate >= 50 ? 'default' : 'secondary'}>
                            {stats.successRate}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Achievements */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-6 border rounded-lg space-y-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold">First Placement</h4>
                        <p className="text-sm text-muted-foreground">You made your first successful placement!</p>
                      </div>
                      
                      <div className="text-center p-6 border rounded-lg space-y-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <Target className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold">5+ Submissions</h4>
                        <p className="text-sm text-muted-foreground">Submitted 5+ candidates to clients</p>
                      </div>
                      
                      <div className="text-center p-6 border rounded-lg space-y-2">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-semibold">Consistent Performer</h4>
                        <p className="text-sm text-muted-foreground">Maintained 50%+ success rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Switch 
                        id="email-notifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                      </div>
                      <Switch 
                        id="sms-notifications"
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly-reports">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Get weekly performance summaries</p>
                      </div>
                      <Switch 
                        id="weekly-reports"
                        checked={settings.weeklyReports}
                        onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="candidate-alerts">Candidate Alerts</Label>
                        <p className="text-sm text-muted-foreground">Notifications for candidate updates</p>
                      </div>
                      <Switch 
                        id="candidate-alerts"
                        checked={settings.candidateAlerts}
                        onCheckedChange={(checked) => handleSettingChange('candidateAlerts', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Privacy & Visibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="privacy-mode">Privacy Mode</Label>
                        <p className="text-sm text-muted-foreground">Hide your profile from public view</p>
                      </div>
                      <Switch 
                        id="privacy-mode"
                        checked={settings.privacyMode}
                        onCheckedChange={(checked) => handleSettingChange('privacyMode', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Profile Completion</Label>
                      <Progress value={75} className="h-2" />
                      <p className="text-sm text-muted-foreground">Complete your profile to increase visibility</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Data Export</Label>
                      <Button variant="outline" onClick={exportProfileData} className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Export All Data
                      </Button>
                      <p className="text-sm text-muted-foreground">Download all your data in JSON format</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-red-600" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <Button onClick={handleChangePassword} className="w-full gap-2">
                      <Key className="h-4 w-4" />
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-orange-600" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">Two-Factor Authentication</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Enable 2FA
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">Session Management</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Manage your active sessions and devices
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Active Sessions
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold">Login History</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Review your recent account activity
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}