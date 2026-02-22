import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FundPriceChart } from './FundPriceChart';
import { toast } from 'sonner@2.0.3';

interface PriceHistoryPoint {
  price: number;
  timestamp: string;
}

interface Fund {
  id: string;
  name: string;
  symbol: string;
  description: string;
  currentPrice: number;
  initialPrice?: number;
  change24h: number;
  strategy: string;
  priceHistory?: PriceHistoryPoint[];
}

interface FundTradeDialogProps {
  fund: Fund;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrade: (fundId: string, action: 'buy' | 'sell', amount: number) => Promise<void>;
  userBalance: number;
  userShares: number;
}

export function FundTradeDialog({
  fund,
  open,
  onOpenChange,
  onTrade,
  userBalance,
  userShares,
}: FundTradeDialogProps) {
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // Safety check for fund data
  if (!fund) {
    console.error('FundTradeDialog: fund is null or undefined');
    return null;
  }

  // Safely get current price with fallback
  const currentPrice = fund.currentPrice || (fund as any).initialPrice || 0;
  const change24h = fund.change24h || 0;

  const buyShares = buyAmount ? parseFloat(buyAmount) : 0;
  const buyTotal = buyShares * currentPrice;

  const sellShares = sellAmount ? parseFloat(sellAmount) : 0;
  const sellTotal = sellShares * currentPrice;

  const handleBuy = async () => {
    if (buyShares <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (buyTotal > userBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsTrading(true);
    try {
      await onTrade(fund.id, 'buy', buyShares);
      toast.success(`Successfully purchased ${buyShares} shares of ${fund.symbol}`);
      setBuyAmount('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Trade failed');
    } finally {
      setIsTrading(false);
    }
  };

  const handleSell = async () => {
    if (sellShares <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (sellShares > userShares) {
      toast.error('Insufficient shares');
      return;
    }

    setIsTrading(true);
    try {
      await onTrade(fund.id, 'sell', sellShares);
      toast.success(`Successfully sold ${sellShares} shares of ${fund.symbol}`);
      setSellAmount('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Trade failed');
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-base sm:text-lg">{fund.name}</span>
            <span className="text-xs sm:text-sm px-2 py-1 bg-primary/10 text-primary rounded">
              {fund.symbol}
            </span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {fund.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Fund Info */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Current Price</p>
              <p className="text-lg sm:text-xl" style={{ fontWeight: 600 }}>
                ${currentPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">24h Change</p>
              <div className="flex items-center gap-1">
                {change24h >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                )}
                <span className={`text-base sm:text-lg ${change24h >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontWeight: 600 }}>
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-sm sm:text-base" style={{ fontWeight: 600 }}>${userBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Holdings</p>
              <p className="text-sm sm:text-base" style={{ fontWeight: 600 }}>{userShares} shares</p>
            </div>
          </div>

          {/* Fund Price Chart */}
          {fund.priceHistory && fund.priceHistory.length > 0 && fund.initialPrice && (
            <div className="my-4">
              <FundPriceChart
                fundName={fund.name}
                fundSymbol={fund.symbol}
                currentPrice={currentPrice}
                initialPrice={fund.initialPrice}
                priceHistory={fund.priceHistory}
                compact={true}
              />
            </div>
          )}

          {/* Trading Tabs */}
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-2">
                <Label htmlFor="buy-amount" className="text-sm sm:text-base">Number of Shares</Label>
                <Input
                  id="buy-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="h-11 sm:h-10 text-base"
                />
              </div>

              <div className="p-3 sm:p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Price per share</span>
                  <span style={{ fontWeight: 600 }}>${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Shares</span>
                  <span style={{ fontWeight: 600 }}>{buyShares.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-sm sm:text-base" style={{ fontWeight: 600 }}>Total Cost</span>
                  <span className="text-base sm:text-lg gradient-blue-purple" style={{ fontWeight: 600 }}>
                    ${buyTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                className="w-full bg-foreground hover:bg-foreground/90 h-11 sm:h-10 text-base"
                onClick={handleBuy}
                disabled={isTrading || buyShares <= 0 || buyTotal > userBalance}
              >
                <span className="gradient-blue-purple inline-flex items-center">
                  {isTrading ? 'Processing...' : 'Buy Shares'}
                </span>
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-2">
                <Label htmlFor="sell-amount" className="text-sm sm:text-base">Number of Shares</Label>
                <Input
                  id="sell-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  max={userShares}
                  className="h-11 sm:h-10 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {userShares} shares
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Price per share</span>
                  <span style={{ fontWeight: 600 }}>${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Shares</span>
                  <span style={{ fontWeight: 600 }}>{sellShares.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-sm sm:text-base" style={{ fontWeight: 600 }}>Total Proceeds</span>
                  <span className="text-base sm:text-lg gradient-blue-purple" style={{ fontWeight: 600 }}>
                    ${sellTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                className="w-full bg-foreground hover:bg-foreground/90 h-11 sm:h-10 text-base"
                onClick={handleSell}
                disabled={isTrading || sellShares <= 0 || sellShares > userShares}
              >
                <span className="gradient-blue-purple inline-flex items-center">
                  {isTrading ? 'Processing...' : 'Sell Shares'}
                </span>
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
