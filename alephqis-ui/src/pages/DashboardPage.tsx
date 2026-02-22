import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Wallet, TrendingUp, LogOut, DollarSign, User } from 'lucide-react';
import { FundTradeDialog } from '../components/FundTradeDialog';
import { TransactionHistory } from '../components/TransactionHistory';
import { PortfolioChart } from '../components/PortfolioChart';
import { clientApi, fundApi } from '../utils/api';
import { toast } from 'sonner';

// WEB3
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react';
import { DUST_AMOUNT } from '@alephium/web3';
import { QISFund } from '../artifacts/ts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Fund {
  id: string;
  name: string;
  symbol: string;
  description: string;
  currentPrice: number;
  initialPrice?: number;
  change24h: number;
  strategy: string;
  priceHistory?: Array<{ price: number; timestamp: string }>;
  contractAddress?: string;
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

interface DashboardPageProps {
  onLogout: () => void;
  onNavigateMyAccount: () => void;
  onNavigateHome: () => void;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function DashboardPage({ onLogout, onNavigateMyAccount, onNavigateHome }: DashboardPageProps) {
  const { connectionStatus, account, signer } = useWallet();

  const [selectedFund, setSelectedFund]       = useState<Fund | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [profile, setProfile]                 = useState<any>(null);
  const [allFunds, setAllFunds]               = useState<Fund[]>([]);
  const [transactions, setTransactions]       = useState<any[]>([]);
  const [isLoading, setIsLoading]             = useState(true);

  // ── Sync wallet → backend ──────────────────────────────────────────────────
  useEffect(() => {
    const syncWallet = async () => {
      if (
        connectionStatus === 'connected' &&
        account?.address &&
        profile &&
        profile.walletAddress !== account.address
      ) {
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) return;
          const { projectId } = await import('../utils/supabase/info');
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-4ba5d8ce/client/update-wallet`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ walletAddress: account.address, dynamicUserId: '' }),
            }
          );
          loadData();
        } catch (err) {
          console.error('Wallet sync error:', err);
        }
      }
    };
    syncWallet();
  }, [connectionStatus, account, profile]);

  useEffect(() => { loadData(); }, []);

  // ── Chargement des données ─────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { onLogout(); return; }

      const [profileData, fundsData] = await Promise.all([
        clientApi.getProfile(token),
        fundApi.getAllFunds(),
      ]);

      setProfile(profileData?.profile);
      setAllFunds(fundsData?.funds || []);
      setTransactions(profileData?.profile?.transactions || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logique blockchain ─────────────────────────────────────────────────────
  const handleTrade = async (fundId: string, action: 'buy' | 'sell', amount: number) => {
    if (connectionStatus !== 'connected' || !signer || !account) {
      toast.error('Connectez votre wallet Alephium avant de trader');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Session expirée — reconnectez-vous'); return; }

    const fund = allFunds.find(f => f.id === fundId);

    if (!fund?.contractAddress) {
      toast.error("Ce fonds n'est pas encore lié à la blockchain");
      return;
    }

    const contractAddress = fund.contractAddress;
    const fundContract    = QISFund.at(contractAddress);
    
    const tokenId = fundContract.contractId;

    toast.info(`Signature (${action === 'buy' ? 'Mint parts' : 'Burn parts'})...`);

    try {
      if (action === 'buy') {
        await fundContract.transact.buyShares({
          signer,
          attoAlphAmount: DUST_AMOUNT,
          args: {
            investor: account.address,
            amount:   BigInt(amount),
          },
        });
      } else {
        await fundContract.transact.sellShares({
          signer,
          attoAlphAmount: DUST_AMOUNT,
          args: {
            investor: account.address,
            amount:   BigInt(amount),
          },
          tokens: [{
            id:     tokenId,
            amount: BigInt(amount),
          }],
        });
      }

      const response = await clientApi.trade(token, fundId, action, amount);
      if (response.success) {
        toast.success('Transaction confirmée sur Alephium ✓');
        await new Promise(r => setTimeout(r, 500));
        await loadData();
      } else {
        throw new Error(response.error || 'Backend update failed');
      }
    } catch (error: any) {
      console.error('Trade error:', error);
      if      (error.message?.includes('NotEnoughBalance'))    toast.error('Solde ALPH insuffisant pour le gas');
      else if (error.message?.includes('user rejected'))       toast.error('Transaction annulée dans le wallet');
      else if (error.message?.includes('nodeProvider'))        toast.error('Wallet non connecté — reconnectez-vous');
      else if (error.message?.includes('Unauthorized'))        toast.error('Seul le propriétaire peut vendre ses parts');
      else if (error.message?.includes('AdminOnly'))           toast.error("Action réservée à l'admin");
      else if (error.message?.includes('InsufficientSupply'))  toast.error('Parts insuffisantes pour ce rachat');
      else                                                     toast.error(error.message || 'Transaction échouée');
      throw error;
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  // ── Calculs portfolio (TEMPS RÉEL AVEC NAV) ────────────────────────────────
  const depositAmount = profile.cashBalance || 0;

  const portfolio: Investment[] = (profile?.investments || [])
    .filter((inv: any) => inv?.fundId)
    .map((inv: any) => {
      const shares = inv.shares || 0;
      const averagePrice = inv.averagePrice || 0;
      const costBasis = shares * averagePrice; 

      // 1. On cherche la NAV en direct dans la liste des fonds
      const liveFund = allFunds.find(f => f.id === inv.fundId);
      
      // 2. On utilise le prix en direct, sinon on fallback sur l'ancienne méthode
      const currentPrice = liveFund?.currentPrice || (shares > 0 ? (inv.currentValue / shares) : averagePrice);
      
      // 3. Recalcul avec le prix LIVE
      const currentValue = shares * currentPrice;
      const gain = currentValue - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      return {
        fundId:     inv.fundId,
        fundName:   inv.fundName   || 'Unknown Fund',
        fundSymbol: inv.fundSymbol || 'N/A',
        shares, 
        avgPrice: averagePrice, 
        currentPrice, // Mis à jour instantanément
        value: currentValue, // Mis à jour instantanément
        gain, // Mis à jour instantanément
        gainPercent, // Mis à jour instantanément
      };
    });

  const availableFunds      = allFunds.filter(f => profile?.availableFunds?.includes(f.id));
  const totalPortfolioValue = portfolio.reduce((s, i) => s + (i.value || 0), 0);
  const totalGain           = portfolio.reduce((s, i) => s + (i.gain  || 0), 0);
  const totalGainPercent    = (totalPortfolioValue - totalGain) > 0
    ? (totalGain / (totalPortfolioValue - totalGain)) * 100 : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-background">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo className="text-primary" onClick={onNavigateHome} />
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onNavigateMyAccount} className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Account</span>
            </Button>
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

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl mb-2 font-semibold">
              Welcome <span className="gradient-blue-purple">{profile?.firstName || 'Client'}!</span>
            </h1>
            <p className="text-muted-foreground">Manage your investments and portfolio</p>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash Balance</p>
                  <p className="text-2xl font-semibold">${depositAmount.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-semibold">${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalGain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`h-5 w-5 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-semibold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                    <span className="text-sm text-muted-foreground">({totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="funds">Authorized Funds</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* Portfolio tab */}
            <TabsContent value="portfolio" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4 gradient-blue-purple">My Investments</h2>
              {portfolio.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed">
                  No investments yet.
                </Card>
              ) : portfolio.map((inv) => (
                <Card key={inv.fundId} className="p-6 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{inv.fundName}</h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">{inv.fundSymbol}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inv.shares.toFixed(2)} shares • Current NAV: ${inv.currentPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${inv.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      <p className={`text-sm font-medium ${inv.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {inv.gain >= 0 ? '+' : ''}${inv.gain.toFixed(2)} ({inv.gain >= 0 ? '+' : ''}{inv.gainPercent.toFixed(2)}%)
                      </p>
                    </div>
                    <Button size="sm" onClick={() => {
                      const fund = allFunds.find(f => f.id === inv.fundId);
                      if (fund) { setSelectedFund(fund); setTradeDialogOpen(true); }
                    }}>
                      Trade
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Funds tab */}
            <TabsContent value="funds" className="grid gap-6 md:grid-cols-2">
              {availableFunds.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed col-span-2">
                  No funds available yet.
                </Card>
              ) : availableFunds.map((fund) => (
                <Card
                  key={fund.id}
                  className="p-6 cursor-pointer group hover:border-primary/30 transition-colors"
                  onClick={() => { setSelectedFund(fund); setTradeDialogOpen(true); }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">
                      {fund.name}
                      <span className="text-xs text-primary ml-2">{fund.symbol}</span>
                    </h3>
                    {fund.contractAddress && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-[10px] text-green-700 border border-green-200 rounded-full font-medium">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                        Verified On-Chain
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{fund.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-semibold">${fund.currentPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">24h</p>
                      <span className={fund.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {fund.change24h >= 0 ? '+' : ''}{fund.change24h}%
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-foreground hover:bg-foreground/90 group-hover:scale-[1.01] transition-transform">
                    View & Trade
                  </Button>
                </Card>
              ))}
            </TabsContent>

            {/* Transactions tab */}
            <TabsContent value="transactions">
              <h2 className="text-2xl font-semibold mb-4 gradient-blue-purple">Transaction History</h2>
              <TransactionHistory transactions={transactions} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Trade Dialog */}
      {selectedFund && (
        <FundTradeDialog
          fund={selectedFund}
          open={tradeDialogOpen}
          onOpenChange={setTradeDialogOpen}
          onTrade={handleTrade}
          userBalance={depositAmount}
          userShares={portfolio.find(p => p.fundId === selectedFund.id)?.shares || 0}
        />
      )}
    </div>
  );
}