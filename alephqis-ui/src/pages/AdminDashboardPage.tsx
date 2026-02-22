import { ONE_ALPH, stringToHex } from '@alephium/web3';
import { useState, useEffect, useCallback } from 'react';
import { useWallet, AlephiumConnectButton } from '@alephium/web3-react';
import { QISFund } from '../artifacts/ts';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  LogOut,
  Users,
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Coins,
  ExternalLink
} from 'lucide-react';
import { CreateFundDialog } from '../components/CreateFundDialog';
import { UpdateFundPriceDialog } from '../components/UpdateFundPriceDialog';
import { FundPriceChart } from '../components/FundPriceChart';
import { adminApi, fundApi } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationDate: string;
  cashBalance: number;
  status: 'active' | 'pending' | 'inactive';
  investments?: any[];
}

interface Fund {
  id: string;
  name: string;
  symbol: string;
  description: string;
  currentPrice: number;
  initialPrice: number;
  change24h: number;
  strategy: string;
  createdAt?: string;
  priceHistory?: Array<{ price: number; timestamp: string }>;
  contractAddress?: string;
}

interface AdminDashboardPageProps {
  onLogout: () => void;
  onViewClient: (clientId: string) => void;
  onNavigateHome: () => void;
}

export function AdminDashboardPage({ onLogout, onViewClient, onNavigateHome }: AdminDashboardPageProps) {
  const { signer, account } = useWallet(); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [createFundOpen, setCreateFundOpen] = useState(false);
  const [updatePriceOpen, setUpdatePriceOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const response = await adminApi.getAllClients();
      const clientsList = Array.isArray(response?.clients) ? response.clients : [];
      setClients(clientsList);
    } catch (err) {
      toast.error('Failed to load clients');
      setClients([]);
    }
  }, []);

  const loadFunds = useCallback(async () => {
    try {
      const response = await fundApi.getAllFunds();
      const fundsList = Array.isArray(response?.funds) ? response.funds : [];
      setFunds(fundsList);
    } catch (err) {
      toast.error('Failed to load funds');
      setFunds([]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadClients(), loadFunds()]);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadClients, loadFunds]);

  const filteredClients = clients.filter(client => {
    const fullName = `${client?.firstName || ''} ${client?.lastName || ''}`.toLowerCase();
    const email = (client?.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const totalClients = clients.length;
  const totalAUM = clients.reduce((sum, c) => {
    const portfolioValue = Array.isArray(c?.investments) 
      ? c.investments.reduce((total, inv) => total + (inv?.value || 0), 0) 
      : 0;
    return sum + portfolioValue + (c?.cashBalance || 0);
  }, 0);
  const activeClients = clients.filter(c => c?.status === 'active').length;

  // --- LOGIQUE DE DÉPLOIEMENT BLOCKCHAIN + BACKEND ---
  const handleCreateFund = async (fundData: any) => {
    try {
      if (!signer || !account) {
        toast.error("Veuillez connecter votre wallet (Group 0 recommandé) !");
        return;
      }

      toast.info("Validation de la transaction de déploiement...");

      // 1. Calcul de la NAV initiale en AttoAlph (Précision 18 décimales)
      const navInAttoAlph = BigInt(Math.floor(fundData.initialPrice || 100)) * (10n ** 18n);

      // 2. Déploiement du Smart Contract sur Alephium
      const deployResult = await QISFund.deploy(signer, {
        signerAddress: account.address,
        initialFields: {
          fundName: stringToHex(fundData.name || 'QIS Fund'),
          symbol: stringToHex(fundData.symbol || 'QIS'),
          currentNav: navInAttoAlph,
          totalSupply: 0n,
          admin: account.address
        },
        issueTokenAmount: 1000000n, // Réserve initiale pour le contrat
        initialAttoAlphAmount: ONE_ALPH / 10n // 0.1 ALPH de dépôt min
      });

      console.log('✅ Contrat déployé :', deployResult.contractInstance.address);
      toast.info("Sauvegarde dans la base de données...");
      
      // 3. Liaison avec le Backend
      const enrichedFundData = {
        ...fundData,
        contractAddress: deployResult.contractInstance.address,
        contractId: deployResult.contractInstance.contractId
      };

      await adminApi.createFund(enrichedFundData);

      toast.success('Fonds créé avec succès sur la blockchain et le système !');
      setCreateFundOpen(false);
      loadFunds(); 

    } catch (err: any) {
      console.error('Erreur déploiement:', err);
      toast.error(err.message || 'Échec de la création du fonds');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="text-primary" onClick={onNavigateHome} />
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold px-3">
              Admin Portal
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <AlephiumConnectButton />
            <Button size="sm" variant="ghost" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl gradient-blue-purple font-semibold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Control center for clients and tokenized assets</p>
            </div>
            <Button className="bg-foreground hover:bg-foreground/90" onClick={() => setCreateFundOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="gradient-blue-purple font-medium">Create Fund</span>
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total AUM', value: `$${(totalAUM / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Clients', value: activeClients, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Funds', value: funds.length, icon: Coins, color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map((stat, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="clients" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="funds">Funds</TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="mt-6 space-y-6">
              <div className="relative w-full max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              {filteredClients.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed">No clients found.</Card>
              ) : (
                <div className="grid gap-4">
                  {filteredClients.map((client) => (
                    <Card key={client.id} className="p-6 hover:border-primary/30 transition-all cursor-pointer" onClick={() => onViewClient(client.id)}>
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-lg">{client.firstName} {client.lastName}</h3>
                            <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="capitalize">{client.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                        <div className="flex items-center gap-10 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Portfolio</p>
                            <p className="font-bold">${(client.investments?.reduce((s, i) => s + (i.value || 0), 0) || 0).toLocaleString()}</p>
                          </div>
                          <Button size="sm" variant="outline" className="gap-2">Manage</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="funds" className="mt-6 space-y-6">
              {funds.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed">No investment funds created.</Card>
              ) : (
                <div className="grid gap-6">
                  {funds.map((fund) => (
                    <Card key={fund.id} className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold">{fund.name}</h3>
                            <Badge variant="secondary">{fund.symbol}</Badge>
                            {fund.contractAddress && (
                              <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-[10px] text-green-700 border border-green-200 rounded-full font-bold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                On-Chain
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">{fund.description}</p>
                          {fund.contractAddress && (
                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded w-fit">
                              <span>Address: {fund.contractAddress}</span>
                              <ExternalLink className="h-3 w-3 cursor-pointer hover:text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">NAV Price</p>
                            <p className="text-2xl font-bold">${fund.currentPrice.toFixed(2)}</p>
                          </div>
                          <Button className="bg-foreground" onClick={() => { setSelectedFund(fund); setUpdatePriceOpen(true); }}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Update NAV
                          </Button>
                        </div>
                      </div>
                      {fund.priceHistory && fund.priceHistory.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <FundPriceChart fundName={fund.name} fundSymbol={fund.symbol} currentPrice={fund.currentPrice} initialPrice={fund.initialPrice} priceHistory={fund.priceHistory} compact={true} />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <CreateFundDialog open={createFundOpen} onOpenChange={setCreateFundOpen} onCreateFund={handleCreateFund} />
      <UpdateFundPriceDialog fund={selectedFund} open={updatePriceOpen} onOpenChange={setUpdatePriceOpen} onPriceUpdated={loadFunds} />
    </div>
  );
}