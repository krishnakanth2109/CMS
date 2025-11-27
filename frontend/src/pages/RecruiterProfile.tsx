import { useState, useRef, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, Mail, Phone, Briefcase, Award, MapPin, Camera, CheckCircle,
  TrendingUp, Edit, Loader2, Globe, Linkedin, Github, Twitter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RecruiterProfile() {
  const { user, token } = useAuth(); // Assuming useAuth updates if user updates
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    specialization: '',
    experience: '',
    bio: '',
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
  });

  const [profilePicture, setProfilePicture] = useState('');
  
  // Stats State (Fetched separately or derived)
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    interviews: 0,
    offers: 0,
    joined: 0,
    successRate: 0
  });

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // 1. Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            specialization: data.specialization || '',
            experience: data.experience || '',
            bio: data.bio || '',
            linkedin: data.socials?.linkedin || '',
            github: data.socials?.github || '',
            twitter: data.socials?.twitter || '',
            website: data.socials?.website || '',
          });
          setProfilePicture(data.profilePicture || '');
          
          // If backend provides stats in profile
          if(data.stats) {
             setStats({
                totalSubmissions: data.stats.totalSubmissions || 0,
                interviews: data.stats.interviews || 0,
                offers: data.stats.offers || 0,
                joined: data.stats.joined || 0,
                successRate: data.stats.totalSubmissions ? Math.round((data.stats.joined / data.stats.totalSubmissions) * 100) : 0
             });
          }
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please choose an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Validation Error", description: "Name and Email are required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        profilePicture,
        socials: {
          linkedin: formData.linkedin,
          github: formData.github,
          twitter: formData.twitter,
          website: formData.website
        }
      };

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: "Success", description: "Profile updated successfully." });
        setIsEditing(false);
        // Update local storage user if name changed
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        sessionStorage.setItem('currentUser', JSON.stringify({ ...currentUser, name: formData.name }));
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your personal information</p>
            </div>
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            </TabsList>

            {/* --- Profile Tab --- */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Picture Card */}
                <Card className="lg:col-span-1 h-fit">
                  <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="relative group cursor-pointer" onClick={isEditing ? triggerFileInput : undefined}>
                      <Avatar className="w-32 h-32 border-4 border-muted">
                        <AvatarImage src={profilePicture} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                          {getInitials(formData.name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white h-8 w-8" />
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">{formData.name || 'Your Name'}</h3>
                      <p className="text-sm text-muted-foreground">Recruiter</p>
                      {formData.specialization && <Badge variant="secondary" className="mt-2">{formData.specialization}</Badge>}
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Details Form */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={formData.email} onChange={e => handleInputChange('email', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={formData.location} onChange={e => handleInputChange('location', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="col-span-1 md:col-span-2 space-y-2">
                          <Label>Bio</Label>
                          <Textarea value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} disabled={!isEditing} rows={3} />
                       </div>
                    </CardContent>
                  </Card>

                  {/* Professional Info */}
                  <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Professional</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>Specialization</Label>
                          <Input value={formData.specialization} onChange={e => handleInputChange('specialization', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label>Years Experience</Label>
                          <Input value={formData.experience} onChange={e => handleInputChange('experience', e.target.value)} disabled={!isEditing} />
                       </div>
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary"/> Social Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="flex gap-2 items-center"><Linkedin className="h-4 w-4"/> LinkedIn</Label>
                          <Input value={formData.linkedin} onChange={e => handleInputChange('linkedin', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label className="flex gap-2 items-center"><Github className="h-4 w-4"/> GitHub</Label>
                          <Input value={formData.github} onChange={e => handleInputChange('github', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label className="flex gap-2 items-center"><Twitter className="h-4 w-4"/> Twitter</Label>
                          <Input value={formData.twitter} onChange={e => handleInputChange('twitter', e.target.value)} disabled={!isEditing} />
                       </div>
                       <div className="space-y-2">
                          <Label className="flex gap-2 items-center"><Globe className="h-4 w-4"/> Website</Label>
                          <Input value={formData.website} onChange={e => handleInputChange('website', e.target.value)} disabled={!isEditing} />
                       </div>
                    </CardContent>
                  </Card>

                  {isEditing && (
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button onClick={handleSaveProfile} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* --- Performance Tab --- */}
            <TabsContent value="performance">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalSubmissions}</div>
                    <div className="text-sm text-muted-foreground">Submissions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.interviews}</div>
                    <div className="text-sm text-muted-foreground">Interviews</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.joined}</div>
                    <div className="text-sm text-muted-foreground">Placements</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Funnel Efficiency</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <div>
                      <div className="flex justify-between mb-1 text-sm font-medium">
                         <span>Submission to Interview</span>
                         <span>{stats.totalSubmissions ? Math.round((stats.interviews / stats.totalSubmissions) * 100) : 0}%</span>
                      </div>
                      <Progress value={stats.totalSubmissions ? (stats.interviews / stats.totalSubmissions) * 100 : 0} className="h-3 bg-blue-100" />
                   </div>
                   <div>
                      <div className="flex justify-between mb-1 text-sm font-medium">
                         <span>Interview to Offer</span>
                         <span>{stats.interviews ? Math.round((stats.offers / stats.interviews) * 100) : 0}%</span>
                      </div>
                      <Progress value={stats.interviews ? (stats.offers / stats.interviews) * 100 : 0} className="h-3 bg-purple-100" />
                   </div>
                   <div>
                      <div className="flex justify-between mb-1 text-sm font-medium">
                         <span>Offer to Join</span>
                         <span>{stats.offers ? Math.round((stats.joined / stats.offers) * 100) : 0}%</span>
                      </div>
                      <Progress value={stats.offers ? (stats.joined / stats.offers) * 100 : 0} className="h-3 bg-green-100" />
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}