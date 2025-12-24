import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Mail, UserCircle } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password, role);

    if (success) {
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${role}`,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid credentials. Try admin@fleet.com or driver@fleet.com with password "password"',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 glow-primary">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FleetTrack</h1>
          <p className="text-muted-foreground mt-2">Smart Transport & Fleet Management</p>
        </div>

        {/* Login Card */}
        <div className="glass-strong rounded-2xl p-8 card-elevated animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold mb-6 text-center">Sign in to continue</h2>

          {/* Role Selector */}
          <div className="flex gap-2 mb-6">
            {(['admin', 'driver'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2',
                  role === r
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <UserCircle className="w-4 h-4" />
                <span className="capitalize">{r}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={role === 'admin' ? 'admin@fleet.com' : 'driver@fleet.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          {/*<div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">Demo Credentials</p>
            <div className="text-xs text-center space-y-1">
              <p><span className="text-primary">Admin:</span> admin@fleet.com</p>
              <p><span className="text-primary">Driver:</span> driver@fleet.com</p>
              <p><span className="text-muted-foreground">Password:</span> password</p>
            </div> 
          </div>*/}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
