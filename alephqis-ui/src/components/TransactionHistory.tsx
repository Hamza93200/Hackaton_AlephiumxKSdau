import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Clock, Layers } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fundId?: string;
  fundName?: string;
  fundSymbol?: string;
  shares?: number;
  pricePerShare?: number;
  note?: string;
  timestamp: string;
  status: string;
}

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="p-12 bg-white border-border text-center">
        <p className="text-muted-foreground">No transactions yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.filter(txn => txn && txn.id).map((txn) => {
        // 1. SÉCURITÉ MAXIMALE SUR LE TYPE DU BACKEND
        const safeType = String(txn.type || '').toLowerCase().trim();
        const isBuy = safeType.includes('buy');
        const isSell = safeType.includes('sell');
        const isDeposit = safeType.includes('deposit');

        // 2. GESTION INFAILLIBLE DES SIGNES
        const rawAmount = Number(txn.amount) || 0;
        // C'est une dépense si le type contient "buy" OU si le backend a envoyé un nombre négatif
        const isExpense = isBuy || rawAmount < 0; 
        
        const sign = isExpense ? '-' : '+';
        const amountColor = isExpense ? 'text-red-600' : 'text-green-600';
        
        const formattedAmount = Math.abs(rawAmount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // 3. UI DYNAMIQUE
        let Icon = Clock;
        let iconBg = 'bg-gray-100 text-gray-600';
        let badgeColor = 'bg-gray-100 text-gray-700';
        let actionText = 'Transaction';

        if (isDeposit) {
          Icon = DollarSign;
          iconBg = 'bg-green-100 text-green-600';
          badgeColor = 'bg-green-100 text-green-700';
          actionText = 'Cash Deposit';
        } else if (isBuy) {
          Icon = TrendingUp;
          iconBg = 'bg-blue-100 text-blue-600';
          badgeColor = 'bg-blue-100 text-blue-700';
          actionText = 'Buy';
        } else if (isSell) {
          Icon = TrendingDown;
          iconBg = 'bg-orange-100 text-orange-600';
          badgeColor = 'bg-orange-100 text-orange-700';
          actionText = 'Sell';
        }

        const fundName = txn.fundName || txn.fundSymbol || 'Unknown Fund';
        const formattedShares = txn.shares ? Number(txn.shares).toFixed(2) : '0.00';

        return (
          <Card key={txn.id} className="p-4 bg-white border-border hover:border-primary/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* PARTIE GAUCHE : ICONE ET INFOS DÉTAILLÉES */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={badgeColor}>
                      {actionText.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(txn.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  {/* Affichage clair du fonds et des parts */}
                  <p className="text-base font-semibold text-foreground">
                    {isDeposit 
                      ? 'Added funds to wallet' 
                      : `${actionText} ${formattedShares} parts of ${fundName}`
                    }
                  </p>
                  
                  {/* Prix unitaire détaillé */}
                  {!isDeposit && txn.pricePerShare && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Layers className="h-3.5 w-3.5" />
                      <span>NAV at ${Number(txn.pricePerShare).toFixed(2)} / part</span>
                    </div>
                  )}
                  
                  {txn.note && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{txn.note}"</p>
                  )}
                </div>
              </div>

              {/* PARTIE DROITE : MONTANT */}
              <div className="text-right shrink-0">
                <p className={`text-xl font-bold ${amountColor}`}>
                  {sign}${formattedAmount}
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize font-medium">
                  {txn.status || 'completed'}
                </p>
              </div>

            </div>
          </Card>
        );
      })}
    </div>
  );
}