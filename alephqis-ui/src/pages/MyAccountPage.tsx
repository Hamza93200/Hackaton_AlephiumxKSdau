import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  ArrowLeft,
  User,
  Mail,
  Wallet as WalletIcon,
  Calendar,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { DocumentUpload } from '../components/DocumentUpload';
import { clientApi } from '../utils/api';
import { toast } from 'sonner@2.0.3';

// 1. IMPORT DES OUTILS ALEPHIUM
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react';

interface MyAccountPageProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export function MyAccountPage({ onBack, onLogout, onNavigateHome }: MyAccountPageProps) {
  // 2. RÉCUPÉRATION DE L'ÉTAT DU WALLET
  const { connectionStatus, account } = useWallet();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in again');
        onLogout();
        return;
      }

      const profileData = await clientApi.getProfile(token);
      const profile = profileData?.profile;
      
      if (!profile) {
        toast.error('Failed to load profile');
        return;
      }

      setProfile(profile);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          text: 'Active',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending Review',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'inactive':
        return {
          icon: XCircle,
          text: 'Inactive',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: Clock,
          text: status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const statusInfo = getStatusInfo(profile.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="relative min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <Logo className="text-primary absolute left-1/2 -translate-x-1/2" onClick={onNavigateHome} />

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="gap-2"
          >
            Logout
          </Button>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl gradient-blue-purple mb-2" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              My Account
            </h1>
            <p className="text-muted-foreground">Manage your profile and account settings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Account Status
                  </h2>
                  <p className="text-sm text-muted-foreground">Current verification status</p>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusInfo.bgColor}`}>
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                <span className={`${statusInfo.color}`} style={{ fontWeight: 500 }}>
                  {statusInfo.text}
                </span>
              </div>

              {profile.status === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Your account is pending review. Please ensure all required documents are uploaded below.
                  </p>
                </div>
              )}

              {profile.status === 'active' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Your account is fully verified and active. You can now access all available investment funds.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Personal Information
                  </h2>
                  <p className="text-sm text-muted-foreground">Your account details</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </div>
                  <p className="text-base" style={{ fontWeight: 500 }}>
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}` 
                      : (profile.firstName || profile.lastName || 'Not provided')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </div>
                  <p className="text-base" style={{ fontWeight: 500 }}>
                    {profile.email || 'Not provided'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member Since</span>
                  </div>
                  <p className="text-base" style={{ fontWeight: 500 }}>
                    {profile.registrationDate ? new Date(profile.registrationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not available'}
                  </p>
                </div>

                {/* 3. SECTION WALLET MODIFIÉE */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <WalletIcon className="h-4 w-4" />
                    <span>Wallet Address</span>
                  </div>
                  
                  {connectionStatus === 'connected' && account ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-mono" style={{ fontWeight: 500 }}>
                          {account.address.slice(0, 12)}...{account.address.slice(-10)}
                        </p>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Connected</span>
                      </div>
                      <div className="mt-2">
                         {/* On affiche quand même le bouton pour permettre la déconnexion */}
                        <AlephiumConnectButton />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <AlephiumConnectButton />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    KYC Documents
                  </h2>
                  <p className="text-sm text-muted-foreground">Upload required documents for account verification</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Required Documents:</strong> Valid passport or government-issued ID, proof of address (utility bill or bank statement), 
                  and recent bank statement. All documents must be clear and valid.
                </p>
              </div>

              <DocumentUpload 
                documents={profile.documents || []} 
                onDocumentUploaded={loadProfile}
              />
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}