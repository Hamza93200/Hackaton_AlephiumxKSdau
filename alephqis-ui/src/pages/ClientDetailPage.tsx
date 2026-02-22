import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Wallet as WalletIcon,
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Check,
  X,
  Copy,
  Coins,
} from 'lucide-react';
import { AddFundToClientDialog } from '../components/AddFundToClientDialog';
import { ClientAvailableFunds } from '../components/ClientAvailableFunds';
import { DepositDialog } from '../components/DepositDialog';
import { TransactionHistory } from '../components/TransactionHistory';
import { adminApi } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface ClientDetailPageProps {
  clientId: string;
  onBack: () => void;
  onNavigateHome: () => void;
}

interface Investment {
  fundId: string;
  fundName: string;
  fundSymbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string | number;
}

export function ClientDetailPage({ clientId, onBack, onNavigateHome }: ClientDetailPageProps) {
  const [addFundOpen, setAddFundOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const response = await adminApi.getClient(clientId);
      setClient(response.client);
    } catch (error: any) {
      console.error('Error loading client:', error);
      toast.error('Failed to load client details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Transform investments to match Investment interface
  const portfolio: Investment[] = (client.investments || []).map((inv: any) => {
    const currentPrice = inv.currentValue / inv.shares; // Calculate current price from value
    const costBasis = inv.shares * inv.averagePrice;
    const gain = inv.currentValue - costBasis;
    const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
    
    return {
      fundId: inv.fundId,
      fundName: inv.fundName,
      fundSymbol: inv.fundSymbol,
      shares: inv.shares,
      avgPrice: inv.averagePrice,
      currentPrice: currentPrice,
      value: inv.currentValue,
      gain: gain,
      gainPercent: gainPercent,
    };
  });
  
  const documents: Document[] = client.documents || [];

  const REQUIRED_DOCUMENT_TYPES = [
    { value: 'identity', label: 'Identity Document' },
    { value: 'address', label: 'Address Verification' },
    { value: 'bank', label: 'Bank Statement' },
  ];

  const getDocumentStatus = (type: string) => {
    return documents.some(doc => doc.type === type);
  };

  const formatFileSize = (size: string | number) => {
    // If size is already a string, return it
    if (typeof size === 'string') return size;
    
    // Otherwise format the number
    const bytes = Number(size);
    if (isNaN(bytes)) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalPortfolioValue = portfolio.reduce((sum, inv) => sum + inv.value, 0);
  const totalGain = portfolio.reduce((sum, inv) => sum + inv.gain, 0);
  const totalGainPercent = totalPortfolioValue > 0 ? (totalGain / (totalPortfolioValue - totalGain)) * 100 : 0;

  const handleAddFund = async (fundId: string) => {
    try {
      console.log('Admin granting fund access:', { clientId, fundId });
      await adminApi.grantFundAccess(clientId, fundId);
      toast.success('Fund access granted successfully! Client can now see and trade this fund.');
      loadClient(); // Reload to show updated data
      setAddFundOpen(false);
    } catch (error: any) {
      console.error('Error granting fund access:', error);
      toast.error(error.message || 'Failed to grant fund access');
    }
  };

  const handleDeposit = async (amount: number, note: string) => {
    try {
      await adminApi.depositFunds(clientId, amount, note);
      loadClient(); // Reload to show updated balance
    } catch (error: any) {
      console.error('Error depositing funds:', error);
      throw error;
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await adminApi.getClientDocumentUrl(clientId, documentId);
      if (response.url) {
        window.open(response.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="text-primary" onClick={onNavigateHome} />
            <span className="px-3 py-1 bg-primary/10 text-primary rounded text-sm" style={{ fontWeight: 600 }}>
              Admin
            </span>
          </div>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-start justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl gradient-blue-purple mb-2" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-muted-foreground mb-2">{client.email}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {client.status}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                  KYC: {client.kyc}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="bg-foreground hover:bg-foreground/90"
                onClick={() => setDepositOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="gradient-blue-purple inline-flex items-center">Deposit Funds</span>
              </Button>
              <Button
                className="bg-foreground hover:bg-foreground/90"
                onClick={() => setAddFundOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="gradient-blue-purple inline-flex items-center">Add Available Fund</span>
              </Button>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <WalletIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash Balance</p>
                  <p className="text-2xl" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                    ${client.cashBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              {client.walletAddress && client.walletAddress !== 'pending' && (
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Wallet Address</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(client.walletAddress);
                        toast.success('Wallet address copied!');
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="text-xs">Copy</span>
                    </Button>
                  </div>
                  <p className="text-xs font-mono text-foreground/80 break-all">
                    {client.walletAddress.slice(0, 6)}...{client.walletAddress.slice(-4)}
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                    ${totalPortfolioValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalGain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`h-5 w-5 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                      {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Authorized Funds</p>
                  <p className="text-2xl" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {(client.availableFunds || []).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(client.availableFunds || []).length === 0 ? 'No funds authorized' : 'funds authorized'}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="grid w-full max-w-3xl grid-cols-5">
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="funds">Authorized Funds</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="info">Information</TabsTrigger>
              </TabsList>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="mt-6 space-y-4">
                <h3 className="text-xl gradient-blue-purple mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Client Investments
                </h3>

                {portfolio.length === 0 ? (
                  <Card className="p-12 bg-white border-border text-center">
                    <p className="text-muted-foreground">No investments yet.</p>
                  </Card>
                ) : (
                  portfolio.map((investment) => (
                    <Card key={investment.fundId} className="p-6 bg-white border-border">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                              {investment.fundName}
                            </h4>
                            <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                              {investment.fundSymbol}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{investment.shares} shares</span>
                            <span>•</span>
                            <span>Avg: ${investment.avgPrice.toFixed(2)}</span>
                            <span>•</span>
                            <span>Current: ${investment.currentPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg" style={{ fontWeight: 600 }}>
                            ${investment.value.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            {investment.gain >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm ${investment.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {investment.gain >= 0 ? '+' : ''}${Math.abs(investment.gain).toFixed(2)} ({investment.gainPercent >= 0 ? '+' : ''}{investment.gainPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Authorized Funds Tab */}
              <TabsContent value="funds" className="mt-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl gradient-blue-purple" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Authorized Funds
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddFundOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Authorize Fund
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  These are the funds this client is authorized to view and trade.
                </p>
                <ClientAvailableFunds availableFundIds={client.availableFunds || []} />
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="mt-6 space-y-4">
                <h3 className="text-xl gradient-blue-purple mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Transaction History
                </h3>
                
                <TransactionHistory transactions={client.transactions || []} />
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-6 space-y-6">
                <h3 className="text-xl gradient-blue-purple mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Client Documents
                </h3>

                {/* Document Status Overview */}
                <Card className="p-6 bg-white border-border">
                  <h4 className="text-base mb-4" style={{ fontWeight: 600 }}>
                    Required Documents Status
                  </h4>
                  <div className="space-y-3">
                    {REQUIRED_DOCUMENT_TYPES.map((docType) => {
                      const isUploaded = getDocumentStatus(docType.value);
                      return (
                        <div
                          key={docType.value}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isUploaded ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isUploaded ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isUploaded ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm" style={{ fontWeight: 600 }}>
                              {docType.label}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isUploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isUploaded ? 'Uploaded' : 'Missing'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Uploaded Documents */}
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-base" style={{ fontWeight: 600 }}>
                      Uploaded Documents
                    </h4>
                    {documents.map((doc) => (
                      <Card key={doc.id} className="p-6 bg-white border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-base mb-1" style={{ fontWeight: 600 }}>
                                {doc.name}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{REQUIRED_DOCUMENT_TYPES.find(d => d.value === doc.type)?.label || doc.type}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.size)}</span>
                                <span>•</span>
                                <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadDocument(doc.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 bg-white border-border text-center">
                    <p className="text-muted-foreground">No documents uploaded yet.</p>
                  </Card>
                )}
              </TabsContent>

              {/* Information Tab */}
              <TabsContent value="info" className="mt-6 space-y-6">
                <div>
                  <h3 className="text-xl gradient-blue-purple mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Client Information
                  </h3>

                <Card className="p-6 bg-white border-border">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                      <p style={{ fontWeight: 600 }}>{client.firstName} {client.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p style={{ fontWeight: 600 }}>{client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p style={{ fontWeight: 600 }}>{client.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registration Date</p>
                      <p style={{ fontWeight: 600 }}>
                        {client.registrationDate 
                          ? new Date(client.registrationDate).toLocaleDateString() 
                          : 'Not available'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Address</p>
                      <p style={{ fontWeight: 600 }}>{client.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">KYC Status</p>
                      <span className="inline-block text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                        {client.kyc}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                      <div className="flex items-center gap-2">
                        <p style={{ fontWeight: 600 }} className="font-mono text-sm">
                          {client.walletAddress && client.walletAddress !== 'pending' ? client.walletAddress : 'Not connected'}
                        </p>
                        {client.walletAddress && client.walletAddress !== 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(client.walletAddress);
                              toast.success('Wallet address copied!');
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            <span className="text-xs">Copy</span>
                          </Button>
                        )}
                      </div>
                      {(!client.walletAddress || client.walletAddress === 'pending') && (
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 User can connect wallet via Dashboard → Connect Wallet button
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Add Fund Dialog */}
      <AddFundToClientDialog
        open={addFundOpen}
        onOpenChange={setAddFundOpen}
        onAddFund={handleAddFund}
        clientName={`${client.firstName} ${client.lastName}`}
      />

      {/* Deposit Dialog */}
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        clientName={`${client.firstName} ${client.lastName}`}
        onDeposit={handleDeposit}
      />
    </div>
  );
}
