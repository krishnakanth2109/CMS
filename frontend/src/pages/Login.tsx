import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        // Retrieve user info from session storage to determine redirection
        const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        navigate(user.role === 'admin' ? '/admin' : '/recruiter');
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${username}`,
        });
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid username or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Something went wrong. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">RecruiterHub</h1>
                <p className="text-muted-foreground">Professional Recruiting Dashboard</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to access your recruiting dashboard with advanced analytics and candidate management.
            </p>
          </div>
        </div>

        <Card className="p-8 glass-effect border-none shadow-xl animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Sign In</h3>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email Address</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="name@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}