import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

interface LoginPageProps {
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
  onLogin: (email: string) => void;
}

export function LoginPage({ onNavigateHome, onNavigateRegister, onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const { authApi } = await import('../utils/api');
      
      console.log('Attempting login for:', email);
      const response = await authApi.login({ email, password });
      console.log('Login response:', response);
      
      if (response.isAdmin) {
        // Store admin access token
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('userId', response.userId || 'admin');
          console.log('✅ Admin access token stored');
        } else {
          console.error('⚠️ Admin login succeeded but no access token received');
        }
        
        toast.success('Welcome, Admin!');
        onLogin(email);
      } else {
        // Store access token and user data
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('userProfile', JSON.stringify(response.profile));
        
        toast.success(`Welcome back, ${response.profile.firstName}!`);
        onLogin(email);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed';
      
      if (errorMessage.includes('Invalid email or password')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('not found')) {
        toast.error('Account not found. Please register first.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Login - Aleph QIS Client Portal"
        description="Access your Aleph QIS investment account. Login to view your portfolio, track performance, and manage your digital asset investments."
        noindex={true}
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            className="flex items-center gap-2 text-left"
            onClick={onNavigateHome}
            aria-label="Go to homepage"
          >
            <Logo className="text-primary" />
          </button>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={onNavigateHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Login Form Section */}
      <section className="relative overflow-hidden pt-32 pb-48 md:pt-40 md:pb-64 px-6 min-h-screen flex items-center">
        <div className="relative z-10 mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl gradient-blue-purple mb-3" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              Welcome Back
            </h1>
            <p className="text-base text-muted-foreground">
              Sign in to access your account
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl border border-border p-8 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-input-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-foreground hover:bg-foreground/90"
                size="lg"
                disabled={isLoading}
              >
                <span className="gradient-blue-purple inline-flex items-center">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={onNavigateRegister}
                  className="text-primary hover:text-primary/80 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Create an account
                </button>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Large watermark fade */}
        <div className="pointer-events-none select-none absolute bottom-0 left-0 right-0 flex items-end justify-center pb-16 md:pb-24">
          <div
            style={{ fontSize: '18vw', fontWeight: 800, opacity: 0.025, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            <span className="text-foreground">Aleph</span><span className="text-primary">QIS</span>
          </div>
        </div>
      </section>
    </div>
  );
}
