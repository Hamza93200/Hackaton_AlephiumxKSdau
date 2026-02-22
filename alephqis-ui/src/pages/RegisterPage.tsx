import { useState } from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { SEOHead } from '../components/SEOHead';

interface RegisterPageProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export function RegisterPage({ onNavigateHome, onNavigateLogin }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { firstName, lastName, email, password, phone, address } = formData;
      await authApi.register({
        firstName,
        lastName,
        email,
        password,
        phone,
        address,
      });

      toast.success('Registration successful! You can now log in.');
      // Redirect to login page after successful registration
      setTimeout(() => {
        onNavigateLogin();
      }, 1500);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('already been registered')) {
        toast.error('An account with this email already exists. Please log in instead.');
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
        title="Register - Start Investing with Aleph QIS"
        description="Create your Aleph QIS account to access institutional-grade digital asset investment strategies. Sign up today to get started with quantitative crypto investing."
        keywords="Aleph QIS registration, crypto investment signup, digital asset account, institutional crypto registration"
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

      {/* Register Form Section */}
      <section className="relative overflow-hidden pt-32 pb-48 md:pt-40 md:pb-64 px-6 min-h-screen flex items-center">
        <div className="relative z-10 mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl gradient-blue-purple mb-3" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              Create Account
            </h1>
            <p className="text-base text-muted-foreground">
              Join BitQIS to access institutional-grade strategies
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl border border-border p-8 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    className="bg-input-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    className="bg-input-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    className="bg-input-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Wall Street, New York, NY"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="bg-input-background"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-foreground hover:bg-foreground/90"
                size="lg"
                disabled={isLoading}
              >
                <span className="gradient-blue-purple inline-flex items-center">
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={onNavigateLogin}
                  className="text-primary hover:text-primary/80 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Sign in
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
